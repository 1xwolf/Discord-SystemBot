const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`);
const Data = require(`pro.db`);

const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "srole",
  run: async (client, message) => {
    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const db = Pro.get(`Allow - Command srole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has("MANAGE_ROLES")) {
      return;
    }

    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}srole <@${message.author.id}> rose**`);

      message.reply({ embeds: [embed] });
      return;
    }

    const roleName = message.content.slice(message.content.indexOf(mentionedUser.toString()) + mentionedUser.toString().length).trim();
    if (!roleName) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}srole <@${message.author.id}> rose**`);

      message.reply({ embeds: [embed] });
      return;
    }

    const member = message.guild.members.cache.get(mentionedUser.id);
    if (!member) {
      message.reply("`**لا يمكن العثور على العضو .**");
      return;
    }

    // تحقق مما إذا كان العضو لديه رول مسجل بالفعل
    const userRoles = Pro.get(`userRoles_${member.id}`) || [];
    if (userRoles.length > 0) {
      message.reply("**يمتلك رول خاص بالفعل.**");
      return;
    }

    // إنشاء الرول
    message.guild.roles
      .create({
        name: roleName,
      })
      .then((role) => {
        // إضافة الرول الجديد للعضو
        member.roles.add(role);

        // حفظ معرف الرول الجديد في قاعدة البيانات
        Pro.set(`userRoles_${member.id}`, [role.id]);

        message.react("✅");
      });
  },
};
