const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: 'myvmute',
  aliases: ["ميوتي"],
  run: async (client, message, args) => {
    try {
      const allowDb = db.get(`Allow - Command mute = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(allowDb);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has('MUTE_MEMBERS') && !owners.includes(message.author.id)) {
        return message.reply("**ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر**");
      }

      let member;
      const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#5c5e64';

      if (!args[0]) {
        const embed = new MessageEmbed()
          .setColor(Color)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}myvmute <@${message.author.id}>**`);
        return message.reply({ embeds: [embed] });
      }

      if (message.mentions.members.size > 0) {
        member = message.mentions.members.first();
      } else {
        member = message.guild.members.cache.get(args[0]);
      }

      if (!member) {
        return message.reply("**يرجى ذكر عضو صالح أو معرف صحيح**");
      }

      const voiceMuteData = db.get(`voicemute_${member.id}`);
      if (!voiceMuteData) {
        return message.reply("**العضو ليس لديه أي عقوبة صوتية محفوظة**");
      }

      const selectedOption = voiceMuteData.reason;
      const timeLeft = voiceMuteData.time;
      const endDate = voiceMuteData.times;
      const by = voiceMuteData.by;

      const logEmbed = new MessageEmbed()
        .setColor('#5c5e64')
        .setAuthor({
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`**معلومات الميوت  \n\nبواسطة : <@${by}> \nالعضو : <@${member.id}> \nالوقت : \`${timeLeft}\`\nوقت الانتهاء : \`${endDate}\`**\n\`\`\`Voice Mute : ${selectedOption}\`\`\``)
        .setThumbnail('https://a.top4top.io/p_3087bwpjx1.png')
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });

      message.channel.send({ embeds: [logEmbed] });

    } catch (error) {
      console.error(error);
      message.reply("**حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة لاحقًا.**");
    }
  }
};