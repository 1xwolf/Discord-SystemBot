const { MessageEmbed } = require('discord.js');
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "runblock",
  description: "Remove a block from a user for a specific role.",
  usage: `${prefix} runblock @user @role`,
  run: async (client, message, args) => {
    // Check if the user is an owner
    if (!owners.includes(message.author.id)) return message.react('❌');

    // Check if the command is enabled
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    // Check if user and role are mentioned
    const userMention = message.mentions.users.first();
    const roleMention = message.mentions.roles.first();

    if (!userMention || !roleMention) {
      const embed = new MessageEmbed()
        .setColor("#ff0000")
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a user and a role to unblock.\nUsage: \`${prefix} runblock @user @role\``);
      return message.reply({ embeds: [embed] });
    }

    // Retrieve blocked users from the database
    const blockedUsers = db.get(`blocked_users_${message.guild.id}`) || {};

    // Check if the role has any blocked users
    if (!blockedUsers[roleMention.id] || !blockedUsers[roleMention.id].includes(userMention.id)) {
      const embed = new MessageEmbed()
        .setColor("#ffcc00")
        .setTitle("Not Blocked")
        .setDescription(`User ${userMention} is not blocked from the role ${roleMention}.`);
      return message.reply({ embeds: [embed] });
    }

    // Remove the user from the blocked list for the specified role
    blockedUsers[roleMention.id] = blockedUsers[roleMention.id].filter(id => id !== userMention.id);
    
    // If the array is empty, remove the role key from the blocked users database entry
    if (blockedUsers[roleMention.id].length === 0) {
      delete blockedUsers[roleMention.id];
    }

    await db.set(`blocked_users_${message.guild.id}`, blockedUsers); // Save to database

    // Check if the user already has the role and assign it if they don't
    const member = message.guild.members.cache.get(userMention.id);
    if (member && !member.roles.cache.has(roleMention.id)) {
      await member.roles.add(roleMention).catch(err => {
        console.error(`Failed to add role: ${err}`);
      });
      await member.send(`You have been unblocked and have now received the role ${roleMention.name}.`);
    }

    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Blocked User Removed")
      .setDescription(`User ${userMention} has been unblocked from obtaining the role ${roleMention}.`);
    message.channel.send({ embeds: [embed] });
  }
};