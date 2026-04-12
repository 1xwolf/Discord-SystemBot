const { MessageEmbed } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "mhide",
  description: "إخفاء الدردشة",
  usage: ["اخفاء الدردشة"],
  run: async (client, message, args, config) => {




    const Pro = require(`pro.db`);
    const db = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS') && !owners.includes(message.author.id)) {
      // إجراءات للتصرف عندما لا يتحقق الشرط
      return;
    }


    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let mentionedMember;

    // تحقق مما إذا كان هناك mention في الرسالة
    if (message.mentions.members.size > 0) {
      mentionedMember = message.mentions.members.first();
    } else {
      const memberId = args[0];
      mentionedMember = message.guild.members.cache.get(memberId);
    }

    if (!mentionedMember) {
      return message.reply("**.يرجى ارفاق منشن الشخص او الايدي**").catch(console.error);
    }

    // إخفاء الدردشة عن الشخص المحدد فقط
    message.channel.permissionOverwrites.edit(mentionedMember, {
      VIEW_CHANNEL: false
    }).then(() => {
      // إضافة إذاعة لتنبيه الشخص المخفي عن الدردشة
      message.react("✅").catch((err) => {
        console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
      });
    });
  },
};
