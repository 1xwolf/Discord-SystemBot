const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "panel",
  description: "Display information about a specific group.",
  usage: ["ginfo <groupNameOrId>"],

  run: async (client, message, args) => {
    // Get the first argument, if any
    let groupNameOrId = args[0];

    // Check for "قروبي" command
    if (groupNameOrId === "قروبي") {
      // Fetch the group for the command issuer
      const userGroupInfo = await Data.get(`user_group_${message.author.id}_${message.guild.id}`);
      if (!userGroupInfo) {
        return message.reply("لا يوجد لديك أي قروب في هذا السيرفر."); // "You do not have any group in this server."
      }

      groupNameOrId = userGroupInfo; // Set the group identifier (name or id)
    }

    // Rest of your existing validation
    if (!groupNameOrId) {
      return message.reply("يرجى إدخال اسم القروب أو رقم التعريف."); // "Please provide the group name or group ID."
    }

    try {
      let groupInfo;

      // Determine if groupNameOrId is a name or an ID and fetch group info accordingly
      if (isNaN(groupNameOrId)) {
        groupInfo = await Data.get(`group_${groupNameOrId.toLowerCase()}_${message.guild.id}`);
      } else {
        groupInfo = await Data.get(`group_id_${groupNameOrId}`);
      }

      // Ensure group information was retrieved
      if (!groupInfo) {
        return message.reply("القروب المحدد غير موجود."); // "The specified group does not exist."
      }

      // Check if the command issuer is the owner of the group or an admin
      const isAdmin = await Data.get(`group_admin_${groupInfo.name}_${message.author.id}`);
      if (message.author.id !== groupInfo.ownerId && !isAdmin) {
        return message.reply("ليس لديك صلاحيات لاستخدام هذا الأمر."); // "You do not have permission to use this command."
      }

      // Fetching group owner
      const owner = await message.guild.members.fetch(groupInfo.ownerId).catch(() => null);
      if (!owner) {
        return message.reply("لم أتمكن من العثور على مالك هذا القروب."); // "Could not find the owner of this group."
      }

      // Fetch group role
      const groupRole = message.guild.roles.cache.find(role => role.name === groupInfo.groupRoleName);
      if (!groupRole) {
        return message.reply("لم أتمكن من العثور على دور القروب."); // "Could not find the group role."
      }

      // Fetch members with the specific role
      const groupMembers = message.guild.members.cache.filter(member => member.roles.cache.has(groupRole.id));

      // Update member count in the database
      const memberCount = groupMembers.size;
      await Data.set(`group_member_count_${groupInfo.groupRoleId}`, memberCount);

      // Fetch admin count from the database
      const adminCount = await Data.get(`group_admin_count_${groupInfo.name}`) || 0;

      // Create buttons for managing group members and admins
      const addButton = new MessageButton()
        .setCustomId(`add_member_${groupInfo.name}`)
        .setLabel('اضافة عضو الى القروب') // "Add Member to Group"
        .setStyle('SUCCESS');

      const removeButton = new MessageButton()
        .setCustomId(`remove_member_${groupInfo.name}`)
        .setLabel('ازالة عضو من القروب') // "Remove Member from Group"
        .setStyle('DANGER');

      const listMembersButton = new MessageButton()
        .setCustomId(`list_members_${groupInfo.name}`)
        .setLabel('عرض الأعضاء') // "List Members"
        .setStyle('SECONDARY');

      const addAdminButton = new MessageButton()
        .setCustomId(`add_admin_${groupInfo.name}`)
        .setLabel('اضافة ادمن للقروب') // "Add Admin to Group"
        .setStyle('PRIMARY');

      const removeAdminButton = new MessageButton()
        .setCustomId(`remove_admin_${groupInfo.name}`)
        .setLabel('ازالة ادمن من القروب') // "Remove Admin from Group"
        .setStyle('DANGER');

      const row = new MessageActionRow()
        .addComponents(addButton, removeButton, listMembersButton, addAdminButton, removeAdminButton);

      // Create an embed message
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`معلومات القروب`)
        .setDescription(`تفاصيل القروب **${groupInfo.name}**`) // "Details of the group"
        .addField('المالك', owner.user.tag, true) // "Owner"
        .addField('عدد الأعضاء', memberCount.toString(), true) // "Number of Members"
        .addField('عدد الأدمنين', adminCount.toString(), true) // "Number of Admins"
        .setTimestamp()
        .setFooter(`طلب من ${message.author.tag}`, message.author.displayAvatarURL());

      // Send the embed message with buttons
      await message.channel.send({ embeds: [embed], components: [row] });

      // Create a collector for button interactions
      const filter = interaction => {
        return interaction.customId.startsWith('add_member_') || 
               interaction.customId.startsWith('remove_member_') ||
               interaction.customId.startsWith('list_members_') ||
               interaction.customId.startsWith('add_admin_') ||
               interaction.customId.startsWith('remove_admin_');
      };

      const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (interaction) => {
        // Verify if the user is the owner
        if (interaction.user.id !== groupInfo.ownerId) {
          await interaction.reply({ content: "ليس لديك صلاحيات لاستخدام هذه الأزرار.", ephemeral: true }); // "You do not have permission to use these buttons."
          return;
        }

        // Handling adding members
        if (interaction.customId.startsWith('add_member_')) {
          await handleAddMember(interaction, groupRole, groupInfo);
        }
        // Handling removing members
        else if (interaction.customId.startsWith('remove_member_')) {
          await handleRemoveMember(interaction, groupRole, groupInfo);
        }
        // Handling listing members
        else if (interaction.customId.startsWith('list_members_')) {
          await handleListMembers(interaction, groupMembers);
        }
        // Handling adding admins
        else if (interaction.customId.startsWith('add_admin_')) {
          await handleAddAdmin(interaction, groupInfo);
        }
        // Handling removing admins
        else if (interaction.customId.startsWith('remove_admin_')) {
          await handleRemoveAdmin(interaction, groupInfo);
        }
      });

      collector.on('end', () => {
        console.log('Interaction collector ended');
      });

    } catch (error) {
      console.error(`Failed to fetch group information: ${error.message}`);
      return message.reply("حدث خطأ أثناء استرجاع معلومات القروب. يرجى المحاولة مرة أخرى."); // "There was an error while fetching the group information. Please try again."
    }
  },
};

