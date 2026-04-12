const { Client, Intents } = require('discord.js');
const db = require('pro.db');
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "adminlist", // اسم الأمر
  aliases: ["قائمة الادمن"], // الأسماء المستعارة
  description: "يظهر جميع الادمن بالسيرفر", // وصف الأمر
  usage: [`${prefix}adminlist`], // كيفية الاستخدام
  run: async function (client, message, args) {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const roleId = db.get(`Allow - Command adminlist = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== roleId && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.react('❌');
    }

    try {
      const guild = message.guild;
      
      const adminMembers = guild.members.cache.filter(member => 
        member.permissions.has('ADMINISTRATOR') && !member.user.bot
      );

      // إذا لم يكن هناك أعضاء بإذن ADMINS
      if (adminMembers.size === 0) {
        return message.channel.send('لا يوجد أعضاء إداريون في السيرفر.');
      }

      // تحويل الأعضاء إلى قائمة مفصولة بفواصل
      const mentions = adminMembers.map(member => member.toString()).join(', ');
      message.channel.send(`أعضاء الإدارة في السيرفر:\n${mentions}`);
    } catch (error) {
      console.error("حدث خطأ أثناء جلب الأعضاء:", error);
      message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
    }
  }
};
