const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "detlog",
  description: "Delete server logs channels",
  usage: "!detlog",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    
    try {
      // Loop through different types of logs channels
      const channels = [
        "channelmessage", "logpic", "logchannels", "lognickname", 
        "logjoinleave", "loglinks", "logbots", "logroles", 
        "logvjoinvexit", "logmove", "logbanunban", "logkick","logtvoicemute","logmutedeafen","logtimeuntime", 
        "logemoji", "logprisonunprison", "logemoji", "logtmuteuntmute", "logwarns"
      ];

      for (const key of channels) {
        const existingChannelId = db.get(`${key}_${message.guild.id}`);
        const existingChannel = message.guild.channels.cache.get(existingChannelId);
        
        // Check if the channel exists in the server
        if (!existingChannel && existingChannelId) {
          // If the channel exists in the database but not in the server, delete it from the database
          db.delete(`${key}_${message.guild.id}`);
        }

        // If the channel exists, delete it from the server and from the database
        if (existingChannel) {
          await existingChannel.delete();
          db.delete(`${key}_${message.guild.id}`);
        }
      }

      message.react("✅"); // React to indicate successful deletion
    } catch (error) {
      console.error("Error occurred in deleting server logs channels:", error);
    }
  }
};
