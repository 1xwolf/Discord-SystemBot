const { MessageEmbed } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const db = require('pro.db');

module.exports = {
  name: 'setroleicon',
  aliases: ['seticon', 'roleicon'],
  description: 'Change a role icon',
  async run(client, message, args) {
    // Permission check
    if (!message.member.permissions.has('MANAGE_ROLES')) {
      return message.reply('❌ You do not have permission to manage roles.');
    }

    if (args.length < 2) {
      return message.reply(`Usage: \`${prefix}setroleicon <role mention or ID> <image URL>\``);
    }

    const roleMention = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    const iconUrl = args[1]; // The URL should be the second argument

    // Validation for role
    if (!roleMention) {
      return message.reply('❌ Please specify a valid role.');
    }

    // Validate the image URL
    if (!iconUrl || !iconUrl.startsWith('http') || !iconUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
      return message.reply('❌ Please provide a valid image URL.');
    }

    // Check if the bot has permission to manage roles
    if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
      return message.reply('❌ I do not have permission to manage roles.');
    }

    // Check role position
    if (roleMention.position >= message.guild.me.roles.highest.position) {
      return message.reply('❌ I cannot change the icon of a role that is higher than my highest role.');
    }

    try {
      // Change the role icon
      await roleMention.setIcon(iconUrl);
      const embed = new MessageEmbed()
        .setColor('GREEN')
        .setDescription(`✅ Successfully changed the icon for the role **${roleMention.name}**.`);
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply('❌ An error occurred while trying to change the role icon. Please try again.');
    }
  }
};