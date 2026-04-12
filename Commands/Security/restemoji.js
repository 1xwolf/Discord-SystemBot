const fs = require("fs");
const { MessageEmbed } = require("discord.js");
const emojiFolder = `${process.cwd()}/Saved/aemoji`;
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'manageemojis',
    aliases: ["restemoji"],
    run: async (client, message, args) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const emojis = fs.readdirSync(emojiFolder);

        if (!emojis.length) {
            return message.react("❌");
        }

        const numberOfEmojis = emojis.length;
        const estimatedTimeSeconds = numberOfEmojis * 3; 
        const minutes = Math.floor(estimatedTimeSeconds / 60); 
        const seconds = estimatedTimeSeconds % 60; 
        const formattedTime = `(\`${minutes}:${seconds.toString().padStart(2, '0')}\`)`; 
        const replyss = await message.channel.send(`سيتم إضافة **${numberOfEmojis}** اموجي. سيستغرق هذا ${formattedTime} دقيقة تقريبًا`);

        for (const fileName of emojis) {
            try {
                const [name, extension] = fileName.split('.');
                const emojiFile = fs.readFileSync(`${emojiFolder}/${fileName}`);
                const emojiData = `data:image/${extension};base64,${emojiFile.toString('base64')}`;
                
                // التحقق مما إذا كان الإيموجي موجود بالفعل
                const existingEmoji = message.guild.emojis.cache.find(emoji => emoji.name === name);
                
                if (existingEmoji) {
                    console.log(`Emoji "${name}" already exists in the server.`);
                } else {
                    // إذا كان الإيموجي غير موجود، يتم إضافته
                    const createdEmoji = await message.guild.emojis.create(emojiData, name);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await replyss.edit(`\n${message.content} ${createdEmoji}`); 
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
};
