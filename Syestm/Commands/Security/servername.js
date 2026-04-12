// servername.js (command file)
const { MessageEmbed } = require('discord.js');
const db = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: "servername",
    description: "Toggle protection against server name changes.",
    usage: `${prefix}servername <on|off>`,
    run: async (client, message, args) => {
        // Check if the user is an owner
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        // Check if the command has the correct arguments
        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            return message.reply(`Please specify \`on\` or \`off\`. Usage: \`${this.usage}\``);
        }

        const status = args[0].toLowerCase();
        const guildId = message.guild.id;

        // Toggle the anti-server name protection feature
        await db.set(`antiServerName_${guildId}`, status === 'on');

        const embed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Server Name Protection Status")
            .setDescription(`Server name protection has been turned **${status === 'on' ? 'on' : 'off'}** for this server.`);
        
        message.channel.send({ embeds: [embed] });
    }
};