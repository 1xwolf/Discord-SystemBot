<div align="center">
  <img src="https://img.shields.io/badge/System%20Bot-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" />

  # System Bot

  **Lightweight & Scalable Discord Bot — Built with Node.js**  
  **بوت ديسكورد خفيف الوزن وقابل للتوسع — مبني بـ Node.js**

  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v13-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)](#)

  <p align="center">

<img width="240" height="240" alt="Discord-logo" src="https://github.com/user-attachments/assets/172b45c1-03b6-49cb-b6b1-e099f444dc98" /> 

<img width="128" height="128" alt="تصميم بدون عنوان (1)" src="https://github.com/user-attachments/assets/9377879c-26e0-4835-bd31-09f66ce262e2" />

  
</p>
</div>

# Overview 

 
System Bot is a Discord bot built with Node.js, designed to be fast, reliable, and easy to customize.  
It allows you to fully manage your server — from moderation to media tools and external API integrations — all in one place.

System Bot هو بوت ديسكورد مكتوب بـ Node.js، صُمّم ليكون سريعاً وموثوقاً وسهل التخصيص.  
يتيح لك إدارة السيرفر بالكامل — من الإشراف إلى أدوات الوسائط وتكامل APIs خارجية — كل ذلك من مكان واحد.

---

<img width="900" height="900" alt="Screenshot 2026-04-12 204644" src="https://github.com/user-attachments/assets/23fe6104-f4e7-40f1-a604-d8fe3d0bb3b7" />



# Features 

| Feature | Description | - | - |
|--------|------------|--------|-------|
| 🛡️ Moderation System | Advanced kick, ban, warnings, and tracking | 
 نظام الإشراف | أوامر احترافية للكيك، البان، التحذيرات والمتابعة |
| 🖼️ Image Tools | Built-in image generation & canvas processing | 
 أدوات الصور | توليد الصور ومعالجة Canvas |
| 🎙️ Voice Support | Full audio playback in voice channels | 
 دعم الصوت | تشغيل صوتي متكامل في القنوات |
| 🔌 API Integrations | Easily connect with external services | 
 تكامل APIs | ربط مع خدمات خارجية بسهولة |
| 🔒 Security | Rate limiting & backend protection | 
 الحماية | حماية متقدمة و Rate limiting |
| 🧩 Modular Structure | Clean and scalable architecture |
 هيكل معياري | كل ميزة في ملف مستقل وسهل التوسع |

---

# Installation 

```bash
git clone https://github.com/username/system-bot.git
cd system-bot
npm install
```

---

# Configuration 

## Step 1 — config.json 

```json
{
  "owners": ["YOUR_USER_ID"],
  "Guild": "YOUR_GUILD_ID",
  "prefix": "!",
  "token": "YOUR_BOT_TOKEN",
  "botId": "YOUR_BOT_ID"
}
```

---

## Step 2 — config.js   

```js
const config = {
  token: process.env.BOT_TOKEN,
  botId: process.env.BOT_ID,
  prefix: '!',
  owners: ['YOUR_USER_ID'],
  Guild: 'YOUR_GUILD_ID',
};
```

> **EN:** If you use environment variables, create a `.env` file and add `BOT_TOKEN` and `BOT_ID`.  
> **AR:** إذا كنت تستخدم متغيرات البيئة، أنشئ ملف `.env` وأضف `BOT_TOKEN` و `BOT_ID`.

---

# Run | التشغيل

```bash
npm start
```

---

<p align="center"> 
    في حال تريد استخدام البوت : help! لأظهار كل الاوامر 
  
</p>

<p align="center">
    If you want to use the bot: !help To show all commands

</p>

---

# Project Structure

```
system-bot/
│
├── Commands/        # أوامر البوت
├── events/          
├── handler/         
├── dashboard/       # لوحة التحكم 
├── assets/          # صور وملفات ثابتة
├── Fonts/           # الخطوط
│
├── index.js         
├── config.js       
├── config.json      
│
├── database.json    
├── package.json      
├── .env              
│
└── Dockerfile        

```

---

# Notes 

- Make sure Node.js version 18+ is installed  
- Keep your bot token secure  
- Use environment variables in production  
---
- تأكد من استخدام Node.js إصدار 18 أو أحدث  
- لا تشارك توكن البوت  
- استخدم متغيرات البيئة في بيئة الإنتاج  