// Handle adding members
async function handleAddMember(interaction, groupRole, groupInfo) {
  await interaction.reply({ content: "منشن الي تبي تضيفه للقروب:", ephemeral: true });
  const responseFilter = response => response.mentions.members.size > 0 && response.author.id === interaction.user.id;

  const memberCollector = interaction.channel.createMessageCollector({ filter: responseFilter, time: 15000 });

  memberCollector.on('collect', async (msg) => {
    const userToAdd = msg.mentions.members.first();
    if (userToAdd) {
      await userToAdd.roles.add(groupRole).catch(err => {
        console.error(`Failed to add role: ${err.message}`);
        msg.reply("حدث خطأ أثناء إضافة العضو إلى القروب. الرجاء التحقق من الصلاحيات.");
      });

      await Data.set(`group_member_${groupInfo.groupRoleId}_${userToAdd.id}`, {
        userId: userToAdd.id,
        groupId: groupInfo.groupRoleId
      });

      const currentCount = await Data.get(`group_member_count_${groupInfo.groupRoleId}`) || 0;
      await Data.set(`group_member_count_${groupInfo.groupRoleId}`, currentCount + 1);

      await msg.reply(`تمت إضافة <@${userToAdd.id}> إلى القروب **${groupInfo.name}** بنجاح!`);
    }
    memberCollector.stop();
  });

  memberCollector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "لم تقم بذكر أي مستخدم في الوقت المحدد!", ephemeral: true });
    }
  });
}

