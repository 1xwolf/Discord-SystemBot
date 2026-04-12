const { MessageEmbed } = require("discord.js");
const Data = require("pro.db");

module.exports = {
    name: "delgroup",
    aliases: ["deletegroup"],
    description: "Delete a group (category) along with its text and voice channels.",
    usage: ["delgroup <groupName>"],

    run: async (client, message, args) => {
        // Check if the user provided a group name
        if (!args.length) {
            return message.reply("يرجى تقديم اسم المجموعة التي تريد حذفها."); // "Please provide the name of the group you want to delete."
        }

        const groupName = args.join(' ');
        const groupKey = `group_${groupName}_${message.guild.id}`;

        // Fetch the group info from the database
        const groupInfo = await Data.get(groupKey);
        if (!groupInfo) {
            return message.reply("لا توجد مجموعة بهذا الاسم."); // "No group found with that name."
        }

        // Check permissions
        if (!message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.reply("ليس لديك إذن لحذف القنوات."); // "You don't have permission to delete channels."
        }

        // Confirmation embed
        const embed = new MessageEmbed()
            .setColor("RED")
            .setDescription(`هل أنت متأكد أنك تريد حذف المجموعة **${groupName}** وجميع قنواتها؟ هذه العملية لا يمكن التراجع عنها.`);
        
        // Send confirmation message
        const confirmationMessage = await message.channel.send({ embeds: [embed] });
        await confirmationMessage.react('✅'); // Reaction for confirmation
        await confirmationMessage.react('❌'); // Reaction for cancellation

        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        // Await confirmation
        confirmationMessage.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
            .then(async collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === '✅') {
                    // User confirmed deletion
                    try {
                        // Delete the category and its channels
                        const category = message.guild.channels.cache.find(c => c.name === groupName && c.type === 'GUILD_CATEGORY');
                        if (category) {
                            // Deleting all channels that belong to this category
                            const channelsInCategory = category.children;

                            // Deleting all text and voice channels in the category
                            for (const channel of channelsInCategory.values()) {
                                await channel.delete(`Deleting channel of group: ${groupName}`);
                            }

                            await category.delete("Group deletion requested by user."); // Deleting the category itself
                        }

                        // Delete role if it exists
                        const groupRole = message.guild.roles.cache.find(role => role.name === groupInfo.groupRoleName);
                        if (groupRole) {
                            await groupRole.delete("Group role deletion requested by user.");
                        }

                        // Remove group info from the database
                        await Data.delete(groupKey);

                        // Success message
                        message.channel.send(`تم حذف المجموعة **${groupName}** وقنواتها ودورها بنجاح.`); // "Successfully deleted the group and its associated channels and role."
                    } catch (error) {
                        console.error(error);
                        message.reply("حدث خطأ أثناء محاولة حذف المجموعة. يرجى المحاولة لاحقًا."); // "There was an error while trying to delete the group. Please try again later."
                    }
                } else {
                    // User cancelled deletion
                    message.channel.send("تم إلغاء حذف المجموعة."); // "Group deletion cancelled."
                }
            })
            .catch(() => {
                message.reply("لم تقم بالتفاعل في الوقت المحدد. تم إلغاء حذف المجموعة."); // "You did not react in time. Group deletion has been cancelled."
            });
    },
};