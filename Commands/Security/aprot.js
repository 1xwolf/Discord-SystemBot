const dbq = require("pro.db");
const { MessageEmbed } = require('discord.js')
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'aprot',
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react('❌');
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('يرجى ذكر عضو صالح.');

    let bypassedMembers = await dbq.get(`bypassedMembers_${message.guild.id}`) || [];
    if (!bypassedMembers.includes(member.id)) {
      bypassedMembers.push(member.id);
      await dbq.set(`bypassedMembers_${message.guild.id}`, bypassedMembers);
      message.reply(`${member.user.tag} تمت إضافته إلى القائمة التي تم تجاوزها.`);
    } else {
      message.reply(`${member.user.tag} موجود بالفعل في القائمة.`);
    }
  }
}
