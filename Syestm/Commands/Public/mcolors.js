const { MessageAttachment, MessageActionRow, MessageSelectMenu } = require("discord.js");
const db = require("pro.db");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "mcolors",
  description: "Shows server colors",
  run: async (client, message) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const colorRoles = message.guild.roles.cache.filter(
      (role) => !isNaN(role.name) && !role.name.includes(".")
    );
    
    if (colorRoles.size === 0) {
      return message.reply("**لا يوجد اللوان فالسيرفر .**");
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

    const colorsList = createCanvas(1200, canvasHeight); 

    const Url = db.get("Url = [ Colors ]");

    let backgroundImage;
    if (Url) {
      try {
        backgroundImage = await loadImage(Url);
      } catch (error) {
        console.error("Error loading background image:", error);
      }
    }

    const ctx = colorsList.getContext("2d");
    
    if (backgroundImage) {
      const xCenter = (colorsList.width - backgroundImage.width) / 2;
      const yCenter = (colorsList.height - backgroundImage.height) / 2;
      
      ctx.drawImage(backgroundImage, xCenter, yCenter);
    }

    let x = 16;
    let y = canvasHeight / 2 - 55;

    sortedRoles.forEach((colorRole, index) => {
      // إذا كان الدور في النطاق الأول من الأدوار المرئية فقط
      if (index < maxRange) {
        x += 90;
      }
      // إذا كان الدور في النطاق الثاني (بعد 25) فقط
      else if (index >= 25 && index < sortedRoles.size) {
        return;
      }
      else {
        x += 90;
      }

      if (x > 1080) {
        x = 110;
        y += 90;
      }

      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      ctx.fillStyle = colorRole.hexColor;
      
      ctx.lineWidth = 5;
      ctx.strokeStyle = "black";
      
      const borderRadius = 17;
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + 70 - borderRadius, y);
      ctx.quadraticCurveTo(x + 70, y, x + 70, y + borderRadius);
      ctx.lineTo(x + 70, y + 70 - borderRadius);
      ctx.quadraticCurveTo(x + 70, y + 70, x + 70 - borderRadius, y + 70);
      ctx.lineTo(x + borderRadius, y + 70);
      ctx.quadraticCurveTo(x, y + 70, x, y + 70 - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      
      ctx.stroke();
      
      ctx.fill();
      
      const colorNumber = colorRole.name;
      const fontSize = "40px";
      const cellWidth = 70;
      const cellHeight = 70;
      
      ctx.font = fontSize + " Arial";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "black";
      ctx.strokeText(colorNumber.toString(), x + cellWidth / 2, y + cellHeight / 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(colorNumber.toString(), x + cellWidth / 2, y + cellHeight / 2);
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const attachment = new MessageAttachment(colorsList.toBuffer(), "img.png");

    const selectMenu = new MessageSelectMenu()
    .setCustomId("Colors")
    .setPlaceholder("قم باختيار اللون المناسب .")
    .addOptions(
      sortedRoles.map((colorRole) => ({
        label: colorRole.name,
        value: colorRole.id,
        emoji  :'🎨',
      })).slice(0, 25) // Only show the first 25 options
    );

    client.on('interactionCreate', async function (interaction) {
      if (interaction.isSelectMenu()) {
        if (interaction.customId === 'Colors') {
          const role = interaction.guild.roles.cache.get(interaction.values[0]);
          if (role) {
            const member = interaction.member;
    
            member.roles.cache.filter((r) => !isNaN(r.name) && !r.name.includes(".")).forEach(async (existingRole) => {
              await member.roles.remove(existingRole);
            });
    
            await member.roles.add(role);
    
            await interaction.reply({ content: '**تم تغيير اللون بنجاح**', ephemeral: true });
          }
        }
      }
    });

    const actionRow = new MessageActionRow().addComponents(selectMenu);
    message.channel.send({ files: [attachment], components: [actionRow] }).catch(() => {});
  },
};