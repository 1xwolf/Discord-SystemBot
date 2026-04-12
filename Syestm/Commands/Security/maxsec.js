const dbq = require("pro.db");
const { MessageEmbed } = require('discord.js')
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'maxsec',
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react('❌');
    const guildId = message.guild.id;
    const currentProtectionState = await dbq.get(`protectionEnabled_${guildId}`) || false;
    
    if (currentProtectionState) {
        await dbq.set(`protectionEnabled_${guildId}`, false);
        message.channel.send('تم إيقاف الحماية.');
    } else {
        await dbq.set(`protectionEnabled_${guildId}`, true);
        message.channel.send('تم تفعيل الحماية.');
    }
  }
}
