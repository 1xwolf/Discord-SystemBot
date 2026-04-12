const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: 'setbanlimit',
  aliases: ['setban'],
  description: 'Set the limit of bans a user can issue in a day.',
  usage: [`${prefix}setbanlimit <number>`],
  run: async (client, message, args) => {
    const Color = Pro.get(`Guild_Color_${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;

    // Check if the user is one of the owners
    if (!owners.includes(message.author.id)) {
      return message.reply("**You do not have permission to set the ban limit.**");
    }

    const limit = parseInt(args[0]);
    if (isNaN(limit) || limit <= 0) {
      return message.reply("**Please provide a valid number greater than 0.**");
    }

    // Save the limit to the database
    Pro.set(`ban_limit_${message.guild.id}`, limit);
    message.reply(`**The ban limit has been set to ${limit}.**`);
  }
};