const { MessageActionRow, MessageButton } = require('discord.js');
const { owners } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');

module.exports = {
    name: 'setstatus',
    run: async (client, message, args) => {
        const db = Pro.get(`Allow - Command setavatar = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
        const isOwner = owners.includes(message.author.id);

        // Check if the user is allowed
        if (!isAuthorAllowed && !isOwner) {
            return message.reply("**You don't have permission to change the bot's status!**");
        }

        // Show current status
        const currentStatus = client.user.presence?.status || 'offline';
        await message.reply(`**Current status: \`${currentStatus}\`**`);

        // Create buttons for status options without "Invisible"
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('online')
                    .setLabel('Online')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('idle')
                    .setLabel('Idle')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('dnd')
                    .setLabel('Do Not Disturb')
                    .setStyle('DANGER')
            );

        // Send the message with buttons
        const response = await message.reply({
            content: '**Please select a status for the bot:**',
            components: [row],
        });

        // Create a message collector to handle button interactions
        const filter = interaction => interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 }); // 60 seconds timeout

        collector.on('collect', async (interaction) => {
            const status = interaction.customId;

            // Change the bot's status (keep existing activity, only change status)
            try {
                // نحافظ على النشاط الحالي ونغير الحالة فقط
                const currentActivity = client.user.presence?.activities?.[0];
                const presenceData = { status, activities: [] };
                if (currentActivity) {
                    const act = { name: currentActivity.name, type: currentActivity.type };
                    if (currentActivity.url) act.url = currentActivity.url;
                    presenceData.activities.push(act);
                }
                await client.user.setPresence(presenceData);
                // ── حفظ في DB مزامنةً مع الداشبورد ──
                Pro.set('bot_presence_status', status);
                console.log(`Bot status changed to: ${status}`);

                // Disable buttons after selection
                const disabledRow = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId('online')
                        .setLabel('Online')
                        .setStyle('PRIMARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('idle')
                        .setLabel('Idle')
                        .setStyle('SECONDARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('dnd')
                        .setLabel('Do Not Disturb')
                        .setStyle('DANGER')
                        .setDisabled(true)
                );

                // Only update interaction if it hasn't been acknowledged yet
                await interaction.update({ content: `**The bot's status has been changed to \`${status}\`!**`, components: [disabledRow] });
                
                // Stop the collector after a successful change
                collector.stop();

            } catch (error) {
                console.error(error);
                // Ensure that we don't try to respond to an interaction that has been acknowledged
                if (!interaction.replied) {
                    await interaction.reply({ content: `**An error occurred while changing the bot's status: ${error.message}**`, ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.reply('**No status was selected in time!**');
            }
        });
    },
};