const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');
const moment = require('moment');

module.exports = {
  name: 'unmute',
  aliases: ['تكلم'],
  description: "A command to unmute a member.",
  run: async (client, message, args) => {
    const Color = Pro.get(`Guild_Color_${message.guild.id}`) || message.guild.me.displayHexColor || '#000000';

    // Check if the command is allowed
    const roleId = Pro.get(`Allow_Command_unmute_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = allowedRole ? message.member.roles.cache.has(allowedRole.id) : false;

    // Check if user is in the allow list
    const allowList = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);

    // Allow unmute if the user has permission via role, is in allow list, or has permission to mute members
    if (!isAuthorAllowed && !isAllowedMember && !message.member.permissions.has('MUTE_MEMBERS')) {
      return message.reply('❌ - **You do not have permission to unmute members.**');
    }

    let member;
    if (message.mentions.members.size > 0) {
      member = message.mentions.members.first();
    } else {
      const memberId = args[0];
      member = message.guild.members.cache.get(memberId);
    }

    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color || '#5c5e64')
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}تكلم <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }


    const prisonData = Pro.get(`Muted_Member_${member.id}`);
    const prisonReason = prisonData ? prisonData.reason : "سبب الاسكات غير معروف";

    // Check if the mute system is enabled
    const isMuteSystemEnabled = Pro.get(`check_unmute_enabled_${message.guild.id}`);
    
    if (isMuteSystemEnabled) {
      // If the mute system is enabled, check if the person trying to unmute is the one who muted the member
      const lastMuteAuthor = Pro.get(`Muted_By_${member.id}`);
      if (lastMuteAuthor && lastMuteAuthor !== message.author.id && !isAllowedMember) {
        return message.reply('❌ - **You cannot unmute this member because you did not mute them.**');
      }
    }


    let role = member.guild.roles.cache.find((role) => role.name === 'Muted');
    if (!role) {
      return message.react('❎');
    }

    // Only attempt to unmute if the member is muted
    if (!member.roles.cache.has(role.id)) {
      return message.reply('**This member is not muted.**');
    }

    try {
      await member.roles.remove(role);
      Pro.add(`unmutepp_${message.author.id}`, 1); // Increment total mutes count
      message.react('✅');



      // Log the action
      const logChannelId = Pro.get(`logtmuteuntmute_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const logEmbed = new MessageEmbed()
          .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
          .setColor('#f5f5ff')
          .setDescription(`**فك الآسكات الكتابي\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})\nفّك فيـ : ${moment().format('HH:mm')}\nMute : ${prisonReason}**`)
          .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png')
          .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
        
        await logChannel.send({ embeds: [logEmbed] });
      }

      if (Pro.has(`Muted_Member_${member.id}`)) {
        Pro.delete(`Muted_Member_${member.id}`);
        if (Pro.has(`mute_${member.id}`)) {
          Pro.delete(`mute_${member.id}`);
        }
      }
    } catch (error) {
      console.error('An error occurred while unmuting the member:', error);
      message.reply('An error occurred while trying to unmute the member.');
    }
  }
};
