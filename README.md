# Web Profile & Portfolio - ธนกฤต อึงไพเราะ (ไอซ์)

เว็บพอร์ตโฟลิโอส่วนตัวสำหรับนำเสนอผลงานด้าน **UX/UI Design & Motion Graphic** ของ **ธนกฤต อึงไพเราะ (ไอซ์)** นักศึกษาคณะ ICT มหาวิทยาลัยมหิดล ชั้นปีที่ 3

---

## จุดเด่นของโปรเจกต์ (Features)

- **Two-Column Dashboard Design**: เลย์เอาต์ 2 คอลัมน์ที่ทันสมัย ฝั่งซ้ายเป็นการ์ดโปรไฟล์ส่วนตัว และฝั่งขวาเป็นประวัติ ทักษะ ประสบการณ์ และผลงาน
- **Figma Canvas Project Cards**: ดีไซน์การ์ดผลงานตามสไตล์ Figma File Canvas พร้อมพรีวิวรูปภาพและรายละเอียด
- **Category Filter Tabs**: ตัวกรองผลงานตามประเภท ได้แก่:
  - ทั้งหมด
  - Figma (UX/UI Mobile App & Dashboard)
  - AE (Motion Graphic & Video Editing ใน Adobe After Effects)
  - BI (Data Analytics Dashboard ใน Power BI)
- **MongoDB Atlas Integration**: ระบบฐานข้อมูลคลาวด์สำหรับจัดเก็บข้อมูลโปรไฟล์, รายการผลงาน, และบันทึกข้อความติดต่อกลับ (Contact Inquiries) แบบเรียลไทม์
- **Brand Identity & Clean UI**: ออกแบบโดยใช้ชุดสี CI 4 สีหลัก (`#FFEDB9`, `#FFCB56`, `#FFA259`, `#FF7E7E`) และไม่มีการใช้อีโมจิเพื่อคงความเป็นมืออาชีพ

---

## โครงสร้างโปรเจกต์ (Project Structure)

```
web-profile/
├── public/
│   ├── assets/               # รูปภาพผลงาน โลโก้ และไฟล์เรซูเม่
│   ├── app.js                # Frontend Logic และการเชื่อมต่อ REST API
│   ├── index.html            # โครงสร้างหน้าเว็บ Semantic HTML5
│   └── style.css             # สไตล์ชีตระบบ CI 4 สี และ Responsive Design
├── .env.example              # ตัวอย่างไฟล์ Environment Variables
├── .gitignore                # ละเว้น node_modules และความลับ
├── package.json              # รายการ Dependencies และ Scripts
├── README.md                 # เอกสารแนะนำโปรเจกต์
└── server.js                 # Express Backend และการเชื่อมต่อ MongoDB Atlas
```

---

## การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. โคลนคลังข้อมูล (Clone Repository)
```bash
git clone https://github.com/Thanakrit8448/web-profile.git
cd web-profile
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` โดยคัดลอกจาก `.env.example`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<db_username>:<db_password>@webprofile.u1sm17a.mongodb.net/?retryWrites=true&w=majority&appName=Webprofile
```

### 4. รันเซิร์ฟเวอร์ (Start Server)
```bash
npm start
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: HTML5, CSS3 (Modern Flexbox & Grid), Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas Cloud Database
- **Design Tools**: Figma, Adobe After Effects, Power BI

---

## ข้อมูลติดต่อ (Contact)

- **ผู้พัฒนา**: ธนกฤต อึงไพเราะ (ไอซ์)
- **โทรศัพท์**: 093-583-9658
- **อีเมล**: icekung8448@gmail.com
- **GitHub**: [Thanakrit8448](https://github.com/Thanakrit8448)
- **LinkedIn**: [ธนกฤต อึงไพเราะ](https://www.linkedin.com/in/ธนกฤต-อึงไพเราะ-5b5511351)
