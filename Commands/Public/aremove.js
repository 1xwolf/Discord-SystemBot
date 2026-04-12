const { MessageAttachment ,Discord } = require('discord.js')
const { RemoveBgResult, RemoveBgError, removeBackgroundFromImageUrl } = require("remove.bg");
const Data = require('pro.db');
const fs = require("fs");
module.exports = {
    name: "aremove",
    description:"",
    aliases:["ch"],
    type: "image",
run: async (client, message, args) => {

      if (message.author.bot) return;
      if (!message.guild) return;
        let user = message.mentions.users.first() || message.author;
        const avatarUrl = user.displayAvatarURL({ format: 'png', size: 4096 });
        const outputFile = `${__dirname}/${user.id}.png`;
    
        try {
          await removeBackgroundFromImageUrl({
            url: avatarUrl,
            apiKey: "Z4eebwY5uQrGnMd2pznESTns",
            size: "regular",
            type: "auto",
            outputFile
          }).then(result => {
            message.channel.send({ files: [outputFile] }).then(() => {
              // بعد إرسال الصورة، قم بحذف الملف
              fs.unlink(outputFile, err => {
                if (err) {
                  console.error("حدثت مشكلة أثناء حذف الملف:", err);
                } 
              });
            });
          }).catch(error => {
            console.log(error);
            message.channel.send("حدثت مشكلة أثناء معالجة الصورة.");
          });
        } catch (error) {
          console.log(error);
          message.channel.send("حدثت مشكلة أثناء معالجة الصورة.");
        
      }
    
    

  }
}