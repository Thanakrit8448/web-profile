const dns = require('dns');

// Set standard reliable public DNS on Windows to prevent ECONNREFUSED on SRV lookups
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== SECURITY: HARDENING & HEADERS ====================
// 1. Hide Express technology footprint
app.disable('x-powered-by');

// 2. Set Standard Security HTTP Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob: https://cdn.jsdelivr.net; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self';"
  );
  next();
});

// 3. Body Parser with Payload Limit (allows image uploads up to 50MB)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== SECURITY: RATE LIMITING ====================
function createRateLimiter({ windowMs, max, message }) {
  const requests = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = requests.get(ip);
    if (!entry || (now - entry.resetTime > windowMs)) {
      entry = { count: 1, resetTime: now };
      requests.set(ip, entry);
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSec = Math.ceil((windowMs - (now - entry.resetTime)) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: message || 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      });
    }

    next();
  };
}

// Global API rate limiter (120 req / 1 min per IP)
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'มีการส่งคำขอถี่เกินไป กรุณารอสักครู่'
});
app.use('/api', generalLimiter);

// Specific rate limiters for high-risk endpoints
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'เข้าสู่ระบบผิดพลาดเกินกำหนด กรุณารอ 15 นาที แล้วลองใหม่อีกครั้ง'
});

const contactLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'คุณส่งข้อความติดต่อถี่เกินไป กรุณารอ 10 นาที ก่อนส่งใหม่อีกครั้ง'
});

const likeLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'กดถูกใจถี่เกินไป กรุณารอสักครู่'
});

// ==================== SECURITY: INPUT SANITIZATION ====================
function sanitizeText(input, maxLen = 500) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags to prevent stored XSS
    .trim()
    .substring(0, maxLen);
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim()) && email.length <= 100;
}

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const MONGO_URI = process.env.MONGO_URI || "";
const DB_NAME = "webprofile_db";

// ==================== DEFAULT SEED DATA & LOCAL STORE ====================
const initialProfile = {
  id: 'thanakrit',
  name: 'ธนกฤต อึงไพเราะ',
  nameEn: 'Thanakrit Eungpairoh',
  nickname: 'ไอซ์',
  role: 'UX/UI Designer & Video Editing',
  subtitle: 'นักศึกษามหาวิทยาลัยมหิดล คณะ ICT ชั้นปีที่ 3',
  bio: 'ผมกำลังเป็นนักศึกษาที่สนใจงานสาย UXUI กับกำลังฝึกงาน UX/UI อยู่ เพราะคิดว่าฝึกทักษะ UX/UI นี้ไม่ได้แค่งานสาย UX/UI ด้านเดียว แต่ยังมีประโยชน์กับงานสาย Video Editing ด้วย\n\nผมมีทักษะตัดต่อวิดีโอ และทำ motion graphic พื้นฐานได้ใน adobe after effect ทักษะนี้ฝึกจาก youtube กับคนรู้จักล้วนๆ แต่สามารถสร้างช่องและมีงานลูกค้าได้\n\nก่อนที่จะร่วมงานกัน สามารถดูผลงานผ่านปุ่มด้านล่างได้เลย',
  skills: [
    "Figma – UI Design",
    "After Effect – Video Editing",
    "VibeCode – Web & App"
  ],
  experience: [
    "ฝึกงานในสาย UX/UI 6 เดือน ที่ Security Pitch",
    "ฝึกงานในสาย dev web โดยใช้ .net framework 2 เดือน ที่ biophics"
  ],
  education: [
    "กำลังศึกษาอยู่ที่คณะเทคโนโลยีสารสนเทศและการสื่อสาร (ICT) มหาวิทยาลัยมหิดล"
  ],
  phone: '093-583-9658',
  email: 'icekung8448@gmail.com',
  tools: [
    { name: 'Figma', icon: '/assets/figma.avif' },
    { name: 'Adobe After Effects', icon: '/assets/Adobe_After_Effects_CC_icon.svg.webp' }
  ],
  socials: {
    github: 'https://github.com/Thanakrit8448',
    linkedin: 'https://www.linkedin.com/in/ธนกฤต-อึงไพเราะ-5b5511351',
    tiktok: 'https://www.tiktok.com/@icelandkung'
  },
  resumeUrl: '/assets/Resume.pdf',
  avatarUrl: '/assets/profile.png',
  updatedAt: new Date()
};

