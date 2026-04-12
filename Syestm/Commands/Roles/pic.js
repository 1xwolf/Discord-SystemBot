
const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
module.exports = {
  name: 'image',
  aliases: ["صور","pic"],
  run: async (client, message, args) => {

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;
    if (!Color) return;

    const db = Pro.get(`Allow - Command pic = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_ROLES')) {
      return message.react(`❌`);
    }

    if (!message.guild || message.author.bot) return;
    let command = message.content.toLowerCase().split(" ")[0];
    let userID = message.content.split(' ').slice(1).join(' ');
    const user = message.mentions.members.first() || message.guild.members.cache.get(userID); // Get the member by mention or ID
    let picrole = message.guild.roles.cache.find(n => n.name === 'pic');
    if (!user) {
      const embed = new MessageEmbed()
        .setColor(`${Color || message.guild.me.displayHexColor || `#000000`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}صور <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }


    reason = `<@!${message.author.id}>`;

    if (!picrole) {
      // Create the "screen" role if it doesn't exist
      try {
        picrole = await message.guild.roles.create({
          name: 'Pic',
          reason: 'Creating role',
          permissions: ['ATTACH_FILES']
        });
      } catch (error) {
        console.error('Error creating role:', error);
        return message.react(`❌`);
      }
    }

    if (user.roles.cache.get(picrole.id)) {
      user.roles.remove(picrole, reason).then(() => {
        return message.react(`✅`);
      });
    } else {
      user.roles.add(picrole, reason).then(() => {
        return message.react(`✅`);
      });
    }
  }
};
