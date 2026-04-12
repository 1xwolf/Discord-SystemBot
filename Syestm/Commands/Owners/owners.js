let config = require("../../config.json");
const { prefix, owners } = require(`${process.cwd()}/config`);
let fs = require("fs");
const db = require("pro.db");
const Discord = require("discord.js");

module.exports = {
    name: 'owners',
    run: async (client, message, args) => {


        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;
        
        const ownerList = config.owners.length > 0
            ? config.owners
                .filter(ownerId => ownerId.trim() !== '') // Filter out empty owner IDs
                .map((ownerId, index) => ` \`#${index + 1}\` <@${ownerId}>`).join("\n")
            : "لا يوجد أونر مضاف حاليًا.";

        const embed = new Discord.MessageEmbed()
            .setColor(Color || '#f5f5ff')
            .setDescription(`${ownerList}`)
            .setFooter(client.user.username, client.user.displayAvatarURL());

        return message.reply({ embeds: [embed] });
    }
};
