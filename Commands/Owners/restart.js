const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const config = require("../../config.json");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const fs = require("fs");

module.exports = {
  name: 'restart',
  description: 'Restarts the bot.',
  async run(client, message, args) {
    // Check if the user is the owner or has permission to restart the bot
    const db = Data.get(`Allow - Command restart = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);

    // If the author is in owners or has the allowed role, continue, else deny
    const isOwner = owners.includes(message.author.id);
    
    if (!isOwner && (!allowedRole || !message.member.roles.cache.has(allowedRole.id))) {
      return message.reply("You do not have permission to use this command.");
    }

    // Indicate the restart process has started
    const statusMessage = await message.channel.send("Restarting the bot...");

    try {
      // Perform the bot restart logic
      await client.destroy();
      await client.login(config.token);

      // Inform the user that the bot has restarted
      await statusMessage.edit("Bot has been restarted.");
    } catch (e) {
      // Handle any errors during the restart process
      await statusMessage.edit(`ERROR: ${e.message}`);
    }
  }
};