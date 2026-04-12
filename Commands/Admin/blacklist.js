const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "blacklist",
  aliases: ["bl"],
  description: "A command to blacklist a member from the server.",
  category: "Admin",
  example: ["blacklist @member <reason>"],
  run: async (client, message, args) => {
    // Ensure the command is run in a guild (server)
    if (!message.guild) return message.reply("This command can only be used in a server.");

    // Check for ADMINISTRATOR permission
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You do not have permission to use this command.");
    }
    
    // Get the member to blacklist
    const memberToBlacklist = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!memberToBlacklist) return message.reply("Please mention a valid member to blacklist.");

    // Get the reason for blacklisting (optional)
    const reason = args.slice(1).join(" ") || "No reason provided";

    // Check for or create the "Blacklist" role
    let blacklistRole = message.guild.roles.cache.find(role => role.name === "Blacklist");
    if (!blacklistRole) {
      try {
        blacklistRole = await message.guild.roles.create({
          name: 'Blacklist',
          color: 'RED',
          reason: 'Role for blacklisted members',
        });
      } catch (error) {
        console.error("Error creating 'Blacklist' role:", error);
        return message.reply("There was an error creating the blacklist role.");
      }
    }

    // Check if the member is already blacklisted
    const isBlacklisted = await Pro.get(`blacklist_${message.guild.id}`) || [];
    if (isBlacklisted.includes(memberToBlacklist.id)) {
      return message.reply("This member is already blacklisted.");
    }

    // Add the blacklist role to the member
    try {
      await memberToBlacklist.roles.add(blacklistRole);
    } catch (error) {
      console.error("Error adding blacklist role to member:", error);
      return message.reply("There was an error adding the blacklist role to the member.");
    }

    // Update the blacklist in the database
    isBlacklisted.push(memberToBlacklist.id);
    await Pro.set(`blacklist_${message.guild.id}`, isBlacklisted);

    // Get the ID of the existing blacklist chat from the database
    const blacklistChatId = await Pro.get(`blacklistChat_${message.guild.id}`);
    if (!blacklistChatId) {
      // Create a "blacklist-chat" channel if it does not exist
      let blacklistChat;
      try {
        blacklistChat = await message.guild.channels.create("blacklist-chat", {
          type: 'GUILD_TEXT',
          permissionOverwrites: [
            {
              id: message.guild.id, // @everyone
              deny: ['VIEW_CHANNEL'], // Deny @everyone
            },
            {
              id: blacklistRole.id, // Reference to the "Blacklist" role
              allow: ['VIEW_CHANNEL'], // Allow Blacklist role to view
            },
            {
              id: memberToBlacklist.id, // Blacklisted member
              allow: ['VIEW_CHANNEL'], // Allow the blacklisted member
            },
          ],
        });
        // Store the ID of the new blacklist chat in the database
        await Pro.set(`blacklistChat_${message.guild.id}`, blacklistChat.id);
        message.channel.send(`Created blacklist-chat channel.`);
      } catch (error) {
        console.error("Error creating 'blacklist-chat' channel:", error);
        return message.reply("There was an error creating the blacklist-chat channel.");
      }
    } else {
      // If there is a blacklist chat, do not hide it
      const blacklistChat = message.guild.channels.cache.get(blacklistChatId);
      if (!blacklistChat) {
        return message.reply("The existing blacklist-chat channel was not found. Please check if it still exists.");
      }
    }

    // Hide all channels for the blacklisted member, except the blacklist chat
    const channels = message.guild.channels.cache;
    channels.forEach(channel => {
      if (channel.id !== blacklistChatId) {
        channel.permissionOverwrites.edit(memberToBlacklist.id, { VIEW_CHANNEL: false }).catch(err => console.error(`Failed to update permissions for ${channel.name}: ${err}`));
      }
    });

    // Log the blacklisting action
    const logChannelId = await Pro.get(`blacklistLog_${message.guild.id}`);
    const logChannel = message.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const logEmbed = new MessageEmbed()
        .setColor("RED")
        .setTitle("Member Blacklisted")
        .setDescription(`**Member:** ${memberToBlacklist}\n**ID:** ${memberToBlacklist.id}\n**Reason:** ${reason}\n**By:** ${message.author}`)
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });
    }

    // Send confirmation message
    const embed = new MessageEmbed()
      .setColor("RED")
      .setDescription(`${memberToBlacklist} has been blacklisted for: ${reason}`);
    message.channel.send({ embeds: [embed] });
  }
};