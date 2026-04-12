const { MessageSelectMenu, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const config = require(`${process.cwd()}/config`);
const Data = require('pro.db');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fetch = require('node-fetch'); // Make sure to install this if you haven't

module.exports = {
    name: "vip",
    description: "VIP commands",
    run: async (client, message, args) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
        
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
                  label: 'تغير الاسم',
                  emoji: '✏️',
                  description: 'لتغير إسم البوت',
                  value: 'setname',
                },
                {
                  label: 'تغيير صورة',
                  emoji: '🌠',
                  description: 'لتغير صورة البوت',
                  value: 'setavatar',
                },
                {
                  label: 'تغير الحالة',
                  description: 'لتغير حالة البوت',
                  emoji: '🚥',
                  value: 'setstatus',
                },
                {
                  label: 'تغير اللون',
                  emoji: '🎨',
                  description: 'لتغير لون البوت',
                  value: 'setcolor',
                },
                {
                  label: 'تغيير البانر', // New option for setting banner
                  emoji: '🏞️',
                  description: 'لتغير بانر البوت',
                  value: 'setbanner',
                },
                {
                  label: 'إعادة تشغيل البوت', // New option for restarting the bot
                  emoji: '🔄',
                  description: 'لإعادة تشغيل البوت',
                  value: 'restart',
                }
              ])
          );

        // Cancel Button
        const deleteButton = new MessageButton()
          .setCustomId('Cancel')
          .setLabel('إلغاء')
          .setStyle('DANGER');

        const cancelRow = new MessageActionRow()
          .addComponents(deleteButton);

        message.reply({ content: "**قائمة تعديل البوت ⚙️**", components: [selectMenu, cancelRow] });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
          await interaction.deferUpdate(); // Acknowledge the interaction without sending a response
          const choice = interaction.values[0];
          
          switch (choice) {
            case "setavatar":
              await handleSetAvatar(interaction, message, client);
              break;
            case "setname":
              await handleSetName(interaction, message, client);
              break;
            case "setstatus":
              await handleSetStatus(interaction, message, client);
              break;
            case "setcolor":
              await handleSetColor(interaction, message);
              break;
            case "setbanner":
              await handleSetBanner(interaction, message, client);
              break;
            case "restart":
              await handleRestart(interaction, message, client);
              break; // Handle restart case
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

// Function to handle setting the bot's avatar
const handleSetAvatar = async (interaction, message, client) => {
  await interaction.message.delete();
  const replyMessage = await message.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");
  
  const messageCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
  });

  messageCollector.on("collect", async (msg) => {
    if (msg.attachments.size > 0) {
      const avatarURL = msg.attachments.first().url;
      await client.user.setAvatar(avatarURL);
      await replyMessage.edit("**تم تغير صورة البوت ** ✅");
    } else if (msg.content.startsWith("http")) {
      await client.user.setAvatar(msg.content);
      await replyMessage.edit("**تم تغير صورة البوت ** ✅");
    } else {
      await replyMessage.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");
    }
    await msg.delete();
  });
};

// Function to handle setting the bot's name
const handleSetName = async (interaction, message, client) => {
  await interaction.message.delete();
  const setNameReply = await message.reply("**يرجى إدخال أسم البوت الجديد ** ⚙️");
  
  const nameCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
  });

  nameCollector.on("collect", async (msg) => {
    await client.user.setUsername(msg.content);
    await setNameReply.edit("**تم تغير إسم البوت ✅**");
    await msg.delete();
  });
};

// Function to handle setting the bot's status
const handleSetStatus = async (interaction, message, client) => {
  await interaction.message.delete();
  await message.reply("**يرجى كتابة الحالة الجديدة للبوت **");

  const statusCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
  });

  statusCollector.on("collect", async (msg) => {
    const newStatus = msg.content.toLowerCase();
    const statusTypeReply = await message.channel.send(`**يرجى اختيار نوع الحالة لـ "${newStatus}":**`);
    
    const statusRow = new MessageActionRow()
      .addComponents([
        new MessageButton().setCustomId("watching").setLabel('📺 Watching').setStyle('SECONDARY'),
        new MessageButton().setCustomId("listening").setLabel('🎧 Listening').setStyle('SECONDARY'),
        new MessageButton().setCustomId("streaming").setLabel('🎥 Streaming').setStyle('SECONDARY'),
        new MessageButton().setCustomId("playing").setLabel('🎮 Playing').setStyle('SECONDARY'),
      ]);
    
    await statusTypeReply.edit({ content: statusTypeReply.content, components: [statusRow] });

    const filter = (buttonInteraction) => buttonInteraction.user.id === msg.author.id;
    const statusCollector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    // Listen for selected status button
    statusCollector.on("collect", async (buttonInteraction) => {
      let activityType;
      switch (buttonInteraction.customId) {
        case "watching":
          activityType = "WATCHING";
          break;
        case "listening":
          activityType = "LISTENING";
          break;
        case "streaming":
          activityType = "STREAMING";
          break;
        case "playing":
          activityType = "PLAYING";
          break;
      }
      client.user.setActivity(newStatus, { type: activityType });
      await buttonInteraction.update({ content: `**تم تغيير حالة البوت إلى "${newStatus}" مع نوع ${activityType} ** ✅`, components: [] });
      statusCollector.stop();
    });
  });
};

