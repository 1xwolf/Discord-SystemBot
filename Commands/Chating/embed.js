const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');

module.exports = {
    name: 'embed',
    aliases: ['embedmsg', 'makeembed'],  // يمكنك إضافة أي أسماء مستعارة هنا
    run: async (client, message, args) => {
        // Check if the user has permissions to send messages
        if (!message.guild || !message.guild.me.permissions.has('SEND_MESSAGES')) {
            return message.reply("ليس لدي أذونات لإرسال الرسائل في هذه القناة.");
        }

        // Check if the user has permissions to use this command
        if (!message.member.permissions.has('MANAGE_MESSAGES')) { // يمكنك تعديل الأذونات حسب الحاجة
            return message.reply("ليس لديك الأذونات اللازمة لاستخدام هذا الأمر.");
        }

        // Check if any text was provided
        if (!args.length) {
            return message.reply(`يرجى إدخال النص الذي تريد تحويله إلى Embed. يُستخدم الأمر كالتالي: ${prefix}embed <النص>`);
        }

        // Combine args into a single string for the embed description
        const embedContent = args.join(' ');

        // Get the embed color from the database or use the default color
        const Color = Pro.get(`Guild_Color_${message.guild.id}`) || message.guild.me.displayHexColor || '#000000';

        // Create a new embed
        const embed = new MessageEmbed()
            .setColor(Color)
            .setDescription(embedContent)
            .setTimestamp()
            .setFooter(`Server: ${message.guild.name}`, message.guild.iconURL()); // Optional footer

        // Set the guild icon to appear on the right
        embed.setAuthor({
            name: message.guild.name,
            iconURL: message.guild.iconURL(),
        });

        // Send the embed to the channel
        try {
            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            return message.reply("حدث خطأ أثناء إرسال الـ Embed. يرجى المحاولة لاحقًا.");
        }
    }
};