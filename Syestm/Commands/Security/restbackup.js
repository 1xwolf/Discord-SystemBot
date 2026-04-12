const { Permissions, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const { owners } = require(`${process.cwd()}/config`);
const fs = require('fs');

const loadBackup = () => {
    try {
        const backupData = fs.readFileSync('./Saved/backup.json');
        return JSON.parse(backupData);
    } catch (error) {
        console.error('Error while retrieving backup data:', error);
        return null;
    }
};

module.exports = {
    name: 'restbackup',
    run: async (client, message, args) => {

        if (!owners.includes(message.author.id)) return message.react('❌');

        if (message.author.bot) return;

        const backupConfirmationRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm_backup')
                    .setLabel('نعم')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('cancel_backup')
                    .setLabel('إلغاء')
                    .setStyle('DANGER')
            );

        const msgbackup = await message.reply({ content: '** هل ترغب في إنشاء نسخة احتياطية (Backup)؟ في حال الموافقة،\n سيتم حذف جميع الرومات، الرولات، الصور، واسم الخادم، ثم سيتم وضع النسخة الاحتياطية المحفوظة. 🛑**', components: [backupConfirmationRow], ephemeral: true });

        const filter = interaction => interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'confirm_backup') {
                await interaction.update({ content: 'جاري استعادة النسخة الاحتياطية...', components: [] });

                const backupDataObj = loadBackup();
                if (!backupDataObj) return interaction.editReply('No backup data found.');

                try {
                    await message.guild.setName(backupDataObj.serverName);

                    // Set server icon
                    const iconBuffer = fs.readFileSync('./Saved/icon.png');
                    await message.guild.setIcon(iconBuffer);

                    // Delete all roles
                    for (const role of message.guild.roles.cache.values()) {
                        if (!role.managed && role.name !== '@everyone') {
                            try {
                                // Check if the role still exists before attempting to delete it
                                const fetchedRole = await message.guild.roles.fetch(role.id);
                                if (fetchedRole) {
                                    await fetchedRole.delete();
                                }
                            } catch (error) {
                                console.error(`Error while deleting role: ${role.name}`);
                            }
                        }
                    }

                    const channelsToDeleteCount = message.guild.channels.cache.filter(channel => channel.type !== 'GUILD_NEWS_THREAD').size;
                    const deletionInterval = 3000;
                    const expectedDeletionTime = channelsToDeleteCount * deletionInterval / 1000; // Convert milliseconds to seconds
                    const minutes = Math.floor(expectedDeletionTime / 60);
                    const seconds = Math.floor(expectedDeletionTime % 60);

                    const formattedTime = `(\`${minutes}:${seconds.toString().padStart(2, '0')}\`)`;
                    let channelsToCreateCount = 0;
                    for (const categoryData of backupDataObj.categories) {
                        channelsToCreateCount += categoryData.channels.length;
                    }

                    await interaction.editReply(`سيتم استعادة **${channelsToCreateCount}** قناة و **${backupDataObj.roles.length}** رول. وسيستغرق ذلك حوالي ${formattedTime} دقيقة.`);
                    let index = 0;
                    for (const channel of message.guild.channels.cache.values()) {
                        setTimeout(async () => {
                            try {
                                await channel.delete();
                            } catch (error) {
                                console.error(`Error while deleting channel: ${channel.name}`);
                            }
                        }, index * deletionInterval);
                        index++;
                    }

                    await new Promise(resolve => setTimeout(resolve, index * deletionInterval));
                    for (const categoryData of backupDataObj.categories) {
                        let recreatedCategory;
                        try {
                            recreatedCategory = await message.guild.channels.create(categoryData.name, {
                                type: 'GUILD_CATEGORY',
                                permissionOverwrites: categoryData.permissions
                            });
                        } catch (error) {
                            console.error(`Error while recreating category: ${categoryData.name}`);
                            continue;
                        }
                        for (const channelData of categoryData.channels) {
                            try {
                                await message.guild.channels.create(channelData.name, {
                                    type: channelData.type,
                                    parent: recreatedCategory,
                                    permissionOverwrites: channelData.permissions
                                });
                            } catch (error) {
                                console.error(`Error while recreating channel: ${channelData.name}`);
                            }
                        }
                    }

                    // Recreate roles
                    for (const roleData of backupDataObj.roles) {
                        try {
                            await message.guild.roles.create({
                                name: roleData.name,
                                color: roleData.color,
                                permissions: roleData.permissions,
                                reason: 'Restoring backup'
                            });
                        } catch (error) {
                            console.error(`Error while recreating role: ${roleData.name}`);
                        }
                    }

                    await interaction.editReply('تم استعادة النسخة الاحتياطية بنجاح.', { ephemeral: true });
                } catch (error) {
                    console.error('An error occurred while restoring the backup:', error);
                    await interaction.editReply('An error occurred while restoring the backup.');
                }
            } else if (interaction.customId === 'cancel_backup') {
                await interaction.update({ content: 'تم إلغاء عملية استعادة النسخة الاحتياطية.', components: [], ephemeral: true });
            }
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msgbackup.edit('انتهى الوقت المحدد.', { ephemeral: true }).then(m => m.delete({ timeout: 5000 }));
            }
        });
    }
};
