const { MessageEmbed } = require('discord.js');
const db = require('pro.db');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'tcrestart',
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const guildId = message.guild.id;

    if (db.get(`Channel = [${guildId}]`)) db.delete(`Channel = [${guildId}]`);
    if (db.get(`Role = [${guildId}]`)) db.delete(`Role = [${guildId}]`);
    if (db.get(`Image = [${guildId}]`)) db.delete(`Image = [${guildId}]`);
    if (db.get(`Cat = [${guildId}]`)) db.delete(`Cat = [${guildId}]`);
    if (db.get(`menuOptions_${guildId}`)) db.delete(`menuOptions_${guildId}`);
    const memberKey = `member${message.author.id}`;
    const channelKey = `channel${message.author.id}_${message.channel.id}`;

    if (db.get(memberKey)) db.delete(memberKey);
    if (db.get(channelKey)) db.delete(channelKey);


    message.react("✅");
  },
};
