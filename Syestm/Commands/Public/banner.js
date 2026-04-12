const { MessageAttachment, MessageActionRow, MessageButton } = require("discord.js");
const Data = require("pro.db");
const db = require("pro.db");

module.exports = {
  name: 'banner',
  aliases: ["بنر"],
  run: async (client, message, args) => {


    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = db.get(`Guild_Color = ${message.guild?.id}`) || `#f5f5ff`;
    if (!Color) return;

    let setchannek = Data.get(`setChannel_${message.guild.id}`);
    if (setchannek && message.channel.id !== setchannek) return; // Check if setChannel is defined and if the message is not in the specified channel

    let userId;
    let user;

    // Check if a user is mentioned in the message
    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    } else if (message.content.split(' ').length < 2) {
      userId = message.author.id;
    } else {
      userId = message.content.split(' ')[1];
    }

    try {
      user = await client.users.fetch(userId);
      await user.fetch();
    } catch (error) {
      return message.react(`❌`);
    }

    let banner = user.bannerURL({ dynamic: true, size: 1024 });
    if (!banner) return message.react(`❌`);

    const attachment = new MessageAttachment(banner, 'banner.png');

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('تحميل')
        .setStyle('LINK')
        .setURL(banner)
    );

    message.reply({ files: [attachment], components: [row] });
  }
};
