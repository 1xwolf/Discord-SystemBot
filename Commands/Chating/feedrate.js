const { Client, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const db = require('pro.db');
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: "feedrate",
    aliases: ["setrating"],
    description: "Set the channel for rating feedback",
    usage: [`${prefix}setfeedbackchannel #channel`],
  
    run: async function (client, message, args) {
      // Check if user has admin permissions
      if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply('You need administrator permissions to use this command!');
      }
  
      // Get mentioned channel
      const channel = message.mentions.channels.first() || message.channel;
  
      // Save channel ID to database
      db.set(`feedback_channel_${message.guild.id}`, channel.id);
  
      message.reply(`Successfully set ${channel} as the feedback channel!`);
    }
  };