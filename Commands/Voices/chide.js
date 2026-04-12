const { MessageEmbed } = require('discord.js');
const Pro = require('pro.db'); // Ensure you're importing pro.db correctly.

module.exports = {
  name: 'chide',
  description: 'Hide all voice channels from a specific member',
  async run(client, message, args) {
    // Get the member mentioned in the command
    const member = message.mentions.members.first();
    const db = Pro.get(`Allow - Command chide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Permission checks
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.react('❌');
    }

    // Check if a member was mentioned
    if (!member) {
      return message.reply('يرجى ذكر العضو الذي تريد إخفاء القنوات عنه.');
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
        await channel.permissionOverwrites.edit(member, { VIEW_CHANNEL: false });
      }

      // Create and send a success embed message
      const embed = new MessageEmbed()
        .setColor('#6f42c1')
        .setTitle('تم تحديث إذن الدخول')
        .setDescription(`🔒 تم إخفاء جميع القنوات الصوتية عن ${member}.`)
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return message.reply('حدث خطأ أثناء محاولة إخفاء القنوات.');
    }
  }
};