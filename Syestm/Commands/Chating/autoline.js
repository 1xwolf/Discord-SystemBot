const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

module.exports = {
  name: "autoline",
  description: "To set image URL and channel",
  usage: `${prefix}autoline <imageURL1> <#channel2> ...`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    // استخراج النص من الرسالة
    const fullText = message.content.substring(prefix.length + "autoline".length + 1);
    const fullArgs = fullText.split(/\s+/); // تقسيم النص إلى قائمة من الكلمات

    if (fullArgs.length % 2 !== 0 || fullArgs.length === 0) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .**\n${prefix}autoline <imageURL1> <#channel2> ...`);

      return message.reply({ embeds: [embed] });
    }

    const storedChannels = await db.get("Channels") || [];

    for (let i = 0; i < fullArgs.length; i += 2) {
      const imageURL = fullArgs[i];
      const channelMention = fullArgs[i + 1];
      const channelID = channelMention.replace(/[^0-9]/g, ''); // استخراج معرف القناة

      const channel = message.guild.channels.cache.get(channelID);
      if (!channel || channel.type !== 'GUILD_TEXT') {
        return message.react("❌");
      }

      const existingChannelIndex = storedChannels.findIndex(channel => channel.channelID === channelID);
      if (existingChannelIndex !== -1) {
        storedChannels[existingChannelIndex].imageURL = imageURL;
      } else {
        storedChannels.push({ channelID: channelID, imageURL: imageURL });
      }
    }

    storedChannels.forEach(channel => {
      const imageURL = channel.imageURL;
      const imageFileName = `Line_${channel.channelID}.png`; 
      const imagePath = path.join(process.cwd(), "Fonts", imageFileName);
      fetch(imageURL)
        .then(res => res.buffer())
        .then(buffer => {
          fs.writeFileSync(imagePath, buffer);
        })
        .catch(err => console.error(err));
      channel.imageURL = imagePath;
    });

    db.set("Channels", storedChannels.map(channel => ({
      channelID: channel.channelID,
      fontURL: channel.imageURL
    })));
    message.react(`✅`);
  },
};
