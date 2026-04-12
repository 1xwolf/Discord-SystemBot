const { Client, Collection, MessageAttachment, WebhookClient, Intents, MessageButton, MessageEmbed, MessageSelectMenu, MessageActionRow, MessageModal, Role, Modal, TextInputComponent } = require("discord.js");
const {owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`)

module.exports = {
    name: "tcopen",
    description: "A simple ping command.",
    run: async (Client, Message) => {

      if (!owners.includes(Message.author.id)) return Message.react('❌');
      const isEnabled = db.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
          return; 
      }
      
        if (Message.author.bot) return;
        if(!owners.includes(Message.author.id)) return Message.react('❌');
        if (!Message.guild) return;
        const Cat = Message.content.split(` `)[1];
        if (!Cat) return Message.reply({ content: `**يرجى ارفاق ايدي الكاتيغوري .**` })
        Message.react("✅").then(() => {
          db.set(`Cat = [${Message.guild.id}]`, Cat)
        })
    }
}