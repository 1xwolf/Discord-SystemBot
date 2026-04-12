const { MessageAttachment } = require('discord.js');
const { Canvas, loadFont, resolveImage } = require('canvas-constructor/napi-rs');
const humanizeDuration = require('humanize-duration');
const { inviteTracker } = require("discord-inviter");
const Data = require("pro.db");

module.exports = {
  name: 'user',
  aliases: ["يوزر"],
  run: async (client, message, args) => {
    
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const userID = args[0].replace(/[<@!>]/g, '');
      targetMember = message.guild.members.cache.get(userID);
    } else {
      targetMember = message.member;
    }

    if (!targetMember) {
      return message.react('❌');
    }

    try {
      loadFont('./Fonts/Cairo-Regular.ttf', { family: 'Cairo' });

      const user = targetMember.user;
      const avatarURL = user.displayAvatarURL({ format: 'png', size: 512 });

      const backgroundImage = await resolveImage(`${process.cwd()}/Fonts/user.png`);

      const canvas = new Canvas(1000, 380)
        .printImage(backgroundImage, 0, 0, 1000, 380)
        .setColor('#ffffff')
        .printCircularImage(await resolveImage(avatarURL), 180, 170, 140)
        .setTextAlign('center')
        .setTextFont('25px Cairo')
        .setColor('#ffffff')
        .printText(user.displayName, 180, 345)
        .printText(`Status: ${getStatusEmoji(user.presence?.status)}`, 640, 130)
      const joinedAt = targetMember.joinedAt;
      const createdAt = user.createdAt;
      const userId = targetMember.id;

      const now = new Date();
      const joinedDuration = humanizeDuration(now - joinedAt, { round: true, largest: 2 });
      const createdDuration = humanizeDuration(now - createdAt, { round: true, largest: 2 });

      const invite = await inviteTracker.getMemberInvites(targetMember);
      const userMessageCount = (await Data.fetch(`${userId}_points`)) || 0;
      const userVoicePoints = (await Data.fetch(`${userId}_voice`)) || 0;
      const totalPoints = userMessageCount + userVoicePoints; // Total points

      canvas.setColor('#ffffff')
            .setTextFont('bold 20px Cairo')
            .printText(`${joinedDuration}`, 640, 160)
            .printText(`${createdDuration}`, 640, 230)
            .printText(`${invite.count}`, 640, 300) // The number of invites
            .printText(`${userMessageCount}`, 640, 96) // Message points display
            .printText(`${userVoicePoints}`, 485, 180) // Voice points display
            .printText(`Total Points: ${totalPoints}`, 640, 360); // Total points

      const attachment = new MessageAttachment(canvas.toBuffer(), 'user.png');
      message.reply({ files: [attachment] });
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while generating the user data. Please try again later.');
    }
  }
};

// Helper function to get status emoji
function getStatusEmoji(status) {
  switch (status) {
    case 'online':
      return '🟢 Online';
    case 'idle':
      return '🟡 Idle';
    case 'dnd':
      return '🔴 Do Not Disturb';
    case 'offline':
      return '⚪ Offline';
    default:
      return '❓ Unknown';
  }
}