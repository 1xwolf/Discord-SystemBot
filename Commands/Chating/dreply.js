const { MessageEmbed, MessageActionRow, MessageButton, Message, Client } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);

const db = require(`pro.db`)
module.exports = {
    name: "dreply",
    aliases: ["dreply"],
    description: "A simple ping command.",
    category: "Informations",
    example: ["2"],
    /**
     * 
     * @param {Client} client 
     * @param {Message} message 
     */

    
    run: async (Client, Message) => {


        if (!owners.includes(Message.author.id)) return Message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Args = Message.content.split(` `).slice(1).join(' ')
        if (!db.get(`Replys_${Args}`)) return await Message.reply({ content: `**ارسل الرد المُراد حذفه **` });
        db.delete(`Replys_${Args}`);
        Message.react(`✅`)
    }
}
