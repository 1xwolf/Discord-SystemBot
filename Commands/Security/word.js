const { Message, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const drb = require(`pro.db`);

module.exports = {
  name: "word",
  aliases: ["word"],
  description: "A simple word command.",
  run: async (client, message) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = drb.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    if (message.author.bot) return;

    const args = message.content.split(" ");
    const word = args.slice(1).join(" "); // Joined words after the command to form the word

    if (!word) {
        const embed = new MessageEmbed()
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}word كلمة**`);
      
        return message.reply({ embeds: [embed] });
    }

    let words = drb.get(`word_${message.guild.id}`) || [];
    const index = words.findIndex(w => w.word === word);

    if (index !== -1) {
        words.splice(index, 1);
        drb.set(`word_${message.guild.id}`, words);
        return message.react("☑️");
    } else {
        // If the word doesn't exist, add it
        words.push({ word, addedBy: message.author.id });
        drb.set(`word_${message.guild.id}`, words);
        return message.react("✅");
    }
  },
};
