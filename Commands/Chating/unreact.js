const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const dwb = require(`pro.db`);
module.exports = {
    name: "unreact",
    aliases: ["unreact"],
    description: "A simple react command.",
    run: async (client, message) => {

        const Color = dwb.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = dwb.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        try {
            const args = message.content.split(" ");
            let Channel = args[1];

            if (!Channel) {
                // إذا لم يتم تحديد القناة
                const missingChannelEmbed = new MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}unreact <#${message.channel.id}>**`);
                return message.reply({ embeds: [missingChannelEmbed] });
            }

            // التحقق إذا كانت القيمة هي Mention
            if (Channel.startsWith('<#') && Channel.endsWith('>')) {
                Channel = Channel.slice(2, -1);
                // تحويل Mention إلى ID
                Channel = message.guild.channels.cache.get(Channel).id;
            }

            const data = {
                Channel_Id: Channel
            };
            dwb.delete(`RoomInfo_${Channel}`, data);

            message.react('✅');
        } catch (error) {
            console.error(error);
            // يفضل إضافة رد فعل للتنبيه عند وجود خطأ
            message.react('❌');
        }
    }
};
