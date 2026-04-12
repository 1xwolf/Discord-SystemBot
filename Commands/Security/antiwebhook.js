const { MessageEmbed } = require('discord.js');
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "antiwebhook",
  description: "Toggle the prevention of webhook creation in the current channel.",
  usage: `${prefix} antiwebhook <on|off>`,
  run: async (client, message, args) => {
    // Check if the user is an owner
    if (!owners.includes(message.author.id)) return message.react('❌');

    // Check if the command is given the correct arguments
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return message.reply(`Please specify \`on\` or \`off\`. Usage: \`${prefix} antiwebhook <on|off>\``);
    }

    const status = args[0].toLowerCase();
    const guildId = message.guild.id;

    // Toggle the anti-webhook feature
    await db.set(`antiWebhook_${guildId}`, status === 'on');

    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Anti Webhook Status")
      .setDescription(`Anti-webhook has been turned **${status === 'on' ? 'on' : 'off'}** for this channel.`);
      
    message.channel.send({ embeds: [embed] });
  }
};