const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "unblock",
  run: async (client, message) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const allowDb = Pro.get(`Allow - Command block = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has("KICK_MEMBERS") && !owners.includes(message.author.id)) {
      return;
    }

    let targetId;

    // إذا تم ذكر عضو في الرسالة
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      targetId = mentionedUser.id;
    } else {
      // إذا تم إرفاق الأمر مع الأيدي مباشرة
      targetId = message.content.split(/\s+/)[1];
    }

    if (!targetId) {
      const embed = new MessageEmbed()
        .setColor(`${Color || "#f5f5ff"}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}unblock <@${message.author.id}>**`);

      return message.reply({ embeds: [embed] });
    }

    // إزالة العضو من قائمة الحظر
    try {
      // حذف إيدي الشخص من قاعدة البيانات
      Pro.delete(`blockedUsers_${targetId}`);

      const selectedUser = await client.users.fetch(targetId); // جلب معلومات المستخدم المحظور
      const logblocklist = Pro.get(`logblocklist_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find((c) => c.id === logblocklist);
      if (logChannel) {
        const unblockEmbed = new MessageEmbed()
          .setColor("#f5f5ff")
          .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
          .setDescription(`**Un Block\n\nUser : <@${targetId}>\nBy : <@${message.author.id}>**`)
          .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1223682470872879197/security.png?ex=661abe1b&is=6608491b&hm=b725fa11e28663c2cc84610351c0aaf52c1d7f4e71c50bbea94a8de1f04b228a&")
          .setFooter(selectedUser.username, selectedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 128 }))
        logChannel.send({ embeds: [unblockEmbed] });
      }

      message.react("✅");
    } catch (error) {
      console.error(error);
      message.react("❌");
    }
  },
};
