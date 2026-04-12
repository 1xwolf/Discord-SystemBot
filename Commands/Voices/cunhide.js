const { MessageEmbed } = require('discord.js');
const Pro = require('pro.db'); // Ensure you're importing pro.db correctly.

module.exports = {
  name: 'cunhide',
  description: 'Unhide all voice channels for a specific member',
  async run(client, message, args) {
    // Get the allowed role from the database
    const db = Pro.get(`Allow - Command cunhide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Permission checks
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.react('❌');
    }

    // Get the mentioned member
    const member = message.mentions.members.first();
    
    // Check if a member was mentioned
    if (!member) {
      return message.reply('يرجى ذكر العضو الذي تريد إظهار القنوات له.');
    }

    // Fetch all voice channels in the guild
    const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE');

    // Check if there are no voice channels
    if (voiceChannels.size === 0) {
      return message.reply('لا توجد قنوات صوتية في هذا الخادم.');
    }

    // Loop through each voice channel and set permissions
    try {
      for (const channel of voiceChannels.values()) {
        await channel.permissionOverwrites.edit(member, { VIEW_CHANNEL: true });
      }

      // Create and send a success embed message
      const embed = new MessageEmbed()
        .setColor('#17a2b8')
        .setTitle('تم تحديث الإذن')
        .setDescription(`🔓 جميع القنوات الصوتية أصبحت مرئية لـ ${member}.`)
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return message.reply('حدث خطأ أثناء محاولة إظهار القنوات.');
    }
  }
};