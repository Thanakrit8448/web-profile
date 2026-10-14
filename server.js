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

// 3. Body Parser with Payload Limit (prevents large payload DoS)
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
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
    "Figma",
    "UI Design",
    "Wireframing",
    "Motion Graphic",
    "Video Editing",
    "Frontend"
  ],
  experience: [
    "ฝึกงานในสาย dev web โดยใช้ .net framework 2 เดือน ที่ biophics",
    "ฝึกงานในสาย UX/UI 6 เดือน ที่ Security Pitch"
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
    id: 'figma-lumin',
    type: 'Figma',
    title: 'Lumin - การตื่นนอนด้วยเสียงเพลงที่คุณรัก',
    categoryTag: 'Mobile App Design',
    figmaHeader: 'APP Lunaria · Page 1',
    timeEdited: 'แก้ไขล่าสุดเมื่อสักครู่',
    summary: 'แอปนาฬิกาปลุกที่มีฟังก์ชันหลักคือการเพิ่มเสียง mp3 จากภายนอก และ สามารถดูเวลาของโลกได้นะตอนนี้ พยายามออกแบบ UI ให้เป็นธีมยามค่ำคืน',
    link: 'https://shorturl.at/EKVEN',
    linkText: 'ดูโปรเจกต์',
    imageUrl: '/assets/project_figma_clock.png',
    order: 1
  },
  {
    id: 'figma-ev',
    type: 'Figma',
    title: 'EV Station PluZ - แอปค้นหาและนำทางสถานีชาร์จรถยนต์ไฟฟ้า',
    categoryTag: 'Mobile App UI / Navigation',
    figmaHeader: 'EV Navigation · Page 1',
    timeEdited: 'แก้ไขเมื่อ 1 วันที่แล้ว',
    summary: 'ออกแบบ UI/UX สำหรับแอปพลิเคชันค้นหาสถานีชาร์จ EV ตรวจสอบสถานะหัวชาร์จ อัตราค่าบริการ และระบบนำทางเส้นทางอัจฉริยะ',
    link: 'https://shorturl.at/EKVEN',
    linkText: 'ดูโปรเจกต์',
    imageUrl: '/assets/project_figma_ev.png',
    order: 2
  },
  {
    id: 'figma-book',
    type: 'Figma',
    title: 'My Reading Dashboard & Library - แอปอ่านและจัดการคลังหนังสือ',
    categoryTag: 'Mobile UI / Book Library',
    figmaHeader: 'Reading Library · Page 1',
    timeEdited: 'แก้ไขเมื่อ 3 วันที่แล้ว',
    summary: 'ออกแบบระบบคลังหนังสือดิจิทัล ติดตามการอ่าน วิเคราะห์ข้อมูล Insight และการอัปโหลดไฟล์หนังสือด้วยดีไซน์มินิมอลสบายตา',
    link: 'https://shorturl.at/Uajwn',
    linkText: 'ดูโปรเจกต์',
    imageUrl: '/assets/project_figma_book.png',
    order: 3
  },
  {
    id: 'ae-video',
    type: 'AE',
    title: 'Blue Protocol: Star Resonance - คลิปวิดีโอโปรโมทเกม',
    categoryTag: 'Motion Graphic & Video Editing',
    figmaHeader: 'Star Resonance · After Effects',
    timeEdited: 'แก้ไขเมื่อสัปดาห์ที่แล้ว',
    summary: 'คลิปวิดีโอที่ลูกค้าจากเกม Blue Protocol Star Resonance จ้างโปรโมท โดดเด่นด้วยการตัดต่อที่เร้าใจ เอฟเฟกต์ Motion Graphic และ Sound Sync',
    link: 'https://url-shortener.me/574X',
    linkText: 'ดูโปรเจกต์',
    imageUrl: '/assets/project_video_clip.png',
    order: 4
  },
  {
    id: 'power-bi',
    type: 'BI',
    title: 'แดชบอร์ดวิเคราะห์สถิติอุบัติเหตุทางถนนในประเทศไทย',
    categoryTag: 'Data Analytics Dashboard',
    figmaHeader: 'Accident Dashboard · Power BI',
    timeEdited: 'แก้ไขเมื่อสัปดาห์ที่แล้ว',
    summary: 'แดชบอร์ดวิเคราะห์ Big Data อุบัติเหตุทางถนนในประเทศไทย ค้นหาจุดเสี่ยง ประเภทยานพาหนะ และช่วงเวลาเกิดเหตุ เพื่อการวางแผนป้องกันเชิงรุก',
    link: 'https://url-shortener.me/5581',
    linkText: 'ดูโปรเจกต์',
    imageUrl: '/assets/project_power_bi.png',
    order: 5
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
    const { type, title, categoryTag, figmaHeader, timeEdited, summary, link, linkText, imageUrl, order } = req.body;
    if (!title || !type) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อผลงานและหมวดหมู่' });
    }

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
    const { type, title, categoryTag, figmaHeader, timeEdited, summary, link, linkText, imageUrl, order } = req.body;
    
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
