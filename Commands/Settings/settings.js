const { MessageSelectMenu, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Data = require('pro.db');

module.exports = {
    name: "settings",
    description: "تعديل إعدادات السيرفر",
    run: async (client, message, args) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) return message.react('❌');

        // Select Menu
        const selectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('settingsMenu')
                    .setPlaceholder('اختر إحدى الخيارات')
                    .addOptions([
                        {
                            label: 'تغيير اسم السيرفر',
                            value: 'change_name',
                        },
                        {
                            label: 'تغيير صورة السيرفر',
                            value: 'change_avatar',
                        },
                    ])
            );

        // Cancel Button
        const deleteButton = new MessageButton()
            .setCustomId('Cancel')
            .setLabel('إلغاء')
            .setStyle('DANGER');

        const cancelRow = new MessageActionRow()
            .addComponents(deleteButton);

        await message.reply({ content: "**قائمة إعدادات السيرفر ⚙️**", components: [selectMenu, cancelRow] });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate(); // Acknowledge the interaction without sending a response
            const choice = interaction.values[0];
            
            switch (choice) {
                case "change_name":
                    await handleChangeName(interaction, message);
                    break;
                case "change_avatar":
                    await handleChangeAvatar(interaction, message);
                    break;
            }
        });

        // Handle Cancel button click
        client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton() && interaction.customId === 'Cancel') {
                collector.stop();
                await interaction.message.delete();
            }
        });
    },
};

// Function to change the server name
const handleChangeName = async (interaction, message) => {
    // Check if antiServerName protection is enabled
    const antiServerNameEnabled = Data.get(`antiServerName_${message.guild.id}`);
    
    if (antiServerNameEnabled) {
        return await interaction.followUp('يرجى إيقاف حماية اسم السيرفر أولاً.');
    }

    await interaction.followUp('يرجى إدخال الاسم الجديد للسيرفر:');

    const filter = m => m.author.id === interaction.user.id;
    const nameCollector = interaction.channel.createMessageCollector({ filter, time: 30000 });

    nameCollector.on('collect', async (nameMessage) => {
        const newName = nameMessage.content;
        if (newName) {
            await interaction.guild.setName(newName);
            await interaction.followUp(`تم تغيير اسم السيرفر إلى **${newName}**.`);
            nameCollector.stop();
        } else {
            await interaction.followUp('الاسم غير صالح. يرجى إدخال اسم صحيح.');
        }
    });

    nameCollector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('لم تقم بإدخال اسم في الوقت المحدد.');
    });
};

// Function to change the server avatar
const handleChangeAvatar = async (interaction, message) => {
    // Check if antiServerAvatar protection is enabled
    const antiServerAvatarEnabled = Data.get(`antiServerAvatar_${message.guild.id}`);
    
    if (antiServerAvatarEnabled) {
        return await interaction.followUp('يرجى إيقاف حماية صورة السيرفر أولاً.');
    }

    await interaction.followUp('يرجى إرسال رابط الصورة الجديدة للسيرفر:');

    const filter = m => m.author.id === interaction.user.id;
    const avatarCollector = interaction.channel.createMessageCollector({ filter, time: 30000 });

    avatarCollector.on('collect', async (avatarMessage) => {
        const avatarUrl = avatarMessage.content;

        // Basic URL check (you can enhance this part)
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
            try {
                await interaction.guild.setIcon(avatarUrl);
                await interaction.followUp('تم تغيير صورة السيرفر بنجاح.');
                avatarCollector.stop();
            } catch (err) {
                await interaction.followUp('حدث خطأ أثناء تغيير صورة السيرفر. يرجى التحقق من الرابط.');
            }
        } else {
            await interaction.followUp('يرجى إدخال رابط صورة صالح.');
        }
    });

    avatarCollector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('لم تقم بإدخال رابط للصورة في الوقت المحدد.');
    });
};