// Function to handle setting the bot's banner
const handleSetBanner = async (interaction, message, client) => {
    await interaction.message.delete();
    const replyMessage = await message.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");

    const messageCollector = message.channel.createMessageCollector({
        filter: (msg) => msg.author.id === message.author.id,
        max: 1,
    });

    messageCollector.on("collect", async (msg) => {
        if (msg.attachments.size > 0) {
            const bannerAttachment = msg.attachments.first();
            // Validate the image formats (accepting PNG, GIF, and JPEG)
            const validImageTypes = ["image/png", "image/gif", "image/jpeg"];
            if (!validImageTypes.includes(bannerAttachment.contentType)) {
                await replyMessage.edit("**يرجى إرسال صورة بصيغة PNG، GIF أو JPEG.**");
                return;
            }

            try {
                // Fetch the image buffer
                const response = await fetch(bannerAttachment.url);
                const buffer = await response.buffer();

                // Prepare to make an API call to update the user's banner
                const rest = new REST({ version: '9' }).setToken(client.token);

                // Make the REST API call to update the banner
                await rest.patch(Routes.user(), {
                    body: {
                        banner: `data:${bannerAttachment.contentType};base64,${buffer.toString('base64')}`
                    }
                });

                await replyMessage.edit("**تم تغير بانر البوت ** ✅");
            } catch (error) {
                console.error(error);
                await replyMessage.edit(`**حدث خطأ أثناء تحديث البانر: \`${error.message}\`**`);
            }
        } else if (msg.content.startsWith("http")) {
            await replyMessage.edit("**يرجى إرفاق الصورة في شكل مرفق، يمكن استخدام الوظيفة القادمة لتحميلها من رابط.**");
        } else {
            await replyMessage.reply("**يرجى إرفاق صورة أو رابط صحيح. ** ⚙️");
        }
        await msg.delete();
    });
};

// Function to handle setting the bot's color
const handleSetColor = async (interaction, message) => {
    await interaction.message.delete(); // Delete the previous interaction message
    const setColorReply = await message.reply("**يرجى إرسال كود اللون بصيغة Hex (مثل #FF5733)** ⚙️");

    const colorCollector = message.channel.createMessageCollector({
        filter: (msg) => msg.author.id === interaction.user.id,
        max: 1,
        time: 30000, // Optional: add a time limit of 30 seconds
    });

    colorCollector.on("collect", async (msg) => {
        const color = msg.content.trim();

        // Validate the hex color code
        const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
        if (!hexColorRegex.test(color)) {
            await setColorReply.edit("**كود اللون غير صالح، يرجى إدخال كود HEX صحيح.** ⚠️");
            await msg.delete(); // Delete the user's message
            return;
        }

        // Save the new color
        await Data.set(`bot_color_${interaction.user.id}`, color);

        await setColorReply.edit(`**تم تغيير لون البوت إلى ${color} ✅**`);

        // Create a new embed with the specified color
        const embed = new MessageEmbed()
            .setColor(color)
            .setTitle("تم تغير لون البوت!")
            .setDescription(`لون البوت الحالي هو: ${color}`);

        // Send the new embed message to a specific channel (e.g., the current message channel)
        await message.channel.send({ embeds: [embed] });

        await msg.delete(); // Delete the user's message after processing
    });

    colorCollector.on("end", (collected, reason) => {
        if (reason === "time") {
            setColorReply.edit("**انتهى الوقت، لم يتم تغيير لون البوت.** ⏳");
        }
    });
};

// Function to handle restarting the bot
const handleRestart = async (interaction, message, client) => {
    await interaction.reply('أعيد تشغيل البوت...').catch(console.error);
  
    try {
        await client.destroy();
        await client.login(config.token); // Ensure you're using the correct reference to the token
        await interaction.followUp("تم إعادة تشغيل البوت بنجاح! ✅");
    } catch (error) {
        await interaction.followUp(`حدث خطأ أثناء إعادة تشغيل البوت: ${error.message} ❌`);
    }
};