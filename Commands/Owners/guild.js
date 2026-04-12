const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
let config = require("../../config.json");
const Data = require("pro.db")
const { prefix, owners } = require(`${process.cwd()}/config`);
let fs = require("fs");
module.exports = {
    name: 'guild',
    run: async (client, message, args) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        if (!args[0] || !/^\d{17,19}$/.test(args[0])) {
            const embed = new MessageEmbed()
                .setColor(`${Color || message.guild.me.displayHexColor || `#f5f5ff`}`)
                .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة.\n${prefix}guild أيدي السيرفر**`);
            return message.reply({ embeds: [embed] });
        }

        const newGuildId = args[0];



        const button = new MessageButton()
            .setStyle('LINK')
            .setLabel('إضافة')
            .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`);

        const row = new MessageActionRow()
            .addComponents(button);

        message.author.send({content: "**أضغط علي الزر ل إضافة البوت**",  components: [row] })
            .then(() => {
                // بعد إرسال الرسالة الخاصة، نقوم بالخروج من السيرفرات بعد 3 ثوانٍ
                setTimeout(() => {
                    client.guilds.cache.forEach(guild => {
                        guild.leave()
                            .then(() => console.log(`Left ${guild.name}`))
                            .catch(console.error);
                    });

                    config.Guild = newGuildId;

                    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                        if (err) console.log(err);
                    });
                }, 3000); // بعد 3 ثوانٍ
            })
            .catch(console.error);

        message.react('✅')
            .catch(console.error);
    }
};
