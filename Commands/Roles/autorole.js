const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
    name: 'autorole',
    run: (client, message) => {

        if (!owners.includes(message.author.id)) return message.react('❌');

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        if (message.author.bot || !message.guild) return message.react("❌");

        // استخراج الرول المحدد
        let role;
        if (message.mentions.roles.size > 0) {
            role = message.mentions.roles.first();
        } else {
            const roleId = message.content.split(' ').find(arg => /^[0-9]+$/.test(arg));
            role = message.guild.roles.cache.get(roleId);
        }

        if (!role) {
            const embed = new MessageEmbed()
            .setColor(`${Color || `#f5f5ff`}`)
            .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}autorole @Members**`);
            return message.reply({ embeds: [embed] });

        }



        // حفظ الرول في قاعدة البيانات
        db.set(`autorole_${message.guild.id}`, role.id);
        
        message.react("✅");
    }
};
