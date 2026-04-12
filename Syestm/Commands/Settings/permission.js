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
  name: "permission",
  description: "View only the active permissions of a role.",
  usage: `${prefix} permission @role`,
  run: async (client, message, args) => {
    if (!checkPermissions(message, "permission")) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    const roleMention = message.mentions.roles.first();

    // تحقق من ما إذا تم ذكر الدور
    if (!roleMention) {
      const embed = new MessageEmbed()
        .setColor("#ff0000")
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a role to view its active permissions.\nUsage: \`${prefix} roleinfo @role\``);
      return message.reply({ embeds: [embed] });
    }

    // احصل على الأذونات النشطة
    const activePermissions = roleMention.permissions.toArray();

    // إعداد المتغيرات لإظهار الأذونات النشطة
    const activePermissionsList = activePermissions.length > 0 
      ? activePermissions.map(perm => `✅ ${perm}`).join("\n") 
      : "No active permissions.";

    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`Active Permissions for role: ${roleMention.name}`)
      .setDescription(activePermissionsList)
      .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};