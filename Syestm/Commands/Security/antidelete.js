const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'antidelete',
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react('❌');

    const args = message.content.split(' ');
    const command = args[1];

    if (command === 'on') {
      db.set(`antiDelete-${message.guild.id}`, true);
      message.channel.send('تم تفعيل وضع مانع المسح رومات - رولات ✅');
    } else if (command === 'off') {
      db.set(`antiDelete-${message.guild.id}`, false);
      message.channel.send('تم تعطيل وضع مانع المسح رومات - رولات  ❎');
    } else {
      message.reply('Example: Antidelete on/off');
    }
  }
}
