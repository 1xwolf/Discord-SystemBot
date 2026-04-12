const { MessageEmbed } = require("discord.js");
const Data = require("pro.db");

module.exports = {
    name: "grole",
    description: "Manage a member in a group by group name or category ID.",
    usage: ["grole <groupNameOrCategoryID> @userMention"],

    run: async (client, message, args) => {
        // Early return on invalid arguments
        if (args.length < 2) {
            return message.reply("Please provide a group name or category ID, followed by a user mention.");
        }

        const groupOrCategoryId = args[0]; // Can be group name or category ID
        const userMention = message.mentions.members.first();

        // Early return on invalid user mention
        if (!userMention) {
            return message.reply("You must mention a valid user to manage in the group.");
        }

        let groupInfo;

        // Determine if the first argument is a category ID
        const categoryId = message.guild.channels.cache.get(groupOrCategoryId);

        // Fetch group information based on group name or category ID
        try {
            if (categoryId) {
                // Fetch the group information using category ID
                groupInfo = await Data.get(`category_${categoryId.id}_${message.guild.id}`);
            } else {
                // Fetching group information using group name
                const groupName = groupOrCategoryId.toLowerCase();
                groupInfo = await Data.get(`group_${groupName}_${message.guild.id}`);
            }
        } catch (dbError) {
            console.error(`Database error while fetching group info: ${dbError.message}`);
            return message.reply("There was an error fetching the group information. Please try again later.");
        }

        // Check if the group exists
        if (!groupInfo) {
            return message.reply("No group found with that name or associated with that category ID.");
        }

        // Check if the user is the owner of the group or an admin
        if (message.author.id !== groupInfo.ownerId && !groupInfo.admins.includes(message.author.id)) {
            return message.reply("You do not have permission to manage members in this group.");
        }

        // Fetching the group's role with case insensitivity
        const groupRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === groupInfo.groupRoleName.toLowerCase());
        if (!groupRole) {
            return message.reply("The group's role could not be found. Please check the group configuration.");
        }

        // Check if the user is already a member of the group
        if (userMention.roles.cache.has(groupRole.id)) {
            return message.reply("This user is already a member of the group.");
        }

        // Attempting to add the user to the group and handle potential errors
        try {
            await userMention.roles.add(groupRole);
            const embed = new MessageEmbed()
                .setColor("GREEN")
                .setDescription(`✅ Successfully added <@${userMention.id}> to the group **${groupInfo.name}**.`);

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to add member to group: ${error.message}`);
            return message.reply("There was an error adding the member to the group. Please try again later.");
        }
    },
};