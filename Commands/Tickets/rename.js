const { MessageEmbed } = require('discord.js');
const Data = require('pro.db');

module.exports = {
  name: 'rename',
  description: 'يقوم بتغيير اسم التذكرة',
  run: async (client, message, args) => {


    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    try {
      // التحقق من وجود وسام يسمح بتغيير اسم التذكرة
      const Role = Data.get(`Role = [${message.guild.id}]`);
      if (!message.member.roles.cache.has(`${Role}`)) {
        return;
      }
      
      const newTicketName = args.join(" ");
      if (!newTicketName) {
        return message.reply("**يرجى إرفاق اسم التذكرة**.");
      }

      const ticketData = Data.get(`channel${message.channel.id}`);
      if (!ticketData) {
        return;
      }

      await message.channel.setName(newTicketName);
      message.react(`✅`);

    } catch (error) {
      console.error('حدث خطأ أثناء تغيير اسم التذكرة:', error);
      message.reply('حدث خطأ أثناء معالجة الطلب.');
    }
  },
};
