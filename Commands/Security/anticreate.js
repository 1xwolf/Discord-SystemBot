const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'anticreate',
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react('❌');

    const args = message.content.split(' ');
    const command = args[1];

    if (command === 'on') {
      db.set(`anticreate-${message.guild.id}`, true);
      message.channel.send('تم تفعيل وضع عدم انشاء رومات - رولات ✅');
    } else if (command === 'off') {
      db.set(`anticreate-${message.guild.id}`, false);
      message.channel.send('تم تعطيل وضع عدم انشاء رومات - رولات  ❎');
    } else {
      message.reply('Example: Antidelete on/off');
    }
  }
}
