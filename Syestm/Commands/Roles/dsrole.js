const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dsrole",
  run: async (client, message) => {
    
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const allowDb = Pro.get(`Allow - Command srole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has("MANAGE_ROLES")) {
      return;
    }

    // الحصول على العضو الممنوح له الرول
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      const noUserEmbed = new MessageEmbed()
        .setColor(`${Color || "#f5f5ff"}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}dsrole <@${message.author.id}>**`);

      return message.reply({ embeds: [noUserEmbed] });
    }

    const member = message.guild.members.cache.get(mentionedUser.id);
    if (!member) {
      return message.react("❌");
    }

    // الحصول على مصفوفة الرولات من قاعدة البيانات
    const userRoles = Pro.get(`userRoles_${member.id}`) || [];

    // التحقق إذا كان العضو لديه رولات
    if (userRoles.length > 0) {
      // حذف كل رول من العضو في السيرفر
      userRoles.forEach((roleId) => {
        const role = message.guild.roles.cache.get(roleId);
        if (role) member.roles.remove(role).catch(console.error);
      });

      // حذف مصفوفة الرولات من قاعدة البيانات
      Pro.delete(`userRoles_${member.id}`);

      message.react("✅");
    } else {
      const noRolesEmbed = new MessageEmbed()
        .setColor(`${Color || "#f5f5ff"}`)
        .setDescription("**العضو ليس لديه رول خاص.**");

      message.reply({ embeds: [noRolesEmbed] });
    }
  },
};
