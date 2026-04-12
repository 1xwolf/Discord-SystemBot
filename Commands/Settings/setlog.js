const { MessageEmbed } = require('discord.js'); // Import MessageEmbed
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setlog",
  description: "Set up server logs by selecting a role.",
  usage: "!setlogs @RoleName",
  run: async (client, message, args) => {
    // Check if the user is an owner
    if (!owners.includes(message.author.id)) return message.react('❌');

    // Check if command is enabled
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    // Check if a role is mentioned
    const roleMention = message.mentions.roles.first();
    if (!roleMention) {
      // Send an embed to guide the user
      const guideEmbed = new MessageEmbed()
        .setColor("#0099ff") // You can choose any color
        .setTitle("Set Log Role")
        .setDescription(`Please mention a role that should have access to the log channels.`)
        .addField("Usage", `${prefix}setlog @role`)
        .setFooter("Make sure the bot has permission to manage channels.");

      return message.channel.send({ embeds: [guideEmbed] }); // Send embed message
    }

    try {
      if (!message.guild.me.permissions.has("MANAGE_CHANNELS")) {
        return message.reply("I do not have permission to manage channels.");
      }

      // Save the selected role in the database
      await db.set(`log_role_${message.guild.id}`, roleMention.id);

      // Create a new category for server logs
      const category = await message.guild.channels.create("Server Logs", {
        type: "GUILD_CATEGORY",
        reason: "Setting up server logs category",
        permissionOverwrites: [{
          id: message.guild.id, // @everyone role
          deny: ['VIEW_CHANNEL'], // Deny view channel permission for everyone
        }],
      });

      // Define the log channels to create
      const channels = [
        { name: "log-messages", key: "channelmessage" },
        { name: "log-pic", key: "logpic" },
        { name: "log-channels", key: "logchannels" },
        { name: "log-nickname", key: "lognickname" },
        { name: "log-join-leave", key: "logjoinleave" },
        { name: "log-links", key: "loglinks" },
        { name: "log-bots", key: "logbots" },
        { name: "log-roles", key: "logroles" },
        { name: "log-vjoin-vexit", key: "logvjoinvexit" },
        { name: "log-move", key: "logmove" },
        { name: "log-ban-unban", key: "logbanunban" },
        { name: "log-kick", key: "logkick" },
        { name: "log-mute-deafen", key: "logmutedeafen" },
        { name: "log-time-untime", key: "logtimeuntime" },
        { name: "log-add-remove-emoji", key: "logemoji" },
        { name: "log-prison-unprison", key: "logprisonunprison" },
        { name: "log-warns", key: "logwarns" },
        { name: "log-mutevoice", key: "logtvoicemute" },
        { name: "log-tmute-untmute", key: "logtmuteuntmute" }
      ];

      // Create log channels under the "Server Logs" category
      for (const { name, key } of channels) {
        const channel = await message.guild.channels.create(name, {
          type: "GUILD_TEXT",
          parent: category,
          reason: `Setting up server logs channel for ${name}`,
        });

        // Deny view permission for @everyone
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          VIEW_CHANNEL: false,
        });

        // Grant permission for the specified log role to view the channel
        await channel.permissionOverwrites.edit(roleMention, {
          VIEW_CHANNEL: true,
        });

        // Save channel ID in the database
        db.set(`${key}_${message.guild.id}`, channel.id);
      }

      // Save the admin user ID in the database
      const adminLogs = db.get(`admin_logs_${message.guild.id}`) || [];
      if (!adminLogs.includes(message.author.id)) {
        adminLogs.push(message.author.id);
        await db.set(`admin_logs_${message.guild.id}`, adminLogs);
      }

      message.react("✅"); // React to indicate successful setup
    } catch (error) {
      console.error("Error occurred in setting up server logs:", error);
      message.reply("An error occurred while setting up the log channels.");
    }
  }
};