const initialProjects = [
  {
    "id": "app-alarm-clock",
    "type": "App",
    "title": "แอปนาฬิกาปลุก Lunaria (Android App) - Vibe Coding 100%",
    "categoryTag": "Mobile Application / Vibe Coding",
    "figmaHeader": "Lunaria Alarm · Android APK",
    "timeEdited": "แก้ไขล่าสุดเมื่อสักครู่",
    "summary": "แอปนาฬิกาปลุกที่สร้างขึ้นมาจากผลงานที่เคยออกแบบไว้ โดยการ vibe code 100% สามารถเลือกไฟล์ MP3 จากในเครื่องมาใช้เป็นเสียงปลุก และมีโหมดกล่อมนอนที่จะช่วยให้คุณนอนหลับด้วยเพลงที่คุณเลือก พร้อม UI ธีมกลางคืนที่สวยงามสบายตา",
    "link": "https://drive.google.com/file/d/1llqDP_hh9F2Yf3rrWqwKh9ElxTDdRero/view?usp=drive_link",
    "linkText": "ดาวน์โหลด APK",
    "imageUrl": "/assets/project_alarm_custom.webp",
    "order": 1,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-28T04:40:31.741Z",
    "duration": "2 สัปดาห์ (ก.ค. 2025)",
    "gallery": [
      "/assets/project_alarm_app.png",
      "/assets/project_figma_clock.png"
    ],
    "problem": "นาฬิกาปลุกทั่วไปในตลาดมักมีเสียงซ้ำซาก แสงหน้าจอยามดึกแสบตา และไม่มีโหมดกล่อมนอนที่ผ่อนคลายสำหรับคนนอนหลับยาก",
    "role": "UX/UI Designer & Vibe Coder",
    "solution": "ออกแบบ UI ธีม Midnight Dark สบายตา พร้อมระบบเลือกเพลง MP3 จากในเครื่องมาใช้เป็นเสียงปลุก และมีโหมดกล่อมนอนที่จะช่วยให้คุณนอนหลับด้วยเพลงที่คุณเลือก",
    "tools": [
      "Figma",
      "VS Code",
      "Android Studio",
      "Vibe Coding"
    ],
    "videoUrl": ""
  },
  {
    "id": "figma-autumn-login",
    "categoryTag": "Mobile & Web UI Design",
    "createdAt": "2026-10-28T04:00:00.000Z",
    "duration": "21 - 28 ต.ค. (1 สัปดาห์)",
    "figmaHeader": "Autumn Theme · Community",
    "gallery": [
      "/assets/project_figma_autumn.png",
      "/assets/project_figma_autumn_frames.png"
    ],
    "imageUrl": "/assets/project_figma_autumn.png",
    "link": "https://www.figma.com/community/file/1697112943303720940/template-login-and-sign-up-autumn-theme",
    "linkText": "ดูโปรเจกต์ Figma Community",
    "order": 2,
    "problem": "หน้า Login และ Sign Up ส่วนใหญ่มักมีดีไซน์ที่ดูเป็นทางการและแข็งทื่อ ขาดความมีชีวิตชีวาและการสร้างความรู้สึกอบอุ่นน่าประทับใจตั้งแต่ก้าวแรกที่ผู้ใช้เปิดเว็บไซต์",
    "role": "Solo UI/UX Designer",
    "solution": "ออกแบบชุด Template หน้า Login, Sign Up, Forgot Password, OTP Verification และ Reset Password ในธีม Autumn ที่ใช้โทนสีส้มอิฐ น้ำตาล ครีม ผสานดีไซน์ Hand-drawn ให้ความรู้สึกอบอุ่น เป็นมิตร และใช้งานง่าย",
    "summary": "เทมเพลต UI หน้าเข้าสู่ระบบและสมัครสมาชิก (Login & Sign Up) ในธีมฤดูใบไม้ร่วงอันอบอุ่น โดดเด่นด้วยดีไซน์น่ารักสไตล์ภาพวาดลายเส้น (Hand-drawn) เหมาะสำหรับการเพิ่มบรรยากาศที่อบอุ่นและเป็นกันเองให้กับโปรเจกต์เว็บถัดไปของคุณ",
    "timeEdited": "แก้ไขเมื่อ 28 ต.ค. 2026",
    "title": "Template: Login & Sign Up (Autumn Theme)",
    "tools": [
      "Figma",
      "UI Design",
      "Design System"
    ],
    "type": "Figma",
    "updatedAt": "2026-10-28T04:00:00.000Z",
    "videoUrl": ""
  },
  {
    "id": "figma-lumin",
    "type": "Figma",
    "title": "App Lunaria  - แอปนาฬิกาปลุก (UI Design)",
    "categoryTag": "Mobile App Design",
    "figmaHeader": "APP Lunaria · Page 1",
    "timeEdited": "แก้ไขล่าสุดเมื่อสักครู่",
    "summary": "แอปนาฬิกาปลุกที่มีฟังก์ชันหลักคือการเพิ่มเสียง mp3 จากภายนอก และ มีโหมดกล่อมนอนที่จะช่วยให้คุณนอนหลับด้วยเพลงที่คุณเลือก พยายามออกแบบ UI ให้เป็นธีมยามค่ำคืน",
    "link": "https://shorturl.at/EKVEN",
    "linkText": "ดูโปรเจกต์ Figma",
    "imageUrl": "/assets/project_figma_clock.png",
    "order": 3,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-14T09:12:52.733Z",
    "duration": "2 สัปดาห์",
    "gallery": [
      "/assets/project_figma_clock.png",
      "/assets/project_alarm_app.png"
    ],
    "problem": "การตื่นนอนด้วยเสียงปลุกทั่วไปมักทำให้สะดุ้งตื่นและอารมณ์เสีย อีกทั้งแอปนาฬิกาปลุกส่วนใหญ่เน้นฟังก์ชันแต่ขาดความสุนทรีย์ในการใช้งานยามค่ำคืน",
    "role": "Solo UX/UI Designer",
    "solution": "ออกแบบ UI สไตล์ Night Sky ผสานมิติแสงจันทร์ นุ่มนวล สบายตา พร้อมระบบเสียงเพลงแบบค่อยๆ เพิ่มระดับ (Gentle Wakeup) และโหมดผ่อนคลายก่อนนอน",
    "tools": [
      "Figma",
      "FigJam",
      "Design System"
    ],
    "videoUrl": ""
  },
  {
    "id": "figma-ev",
    "type": "Figma",
    "title": "EV Station PluZ - แอปค้นหาและนำทางสถานีชาร์จรถยนต์ไฟฟ้า",
    "categoryTag": "Mobile App UI / Navigation",
    "figmaHeader": "EV Navigation · Page 1",
    "timeEdited": "แก้ไขเมื่อ 1 วันที่แล้ว",
    "summary": "ออกแบบ UI/UX สำหรับแอปพลิเคชันค้นหาสถานีชาร์จ EV ตรวจสอบสถานะหัวชาร์จ อัตราค่าบริการ และระบบนำทางเส้นทางอัจฉริยะ\nเป็นงานที่ได้ทำตอนเรียนรายวิชา UXUI ตอนปี 3",
    "link": "https://shorturl.at/EKVEN",
    "linkText": "ดูโปรเจกต์",
    "imageUrl": "/assets/project_figma_ev.png",
    "order": 4,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-14T09:17:06.385Z",
    "duration": "3 สัปดาห์",
    "gallery": [
      "/assets/project_figma_ev.png"
    ],
    "problem": "ผู้ใช้รถยนต์ไฟฟ้า (EV) มักเจอปัญหาสถานีชาร์จเต็ม ไม่ทราบสถานะหัวชาร์จล่วงหน้า หรือหาตำแหน่งสถานีชาร์จยากขณะเดินทางไกล",
    "role": "UX/UI Designer (งานรายวิชา UXUI ปี 3)",
    "solution": "ออกแบบแอปพลิเคชันค้นหาสถานีชาร์จ EV ที่แสดงสถานะหัวชาร์จ Real-time, ระบบจองคิวล่วงหน้า, การคำนวณค่าบริการ และระบบนำทางอัจฉริยะวางแผนจุดแวะชาร์จ",
    "tools": [
      "Figma",
      "FigJam",
      "User Journey Mapping"
    ],
    "videoUrl": ""
  },
  {
    "id": "figma-book",
    "type": "Figma",
    "title": "แอปอ่านหนังสือที่มี AI Agent เป็นผู้ช่วยอ่านไปพร้อมกับเรา",
    "categoryTag": "Mobile UI / Book Library",
    "figmaHeader": "Reading Library · Page 1",
    "timeEdited": "แก้ไขเมื่อ 3 วันที่แล้ว",
    "summary": "ผู้ใช้สามารถ สร้าง AI Agent ที่มีความเชี่ยวชาญและสไตล์การอธิบายต่างกัน แล้วเรียกมาเป็นเพื่อนอ่านหนังสือได้ ไม่ใช่แค่ใช้ AI สรุปหนังสืออย่างเดียว",
    "link": "https://shorturl.at/Uajwn",
    "linkText": "ดูโปรเจกต์",
    "imageUrl": "/assets/project_figma_book.png",
    "order": 5,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-14T09:18:01.016Z",
    "duration": "2 สัปดาห์",
    "gallery": [
      "/assets/project_figma_book.png"
    ],
    "problem": "การอ่านหนังสือคนเดียวมักทำให้หมดไฟ หรืออ่านไม่เข้าใจ และเครื่องมือ AI ทั่วไปมักทำได้แค่สรุปเนื้อหาสั้นๆ โดยไม่ได้สร้างความผูกพันหรือแลกเปลี่ยนมุมมอง",
    "role": "UX/UI Designer",
    "solution": "ออกแบบระบบ AI Agent Companion ที่ผู้ใช้สามารถเลือกผู้ช่วยที่มีบุคลิกภาพเฉพาะตัว คอยพูดคุย ถาม-ตอบ และอ่านไปพร้อมกับผู้ใช้เหมือนมีเพื่อนอ่านหนังสือข้างๆ",
    "tools": [
      "Figma",
      "AI Prompting",
      "FigJam"
    ],
    "videoUrl": ""
  },
  {
    "id": "ae-video",
    "type": "AE",
    "title": "Blue Protocol: Star Resonance - คลิปวิดีโอโปรโมทเกม",
    "categoryTag": "Motion Graphic & Video Editing",
    "figmaHeader": "Star Resonance · After Effects",
    "timeEdited": "แก้ไขเมื่อสัปดาห์ที่แล้ว",
    "summary": "คลิปวิดีโอที่ลูกค้าจากเกม Blue Protocol Star Resonance จ้างโปรโมท",
    "link": "https://url-shortener.me/574X",
    "linkText": "ดูโปรเจกต์",
    "imageUrl": "/assets/project_video_clip.png",
    "order": 6,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-14T09:20:14.612Z",
    "duration": "1 สัปดาห์",
    "gallery": [
      "/assets/project_video_clip.png"
    ],
    "problem": "เกม Blue Protocol: Star Resonance ต้องการวิดีโอโปรโมทที่เร้าใจ ดึงดูดผู้เล่นใหม่ และสื่อสารจุดเด่นของระบบการเล่นได้อย่างรวดเร็วใน 15-30 วินาที",
    "role": "Motion Graphic & Video Editor",
    "solution": "ตัดต่อวิดีโอสไตล์ Fast-Paced ผสมผสาน Motion Graphic, Sound Design สอดประสานจังหวะ และ Color Grading ให้ได้มิติเกมฟอร์มยักษ์",
    "tools": [
      "Adobe After Effects",
      "Premiere Pro",
      "Photoshop"
    ],
    "videoUrl": "https://url-shortener.me/574X"
  },
  {
    "id": "power-bi",
    "type": "BI",
    "title": "Dashboard อุบัติเหตุทางถนนในประเทศไทย",
    "categoryTag": "Data Analytics Dashboard",
    "figmaHeader": "Accident Dashboard · Power BI",
    "timeEdited": "แก้ไขเมื่อสัปดาห์ที่แล้ว",
    "summary": "Dashboard วิเคราะห์อุบัติเหตุทางถนนในประเทศไทย จัดอันดับประเถทรถยนต์ที่เกิดอุบัติเหตุบ่อยที่สุด หรือ พื้นที่ที่มีความเสี่ยงสูงในการเกิดอุบัติเหตุ\nเป็นงานในรายวิชา BI ในตอนเรียนปี 3",
    "link": "https://url-shortener.me/5581",
    "linkText": "ดูโปรเจกต์",
    "imageUrl": "/assets/project_power_bi.png",
    "order": 7,
    "createdAt": "2026-10-14T03:15:06.784Z",
    "updatedAt": "2026-10-14T09:26:37.532Z",
    "duration": "งานในรายวิชา BI ตอนเรียนปี 3",
    "gallery": [
      "/assets/project_power_bi.png"
    ],
    "problem": "ข้อมูลสถิติอุบัติเหตุทางถนนในประเทศไทยมีขนาดใหญ่และกระจัดกระจาย ทำให้ยากต่อการระบุปัจจัยเสี่ยงหลักและพื้นที่อันตรายเพื่อกำหนดมาตรการป้องกัน",
    "role": "Data Analyst & Dashboard Designer",
    "solution": "สร้าง Interactive Dashboard ที่เจาะลึกสถิติแยกตามประเภทรถยนต์ ช่วงเวลา และพื้นที่เสี่ยงสูง พร้อมตัวกรองอัจฉริยะที่ช่วยให้วิเคราะห์ข้อมูลได้ทันที",
    "tools": [
      "Power BI",
      "Excel",
      "DAX",
      "Data Modeling"
    ],
    "videoUrl": ""
  }
];

