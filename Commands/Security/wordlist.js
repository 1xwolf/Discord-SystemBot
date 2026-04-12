const { MessageEmbed } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const dtb = require('pro.db');

module.exports = {
    name: "wordlist",
    aliases: ["wordlist"],
    description: "Show all words in the database.",
  
    run: async (client, message) => {
        // التأكد من أن المستخدم هو من يمتلك الصلاحية
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        const isEnabled = dtb.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const words = dtb.get(`word_${message.guild.id}`);
        if (!Array.isArray(words) || words.length === 0) {
            return message.reply({ content: "**لا توجد كلمات يعاقب كاتبها.**" });
        }

        // حصر الكلمات إلى 1000 أو أقل
        const limitedWords = words.slice(0, 1000);

        // تقسيم الكلمات إلى مجموعة من الـ Embeds
        const embeds = [];
        for (let i = 0; i < limitedWords.length; i += 25) {
            const embed = new MessageEmbed()
                .setTitle("قائمة الكلمات المحظورة")
                .setColor("#FF5733") // يمكنك تغيير اللون إذا أردت
                .setTimestamp();

            limitedWords.slice(i, i + 25).forEach((wordObject, index) => {
                const addedByUser = client.users.cache.get(wordObject.addedBy);
                const addedByTag = addedByUser?.tag || "Unknown User";

                embed.addField(
                    `#${i + index + 1} ${wordObject.word}`,
                    `By: ${addedByUser ? `<@${addedByUser.id}>` : "Unknown User"}`,
                    false // تعيين هذا الخيار إلى false لوضع المسافة بين الحقول
                );
            });

            embeds.push(embed);
        }

        // إرسال جميع الـ Embeds
        try {
            for (const embed of embeds) {
                await message.reply({ embeds: [embed] });
            }
        } catch (err) {
            console.error(err);
            return message.reply("حدث خطأ أثناء إرسال قائمة الكلمات. يرجى المحاولة لاحقًا.");
        }
    }
};