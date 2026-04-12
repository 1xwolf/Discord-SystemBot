const { MessageEmbed } = require(`discord.js`);
const { prefix,owners } = require(`${process.cwd()}/config`);
const Data = require('pro.db');

module.exports = {
    name: 'setrcolor',
    run: async (Client, message, args) => {

        if (message.author.bot) return;
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
        
        const guildColor = Data.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';

        if (!args[0]) {
            const embed = new MessageEmbed()
                .setColor(guildColor)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}rsetcolor #8f98d3**`);
            return message.reply({ embeds: [embed] });
        }

        const color = args[0];
        // Check if the color is valid
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            const embed = new MessageEmbed()
                .setColor(guildColor)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}rsetcolor #8f98d3**`);
            return message.reply({ embeds: [embed] });
        }

        Data.set(`textColor_${message.guild.id}`, color);
        message.react(`✅`);
    }
};
