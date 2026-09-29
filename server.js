const dns = require('dns');

// Set standard reliable public DNS on Windows to prevent ECONNREFUSED on SRV lookups
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://icekung8448_db_user:KwJ9nq1q5SjBSiV3@webprofile.u1sm17a.mongodb.net/?retryWrites=true&w=majority&appName=Webprofile";
const DB_NAME = "webprofile_db";

let db = null;
let client = null;

// Connect to MongoDB (Reusable connection cache for serverless)
async function connectDB() {
  if (db) return db;
  try {
    console.log("Connecting to MongoDB Atlas...");
    client = new MongoClient(MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 6000
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(` Connected to MongoDB Atlas: ${DB_NAME}`);
    
    // Seed database if profile or projects collection is empty
    const profileCol = db.collection('profile');
    const existing = await profileCol.findOne({ id: 'thanakrit' });
    if (!existing) {
      await seedDatabase();
    }
    return db;
  } catch (err) {
    console.error(" MongoDB connection error:", err.message);
  }
}

// Seed Default Data if collections are empty
async function seedDatabase() {
  if (!db) return;
  try {
    const profileCol = db.collection('profile');
    const existingProfile = await profileCol.findOne({ id: 'thanakrit' });
    
    const profileData = {
      id: 'thanakrit',
      name: 'ธนกฤต อึงไพเราะ',
      nameEn: 'Thanakrit Eungpairoh',
      nickname: 'ไอซ์',
      role: 'UX/UI Designer & Motion Graphic',
      subtitle: 'นักศึกษามหาวิทยาลัยมหิดล คณะ ICT ชั้นปีที่ 3',
      bio: 'สวัสดีครับ ผมชื่อ ธนกฤต อึงไพเราะ เรียกผมว่า ไอซ์ ได้เลยนะครับ\n\nผมกำลังเป็นนักศึกษาที่สนใจงานสาย UXUI กับกำลังฝึกงาน UX/UI อยู่ เพราะคิดว่าฝึกทักษะ UX/UI นี้ไม่ได้แค่งานสาย UX/UI ด้านเดียว แต่ยังมีประโยชน์กับงานสาย motion graphic ด้วย\n\nผมมีทักษะตัดต่อวิดีโอ และทำ motion graphic พื้นฐานได้ใน adobe after effect ทักษะนี้ฝึกจาก youtube กับคนรู้จักล้วนๆ แต่สามารถสร้างช่องและมีงานลูกค้าได้\n\nคุณสามารถดูผลงานแล้วกดปุ่มร่วมงานกับผมได้เลยครับ ขอบคุณครับ',
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

    if (!existingProfile) {
      await profileCol.insertOne(profileData);
      console.log(" Seeded profile collection successfully.");
    } else {
      await profileCol.replaceOne({ id: 'thanakrit' }, profileData);
    }

    const projectsCol = db.collection('projects');
    await projectsCol.deleteMany({});

    const defaultProjects = [
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

    await projectsCol.insertMany(defaultProjects);
    console.log(" Seeded 5 projects with exact images successfully.");
  } catch (seedErr) {
    console.error("Database seeding error:", seedErr.message);
  }
}

// Ensure DB is connected for serverless invocations (e.g. Vercel)
app.use(async (req, res, next) => {
  if (!db) {
    try {
      await connectDB();
    } catch (e) {
      console.error("Serverless DB connection error:", e.message);
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
    timestamp: new Date().toISOString()
  });
});

// 2. GET Profile Data
app.get('/api/profile', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const profile = await db.collection('profile').findOne({ id: 'thanakrit' });
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET Projects
app.get('/api/projects', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const projects = await db.collection('projects').find({}).sort({ order: 1 }).toArray();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST Like a project
app.post('/api/projects/:id/like', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const projectId = req.params.id;
    const result = await db.collection('projects').findOneAndUpdate(
      { id: projectId },
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    res.json({ success: true, likes: result.likes, id: projectId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST Contact Form (Save to MongoDB)
app.post('/api/contact', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "กรุณากรอกชื่อ, อีเมล และข้อความให้ครบถ้วน" });
    }

    const newContact = {
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      subject: (subject || 'ทั่วไป / ติดต่องานฝึกงาน').trim(),
      message: message.trim(),
      ip: req.ip || req.connection.remoteAddress,
      createdAt: new Date()
    };

    const insertResult = await db.collection('contacts').insertOne(newContact);
    console.log(` New contact message received from ${name} (${email}) - ID: ${insertResult.insertedId}`);

    res.json({
      success: true,
      message: "ขอบคุณสำหรับข้อความ! บันทึกข้อมูลลงสู่ระบบเรียบร้อยแล้ว",
      id: insertResult.insertedId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET All Contacts (Admin / Inquiries list)
app.get('/api/contacts', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const contacts = await db.collection('contacts').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
