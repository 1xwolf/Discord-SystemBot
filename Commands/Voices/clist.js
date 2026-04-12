const { MessageEmbed } = require('discord.js');
const Pro = require('pro.db'); // Ensure you're importing pro.db correctly.

module.exports = {
  name: 'clist',
  description: 'List members denied access to all voice channels',
  async run(client, message, args) {
    // Get the allowed role from the database
    const db = Pro.get(`Allow - Command clist = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Permission checks
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.react('❌');
    }

    // Fetch all voice channels in the guild
    const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE');

    // Check if there are no voice channels
    if (voiceChannels.size === 0) {
      return message.reply('لا توجد قنوات صوتية في هذا السيرفر.');
    }

    const deniedMembers = new Set();

    // Gather all members denied access across all voice channels
    voiceChannels.forEach(channel => {
      const deniedAccess = channel.permissionOverwrites.cache
        .filter(overwrite => overwrite.type === 'member' && overwrite.deny.has('CONNECT'));
      deniedAccess.forEach(overwrite => deniedMembers.add(overwrite.id));
    });

    // Create an embed for the denied members list
    const embed = new MessageEmbed()
      .setColor('#ffc107')
      .setTitle('قائمة الأعضاء الممنوعين من الوصول')
      .setDescription('الأعضاء الذين مُنعوا من الوصول إلى القنوات الصوتية:')
      .setTimestamp();

    // Prepare the response based on the denied members
    if (deniedMembers.size === 0) {
      embed.setDescription('لا يوجد أعضاء ممنوعون من الوصول إلى أي قنوات صوتية.');
    } else {
      const membersList = Array.from(deniedMembers)
        .map(id => message.guild.members.cache.get(id)?.user.tag)
        .filter(tag => tag !== undefined) // Ensure that only defined tags are included
        .join(', ') || 'لا توجد أعضاء';
      embed.addField('الأعضاء الممنوعون:', membersList);
    }

    // Send the embed message to the channel
    return message.channel.send({ embeds: [embed] });
  }
};