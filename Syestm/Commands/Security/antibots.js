const d2b = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);
module.exports = {
    name: `antibots`,
    run: async (Client, message) => {
        if (!owners.includes(message.author.id)) return message.react('❌');

        if (!message.guild) return;
        const args = message.content.split(` `)
        let onoroff = args[1]
        if (!onoroff) return message.reply(`Example: antibots on/off`)
        if (onoroff == 'on') {
            if (d2b.get(`antibots-${message.guild.id}`) == 'on') {
                return message.channel.send(`تم تفعيل وضع عدم دخول اي بوتات ✅`);
            } else {
                d2b.set(`antibots-${message.guild.id}`, 'on');
                message.channel.send(`تم تفعيل وضع عدم دخول اي بوتات ✅`);
            }
        } else if (onoroff == 'off') {
            if (d2b.get(`antibots-${message.guild.id}`) == 'off') {
                return message.channel.send(`تم تعطيل وضع عدم دخول اي بوتات  ❎`);
            } else {
                d2b.set(`antibots-${message.guild.id}`, 'off');
                message.channel.send(`تم تعطيل وضع عدم دخول اي بوتات  ❎`);
            }

        }
    }
}