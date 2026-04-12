const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`);

module.exports = {
  name: "unhide",
  aliases: ["اظهار"],
  description: "Show chat",
  usage: ["!show"],
  run: async (client, message, args, config) => {
    // Retrieve the allowed role ID from the database
    const allowedRoleId = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Check if the author is allowed to unhide the channel
    if (!isAuthorAllowed && message.author.id !== allowedRoleId && !message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.reply("You do not have permission to unhide this channel."); // Inform user of lack of permissions
    }

    // Check if the command is enabled
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return message.reply("This command is currently disabled."); // Inform user if command is disabled
    }

    // Get the @everyone role and update channel permissions
    const everyoneRole = message.guild.roles.cache.find(role => role.name === '@everyone');
    
    try {
      await message.channel.permissionOverwrites.edit(everyoneRole, {
        VIEW_CHANNEL: true,
      });
      // Reply to the user after successful update
      message.reply(`:white_check_mark: Channel **${message.channel.name}** was unhidden by **${message.author.tag}!**`);
    } catch (err) {
      console.error(`Failed to unhide the channel: ${err.message}`);
      message.reply("There was an error un-hiding the channel."); // Inform user of error
    }
  }
};