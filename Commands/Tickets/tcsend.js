const Data = require("pro.db");
const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'tcsend',
  aliases: ["tcsend"],
  run: async (client, message, args) => {

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#4e464f';
    if (!Color) return;
    
    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const tcsend = args.join(' ');
    if (!tcsend) {
      const embed = new MessageEmbed()
      .setColor(`${Color || `#4e464f`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}tcsend مساء الخير، اهلًا بك في تذكرتك.**`);
      return message.reply({ embeds: [embed] });
    }

    Data.set(`tcsend_${message.guild.id}`, tcsend);
    message.react("✅");
  }
};
