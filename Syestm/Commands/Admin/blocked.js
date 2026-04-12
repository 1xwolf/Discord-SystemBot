const { MessageEmbed } = require('discord.js');
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

// وظيفة لفحص الأذونات اللازمة
const checkPermissions = (message, commandName) => {
  const dbRoleId = db.get(`Allow - Command ${commandName} = [ ${message.guild.id} ]`);
  const allowedRole = message.guild.roles.cache.get(dbRoleId);
  const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
  const hasManageChannels = message.member.permissions.has('MANAGE_CHANNELS');

  return hasManageChannels || isAuthorAllowed;
};
module.exports = {
  name: "blocked",
  description: "Show blocked users from sending images.",
  usage: `${prefix} blocked`,
  run: async (client, message, args) => {
    if (!checkPermissions(message, "blocked")) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    const blockedPics = db.get(`blocked_pics_${message.guild.id}`) || [];
    if (blockedPics.length === 0) {
      const embed = new MessageEmbed()
        .setColor("#ffcc00")
        .setTitle("No Blocked Users")
        .setDescription("There are currently no users blocked from sending images.");
      return message.reply({ embeds: [embed] });
    }

    const userList = blockedPics.map(id => `<@${id}>`).join(", ");
    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Blocked Users")
      .setDescription(`The following users are blocked from sending images:\n${userList}`);
    message.channel.send({ embeds: [embed] });
  }
};