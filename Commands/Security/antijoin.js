const dnb = require(`pro.db`)
const { owners, prefix } = require(`${process.cwd()}/config`);
module.exports = {
    name: `antijoin`,
    run: async (Client, message) => {
      if (!owners.includes(message.author.id)) return message.react('❌');
    const args = message.content.split(' ');
    if (args[1] === 'off') {
      await dnb.set(`antijoinEnabled_${message.guild.id}`, false);
      message.reply('تم تعطيل وضع عدم دخول حسابات الوهمية ❎');
    } else if (args[1] === 'on') {
      await dnb.set(`antijoinEnabled_${message.guild.id}`, true);
      message.reply('تم تفعيل وضع عدم دخول حسابات الوهمية  ✅');
    } else {
      await message.reply('Example: antijoin on/off');
    }
  

    }
}