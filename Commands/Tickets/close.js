const { MessageEmbed } = require('discord.js');
const Data = require('pro.db');
const { createTranscript } = require("discord-html-transcripts");

module.exports = {
  name: 'close',
  aliases: ["إغلاق","اغلاق"],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    try {

        const Role = Data.get(`Role = [${message.guild.id}]`);
        if (!message.member.roles.cache.has(`${Role}`)) {
          return;
        }
        
      const Color = Data.get(`Guild_Color = ${message.guild?.id}`) || `#4e464f`;
      if (!Color) return; 
      
      if (Data.has(`channel${message.channel.id}`)) {
        const memberId = Data.get(`channel${message.channel.id}`);
        const member = await message.guild.members.fetch(memberId);
        
        Data.delete(`channel${message.channel.id}`);
        Data.delete(`member${member.id}`);
    
        const ticketName = message.channel.name;
  
        setTimeout(async () => {
          const transcript = await createTranscript(message.channel, {
            returnType: 'buffer',
            minify: true,
            saveImages: true,
            useCDN: true,
            poweredBy: false,
            fileName: `${message.channel.name}.html`,
          });
    
          const logChannelId = Data.get(`Channel = [${message.guild.id}]`);
          const logChannel = message.guild.channels.cache.find(c => c.id === logChannelId);

          if (!logChannel) {
            console.error('لا يمكن العثور على روم اللوج!');
            return;
          }
    
          const embed = new MessageEmbed()
            .setAuthor(member.user.tag, member.user.avatarURL({ dynamic: true, size: 1024, format: 'png' }))
            .setColor(Color)
            .setDescription(`**إغلاق تذكرة\n\nتذكرة  <@${member.user.id}>\nأغلقها : <@${message.author.id}>\nاسم التذكرة  ${ticketName}**`)
            .setFooter(message.guild.name, message.guild.iconURL())
            .setTimestamp();
              
          await logChannel.send({ embeds: [embed], files: [transcript] });
    
          await message.channel.delete();
        }, 5000);
      
        await message.reply(`**🎫 <#${message.channel.id}> : سيتم حذف التذكرة خلال ثواني**`).catch(console.error);
      } else {
        await message.react('❌').catch(console.error);
      }
    } catch (error) {
      console.error('حدث خطأ أثناء معالجة الطلب:', error);
    }
  },
};
