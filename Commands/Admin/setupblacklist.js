const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "setupBlacklistChat",
  aliases: ["setupblchat"],
  description: "Set up the blacklist chat for blacklisted members.",
  category: "Admin",
  example: ["setupBlacklistChat #blacklist-chat"],
  run: async (client, message, args) => {
    // Ensure the command is run in a guild (server)
    if (!message.guild) return message.reply("This command can only be used in a server.");

    // Check for ADMINISTRATOR permission
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You do not have permission to use this command.");
    }

    // Check if a channel was mentioned or passed in
    const channelMention = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channelMention) return message.reply("Please mention a valid channel or provide a channel ID.");

    // Check for or create the "Blacklist" role
    let blacklistRole = message.guild.roles.cache.find(role => role.name === "Blacklist");
    if (!blacklistRole) {
      try {
        blacklistRole = await message.guild.roles.create({
          name: 'Blacklist',
          color: 'RED',
          reason: 'Role for blacklisted members'
        });
      } catch (error) {
        console.error("Error creating 'Blacklist' role:", error);
        return message.reply("There was an error creating the blacklist role.");
      }
    }

    // Create or update permissions for the specified blacklist chat channel
    try {
      await channelMention.permissionOverwrites.edit(message.guild.id, { VIEW_CHANNEL: false }); // Deny @everyone access
      await channelMention.permissionOverwrites.edit(blacklistRole.id, { VIEW_CHANNEL: true }); // Allow Blacklist role access
    } catch (error) {
      console.error("Error setting permissions for the blacklist chat:", error);
      return message.reply("There was an error updating the channel permissions.");
    }

    // Store the ID of the blacklist channel in the database
    await Pro.set(`blacklistChat_${message.guild.id}`, channelMention.id);

    // Send confirmation message
    const embed = new MessageEmbed()
      .setColor("BLUE")
      .setDescription(`The blacklist chat has been set to ${channelMention}. Only blacklisted members and the Blacklist role can see this channel.`);
    message.channel.send({ embeds: [embed] });
  }
};