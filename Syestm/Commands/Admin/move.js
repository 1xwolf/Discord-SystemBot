const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');

const cooldowns = new Map(); // To manage command cooldowns

module.exports = {
    name: 'move',
    aliases: ["سحب", "تل"],
    run: async (client, message, args) => {
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || '#000000';

        // Load the allowed role for the move command
        const allowedRoleID = Pro.get(`Allow - Command move = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(allowedRoleID);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRoleID) || message.author.id === allowedRoleID || message.member.permissions.has('MOVE_MEMBERS');

        if (!isAuthorAllowed) {
            return message.reply(`**:rolling_eyes: - You don't have permissions to move someone!**`);
        }

        // Check for cooldown
        if (cooldowns.has(message.author.id)) {
            const cooldownAmount = 10000; // 10 seconds cooldown
            const now = Date.now();
            const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`**:timer: - Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.**`);
            }
        }

        const memberArg = args[0];
        const membersToMove = message.mentions.members;

        if (membersToMove.size === 0) {
            const dbAliases = Pro.get(`aliases_${module.exports.name}`) || [];
            const allAliases = [...new Set([...module.exports.aliases, ...dbAliases])]; // Combine and deduplicate aliases
            const aliases = allAliases.join(', '); // Format aliases for display

            const embed = new MessageEmbed()
                .setColor(Color)
                .setTitle("Command: move")
                .setDescription("Moves mentioned members to your voice channel.")
                .addField("Aliases:", aliases || 'لا يوجد.')
                .addField("Usage:", `\`${prefix}move <@user> [@user2] ...\``)
                .addField("Examples:", `\`${prefix}move @user1 @user2\``)
                .setFooter("Please mention the users you want to move.");

            return message.reply({ embeds: [embed] });
        }

        const authorVoiceChannel = message.member.voice.channel;

        if (!authorVoiceChannel) {
            return message.reply(`**:rolling_eyes: - You are not connected to a voice channel!**`);
        }

        // Move each member
        membersToMove.forEach(member => {
            const memberVoiceChannel = member.voice.channel;

            if (!memberVoiceChannel) {
                return message.reply(`**:rolling_eyes: - ${member.user.username} is not connected to a voice channel!**`);
            }

            if (memberVoiceChannel.id === authorVoiceChannel.id) {
                return message.reply(`**:rolling_eyes: - ${member.user.username} is already in your voice channel!**`);
            }

            member.voice.setChannel(authorVoiceChannel)
                .then(() => {
                    const confirmationEmbed = new MessageEmbed()
                        .setColor(Color)
                        .setDescription(`✅ **${member.user.username} has been moved to ${authorVoiceChannel.name}!**`);
                    message.channel.send({ embeds: [confirmationEmbed] });

                    // Log the action to a mod channel if needed
                    const logChannel = message.guild.channels.cache.find(channel => channel.name === 'mod-logs');
                    if (logChannel) {
                        const logEmbed = new MessageEmbed()
                            .setColor('#00FF00')
                            .setTitle('Member Moved')
                            .addField('Moved By:', message.author.tag)
                            .addField('Moved Member:', member.user.tag)
                            .addField('New Channel:', authorVoiceChannel.name)
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    }
                })
                .catch(() => {
                    return message.reply(`**:x: - I could not move ${member.user.username}. Please check my permissions!**`);
                });
        });

        // Set cooldown
        cooldowns.set(message.author.id, Date.now());
        setTimeout(() => cooldowns.delete(message.author.id), 10000); // Reset cooldown after 10 seconds
    }
};