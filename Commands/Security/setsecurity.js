const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setsecurity",
  description: "Set up server logs",
  usage: "!stlogs",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react('❌');



    try {
   
      const category = await message.guild.channels.create("Security log", {
        type: "GUILD_CATEGORY",
        reason: "Setting up server logs category",
        VIEW_CHANNEL: false
      });

      const channels = [
        { name: "log-antidelete", keyy: "logantidelete" },
        { name: "log-protection", keyy: "logprotection" },
        { name: "log-antijoinbots", keyy: "logantijoinbots" },
        { name: "log-blocklist", keyy: "logblocklist" },



      ];

      for (const { name, keyy } of channels) {
        const channel = await message.guild.channels.create(name, {
          type: "GUILD_TEXT",
          parent: category,
          reason: `Setting up server logs channel for ${name}`,
          VIEW_CHANNEL: false
        });
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          VIEW_CHANNEL: false
        });
        db.set(`${keyy}_${message.guild.id}`, channel.id);
      }

      message.react("✅"); // React to indicate successful setup
    } catch (error) {
      console.error("Error occurred in setting up server logs:", error);
    }
  }
};
