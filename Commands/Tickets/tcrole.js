const { Client, Collection, MessageAttachment, WebhookClient, Intents, MessageButton, MessageEmbed, MessageSelectMenu, MessageActionRow, MessageModal, Role, Modal, TextInputComponent } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
  name: "tcrole",
  description: "A simple ping command.",
  run: async (Client, Message) => {
    if (Message.author.bot) return;


    if (!owners.includes(Message.author.id)) return Message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    
    let role = null;
    if (Message.mentions.roles.size > 0) {
      role = Message.mentions.roles.first();
    } else {
      const roleId = Message.content.split(` `)[1];
      if (!roleId) return Message.reply({ content: `**يرجى ارفاق منشن الرول أو الايدي.**` });
       role = Message.guild.roles.cache.get(roleId);
      if (!role) {
        role = Message.guild.roles.cache.find((r) => r.name === roleId);
      }
    }

    if (!role) return Message.reply({ content: `**الرول غير موجود.**` });

    Message.react("✅").then(() => {
      db.set(`Role = [${Message.guild.id}]`, role.id);
    });
  },
};
