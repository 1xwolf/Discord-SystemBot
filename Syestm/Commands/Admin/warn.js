const { Message, Client, MessageEmbed } = require("discord.js");
const deb = require('pro.db')

module.exports = {
  name: "warn",
  aliases: ["انذار","تحذير"],
  description: "يعطي تحذيرًا لعضو ما.",
  aliases: ["تحذير", "تح"],
  run: async (client, message, args) => {


    const isEnabled = deb.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const Color = deb.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;


    const Pro = require(`pro.db`)
    const db = Pro.get(`Allow - Command warn = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has('MANAGE_MESSAGES')) {
// إجراءات للتصرف عندما لا يتحقق الشرط
return;
}



    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const reason_msg = args.slice(1).join(' ');



    if (!args[0]) {
      return message.reply({ content: `**يرجى ارفاق منشن العضو او الايدي .**`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    if (!member) {
      return message.reply({ content: `🙄 **لا يمكنني العثور على هذا العضو**`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    if (member.id === message.author.id) {
      return message.reply({ content: `🙄 **${member.user.username} لا يمكنك إعطاء تحذير لـ **`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    if (message.member.roles.highest.position < member.roles.highest.position) {
      return message.reply({ content: `🙄 **${member.user.username} لا يمكنك إعطاء تحذير لـ **`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    if (!reason_msg) {
      return message.reply({ content: `🙄**يرجى كتابة سبب للتحذير**`, allowedMentions: { parse: [] } })
    }

    deb.add(`warns_${member.id}`, 1)
    let Warn = deb.get(`warns_${member.id}`)
    deb.set(`messageauthor_${member.id}`, message.author.id)

    message.react("✅")

    let logwarns = deb.get(`logwarns_${message.guild.id}`);
    logChannel = message.guild.channels.cache.find(channel => channel.id === logwarns);

    let embed = new MessageEmbed()
    .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1224819138103476387/warning.png?ex=661ee0b6&is=660c6bb6&hm=fad412feb8a23da42714f0c7b23147c64f358884f3cac1f010d60bb24788321a&")
    .setColor(`#f5f5ff`)
    .setDescription(`
    **أنذار**

**العضو : <@${member.id}> 
التحذير رقم : ( ${Warn} )
بواسطة : <@${message.author.id}> **
\`\`\`reason : ${reason_msg}\`\`\`\ 
      `)

      .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
      .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }));
      member.send({ embeds: [embed] }); 
      logChannel.send({embeds: [embed]});
      
      
  },
};