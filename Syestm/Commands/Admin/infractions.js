const { MessageEmbed } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const moment = require('moment');
const db = require('pro.db');

// Function to format remaining time
function formatRemainingTime(endDate) {
  const now = moment();
  const end = moment(endDate);
  if (end.isBefore(now)) return 'منتهي';
  
  const duration = moment.duration(end.diff(now));
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  let timeString = '';
  if (days > 0) timeString += `${days} يوم `;
  if (hours > 0) timeString += `${hours} ساعة `;
  if (minutes > 0) timeString += `${minutes} دقيقة`;
  
  return timeString.trim() || 'منتهي';
}

function getTotalPunishments(member) {
  const totalMutes = db.get(`Total_Mutes_${member.id}`) || 0; // Total mutes
  const totalVoiceMutes = db.get(`Total_voice_${member.id}`) || 0; // Total voice mutes
  const totalPrisons = db.get(`Total_Prisons_${member.id}`) || 0; // Total prisons
  
  // Get current punishments
  const currentMute = db.get(`Muted_Member_${member.id}`);
  const currentVoiceMute = db.get(`voicemute_${member.id}`);
  const currentPrison = db.get(`prison_${member.id}`);

  // Format current punishments
  let currentPrisonInfo = 'لا يوجد عقوبة حالية';
  if (currentPrison) {
    const prisonEndDate = moment(currentPrison.endDate);
    const remainingTime = formatRemainingTime(prisonEndDate);
    
    currentPrisonInfo = `\`السبب:\` ${currentPrison.reason}
    \`المدة المتبقية:\` ${remainingTime}
    \`ينتهي في:\` ${moment(currentPrison.endDate).format('LLLL')}
    \`من قبل:\` <@${currentPrison.by}>`;
  }

  // Format mute information
  let currentMuteInfo = 'لا يوجد عقوبة حالية';
  if (currentMute) {
    const muteEndTime = moment(currentMute.times);
    currentMuteInfo = `\`السبب:\` ${currentMute.reason}
    \`ينتهي في:\` ${muteEndTime.format('LLLL')}
    \`من قبل:\` <@${currentMute.by}>`;
  }

  // Format voice mute information
  let currentVoiceMuteInfo = 'لا يوجد عقوبة حالية';
  if (currentVoiceMute) {
    const voiceMuteEndTime = moment(currentVoiceMute.times);
    currentVoiceMuteInfo = `\`السبب:\` ${currentVoiceMute.reason}
    \`ينتهي في:\` ${voiceMuteEndTime.format('LLLL')}
    \`من قبل:\` <@${currentVoiceMute.by}>`;
  }

  // Get punishment history if needed
  const prisonHistory = db.get(`prison_${member.id}`) || [];
  
  return {
    totalMutes,
    totalVoiceMutes,
    totalPrisons,
    currentMuteInfo,
    currentVoiceMuteInfo,
    currentPrisonInfo,
    prisonHistory
  };
}

module.exports = {
  name: 'infractions',
  aliases: ['عقوباتي'],
  run: async (client, message, args) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    
    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
    if (!Color) return;

    const allowedRoleId = db.get(`Allow_Command_infractions_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.react('❌');
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}infractions <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    const {
      totalMutes,
      totalVoiceMutes,
      totalPrisons,
      currentMuteInfo,
      currentVoiceMuteInfo,
      currentPrisonInfo,
      prisonHistory
    } = getTotalPunishments(member); // Fetch the total punishments

    const logEmbed = new MessageEmbed()
      .setColor(Color)
      .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**معلومات العقوبات\n
📊 احصائيات العقوبات:
\`السجن:\` ${totalPrisons}
\`الاسكات:\` ${totalMutes}
\`الميوت:\` ${totalVoiceMutes}\n
🔒 السجن الحالي:
${currentPrisonInfo}\n
🔇 الاسكات الحالي:
${currentMuteInfo}\n
🎤 الميوت الحالي:
${currentVoiceMuteInfo}**`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.channel.send({ embeds: [logEmbed] }); // Send the response
  }
};