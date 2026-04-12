const { MessageEmbed } = require('discord.js');
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "antiserveurl",
  description: "Toggle the prevention of server invite URL changes.",
  usage: `${prefix} antiserveurl <on|off>`,
  run: async (client, message, args) => {
    // Check if the user is an owner
    if (!owners.includes(message.author.id)) return message.react('❌');

    // Check if the command is given the correct arguments
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return message.reply(`Please specify \`on\` or \`off\`. Usage: \`${prefix} antiserveurl <on|off>\``);
    }

    const status = args[0].toLowerCase();
    const guildId = message.guild.id;

    // Handle turning on the anti-serveurl feature
    if (status === 'on') {
      // Fetch the current invites for the guild
      const invites = await message.guild.invites.fetch();
      const firstInvite = invites.first();

      if (firstInvite) {
        // Save the invite URL to the database
        await db.set(`savedInviteUrl_${guildId}`, firstInvite.url);
        console.log(`Saved invite URL for ${message.guild.name}: ${firstInvite.url}`);
      } else {
        return message.reply(`No invites found for this server. Please create an invite first.`);
      }
    } else {
      // If turning off the feature, just log the action
      console.log(`Turned off anti-serveurl for ${message.guild.name}.`);
    }

    // Toggle the anti-serveurl feature
    await db.set(`antiServeUrl_${guildId}`, status === 'on');

    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Anti ServeURL Status")
      .setDescription(`Anti-serveurl has been turned **${status === 'on' ? 'on' : 'off'}** for this server.`);
      
    message.channel.send({ embeds: [embed] });
  }
};