const STORE_FILE = path.join(__dirname, 'data', 'store.json');

function initLocalStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      return {
        profile: data.profile || { ...initialProfile },
        projects: Array.isArray(data.projects) && data.projects.length > 0 ? data.projects : [ ...initialProjects ],
        contacts: Array.isArray(data.contacts) ? data.contacts : []
      };
    }
  } catch (e) {
    console.error("Local store read error, using defaults:", e.message);
  }
  return {
    profile: { ...initialProfile },
    projects: [ ...initialProjects ],
    contacts: []
  };
}

let localStore = initLocalStore();

function persistLocalStore() {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    // In serverless / read-only environment, keep in memory
  }
}

// ==================== MONGODB CONNECTION ====================
let db = null;
let client = null;
let lastDbError = null;
let connectPromise = null;
let lastConnectAttempt = 0;

function tryObjectId(id) {
  if (!id || typeof id !== 'string' || id.length !== 24) return null;
  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
}

async function connectDB() {
  if (!MONGO_URI) {
    return null;
  }
  if (db) return db;
  if (connectPromise) return connectPromise;

  const now = Date.now();
  if (now - lastConnectAttempt < 5000) return db;
  lastConnectAttempt = now;

  connectPromise = (async () => {
    try {
      console.log("Connecting to MongoDB Atlas...");
      client = new MongoClient(MONGO_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000
      });
      await client.connect();
      db = client.db(DB_NAME);
      lastDbError = null;
      console.log(` Connected to MongoDB Atlas: ${DB_NAME}`);
      
      // Sync with MongoDB
      await syncWithDatabase();
      return db;
    } catch (err) {
      lastDbError = err.message;
      console.error(" MongoDB connection error:", err.message);
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

async function syncWithDatabase() {
  if (!db) return;
  try {
    const profileCol = db.collection('profile');
    const existingProfile = await profileCol.findOne({ id: 'thanakrit' });
    if (!existingProfile) {
      await profileCol.insertOne(localStore.profile);
      console.log(" Seeded profile collection into MongoDB Atlas.");
    } else {
      localStore.profile = existingProfile;
    }

    const projectsCol = db.collection('projects');
    const projectCount = await projectsCol.countDocuments();
    if (projectCount === 0) {
      await projectsCol.insertMany(localStore.projects);
      console.log(" Seeded projects into MongoDB Atlas.");
    } else {
      localStore.projects = await projectsCol.find({}).sort({ order: 1 }).toArray();
    }

    const contactsCol = db.collection('contacts');
    const dbContacts = await contactsCol.find({}).sort({ createdAt: -1 }).toArray();
    if (dbContacts && dbContacts.length > 0) {
      localStore.contacts = dbContacts;
    }

    persistLocalStore();
  } catch (err) {
    console.error("Database sync error:", err.message);
  }
}

// Ensure DB connection for /api requests if MONGO_URI is configured
app.use('/api', async (req, res, next) => {
  if (MONGO_URI && !db) {
    try {
      await connectDB();
    } catch (e) {
      console.warn("DB connect middleware error:", e.message);
    }
  }
  next();
});

// ==================== REST API ENDPOINTS ====================

// 1. Database & System Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    databaseConnected: db !== null,
    databaseName: DB_NAME,
    lastDbError: lastDbError,
    timestamp: new Date().toISOString()
  });
});

