const { MessageEmbed } = require("discord.js");
const db = require(`pro.db`);
const Pro = require(`pro.db`);

module.exports = {
  name: 'allbans',
  run: (client, message, args) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    message.guild.bans.fetch()
      .then(bans => {
        if (bans.size === 0) {
          return message.reply("> لا يوجد أي أشخاص محظورين.");
        }

        let list = '';
        let count = 1;
        bans.forEach(ban => {
          const user = ban.user;
          const reason = ban.reason;
          const formattedReason = reason ? ` - ${reason}` : ''; 
          list += `\`#${count}\` - <@${user.id}>${formattedReason}\n`;
          count++;
        });

        if (list.length >= 1950) list = `${list.slice(0, 1948)}`;

        const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
          .setDescription(`${list}`)

        message.reply({ embeds: [embed] });
      })
      .catch(console.error);
  }
};
