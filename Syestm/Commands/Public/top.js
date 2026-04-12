const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const Data = require("pro.db");

module.exports = {
    name: 'top',
    aliases: ['top'],
    run: async (client, message, args) => {
        // Check if command is enabled
        if (Data.get(`command_enabled_${module.exports.name}`) === false) return;

        const guildColor = '#ffffff';
        const setChannel = Data.get(`setChannel_${message.guild.id}`);
        
        // Check for specific channel
        if (setChannel && message.channel.id !== setChannel) return;

        const mentionedUser = message.mentions.users.first() || message.author; 
        const userId = mentionedUser.id;

        // Determine display type
        const type = args[0] ? args[0].toLowerCase() : 'both';

        try {
            const leaderboardData = await fetchLeaderboardData();
            const userPoints = await fetchUserPoints(userId);
            
            // Initial page and page size
            const pageSize = 10;
            let currentPage = 0;

            // Create initial embed based on type
            let embed, entries;
            if (type === 'text') {
                entries = leaderboardData.textEntries;
                embed = createTopEmbed(guildColor, message, entries, userPoints, mentionedUser, 'text', currentPage, pageSize);
            } else if (type === 'voice') {
                entries = leaderboardData.voiceEntries;
                embed = createTopEmbed(guildColor, message, entries, userPoints, mentionedUser, 'voice', currentPage, pageSize);
            } else {
                return message.reply({ embeds: [createCombinedTopEmbed(guildColor, message, leaderboardData, userPoints, mentionedUser)] });
            }

            // Create navigation buttons
            const buttons = createNavigationButtons(entries, currentPage, pageSize);

            // Send message with embed and buttons
            const sentMessage = await message.reply({ 
                embeds: [embed],
                components: [buttons]
            });

            // Create button collector
            const filter = i => i.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({ 
                filter, 
                time: 60000 
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'previous') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (interaction.customId === 'next') {
                    currentPage = Math.min(Math.ceil(entries.length / pageSize) - 1, currentPage + 1);
                }

                // Update embed and buttons
                const updatedEmbed = createTopEmbed(guildColor, message, entries, userPoints, mentionedUser, type, currentPage, pageSize);
                const updatedButtons = createNavigationButtons(entries, currentPage, pageSize);

                await interaction.update({ 
                    embeds: [updatedEmbed],
                    components: [updatedButtons]
                });
            });

            collector.on('end', async () => {
                // Disable buttons after time expires
                const disabledButtons = createNavigationButtons(entries, currentPage, pageSize, true);
                await sentMessage.edit({ components: [disabledButtons] });
            });
            
        } catch (error) {
            handleError(message, error);
        }
    }
};

// Create navigation buttons
function createNavigationButtons(entries, currentPage, pageSize, disabled = false) {
    const totalPages = Math.ceil(entries.length / pageSize);

    const previousButton = new MessageButton()
        .setCustomId('previous')
        .setLabel('Previous')
        .setStyle('PRIMARY')
        .setDisabled(disabled || currentPage === 0);

    const nextButton = new MessageButton()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('PRIMARY')
        .setDisabled(disabled || currentPage === totalPages - 1);

    return new MessageActionRow().addComponents(previousButton, nextButton);
}

// Create embed for text or voice leaderboard with pagination
function createTopEmbed(guildColor, message, entries, userPoints, mentionedUser, type, currentPage, pageSize) {
    const embed = new MessageEmbed()
        .setColor(guildColor)
        .setFooter({ 
            text: `Requested by: ${message.author.tag} | Page ${currentPage + 1}`, 
            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
        })
        .setAuthor({ 
            name: `📋 Top ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard`, 
            iconURL: message.guild.iconURL({ dynamic: true }) 
        });

    // Slice entries for current page
    const startIndex = currentPage * pageSize;
    const pageEntries = entries.slice(startIndex, startIndex + pageSize);

    // Format leaderboard entries
    const leaderboardText = pageEntries.length > 0
        ? pageEntries.map((entry, index) =>
            `**#${startIndex + index + 1}. <@${entry.userId.split("_")[0]}> - ${entry.points} XP**`
        ).join('\n')
        : 'No users found.';

    embed.setDescription(leaderboardText);

    // Add user's rank
    const userRankKey = type === 'text' ? 'textRank' : 'voiceRank';
    const userPointsKey = type === 'text' ? 'textPoints' : 'voicePoints';
    const userRankDisplay = userPoints[userRankKey] 
        ? `**#${userPoints[userRankKey]} ${mentionedUser} - ${userPoints[userPointsKey]} XP**`
        : `**${mentionedUser} Rank: Not in the ranking**`;

    embed.addField(`Your Rank`, userRankDisplay);
    
    return embed;
}

