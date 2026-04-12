const { MessageActionRow, MessageSelectMenu, MessageButton, Permissions, MessageAttachment } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');
const cloudinary = require('cloudinary').v2;
const deepai = require('deepai');
const DIG = require('discord-image-generation');
const Jimp = require('jimp');
const isImageUrl = require('is-image-url');
const { RemoveBgResult, RemoveBgError, removeBackgroundFromImageUrl } = require("remove.bg");
const fs = require("fs");

module.exports = {
  name: "edit-image",
  aliases: ["عدل"],
  description: "Edit avatar commands",
  run: async (client, message, args) => {

    const selectMenu = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('vipMenu')
          .setPlaceholder('اختر إحدى الخيارات')
          .addOptions([
            {
              label: 'رمادي',
              emoji: '💾',
              description: 'لتحويل الصورة من ملون إلى رمادي',
              value: 'ashen',
            },{
              label: 'فلتر',
              emoji: '💾',
              description: 'لإضافة فلتر على الصورة',
              value: 'filter',
            },{
              label: 'دائري',
              emoji: '💾',
              description: 'لقص الصورة إلى شكل دائري',
              value: 'crop',
            },{
                label: 'بلور',
                emoji: '💾',
                description: 'لإضافة تأثير البلور على الصورة',
                value: 'crystalize',
              },{
                label: 'فلترو',
                emoji: '💾',
                description: 'لإضافة تأثير عكس آلوان الصورة',
                value: 'inverse',
              },{
                label: 'إزالة الخلفيه',
                emoji: '💾',
                description: 'ازالة الخلفيه من الصورة',
                value: 'remove',
              }
          ])
      );

    const deleteButton = new MessageButton()
      .setCustomId('Cancel')
      .setLabel('إلغاء')
      .setStyle('DANGER');

    const Cancel = new MessageActionRow()
      .addComponents(deleteButton);

    message.reply({ content: "**قائمة آوامر تعديل الأفاتار**.", components: [selectMenu, Cancel] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
      collector.stop();
    
      const choice = interaction.values[0];

      if (choice === "ashen") {
        await interaction.message.delete();
           
        deepai.setApiKey("37daf812-c7fd-460c-903c-ad362b9d6b76");
        cloudinary.config({
          'cloud_name': "ertghy",
          'api_key': '256788467711845',
          'api_secret': "2IGlZ3XdRuSJ0SD53NQZntKGMNk"
        });
        let image = message.attachments.first() ? message.attachments.find(_0x1c5be8 => ["jpg", "jpeg", 'png', "gif"].find(_0x3538b1 => _0x1c5be8.proxyURL.includes(_0x3538b1))).proxyURL : undefined || args[0x0] ? isImageUrl(args[0x0]) ? args[0x0] : undefined : undefined || message.author.displayAvatarURL({
          'format': 'png',
          'size': 0x800,
          'dynamic': true
        });
        if (message.mentions.users.first()) {
          image = message.mentions.users.first().displayAvatarURL({
            'format': 'png',
            'dynamic': true,
            'size': 0x800
          });
        }
        cloudinary.uploader.upload(image, {
          'public_id': message.author.id,
          'transformation': [{
            'effect': "grayscale"
          }]
        }, (_0x485e3a, _0x52775a) => {
          if (_0x485e3a) {
            return message.channel.send("Error ..").then(_0x4d8964 => setTimeout(() => {
              _0x4d8964["delete"]();
              message["delete"]();
            }, 0xbb8));
          }
          message.reply({
            'content': "** **",
            'files': [{
              'attachment': _0x52775a.url
            }]
          });
        });

      } else if (choice === "filter") {
        await interaction.message.delete();
        const imgURL = message.attachments.first() && message.attachments.first().proxyURL || message.mentions.users.first() && message.mentions.users.first().displayAvatarURL({
            'dynamic': true,
            'format': "png",
            'size': 0x800
          }) || args[1] || message.author.displayAvatarURL({
            'dynamic': true,
            'format': "png",
            'size': 0x800
          });
          let img = await new DIG.Sepia().getImage(imgURL);
          let attach = new MessageAttachment(img, "Sepia.png");
          message.reply({
            files: [attach]
          });

        } else if (choice === "crop") {
          await interaction.message.delete();
          try {
            let avatar;
            if (message.attachments.size > 0) {
              avatar = message.attachments.first().url;
            } else if (args[1]?.startsWith("http")) {
              avatar = args[1];
            } else if (message.mentions.users.size > 0) {
              avatar = message.mentions.users.first().displayAvatarURL({
                dynamic: false,
                format: "jpg",
                size: 2048
              });
            } else {
              avatar = message.author.displayAvatarURL({
                dynamic: false,
                format: "jpg",
                size: 2048
              });
            }
        
            try {
              const image = await Jimp.read(avatar);
              const width = image.bitmap.width;
              const height = image.bitmap.height;
              const size = Math.min(width, height);
              const halfWidth = width / 2;
              const halfHeight = height / 2;
              const circleRadius = size / 2;
              const circleX = halfWidth;
              const circleY = halfHeight;
              
              // إنشاء إطار أبيض حول الصورة
              const frameWidth = 7; // عرض الإطار
              image.scan(0, 0, width, height, function (x, y, idx) {
                const distanceToCenter = Math.sqrt(Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2));
                if (distanceToCenter > circleRadius - frameWidth && distanceToCenter < circleRadius) {
                  this.bitmap.data[idx] = 255; // قيمة الأحمر
                  this.bitmap.data[idx + 1] = 255; // قيمة الأخضر
                  this.bitmap.data[idx + 2] = 255; // قيمة الأزرق
                  this.bitmap.data[idx + 3] = 255; // قيمة الألفا (الشفافية)
                }
              });
              
              // قص الصورة إلى شكل دائري من النصف
              image.scan(0, 0, width, height, function (x, y, idx) {
                const distanceToCenter = Math.sqrt(Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2));
                if (distanceToCenter > circleRadius) {
                  this.bitmap.data[idx + 3] = 0; // جعل الشفافية صفر للجزء خارج الدائرة
                }
              });
              
              const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
              const attachment = new MessageAttachment(buffer, "cropped-image.png");
              message.reply({ files: [attachment] });
            } catch (err) {
              console.error(err);
              message.reply("حدث خطأ أثناء معالجة الصورة.");
            }
          } catch (error) {
            console.error(error);
            message.reply("حدث خطأ أثناء معالجة الصورة.");
          }
                

        } else if (choice === "crystalize") {
            await interaction.message.delete();
            try {
                let imageUrl;
                if (message.attachments.size > 0) {
                    imageUrl = message.attachments.first().url;
                } else {
                    imageUrl = message.author.displayAvatarURL({ format: 'png' });
                }
                if (!imageUrl) return;
        
                const image = await Jimp.read(imageUrl);
                image.blur(3); // تعديل قيمة البلور حسب الحاجة
                image.quality(100); // جودة الصورة
                image.resize(1024, Jimp.AUTO); // تغيير حجم الصورة
        
                const convertedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
                const convertedImage = new MessageAttachment(convertedImageBuffer, 'blurred-image.png');
        
        

        
                await message.reply({ files: [convertedImage] });
            } catch (error) {
                console.log(error);
            }
        } else if (choice === "inverse") {
            await interaction.message.delete();
        
            let imgURL;
            if (message.attachments.size > 0) {
                imgURL = message.attachments.first().url;
            } else if (message.mentions.users.size > 0) {
                imgURL = message.mentions.users.first().displayAvatarURL({
                    dynamic: true,
                    format: "png",
                    size: 1024
                });
            } else if (message.content.split(" ")[1]) {
                imgURL = message.content.split(" ")[1];
            } else {
                imgURL = message.author.displayAvatarURL({
                    dynamic: true,
                    format: "png",
                    size: 1024
                });
            }
        
            try {
                const img = await new DIG.Sepia().getImage(imgURL);
                const invertedImg = await new DIG.Invert().getImage(img); // تطبيق الفلتر على الصورة المحملة بواسطة فلتر Sepia
                const attachment = new MessageAttachment(invertedImg, "Inverted.png");
                message.reply({
                    files: [attachment]
                });
            } catch (error) {
                console.error(error);
                message.reply("حدث خطأ أثناء معالجة الصورة.");
            }
        }else if (choice === "remove") {
          await interaction.message.delete();
        
          let imgURL;
        
          if (message.attachments.size > 0) {
            imgURL = message.attachments.first().url;
          } else if (message.mentions.users.size > 0) {
            imgURL = message.mentions.users.first().displayAvatarURL({ format: 'png', size: 4096 });
          } else if (args[0] && isImageUrl(args[0])) {
            imgURL = args[0];
          } else {
            imgURL = message.author.displayAvatarURL({ format: 'png', size: 4096 });
          }
        
          const outputFile = `${__dirname}/${message.author.id}.png`;
        
          try {
            await removeBackgroundFromImageUrl({
              url: imgURL,
              apiKey: "Z4eebwY5uQrGnMd2pznESTns",
              size: "regular",
              type: "auto",
              outputFile
            }).then(result => {
              message.channel.send({ files: [outputFile] }).then(() => {
                fs.unlink(outputFile, err => {
                  if (err) {
                    console.error("An error occurred while deleting the file:", err);
                  }
                });
              });
            }).catch(error => {
              console.log(error);
              message.channel.send("An error occurred while processing the image.");
            });
          } catch (error) {
            console.log(error);
            message.channel.send("An error occurred while processing the image.");
          }
      

       
          
        }
      
       
          
        });
        
        
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel') {
        collector.stop();
        interaction.message.delete();
      }
    });
  },
};
