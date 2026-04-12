const { Client, Collection, MessageAttachment, WebhookClient, Intents, MessageButton, MessageEmbed, MessageSelectMenu, MessageActionRow, MessageModal, Role, Modal, TextInputComponent } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
  name: "ticlog",
  description: "A simple ping command.",
  run: async (Client, Message) => {
      


    if (Message.author.bot) return;
    if (!owners.includes(Message.author.id)) return Message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    let channel = null;
    if (Message.mentions.channels.size > 0) {
      channel = Message.mentions.channels.first();
    } else {
      const channelId = Message.content.split(` `)[1];
      if (!channelId) return Message.reply({ content: `**يرجى ارفاق منشن الشات او الايدي.**` });
      
      channel = Message.guild.channels.cache.get(channelId);

      if (!channel) {
        channel = Message.guild.channels.cache.find((c) => c.name === channelId);
      }
    }

    if (!channel) return Message.reply({ content: `**الشات غير موجود.**` });

    Message.react("✅").then(() => {
      db.set(`Channel = [${Message.guild.id}]`, channel.id);
    });
  },
};
