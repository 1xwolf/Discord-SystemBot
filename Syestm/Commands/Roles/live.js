const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require(`pro.db`);

module.exports = {
  name: 'live',
  aliases: ["لايف"],
  run: async (client, message, args) => {
    try {


    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

      const db = Pro.get(`Allow - Command pic = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(db);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_ROLES')) {
        return;
      }

      if (!message.guild || message.author.bot) return;
      let command = message.content.toLowerCase().split(" ")[0];
      let userID = message.content.split(' ').slice(1).join(' ');
      const user = message.mentions.members.first() || message.guild.members.cache.get(userID); // Get the member by mention or ID
      let picrole = message.guild.roles.cache.find(n => n.name === 'Live');
      if (!user) {
        const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}لايف <@${message.author.id}>**`);
        return message.reply({ embeds: [embed] });
      }

      reason = `<@!${message.author.id}>`;

      const picRoleId = Pro.get(`Live = ${message.guild.id}`);
      if (!picRoleId) {
        // Create the "Live" role if it doesn't exist
        try {
          picrole = await message.guild.roles.create({
            name: 'Live',
            reason: 'Creating role',
            permissions: ['STREAM']
          });
          Pro.set(`Live = ${message.guild.id}`, picrole.id); // Store the role ID in the database
        } catch (error) {
          console.error('Error creating role:', error);
          return message.react(`❌`);
        }
      } else {
        picrole = message.guild.roles.cache.get(picRoleId); // Retrieve the role ID from the database
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
    } catch (error) {
      console.error(error);
    }
  }
};
