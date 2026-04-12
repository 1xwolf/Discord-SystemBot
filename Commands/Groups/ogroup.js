const { MessageEmbed } = require('discord.js');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'ogroup',
  aliases: ['ownergroup'],
  description: 'Give a user ownership of a specified group (category) and grant access to it.',
  usage: ['ogroup <userMention> <categoryId>'],
  
  run: async (client, message, args) => {
    // Check if the command issuer is the owner or has permission to manage roles
    if (!message.member.permissions.has('MANAGE_ROLES') && !owners.includes(message.author.id)) {
      return message.reply("You don't have permission to manage roles.");
    }

    // Validate provided arguments (user mention and category ID)
    const userMention = message.mentions.members.first();
    const categoryId = args[1];

    if (!userMention) {
      return message.reply("Please mention a user to make them the owner of the group.");
    }
    
    if (!categoryId) {
      return message.reply("Please provide the ID of the category you want to take ownership of.");
    }

    // Attempt to retrieve the category by its ID
    const category = message.guild.channels.cache.get(categoryId);
    if (!category || category.type !== 'GUILD_CATEGORY') {
      return message.reply(`No category found with the ID **${categoryId}**.`);
    }

    try {
      // Find the associated role
      const role = message.guild.roles.cache.find(r => r.name === category.name);
      if (!role) {
        return message.reply(`No role found associated with the category **${category.name}**.`);
      }

      // Check if the user already has the role
      if (userMention.roles.cache.has(role.id)) {
        return message.reply(`<@${userMention.id}> already has ownership of this group.`);
      }

      // Add the role to the mentioned user
      await userMention.roles.add(role);

      // Create and send a confirmation message
      const embed = new MessageEmbed()
        .setColor("GREEN")
        .setTitle(`Ownership Granted`)
        .setDescription(`The group **${category.name}** is now under your control!`)
        .addField("New Owner", `<@${userMention.id}>`, true)
        .addField("Category ID", `${categoryId}`, true)
        .setTimestamp();
      
      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error(`Failed to grant ownership: ${error.message}`);
      message.reply("There was an error trying to grant ownership of the group to the specified user. Please check my permissions and try again.");
    }
  },
};