// 2. GET Profile Data (Always succeeds)
app.get('/api/profile', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    if (db) {
      const profile = await db.collection('profile').findOne({ id: 'thanakrit' });
      if (profile) return res.json({ success: true, data: profile });
    }
  } catch (err) {
    console.error("DB profile query error, using local fallback:", err.message);
  }
  res.json({ success: true, data: localStore.profile });
});

// 3. GET Projects (Always succeeds with all projects)
app.get('/api/projects', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    if (db) {
      const projects = await db.collection('projects').find({}).sort({ order: 1 }).toArray();
      if (projects && projects.length > 0) {
        return res.json({ success: true, count: projects.length, data: projects });
      }
    }
  } catch (err) {
    console.error("DB projects query error, using local fallback:", err.message);
  }
  res.json({ success: true, count: localStore.projects.length, data: localStore.projects });
});

// 4. POST Like a project (Protected with Rate Limiter)
app.post('/api/projects/:id/like', likeLimiter, async (req, res) => {
  try {
    const projectId = sanitizeText(req.params.id, 50);
    const item = localStore.projects.find(p => p.id === projectId);
    if (item) {
      item.likes = (item.likes || 0) + 1;
      persistLocalStore();
    }
    if (db) {
      try {
        await db.collection('projects').updateOne({ id: projectId }, { $inc: { likes: 1 } });
      } catch (e) {
        console.error("MongoDB like error:", e.message);
      }
    }
    res.json({ success: true, likes: item ? item.likes : 1, id: projectId });
  } catch (err) {
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกถูกใจ" });
  }
});

