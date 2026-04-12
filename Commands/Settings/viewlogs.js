const db = require("pro.db");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "viewlogs",
  description: "View server logs.",
  usage: "!viewlogs",
  run: async (client, message, args) => {
    // Ensure the command is run in a guild (server)
    if (!message.guild) return message.reply("This command can only be used in a server.");

    // Retrieve the list of admin IDs from the database
    const adminLogs = await db.get(`admin_logs_${message.guild.id}`) || [];
    
    // Check if the command issuer is an admin
    if (!adminLogs.includes(message.author.id)) {
      return message.reply("You do not have permission to view the logs.");
    }

    // Retrieve log channels from the database
    const logTypes = [
      "channelmessage", "logpic", "logchannels",
      "lognickname", "logjoinleave", "loglinks",
      "logbots", "logroles", "logvjoinvexit",
      "logmove", "logbanunban", "logkick",
      "logemoji", "logprisonunprison", "logwarns",
      "logtmuteuntmute"
    ];

    const logsEmbed = new MessageEmbed()
      .setColor("BLUE")
      .setTitle("Server Logs")
      .setDescription("Here are the channels where logs are stored:");

    // Append log channel IDs to the embed
    let hasLogs = false;
    for (const type of logTypes) {
      const channelId = await db.get(`${type}_${message.guild.id}`);
      if (channelId) {
        const channel = message.guild.channels.cache.get(channelId);
        if (channel) {
          hasLogs = true;
          logsEmbed.addField(type, `Channel ID: ${channelId} (Channel Name: ${channel.name})`, true);
        } else {
          logsEmbed.addField(type, `Channel ID: ${channelId} (Channel not found)`, true);
        }
      }
    }

    if (!hasLogs) {
      return message.reply("No log channels have been set up yet.");
    }

    message.channel.send({ embeds: [logsEmbed] });
  }
};