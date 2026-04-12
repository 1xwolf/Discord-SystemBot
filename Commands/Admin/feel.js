
const { MessageSelectMenu, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Data = require('pro.db');

let messageListener; // To hold the message listener reference


module.exports = {
    name: "feel",
    description: "VIP commands",
    run: async (client, message, args) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) return message.react('❌');

        
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        // Select Menu
        const selectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('vipMenu')
                    .setPlaceholder('اختر إحدى الخيارات')
                    .addOptions([
                        {
                            label: 'تحديد الشات الفضفه',
                            value: 'set_chat',
                        },
                        {
                            label: 'تغيير لون الامبيد',
                            value: 'change_color',
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

        await message.reply({ content: "**قائمة تعديل feeling  ⚙️**", components: [selectMenu, cancelRow] });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate(); // Acknowledge the interaction without sending a response
            const choice = interaction.values[0];
            
            switch (choice) {
                case "set_chat":
                    await handleSetChat(interaction, message, client);
                    break;
                case "change_color":
                    await handleChangeColor(interaction);
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

// Function to handle setting the chat for "فضفضه"
const handleSetChat = async (interaction, message, client) => {
    await interaction.followUp('يرجى ذكر القناة لتحديدها كقناة فضفضه (استخدم @).');

    const filter = m => m.author.id === message.author.id; // Filter to collect messages from the command user
    const channelCollector = message.channel.createMessageCollector({ filter, time: 30000 }); // 30 seconds to respond

    channelCollector.on('collect', async (msg) => {
        const channelMention = msg.mentions.channels.first();
        if (channelMention) {
            Data.set(`selected_channel_${message.guild.id}`, channelMention.id);
            await interaction.followUp(`تم تحديد الشات ${channelMention} كقناة فضفضه.`);
            
            // Stop any existing listener and set up a new one
            if (messageListener) {
                client.off('messageCreate', messageListener);
            }

            messageListener = async (msg) => {
                // Check if the message is in the specified channel and is not from the bot itself
                if (msg.channel.id === channelMention.id && !msg.author.bot) {
                    const embedColor = Data.get(`embed_color_${msg.guild.id}`) || '#0099ff'; // Use color from the database
                    const messageEmbed = new MessageEmbed()
                        .setColor(embedColor) 
                        .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL({ dynamic: true, size: 512 }) })
                        .setDescription(msg.content)
                        .setTimestamp()
                        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true, size: 128 }));

                    await msg.channel.send({ embeds: [messageEmbed] });

                    // Delete the original message from the user
                    try {
                        await msg.delete();
                        console.log('Deleted user message:', msg.content);
                    } catch (err) {
                        console.error('Error deleting message:', err);
                    }
                }
            };

            client.on('messageCreate', messageListener); // Attach the new listener
            await loadPreviousMessages(channelMention); // Load previous messages
            channelCollector.stop(); // Stop the collector after receiving a valid channel mention
        } else {
            await interaction.followUp('يرجى ذكر قناة صحيحة باستخدام @.'); // Prompt to mention a valid channel
        }
        await msg.delete(); // Optionally delete the user's message
    });

    channelCollector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('لم يتم إدخال أي قناة في الوقت المحدد.');
    });
};

// Function to change the embed color
const handleChangeColor = async (interaction) => {
    await interaction.followUp('يرجى إدخال كود لون HEX (مثل #ff5733):');

    const filter = m => m.author.id === interaction.user.id;
    const colorCollector = interaction.channel.createMessageCollector({ filter, time: 30000 });

    colorCollector.on('collect', async (colorMessage) => {
        const color = colorMessage.content;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            Data.set(`embed_color_${interaction.guild.id}`, color);
            await interaction.followUp('تم تغيير اللون بنجاح.');
            colorCollector.stop();
        } else {
            await interaction.followUp('لون غير صالح. يرجى تقديم كود لون صحيح.');
        }
    });

    colorCollector.on('end', collected => {
        if (collected.size === 0) interaction.followUp('لم تقم بإدخال لون في الوقت المحدد.');
    });
};
