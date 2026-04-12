const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`); // Assuming this is used elsewhere in your code
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "unhideall",
  description: "Unhide all text, voice channels, and categories for everyone",
  usage: ["unhide all"],
  run: async (client, message, args, config) => {
    // Check if the user has the required permissions
    if (!message.member.permissions.has("MANAGE_CHANNELS")) {
      return message.reply("You do not have permission to use this command.");
    }

    // Get all channels in the guild
    const channels = message.guild.channels.cache;

    // Define an array to collect promises for editing permission overwrites
    const permissionUpdates = [];
    let unhiddenCount = 0; // Counter for unhidden channels

    // Iterate over each channel to unhide
    channels.forEach((channel) => {
      // Check if the channel type is either text, voice, or category
      if (channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE' || channel.type === 'GUILD_CATEGORY') {
        // Check if the channel has overwrites for the @everyone role
        const permissionOverwrite = channel.permissionOverwrites.cache.find(
          (overwrite) => overwrite.id === message.guild.id
        );

        if (permissionOverwrite) {
          // Update permissions to unhide the channel
          permissionUpdates.push(
            channel.permissionOverwrites.edit(message.guild.id, {
              VIEW_CHANNEL: true,
            }).then(() => {
              unhiddenCount++; // Increment the counter on successful unhide
            }).catch(err => console.error(`Failed to unhide channel: ${channel.name}`, err))
          );
        } else {
          // If there are no permission overwrites for @everyone, we can ignore
          console.log(`No permission overwrites found for channel: ${channel.name}`);
        }
      }
    });

    // Wait for all permission updates to complete
    await Promise.all(permissionUpdates);

    // Create the confirmation message with the count of unhidden channels
    const embed = new MessageEmbed()
      .setColor("GREEN")
      .setDescription(`Successfully unhide ${unhiddenCount} channel from everyone .`);
      
    message.channel.send({ embeds: [embed] });
  },
};