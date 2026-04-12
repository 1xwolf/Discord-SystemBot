const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`); // Assuming this is used elsewhere in your code
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "hideall",
  description: "Hide all chat, voice channels, and categories from everyone",
  usage: ["hide all"],
  run: async (client, message, args, config) => {
    // Check if the command issuer has permission to manage the channels
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
      return message.reply("You don't have permission to manage channels.");
    }

    const guild = message.guild;
    const channels = guild.channels.cache;
    let hiddenCount = 0; // Initialize a counter for hidden channels

    // Iterate through each channel in the guild
    const hidePromises = channels.map(channel => {
      if (channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE' || channel.type === 'GUILD_CATEGORY') {
        // Update the channel permissions to deny 'VIEW_CHANNEL' for @everyone role
        return channel.permissionOverwrites.edit(guild.roles.everyone, {
          VIEW_CHANNEL: false,
        })
          .then(() => {
            hiddenCount++; // Increment the counter for each successfully hidden channel or category
            console.log(`Successfully hidden ${channel.name}`);
          })
          .catch(err => {
            console.error(`Failed to hide ${channel.name}:`, err);
          });
      }
      return Promise.resolve(); // Ensure all channels return a promise
    });

    // Wait for all permission updates to complete
    await Promise.all(hidePromises);

    // Send a confirmation message with the count of hidden channels
    const embed = new MessageEmbed()
      .setColor("#ff0000")
      .setDescription(`Successfully hidden ${hiddenCount} channels from everyone.`);
    message.channel.send({ embeds: [embed] });
  }
};