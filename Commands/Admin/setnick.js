const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: 'setnick', // اسم الأمر
  aliases: ["اسم"],
  run: (client, message, args) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const db = Pro.get(`Allow - Command setnick = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_NICKNAMES')) {
      // إجراءات للتصرف عندما لا يتحقق الشرط
      return;
    }

    const member = message.mentions.members.first();
    const name = args.slice(1).join(" ");

    if (!member) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setnick <@${message.author.id}> ;عفروتو **`);
      return message.reply({ embeds: [embed] });
    }

    if (!name) {
      member.setNickname('').then(() => {
        message.react('✅');
        sendLogMessage(message, member, '');
      }).catch(() => { message.react('❌'); });
    } else {
      member.setNickname(name).then(() => {
        message.react('✅');
        sendLogMessage(message, member, name);
      }).catch(() => { message.react('❌'); });
    }
  }
};

function sendLogMessage(message, member, newNickname) {
  const logChannelId = Pro.get(`lognickname_${message.guild.id}`);
  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new MessageEmbed()
    .setColor("#C88EA7")
    .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' }))
    .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1208201551014002848/signature.png?ex=65e26c61&is=65cff761&hm=89f278d848d3acedc08f9f708b70e7c24bd42974df694028f833e9b27f0ceda4&')
    .setDescription(`**تم تغيير الكنية\n\nالعضو : ${member}\nبواسطة : ${message.author}**\n\`\`\`Nickname => ${newNickname || "إزالة الكنية"}\`\`\` `)
    .setFooter(message.author.username, message.author.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' }));
  logChannel.send({ embeds: [embed] });
}