// Handle removing members
async function handleRemoveMember(interaction, groupRole, groupInfo) {
  await interaction.reply({ content: "منشن الي تبي تزيله من القروب:", ephemeral: true });
  const responseFilter = response => response.mentions.members.size > 0 && response.author.id === interaction.user.id;

  const memberCollector = interaction.channel.createMessageCollector({ filter: responseFilter, time: 15000 });

  memberCollector.on('collect', async (msg) => {
    const userToRemove = msg.mentions.members.first();
    if (userToRemove) {
      await userToRemove.roles.remove(groupRole).catch(err => {
        console.error(`Failed to remove role: ${err.message}`);
        msg.reply("حدث خطأ أثناء إزالة العضو من القروب. الرجاء التحقق من الصلاحيات.");
      });

      await Data.delete(`group_member_${groupInfo.groupRoleId}_${userToRemove.id}`);

      const currentCount = await Data.get(`group_member_count_${groupInfo.groupRoleId}`) || 1;
      await Data.set(`group_member_count_${groupInfo.groupRoleId}`, Math.max(currentCount - 1, 0));

      await msg.reply(`تمت إزالة <@${userToRemove.id}> من القروب **${groupInfo.name}** بنجاح!`);
    }
    memberCollector.stop();
  });

  memberCollector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "لم تقم بذكر أي مستخدم في الوقت المحدد!", ephemeral: true });
    }
  });
}

// List group members
async function handleListMembers(interaction, groupMembers) {
  const membersList = groupMembers.map(member => `<@${member.id}>`).join(', ') || 'لا يوجد أعضاء في هذا القروب.';

  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('أعضاء القروب')
    .setDescription(membersList)
    .setTimestamp()
    .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Handle adding admins
async function handleAddAdmin(interaction, groupInfo) {
  await interaction.reply({ content: "منشن العضو الذي تود اضافته كأدمن:", ephemeral: true });
  const responseFilter = response => response.mentions.members.size > 0 && response.author.id === interaction.user.id;

  const adminCollector = interaction.channel.createMessageCollector({ filter: responseFilter, time: 15000 });

  adminCollector.on('collect', async (msg) => {
    const userToAddAdmin = msg.mentions.members.first();
    if (userToAddAdmin) {
      await Data.set(`group_admin_${groupInfo.name}_${userToAddAdmin.id}`, {
        userId: userToAddAdmin.id,
        groupName: groupInfo.name,
      });

      const currentAdminCount = await Data.get(`group_admin_count_${groupInfo.name}`) || 0;
      await Data.set(`group_admin_count_${groupInfo.name}`, currentAdminCount + 1);

      await msg.reply(`تمت إضافة <@${userToAddAdmin.id}> كأدمن في القروب **${groupInfo.name}** بنجاح!`);
    }
    adminCollector.stop();
  });

  adminCollector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "لم تقم بذكر أي مستخدم في الوقت المحدد!", ephemeral: true });
    }
  });
}

// Handle removing admins
async function handleRemoveAdmin(interaction, groupInfo) {
  await interaction.reply({ content: "منشن العضو الذي تود ازالته كأدمن:", ephemeral: true });
  const responseFilter = response => response.mentions.members.size > 0 && response.author.id === interaction.user.id;

  const adminCollector = interaction.channel.createMessageCollector({ filter: responseFilter, time: 15000 });

  adminCollector.on('collect', async (msg) => {
    const userToRemoveAdmin = msg.mentions.members.first();
    if (userToRemoveAdmin) {
      await Data.delete(`group_admin_${groupInfo.name}_${userToRemoveAdmin.id}`);

      const currentAdminCount = await Data.get(`group_admin_count_${groupInfo.name}`) || 1; // Ensure we don't go negative
      await Data.set(`group_admin_count_${groupInfo.name}`, Math.max(currentAdminCount - 1, 0));

      await msg.reply(`تمت إزالة <@${userToRemoveAdmin.id}> كأدمن من القروب **${groupInfo.name}** بنجاح!`);
    }
    adminCollector.stop();
  });

  adminCollector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "لم تقم بذكر أي مستخدم في الوقت المحدد!", ephemeral: true });
    }
  });
}