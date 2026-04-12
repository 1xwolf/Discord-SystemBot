const { MessageEmbed } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "rerole",
  description: "Remove a member from a specific group.",
  usage: ["rerole <userMention> <groupName>"],

  run: async (client, message, args) => {
    const userMention = message.mentions.members.first();
    const groupName = args[1];

    if (!userMention || !groupName) {
      return message.reply("Please mention a user and provide the group name.");
    }

    try {
      // Retrieve group info from the database using group name
      const groupInfo = await Data.get(`group_${groupName}_${message.guild.id}`);
      if (!groupInfo) {
        return message.reply("Group does not exist.");
      }

      // Retrieve group role based on the stored role name
      const groupRole = message.guild.roles.cache.find(role => role.name === groupInfo.groupRoleName);
      if (!groupRole) {
        return message.reply("Group role no longer exists.");
      }

      // Check if the user is in the specified group role
      if (!userMention.roles.cache.has(groupRole.id)) {
        return message.reply(`Member <@${userMention.id}> is not in this group.`);
      }

      // Remove the role from the user
      await userMention.roles.remove(groupRole);
      const embed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(`Successfully removed <@${userMention.id}> from the group **${groupName}**!`);

      return message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error(`Failed to remove member: ${error.message}`);
      return message.reply("There was an error while removing the member. Please try again.");
    }
  },
};