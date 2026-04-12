const { Message, Client, MessageEmbed } = require("discord.js");
const d1b = require('pro.db')

module.exports = {
  name: "remove-warn",
  aliases: ["شيل", "rwarn"],
  description: `يزيل تحذيرًا من مستخدم.`,
  
  run: async (client, message, args) => {

    const isEnabled = d1b.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);


    const Pro = require(`pro.db`)
    const db = Pro.get(`Allow - Command warn = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has('MANAGE_MESSAGES')) {
// إجراءات للتصرف عندما لا يتحقق الشرط
return;
}


    if (member) {
      if (!d1b.has(`warns_${member.id}`)) {
        return message.reply({ content: `👌 **${member.user.username} لا يملك أي تحذيرات.**`, allowedMentions: { parse: [] } });
      }

      if (!args[1]) {
        let w = d1b.get(`warns_${member.id}`) || 0
        d1b.delete(`warns_${member.id}`)
        setTimeout(() => {
          message.reply({ content: `✅ **${member.user.username} تمت إزالة \`${w}\` تحذير/تحذيرات من **` , allowedMentions: { parse: [] }})
        }, 1000)
      } else {
        let c = args[1]
        if (isNaN(c)) return
        let n;
        let w = d1b.get(`warns_${member.id}`)
        if (c > w) {
          n = w
        } else {
          n = c
        }
        d1b.subtract(`warns_${member.id}`, n)
        setTimeout(() => {
          message.reply({ content: `✅ **${member.user.username} تمت إزالة ${n} تحذير/تحذيرات من **`, allowedMentions: { parse: [] } })
        }, 1000)
      }

    } else {
      message.reply({ content: `🙄 **يرجى الإشارة إلى العضو أو الرقم التعريف**`, allowedMentions: { parse: [] } })
    }
  },
};