// Create embed for combined text and voice leaderboard
function createCombinedTopEmbed(guildColor, message, leaderboardData, userPoints, mentionedUser) {
    const embed = new MessageEmbed()
        .setColor(guildColor)
        .setFooter({ text: `Requested by: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setAuthor({ name: `📋 Guild Score Leaderboards`, iconURL: message.guild.iconURL({ dynamic: true }) });

    const textRankDisplay = userPoints.textRank 
        ? `**#${userPoints.textRank} ${mentionedUser} - ${userPoints.textPoints} XP**`
        : `**${mentionedUser} Text Rank: Not in the ranking**`;

    const voiceRankDisplay = userPoints.voiceRank
        ? `**#${userPoints.voiceRank} ${mentionedUser} - ${userPoints.voicePoints} XP**`
        : `**${mentionedUser} Voice Rank: Not in the ranking**`;

    embed.addField("TOP TEXT 💬", 
        formatTopUsers(leaderboardData.textEntries.slice(0, 8)) + 
        `\n${textRankDisplay}` + 
        `\n:sparkles: **More?** \`/top text\``, 
        true
    );

    embed.addField("TOP VOICE 🎙️", 
        formatTopUsers(leaderboardData.voiceEntries.slice(0, 8)) + 
        `\n${voiceRankDisplay}` + 
        `\n:sparkles: **More?** \`/top voice\``, 
        true
    );

    return embed;
}

// Format top users for display
function formatTopUsers(users) {
    return users.length > 0 
        ? users.map((entry, index) =>
            `**#${index + 1}. <@${entry.userId.split("_")[0]}> - ${entry.points} XP**`
        ).join('\n')
        : 'No users found.';
}

// Fetch leaderboard data from database
async function fetchLeaderboardData() {
    const allUsers = await Data.fetchAll();
    return {
        textEntries: getSortedEntries(allUsers, "_points"),
        voiceEntries: getSortedEntries(allUsers, "_voice")
    };
}

// Get sorted entries from user data
function getSortedEntries(allUsers, suffix) {
    return Object.entries(allUsers)
        .filter(([key]) => key.endsWith(suffix))
        .sort(([, valueA], [, valueB]) => valueB - valueA)
        .map((entry, index) => ({
            userId: entry[0],
            points: entry[1],
            rank: index + 1
        }));
}

// Fetch points and rank for a specific user
async function fetchUserPoints(userId) {
    const textPoints = await Data.get(`${userId}_points`) || 0;
    const voicePoints = await Data.get(`${userId}_voice`) || 0;
    console.log(`User ID: ${userId}, Text Points: ${textPoints}, Voice Points: ${voicePoints}`);
    
    return {
        textPoints,
        voicePoints,
        textRank: await getUserRank(userId, "_points"),
        voiceRank: await getUserRank(userId, "_voice")
    };
}

// Get user's rank in leaderboard
async function getUserRank(userId, suffix) {
    const allEntries = await Data.fetchAll();
    const keys = Object.keys(allEntries)
        .filter(key => key.endsWith(suffix))
        .sort((a, b) => allEntries[b] - allEntries[a]);

    return keys.indexOf(`${userId}${suffix}`) + 1 || null;
}

// Handle errors
function handleError(message, error) {
    console.error("Error fetching data: ", error);
    message.react("❌");
}