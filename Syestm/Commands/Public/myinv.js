const Discord = require("discord.js")
const db = require(`pro.db`)
const { MessageEmbed } = require("discord.js");
const { inviteTracker } = require("discord-inviter");

module.exports = {
  name: "myinv",
  aliases: ["دعواتي","invites"],
  run: async (client, message, args, config) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setchannek = db.get(`setChannel_${message.guild.id}`);
    if (setchannek && message.channel.id !== setchannek) return;



    let user = message.mentions.members.first() || message.guild.members.cache.get(message.content.split(' ')[1]) || message.member;

    var invite = await inviteTracker.getMemberInvites(user);

   message.reply(`**${user} : ${invite.count}**`)
  }
}
