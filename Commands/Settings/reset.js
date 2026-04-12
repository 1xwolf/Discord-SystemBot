const Data = require('pro.db');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'reset',
  aliases: ['reset'],
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react(`❌`);
    const mentionedMember = message.mentions.members.first();
    let userId = message.author.id;

    if (mentionedMember) {
      userId = mentionedMember.id;
    } else {
      return message.reply("يرجى إرفاق منشن العضو أو إدخال الأيدي.");
    }
    
    await Data.set(`${userId}_voice`, 0);
    await Data.set(`${userId}_points`, 0);

    message.react("✅");
  },
};
