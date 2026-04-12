const { Client, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const { Canvas, loadImage } = require('canvas-constructor/napi-rs');
const db = require('pro.db');
const fetch = require('node-fetch'); // Ensure you require node-fetch to use fetch
const fs = require('fs');
const path = require('path');
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "rate",
  aliases: ["تقييم"],
  description: "Rate a user with background",
  usage: [`${prefix}rate @user`],

  run: async function (client, message, args) {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = '#2C2F33';
    const roleId = db.get(`Allow - Command rate = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== roleId && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.react('❌');
    }

    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      return message.reply('Please mention a user to rate!');
    }

    if (mentionedUser.bot) {
      return message.reply('Cannot rate bots!');
    }

    try {
      const button = new MessageButton()
        .setCustomId(`rate_${mentionedUser.id}`)
        .setLabel('تقييم')
        .setStyle('PRIMARY');

      const row = new MessageActionRow().addComponents(button);

      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('تقييم العميل')
        .setDescription(`اضغط على الزر للتقيم ${mentionedUser}`)
        .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true, format: 'png' }));

      const ratingMessage = await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      const filter = i => i.customId === `rate_${mentionedUser.id}`;
      const collector = ratingMessage.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async interaction => {
        await interaction.reply({
          content: 'اكتب تقييمك خلال 60 ثانية:',
          ephemeral: true
        });

        const messageFilter = m => m.author.id === interaction.user.id;
        const feedbackCollector = message.channel.createMessageCollector({
          filter: messageFilter,
          max: 1,
          time: 60000
        });

        feedbackCollector.on('collect', async m => {
          const feedbackChannelId = db.get(`feedback_channel_${message.guild.id}`);
          const feedbackChannel = message.guild.channels.cache.get(feedbackChannelId);

          if (!feedbackChannel) {
            return interaction.followUp({
              content: 'Feedback channel not found.',
              ephemeral: true
            });
          }

          try {
            const canvas = new Canvas(914, 316)
              .printImage(await loadImage(`${process.cwd()}/Fonts/rating.png`), 0, 0, 914, 316)
              .setColor('rgba(47, 49, 54, 0.85)')
              .printRoundedRectangle(20, 20, 650, 276, 25)
              .setColor('rgba(47, 49, 54, 0.75)')
              .printRoundedRectangle(690, 20, 204, 276, 25)
              .setTextAlign('right')
              .setColor('#FFFFFF')
              .setTextFont('bold 20px Cairo')
              .printText('تقييم العميل :', 600, 50)
              .setTextFont('bold 40px Cairo')
              .printText(m.content, 550, 150)
              .setColor('#FFFFFF')
              .beginPath()
              .arc(792, 140, 42, 0, Math.PI * 2) // Outer white border
              .closePath()
              .fill()
              .setColor('rgba(47, 49, 54, 0.75)')
              .beginPath()
              .arc(792, 140, 40, 0, Math.PI * 2) // Inner dark border
              .closePath()
              .fill()
              .printCircularImage(
                await loadImage(mentionedUser.displayAvatarURL({ format: 'png' })),
                792,
                140,
                80,
                80
              )
              .setTextAlign('center')
              .setColor('#FFFFFF')
              .setTextFont('bold 24px Cairo')
              .printText(mentionedUser.username, 792, 250)
              .toBuffer();

            const attachment = new MessageAttachment(canvas, 'rating.png');

            await feedbackChannel.send({
              content: `<@${mentionedUser.id}>`,
              files: [attachment]
            });

            // Load the line image and send it
            const lineAttachment = new MessageAttachment(`${process.cwd()}/Fonts/line.png`, 'line.png');
            await feedbackChannel.send({
              files: [lineAttachment]
            });

            await interaction.followUp({
              content: 'تم التقييم بنجاح!',
              ephemeral: true
            });

            await ratingMessage.delete().catch(() => {});
          } catch (err) {
            console.error('Error creating image:', err);
            await interaction.followUp({
              content: 'Error creating rating image. Please try again.',
              ephemeral: true
            });
          }
        });

        feedbackCollector.on('end', collected => {
          if (collected.size === 0) {
            interaction.followUp({
              content: 'Time expired. Please try again.',
              ephemeral: true
            });
          }
        });
      });

    } catch (err) {
      console.error('Error processing command:', err);
      message.reply('An error occurred. Please try again.');
    }
  }
};