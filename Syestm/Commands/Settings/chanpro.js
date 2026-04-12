const { MessageAttachment } = require('discord.js');
const Data = require('pro.db');
const { loadImage, createCanvas, Image } = require('canvas');
const Pro = require("pro.db");
const fetch = require('node-fetch');
const { owners } = require(`${process.cwd()}/config`);
const fs = require("fs");
const path = require('path');

module.exports = {
    name: 'chanpro',
    description: 'Set a custom background image for your profile.',
    run: async (client, message, args) => {
        // التحقق من صلاحيات المستخدم
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        // التحقق من تفعيل الأمر
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        let imageURL;
        const imageName = "image.png";

        // الحصول على رابط الصورة
        if (args[0]) {
            imageURL = args[0];
        } else if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            imageURL = attachment.url;
            
            // التحقق من نوع الملف
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(attachment.contentType)) {
                return message.reply("**يجب أن يكون الملف المرفق صورة صالحة**");
            }
        } else {
            return message.reply("**يرجى ارفاق رابط الصورة أو الصورة**");
        }

        try {
            // تحميل الصورة
            const response = await fetch(imageURL);
            if (!response.ok) {
                throw new Error('فشل في تحميل الصورة');
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // التأكد من وجود المجلد
            const dirPath = path.join(process.cwd(), "Fonts");
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const tempPath = path.join(dirPath, `temp_${Date.now()}_${imageName}`);
            fs.writeFileSync(tempPath, buffer);

            // تحميل الصورة باستخدام canvas
            const img = new Image();
            img.onerror = (err) => {
                throw new Error('فشل في تحميل الصورة');
            };

            // تحميل الصورة من الملف المؤقت
            const image = await loadImage(tempPath);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            // حفظ الصورة كـ PNG
            const finalPath = path.join(dirPath, imageName);
            const out = fs.createWriteStream(finalPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            // انتظار انتهاء الحفظ
            await new Promise((resolve, reject) => {
                out.on('finish', resolve);
                out.on('error', reject);
            });

            // حذف الملف المؤقت
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }

            // حفظ المسار في قاعدة البيانات
            Pro.set(`setImageURL_${message.guild.id}`, finalPath);

            // تأكيد نجاح العملية
            message.react('✅');

        } catch (error) {
            console.error('خطأ في معالجة الصورة:', error);
            message.reply("**حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى.**");

            // محاولة حذف الملف المؤقت في حالة الخطأ
            const tempPath = path.join(process.cwd(), "Fonts", `temp_${Date.now()}_${imageName}`);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }
};