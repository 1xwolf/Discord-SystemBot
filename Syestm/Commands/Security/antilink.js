const d99b = require(`pro.db`)
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: `antilink`,
    run: async (Client, message) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
      
        if (!message.guild) return;
   //     if (!message.member.permissions.has('ADMINISTRATOR')) return;
        const args = message.content.split(` `)
        let onoroff =args[1]
        if (!onoroff) return message.reply(`Example: antilinks on/off`);
        if (onoroff == 'on') {
            if (d99b.get(`antilinks-${message.guild.id}`) == 'on') {
                return message.channel.send(`تم تفعيل وضع عدم ارسال الروابط ✅`);
            } else {
                d99b.set(`antilinks-${message.guild.id}`, 'on');
                message.channel.send(`تم تفعيل وضع عدم ارسال الروابط ✅`);
            }

        } else if (onoroff == 'off') {
            if (d99b.get(`antilinks-${message.guild.id}`) == 'off') {
                return message.channel.send(`تم تعطيل وضع عدم ارسال الروابط  ❎`);
            } else {
                d99b.set(`antilinks-${message.guild.id}`, 'off');
                message.channel.send(`تم تعطيل وضع عدم ارسال الروابط  ❎`);
            }
        }
    }
}