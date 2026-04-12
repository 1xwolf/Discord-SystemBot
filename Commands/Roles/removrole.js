const Discord = require('discord.js');

module.exports = {
    name: 'roleremove', // Command name here
    aliases: ['rr'],
    run: async (client, message, args) => {
        const Pro = require('pro.db');
        const db = Pro.get(`Allow-Command-roleremove-${message.guild.id}`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
            // Take action when the condition is not met
            return message.react('❌');
        }

        for (const roleArg of args) {
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleArg.toLowerCase().trim()));
            if (!role) {
                return message.reply('Please provide a valid role name to remove.');
            }

            let Members = 0;
            message.guild.members.cache.forEach((member) => {
                if (member.roles.cache.has(role.id)) {
                    try {
                        member.roles.remove(role);
                        Members++;
                    } catch (error) {
                        console.error(error);
                    }
                }
            });

            const embed = new Discord.MessageEmbed()
                .setDescription(`:white_check_mark: Removed role **${role.name}** from **${Members}** member(s).`)
                    .setColor('RED');

            message.reply({ embeds: [embed] });
        }
    }
}