const { MessageActionRow, MessageButton } = require("discord.js");
const Pro = require('pro.db');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "addstickers",
  aliases: ["stickers"],
  run: async (client, message, args) => {
    if (!message.member.permissions.has('ADMINISTRATOR')) return message.react('❌');

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    message.reply('> **ارسل الستيكر خلال 30 ثانية**').then((fmsg) => {
      const collectorFilter = (collected) => collected.author.id === message.author.id && collected.stickers.size > 0;
      const stickerCollector = message.channel.createMessageCollector({ collectorFilter, time: 30000 });

      stickerCollector.once('collect', async (collected) => {
        const attachment = collected.stickers.first();
        fmsg.delete().catch(() => {});

        if (attachment.url.endsWith('json')) {
          collected.delete().catch(() => {});
          message.react('❌');
          return message.reply('**يمكنك ارسال ستيكر فقط**');
        }

        message.channel.send('> **يتم اضافة الستيكر**').then((msg) => {
          message.guild.stickers.create(attachment.url, attachment.name, 'hawk')
            .then(sticker => {
              message.react('✅');
              msg.edit(`> **تم اضافة الستيكر للسيرفر بأسم \`${sticker.name}\`**`);
            })
            .catch((e) => {
              collected.delete().catch(() => {});
              message.react('❌');
              msg.edit(`**وصل عدد الستيكرات في السيرفر للحد الاقصى**`);
            });
        });

        stickerCollector.stop();
      });

      stickerCollector.on('end', (collected, reason) => {
        if (reason === 'time') {
          fmsg.delete().catch(() => {});
          message.react('❌');
          message.reply('**انتهى الوقت ولم يتم ارسال اي ستيكر**');
        }
      });
    });
  },
};
