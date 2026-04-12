const { MessageEmbed } = require('discord.js');
const Pro = require('pro.db'); // Ensure you're importing pro.db correctly.

module.exports = {
  name: 'callow',
  description: 'Allow a member to enter all voice channels',
  async run(client, message, args) {
    // Get the member mentioned in the command
    const member = message.mentions.members.first();
    const db = Pro.get(`Allow - Command callow = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Permission checks
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.react('❌');
    }

    // Check if a member was mentioned
    if (!member) {
      return message.reply('يرجى ذكر العضو الذي تريد السماح له.');
    }

    // Fetch all voice channels in the guild
    const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE');

    // Check if there are no voice channels
    if (voiceChannels.size === 0) {
      return message.reply('لا توجد قنوات صوتية في هذا الخادم.');
    }

    // Loop through each channel and set permissions
    try {
      for (const channel of voiceChannels.values()) {
        await channel.permissionOverwrites.edit(member, { CONNECT: true });
      }

      // Create and send a success embed message
      const embed = new MessageEmbed()
        .setColor('#28a745')
        .setTitle('تم تحديث إذن الدخول')
        .setDescription(`✅ ${member} صار قادراً على دخول جميع القنوات الصوتية.`)
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error(error);
      return message.reply('حدث خطأ أثناء محاولة تحديث الأذونات.');
    }
  }
};