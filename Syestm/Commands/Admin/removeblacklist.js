const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "remove-blacklist",
  aliases: ["unblacklist"],
  description: "A command to remove a member from the server blacklist.",
  category: "Admin",
  example: ["remove-blacklist @member"],
  run: async (client, message, args) => {
    // Ensure the command is run in a guild (server)
    if (!message.guild) return message.reply("This command can only be used in a server.");

    // Check for ADMINISTRATOR permission
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You do not have permission to use this command.");
    }

    // Get the member to un-blacklist
    const memberToUnBlacklist = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!memberToUnBlacklist) return message.reply("Please mention a valid member to un-blacklist.");

    // Get the current blacklist from the database
    const isBlacklisted = await Pro.get(`blacklist_${message.guild.id}`) || [];
    if (!isBlacklisted.includes(memberToUnBlacklist.id)) {
      return message.reply("This member is not currently blacklisted.");
    }

    // Check for the blacklist role
    const blacklistRole = message.guild.roles.cache.find(role => role.name === "Blacklist");
    if (blacklistRole) {
      // Remove the blacklist role from the member
      try {
        await memberToUnBlacklist.roles.remove(blacklistRole);
      } catch (error) {
        console.error("Error removing blacklist role from member:", error);
        return message.reply("There was an error removing the blacklist role from the member.");
      }
    }

    // Remove the member from the blacklist in the database
    const updatedBlacklist = isBlacklisted.filter(id => id !== memberToUnBlacklist.id);
    await Pro.set(`blacklist_${message.guild.id}`, updatedBlacklist);

    // Restore the member's permissions for all channels
    const channels = message.guild.channels.cache;
    channels.forEach(channel => {
      channel.permissionOverwrites.edit(memberToUnBlacklist.id, { VIEW_CHANNEL: null }).catch(err => console.error(`Failed to update permissions for ${channel.name}: ${err}`));
    });

    // Send confirmation message
    const embed = new MessageEmbed()
      .setColor("GREEN")
      .setDescription(`${memberToUnBlacklist} has been removed from the blacklist and can now see all channels.`);
    message.channel.send({ embeds: [embed] });
  }
};