// 5. POST Contact Form (Protected with Rate Limiter, NoSQL Injection & XSS Defense)
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Strict type check to prevent NoSQL query injection payloads
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาระบุข้อความให้ครบถ้วน" });
    }

    const cleanName = sanitizeText(name, 80);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = sanitizeText(phone || '', 25).replace(/[^0-9+\-\s()]/g, '');
    const cleanSubject = sanitizeText(subject || 'ทั่วไป / ติดต่องาน', 120);
    const cleanMessage = sanitizeText(message, 3000);

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: "กรุณาระบุชื่อผู้ติดต่อ (อย่างน้อย 2 ตัวอักษร)" });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" });
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return res.status(400).json({ success: false, error: "กรุณาระบุข้อความรายละเอียด (อย่างน้อย 5 ตัวอักษร)" });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

    const newContact = {
      _id: 'msg_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      ip: clientIp,
      createdAt: new Date()
    };

    localStore.contacts.unshift(newContact);
    persistLocalStore();

    if (db) {
      try {
        await db.collection('contacts').insertOne(newContact);
      } catch (e) {
        console.error("MongoDB contact save error:", e.message);
      }
    }

    res.json({
      success: true,
      message: "ขอบคุณสำหรับข้อความ! บันทึกข้อมูลลงสู่ระบบเรียบร้อยแล้ว",
      id: newContact._id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// 6. GET All Contacts (Admin ONLY - Protected against Data Leak)
app.get('/api/contacts', verifyAdmin, async (req, res) => {
  try {
    if (db) {
      const contacts = await db.collection('contacts').find({}).sort({ createdAt: -1 }).toArray();
      if (contacts && contacts.length > 0) {
        return res.json({ success: true, count: contacts.length, data: contacts });
      }
    }
  } catch (err) {
    console.error("DB contacts query error, using local fallback:", err.message);
  }
  res.json({ success: true, count: localStore.contacts.length, data: localStore.contacts });
});

// ==================== ADMIN API ENDPOINTS ====================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ice1234';

// Admin Auth Middleware (Timing-safe comparison)
function verifyAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (typeof token === 'string' && safeCompare(token, ADMIN_PASSWORD)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง หรือเซสชันหมดอายุ' });
}

// 7. POST Admin Login (Protected against Brute Force Attacks)
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (typeof password === 'string' && safeCompare(password, ADMIN_PASSWORD)) {
    res.json({ success: true, token: ADMIN_PASSWORD, message: 'เข้าสู่ระบบสำเร็จ' });
  } else {
    res.status(401).json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

// 8. PUT Update Profile (Bio, Name, Skills, Experience, Education)
app.put('/api/admin/profile', verifyAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { name, nickname, role, subtitle, bio, skills, experience, education, phone, email } = req.body;
    
    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(nickname !== undefined && { nickname: nickname.trim() }),
      ...(role !== undefined && { role: role.trim() }),
      ...(subtitle !== undefined && { subtitle: subtitle.trim() }),
      ...(bio !== undefined && { bio: bio.trim() }),
      ...(skills !== undefined && {
        skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean)
      }),
      ...(experience !== undefined && {
        experience: Array.isArray(experience) ? experience : experience.split('\n').map(s => s.trim()).filter(Boolean)
      }),
      ...(education !== undefined && {
        education: Array.isArray(education) ? education : education.split('\n').map(s => s.trim()).filter(Boolean)
      }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      updatedAt: new Date()
    };

    localStore.profile = { ...localStore.profile, ...updateData };
    persistLocalStore();

    if (db) {
      try {
        await db.collection('profile').updateOne({ id: 'thanakrit' }, { $set: updateData }, { upsert: true });
      } catch (e) {
        console.error("MongoDB profile update error:", e.message);
      }
    }

    res.json({ success: true, message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว', data: localStore.profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST Create Project
app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
  try {
    const {
      type, title, categoryTag, figmaHeader, timeEdited, summary, link, linkText, imageUrl, order,
      role, duration, tools, problem, solution, gallery, videoUrl
    } = req.body;
    if (!title || !type) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อผลงานและหมวดหมู่' });
    }

    const processedTools = Array.isArray(tools)
      ? tools
      : (typeof tools === 'string' ? tools.split(',').map(s => s.trim()).filter(Boolean) : []);

    const processedGallery = Array.isArray(gallery)
      ? gallery
      : (typeof gallery === 'string'
          ? (gallery.startsWith('data:image/') ? [gallery] : gallery.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean))
          : []);

    const newProject = {
      id: 'proj-' + Date.now(),
      type: type || 'Figma',
      title: title.trim(),
      categoryTag: (categoryTag || type).trim(),
      figmaHeader: (figmaHeader || (type + ' Project · Page 1')).trim(),
      timeEdited: (timeEdited || 'แก้ไขล่าสุดเมื่อสักครู่').trim(),
      summary: (summary || '').trim(),
      link: (link || '#').trim(),
      linkText: (linkText || 'ดูโปรเจกต์').trim(),
      imageUrl: (imageUrl || '/assets/project_figma_clock.png').trim(),
      order: order ? parseInt(order, 10) : localStore.projects.length + 1,
      role: (role || '').trim(),
      duration: (duration || '').trim(),
      tools: processedTools,
      problem: (problem || '').trim(),
      solution: (solution || '').trim(),
      gallery: processedGallery,
      videoUrl: (videoUrl || '').trim(),
      createdAt: new Date()
    };

    localStore.projects.push(newProject);
    persistLocalStore();

    if (db) {
      try {
        await db.collection('projects').insertOne(newProject);
      } catch (e) {
        console.error("MongoDB project insert error:", e.message);
      }
    }

    res.json({ success: true, message: 'เพิ่มผลงานใหม่เรียบร้อยแล้ว', data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. PUT Update Project
app.put('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      type, title, categoryTag, figmaHeader, timeEdited, summary, link, linkText, imageUrl, order,
      role, duration, tools, problem, solution, gallery, videoUrl
    } = req.body;
    
    if (MONGO_URI && !db) {
      await connectDB();
    }

    let item = localStore.projects.find(p => p.id === projectId || String(p._id) === String(projectId));
    if (!item && db) {
      const objId = tryObjectId(projectId);
      const query = objId ? { $or: [{ id: projectId }, { _id: objId }] } : { id: projectId };
      item = await db.collection('projects').findOne(query);
      if (item) {
        localStore.projects.push(item);
      }
    }

    if (!item) {
      return res.status(404).json({ success: false, error: 'ไม่พบผลงานที่ต้องการแก้ไข' });
    }

    if (type !== undefined) item.type = type;
    if (title !== undefined) item.title = title.trim();
    if (categoryTag !== undefined) item.categoryTag = categoryTag.trim();
    if (figmaHeader !== undefined) item.figmaHeader = figmaHeader.trim();
    if (timeEdited !== undefined) item.timeEdited = timeEdited.trim();
    if (summary !== undefined) item.summary = summary.trim();
    if (link !== undefined) item.link = link.trim();
    if (linkText !== undefined) item.linkText = linkText.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl.trim();
    if (order !== undefined) item.order = parseInt(order, 10);
    if (role !== undefined) item.role = role.trim();
    if (duration !== undefined) item.duration = duration.trim();
    if (tools !== undefined) {
      item.tools = Array.isArray(tools)
        ? tools
        : (typeof tools === 'string' ? tools.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
    if (problem !== undefined) item.problem = problem.trim();
    if (solution !== undefined) item.solution = solution.trim();
    if (gallery !== undefined) {
      item.gallery = Array.isArray(gallery)
        ? gallery
        : (typeof gallery === 'string'
            ? (gallery.startsWith('data:image/') ? [gallery] : gallery.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean))
            : []);
    }
    if (videoUrl !== undefined) item.videoUrl = videoUrl.trim();
    item.updatedAt = new Date();

    persistLocalStore();

    if (db) {
      try {
        const updateData = { ...item };
        delete updateData._id;
        const objId = tryObjectId(projectId);
        const filter = objId
          ? { $or: [{ id: projectId }, { id: item.id }, { _id: objId }] }
          : { $or: [{ id: projectId }, { id: item.id }] };
        await db.collection('projects').updateOne(filter, { $set: updateData });
        console.log(`[Admin] Successfully updated project in MongoDB: ${item.id} (${item.title})`);
      } catch (e) {
        console.error("MongoDB project update error:", e.message);
      }
    }

    res.json({ success: true, message: 'แก้ไขผลงานเรียบร้อยแล้ว', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. DELETE Project
app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const projectId = req.params.id;
    const index = localStore.projects.findIndex(p => p.id === projectId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบผลงานที่ต้องการลบ' });
    }

    localStore.projects.splice(index, 1);
    persistLocalStore();

    if (db) {
      try {
        await db.collection('projects').deleteOne({ id: projectId });
      } catch (e) {
        console.error("MongoDB project delete error:", e.message);
      }
    }

    res.json({ success: true, message: 'ลบผลงานเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. DELETE Contact Message
app.delete('/api/admin/contacts/:id', verifyAdmin, async (req, res) => {
  try {
    const contactId = req.params.id;
    const index = localStore.contacts.findIndex(c => String(c._id) === String(contactId));
    if (index !== -1) {
      localStore.contacts.splice(index, 1);
      persistLocalStore();
    }

    if (db) {
      try {
        let query = {};
        try {
          query = { _id: new ObjectId(contactId) };
        } catch {
          query = { _id: contactId };
        }
        await db.collection('contacts').deleteOne(query);
      } catch (e) {
        console.error("MongoDB contact delete error:", e.message);
      }
    }

    res.json({ success: true, message: 'ลบข้อความเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Page Route
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: path.join(__dirname, 'public') });
});

// Global error handling middleware (prevents leaking stack traces)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'ขนาดข้อมูลที่ส่งมามีขนาดใหญ่เกินกำหนด' });
  }
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' });
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'public') });
});

// Start Server & Connect MongoDB (Local development)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(` Web Profile Server running on http://localhost:${PORT}`);
    console.log(`===============================================`);
    await connectDB();
  });
}

module.exports = app;
