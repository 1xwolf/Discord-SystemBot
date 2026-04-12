const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: 'myprison',
  aliases: ["سجني",],
  run: async (client, message, args) => {

    const allowDb = db.get(`Allow - Command prison = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has('MUTE_MEMBERS') && !owners.includes(message.author.id)) {
      return;
    }

    let member;
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    if (!args[0]) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}myprison <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    if (message.mentions.members.size > 0) {
      member = message.mentions.members.first();
    } else {
      member = message.guild.members.cache.get(args[0]);
    }

    if (!member) {
      return message.reply("**الرجاء تحديد عضو صحيح**");
    }

    const prisonData = db.get(`MutedMember_${member.id}`);
    if (!prisonData) {
      return message.reply("**العضو ليس لديه إي عقوبة محفوظه**");
    }

    const selectedOption = prisonData.reason;
    const timeLeft = prisonData.time;
    const endDate = prisonData.times;
    const channel = prisonData.channel.id;
    const by = prisonData.by; 

    const logEmbed = new MessageEmbed()
      .setColor('#313338')
      .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**معلومات السجن\n\nبواسطة : <@${by}> (${message.guild.members.cache.get(by).user.tag})\nالعضو : <@${member.id}> (${member.user.tag})\n الوقت : \`${timeLeft}\`\nوقت الانتهاء : \`${endDate}\`**\n\`\`\`Prison : ${selectedOption}\`\`\``) 
      .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1224588302393540638/bars.png?ex=661e09bb&is=660b94bb&hm=198f684aacf261c80430479f57f365b8c3dd11aa914b5c382240a2adbe33b00a&')
      .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    message.channel.send({ embeds: [logEmbed] });
  }
};
