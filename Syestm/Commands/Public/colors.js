const { MessageAttachment } = require("discord.js");
const db = require("pro.db");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "colors",
  aliases: ["الوان"],
  description: "Shows server colors",
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    let setchannek = db.get(`setChannel_${message.guild.id}`);
    if (setchannek && message.channel.id !== setchannek) return;

    const colorRoles = message.guild.roles.cache.filter(
      (role) => !isNaN(role.name) && !role.name.includes(".")
    );

    if (colorRoles.size === 0) {
      return message.reply("**لا يوجد اللوان في السيرفر.**");
    }

    const sortedRoles = colorRoles.sort((roleA, roleB) => roleB.position - roleA.position);

    let minRange = 1;
    let maxRange = 22;
    let canvasHeight = 400;
    if (sortedRoles.size > 22) {
      minRange = 22;
      maxRange = 25;
      canvasHeight = 400;
    }

    const colrsList = createCanvas(1200, canvasHeight);
    const Url = db.get("Url = [ Colors ]");

    let backgroundImage;
    if (Url) {
      try {
        backgroundImage = await loadImage(Url);
      } catch (error) {
        console.error("Error loading background image:", error);
      }
    }

    const ctx = colrsList.getContext("2d");
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, 1200, 500);
    }

    let x = 50; // Adjust x starting position
    let y = 145;

    sortedRoles.forEach((colorRole) => {
      x += 90; // Space between circles
      if (x > 1080) {
        x = 110;
        y += 90; // Move down a row if x exceeds canvas width
      }

      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      // تحديد لون التعبئة
      ctx.fillStyle = colorRole.hexColor;
      
      // إضافة حواف سوداء بارزة
      ctx.lineWidth = 5; // حجم الحاف
      ctx.strokeStyle = "black"; // لون الحاف
      
      // الرسم الدائري
      const radius = 40; // Radius of the circle
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, false);
      ctx.closePath();
      
      // رسم الحواف
      ctx.stroke();
      
      // رسم التعبئة
      ctx.fill();

      // نص الرقم اللوني
      const colorNumber = colorRole.name;
      const fontSize = "26px"; // Increased font size from 20px to 26px
      ctx.font = fontSize + " Arial";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "black";
      ctx.strokeText(colorNumber.toString(), x + radius, y + radius); // Center text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(colorNumber.toString(), x + radius, y + radius); // Center text
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const attachment = new MessageAttachment(colrsList.toBuffer(), "img.png");

    // إرسال الصورة المرفقة
    message.channel.send({ files: [attachment] });
  }
};