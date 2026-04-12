const { MessageAttachment, MessageEmbed } = require('discord.js');
const db = require("pro.db");
const Data = require("pro.db");

module.exports = {
    name: 'server',
    aliases: ["سيرفري"],
    run: async (client, message, args) => {
        
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = db.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff'; // Updated key format
        if (!Color) return;

        let setchannek = Data.get(`setChannel_${message.guild.id}`);
        if (setchannek && message.channel.id !== setchannek) return; // Check if setChannel is defined and if the message is not in the specified channel

        await message.guild.members.fetch();
        const members = message.guild.members.cache;
        const channels = message.guild.channels.cache;
        const emojis = message.guild.emojis.cache.size;
        const firstFiveEmojis = message.guild.emojis.cache.map(emoji => emoji).slice(0, 5).join(' ');
        const boostCount = message.guild.premiumSubscriptionCount;
        const verificationLevel = message.guild.verificationLevel;
        const rolesCount = message.guild.roles.cache.size;

        // Get user's device type
        let deviceEmoji;
        const clientStatus = message.author.presence?.clientStatus; // Get the user's presence info

        if (clientStatus) {
            if (clientStatus.desktop) {
                deviceEmoji = '💻'; // Desktop emoji
            } else if (clientStatus.mobile) {
                deviceEmoji = '📱'; // Mobile emoji
            } else if (clientStatus.web) {
                deviceEmoji = '🌐'; // Web emoji
            } else {
                deviceEmoji = '❓'; // Unknown device emoji
            }
        } else {
            deviceEmoji = '❓'; // If presence is not available
        }

        // Create the embed message
        const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('Server Information') // Optional title
            .setThumbnail(message.guild.iconURL({ dynamic: true })) // Add the server avatar
            .addFields(
                { name: '🆔 سيرفر ايدي:', value: `${message.guild.id}`, inline: true },
                { name: '📆 تاريخ الإنشاء:', value: `**<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>**`, inline: true },
                { name: '👑 مالك السيرفر:', value: `<@!${message.guild.ownerId}>`, inline: true },
                { name: `👥 الأعضاء (${message.guild.memberCount}):`, 
                  value: `**${members.filter(member => member.presence?.status === 'online').size + 
                                  members.filter(member => member.presence?.status === 'idle').size + 
                                  members.filter(member => member.presence?.status === 'dnd').size}** Online | Idle | DND
                          \n**${members.filter(member => !['online', 'idle', 'dnd'].includes(member.presence?.status)).size}** Offline
                          \n**${members.filter(member => member.user.bot).size}** Bot`, 
                  inline: true 
                },
                { name: `💬 الرومات (${message.guild.channels.cache.size}):`, 
                  value: `**${channels.filter(channel => channel.type === 'GUILD_TEXT').size}** Text | **${channels.filter(channel => channel.type === 'GUILD_VOICE').size}** Voice
                          \n**${channels.filter(channel => channel.type === 'GUILD_CATEGORY').size}** Category`, 
                  inline: true 
                },
                { name: `🌐 آخر:`, 
                  value: `Verification Level: **${verificationLevel}**
                          \nBoosts: **${boostCount}** 🔮
                          \nRoles: **${rolesCount}**`, 
                  inline: true 
                },
                { name: `🛡️ الإموجيات (${emojis}):`, value: `**${firstFiveEmojis}**`, inline: true },
                { name: `👤 نوع الجهاز:`, value: `**${deviceEmoji}**`, inline: true } // Include device emoji
            );

        await message.reply({ embeds: [embed] });
    }
};