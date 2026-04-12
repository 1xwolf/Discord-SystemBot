const { MessageEmbed } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: "hide",
  aliases: ["اخفاء"],
  description: "Hide chat",
  usage: ["hide chat"],
  run: async (client, message, args, config) => {
    // Retrieve the allowed role from the database
    const db = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Check if the author is allowed to use this command
    if (!isAuthorAllowed && message.author.id !== db && 
        !message.member.permissions.has('MANAGE_CHANNELS') && 
        !owners.includes(message.author.id)) {
      return message.reply("You do not have permission to use this command."); // Inform user of permission denial
    }

    // Check if the command is enabled
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return message.reply("This command is disabled."); // Inform user that the command is disabled
    }

    // Find the @everyone role
    let everyone = message.guild.roles.cache.find(role => role.name === '@everyone');
    
    // Attempt to hide the channel
    try {
      await message.channel.permissionOverwrites.edit(everyone, {
        VIEW_CHANNEL: false
      });

      // Reply to the user after a successful update
      message.reply(`:white_check_mark: Channel **${message.channel.name}** was hidden by **${message.author.tag}!**`);
    } catch (err) {
      console.error(`Failed to hide the channel: ${err.message}`);
      message.reply("There was an error hiding the channel."); // Inform user of error
    }
  }
};