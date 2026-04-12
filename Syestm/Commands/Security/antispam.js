const Pro = require(`pro.db`);
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: `antispam`,
  run: async (Client, message) => {
    
    if (!owners.includes(message.author.id)) return message.react('❌');

    const args = message.content.split(' ');
    const command = args[1];

    if (command === 'on') {
      await Pro.set(`spamProtectionEnabled_${message.guild.id}`, true);
      await message.reply('تم تفعيل وضع عدم الاسبام ✅');
    } else if (command === 'off') {
      await Pro.set(`spamProtectionEnabled_${message.guild.id}`, false);
      await message.reply('تم تعطيل وضع عدم الاسبام ❎');
    } else {
      await message.reply('Example: antispam on/off');
    }
  }
};
