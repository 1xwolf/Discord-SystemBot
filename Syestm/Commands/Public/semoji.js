const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const db = require('pro.db')
module.exports = {
  name: 'semoji',
  run: (client, message, args) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;
    
  const Color = db.get(`Guild_Color = ${message.guild?.id}`) || `#f5f5ff`;
  if (!Color) return; 

    const Command = message.content.split(' ');

    const emojis = Command.slice(1);
    if (emojis.length === 0) {
      const embed = new MessageEmbed()
      .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}semoji 😘**`)
      .setColor(`${Color || `#f5f5ff`}`)
       message.reply({ embeds: [embed] });

      
    }




    const rows = [];
    for (const emoji of emojis) {
      const emojiId = emoji.slice(emoji.length - 20, emoji.length - 1);
      if (isNaN(emojiId)) {
        message.react('❌');
        continue;
      }

      const emojiURL = emoji.startsWith('<a:')
        ? `https://cdn.discordapp.com/emojis/${emojiId}.gif`
        : `https://cdn.discordapp.com/emojis/${emojiId}.png`;


      message.reply({ content: emojiURL });
    }
  }
};
