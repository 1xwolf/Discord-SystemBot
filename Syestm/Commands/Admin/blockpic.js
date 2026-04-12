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
  name: "blockpic",
  description: "Block a user from sending images.",
  usage: `${prefix} blockpic @user`,
  run: async (client, message, args) => {
    if (!checkPermissions(message, "blockpic")) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    const userMention = message.mentions.users.first();
    if (!userMention) {
      const embed = new MessageEmbed()
        .setColor("#ff0000")
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a user to block from sending images.\nUsage: \`${prefix} blockpic @user\``);
      return message.reply({ embeds: [embed] });
    }

    const blockedPics = db.get(`blocked_pics_${message.guild.id}`) || [];
    if (blockedPics.includes(userMention.id)) {
      const embed = new MessageEmbed()
        .setColor("#ffcc00")
        .setTitle("Already Blocked")
        .setDescription(`User ${userMention} is already blocked from sending images.`);
      return message.reply({ embeds: [embed] });
    }

    blockedPics.push(userMention.id);
    await db.set(`blocked_pics_${message.guild.id}`, blockedPics);

    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("User Blocked")
      .setDescription(`User ${userMention} has been blocked from sending images.`);
    message.channel.send({ embeds: [embed] });
  }
};