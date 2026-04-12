const { MessageEmbed } = require('discord.js');
const db = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: "serveravatar",
    description: "Toggle protection against server avatar changes.",
    usage: `${prefix}serveravatar <on|off>`,
    run: async (client, message, args) => {
        // Check if the user is an owner
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        // Check if the command has the correct arguments
        const action = args[0] ? args[0].toLowerCase() : null;
        if (!action || !["on", "off"].includes(action)) {
            return message.reply(`Please specify \`on\` or \`off\`. Usage: \`${this.usage}\``);
        }

        const guildId = message.guild.id;

        // Toggle the avatar protection feature
        if (action === 'on') {
            // Save the current avatar in the database when enabling protection
            const currentAvatar = message.guild.iconURL();
            await db.set(`savedServerAvatar_${guildId}`, currentAvatar);
            await db.set(`antiServerAvatar_${guildId}`, true);
            const embed = new MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Server Avatar Protection Status")
                .setDescription(`Server avatar protection has been turned **on**. Current avatar saved.`);
            return message.channel.send({ embeds: [embed] });
        } else if (action === 'off') {
            // Turn off the avatar protection
            await db.set(`antiServerAvatar_${guildId}`, false);
            const embed = new MessageEmbed()
                .setColor("#ff0000")
                .setTitle("Server Avatar Protection Status")
                .setDescription(`Server avatar protection has been turned **off**.`);
            return message.channel.send({ embeds: [embed] });
        }
    }
};