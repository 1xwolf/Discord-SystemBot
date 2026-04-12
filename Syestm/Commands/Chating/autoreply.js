const { MessageActionRow, MessageButton, Client } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "autoreply",
  aliases: ["إضافة"],
  description: "A simple ping command.",
  category: "Informations",
  example: ["1"],
  run: async (Client, Message) => {
    if (!owners.includes(Message.author.id)) return Message.react('❌');

    const Bu = new MessageActionRow().addComponents(
      new MessageButton().setCustomId("Auto_Reply").setStyle("SECONDARY").setLabel("أضغط لإضفه ردًا ")
    );
    await Message.reply({ components: [Bu] });
  },
};
