let config = require("../../config.json");
const { prefix, owners } = require(`${process.cwd()}/config`);
let fs = require("fs");
const db = require("pro.db");
const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
    name: 'setowner', // Command name
    run: async (client, message, args) => {


        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;
        
        if (!owners.includes(message.author.id)) return;


        if (!args[0] || isNaN(args[0])) {
            // Check if there are mentions in the message
            const mentions = message.mentions.users;
            
            if (mentions.size > 0) {
                mentions.forEach(user => {
                    const mentionedOwnerId = user.id;
                    if (!config.owners.includes(mentionedOwnerId)) {
                        config.owners.push(mentionedOwnerId);
                    }
                });

                fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                    if (err) console.log(err);
                });

                return message.react("☑️");
            }

            const embed = new MessageEmbed()
            .setColor(`${Color || `#f5f5ff`}`)
            .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة \n${prefix}setowner <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        const id = args[0];

        if (config.owners.includes(id)) {
            return message.reply("`** موجود من قبل .. **`");
        }

        config.owners.push(id);

        fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
            if (err) console.log(err);
        });

        message.react("✅");
    }
};
