const { Client, Intents } = require('discord.js');
const db = require('pro.db');
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "rooms",
  aliases: ["الغرف"],
  description: "يذكر الأعضاء الذين لديهم صلاحية 'ADMINISTRATOR' أو صلاحية 'deafen members' في دورهم وليسوا في الرومات الصوتية ولا يكونوا بوتات",
  usage: [`${prefix}rooms`],
  run: async function (client, message) {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const args = message.content.split(' ');
    const roleId = db.get(`Allow - Command rooms = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== roleId && !message.member.permissions.has('KICK_MEMBERS')) {
      return message.react('❌');
    }

    try {
      const guild = message.guild;
      const mentionsSet = new Set(); // استخدام مجموعة لضمان عدم التكرار

      // الحصول على الأعضاء الذين لديهم صلاحية 'ADMINISTRATOR'
      const adminMembers = guild.members.cache.filter(member => 
        member.permissions.has('ADMINISTRATOR') && !member.user.bot
      );

      // الحصول على الأعضاء الذين لديهم صلاحية 'deafen members'
      const membersWithDeafenPermission = guild.members.cache.filter(member => 
        !member.voice.channel &&
        !member.user.bot &&
        member.roles.cache.some(role => role.permissions.has('DEAFEN_MEMBERS'))
      );

      // إضافة الأعضاء الإداريين إلى المجموعة
      adminMembers.forEach(member => {
        if (!member.voice.channel) {
          mentionsSet.add(member.user.toString());
        }
      });

      // إضافة الأعضاء الذين لديهم صلاحية 'deafen members' إلى المجموعة
      membersWithDeafenPermission.forEach(member => {
        mentionsSet.add(member.user.toString());
      });

      // تحويل المجموعة إلى قائمة مفصولة بفواصل
      const mentions = Array.from(mentionsSet).join(', ');

      if (mentions) {
        message.channel.send(`\n${mentions}`);
      } else {
        message.channel.send('لا يوجد أعضاء .');
      }
    } catch (error) {
      console.error("حدث خطأ أثناء جلب الأعضاء:", error);
      message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
    }
  }
};
