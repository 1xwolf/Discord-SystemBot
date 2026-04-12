const { MessageEmbed } = require('discord.js');
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "lastvoice",
  aliases: ["lv"],
  description: "Get the last users (excluding bots) who joined voice channels.",
  usage: ["!lastvoice [number]"],
  run: async (client, message, args) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const roleId = db.get(`Allow - Command lastvoice = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== roleId && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.react('❌');
    }
    try {
      // Validate number of users to display (default 5, max 10)
      const displayCount = Math.min(
        Math.max(parseInt(args[0]) || 5, 1), 
        10
      );

      // Get all voice channels
      const voiceChannels = message.guild.channels.cache.filter(
        channel => channel.type === 'GUILD_VOICE'
      );

      // If no voice channels exist
      if (voiceChannels.size === 0) {
        return message.reply("**لا توجد قنوات صوتية في السيرفر.**");
      }

      const lastUserMap = new Map();

      // Collect last voice channel join for each non-bot member
      voiceChannels.forEach(channel => {
        channel.members
          .filter(member => !member.user.bot) // Exclude bots
          .forEach(member => {
            const memberInfo = {
              user: member,
              channelName: channel.name
            };

            // Update with the member information
            if (!lastUserMap.has(member.id)) {
              lastUserMap.set(member.id, memberInfo);
            }
          });
      });

      // Convert map to sorted array
      const lastUsers = Array.from(lastUserMap.values())
        .slice(0, displayCount);

      // Handle no users in voice channels
      if (lastUsers.length === 0) {
        return message.reply("**لم يدخل أي أعضاء (باستثناء البوتات) إلى الرومات الصوتية مؤخراً.**");
      }

      // Create rich embed with detailed information
      const embed = new MessageEmbed()
        .setColor("#00ff00")
        .setTitle(`📞 آخر ${displayCount} أعضاء في الرومات الصوتية`)
        .setDescription(
          lastUsers.map((userInfo, index) => 
            `**${index + 1}. ${userInfo.user.user.toString()}**\n` +
            `• قناة: **${userInfo.channelName}**`
          ).join("\n\n")
        )
        .setFooter({ 
          text: `عدد القنوات الصوتية: ${voiceChannels.size}`, 
          iconURL: message.guild.iconURL() 
        })
        .setTimestamp();

      // Send the embed
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in lastvoice command:', error);
      message.reply("**حدث خطأ أثناء جلب معلومات القنوات الصوتية.**");
    }
  },
};