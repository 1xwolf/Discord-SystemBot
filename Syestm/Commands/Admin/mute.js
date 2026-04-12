const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Pro = require('pro.db');

module.exports = {
  name: 'mute',
  aliases: ["اسكت", "اسكات"],
  folder: 'Admin',
  run: async (client, message) => {
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Pro.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
    const db = Pro.get(`Allow_Command_mute_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    
    const memberCheck = await message.guild.members.fetch(message.author.id);
    const canMute = isAuthorAllowed || memberCheck.permissions.has('MUTE_MEMBERS');

    if (!canMute) return;

    const args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}اسكت <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    const currentMute = Pro.get(`mute_${member.id}`);
    if (currentMute) {
      return message.reply(`**العضو <@${member.id}> لديه ميوت حالي بالفعل.**`);
    }

    const currentReasons = Pro.get(`mute_reasons_${message.guild.id}`) || [];
    if (currentReasons.length === 0) {
      return message.reply("**لا توجد أسباب محددة للميوت في هذا الخادم!**");
    }

    const options = getUniqueOptions(currentReasons);
    const menu = new MessageSelectMenu()
      .setCustomId('mute_menu')
      .setPlaceholder('اختر عقوبة العضو ووقت الإسكات')
      .addOptions(options);

    const deleteButton = new MessageButton()
      .setCustomId('Cancel2')
      .setLabel('الغاء')
      .setStyle('SECONDARY');

    const menuRow = new MessageActionRow().addComponents(menu);
    const buttonRow = new MessageActionRow().addComponents(deleteButton);

    message.reply({ content: `**يرجى تحديد سبب العقوبة.**\n** * <@${member.id}>**`, components: [menuRow, buttonRow] });

    const filter = (interaction) => interaction.isSelectMenu() && interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 });

    let interactionDetected = false;

    collector.on('collect', async (interaction) => {
      interactionDetected = true;
      const selectedOption = interaction.values[0];
      const reasonData = currentReasons.find(option => option.value === selectedOption);

      if (reasonData) {
        await applyMute(member, reasonData.value, reasonData.label, message);
        message.react("✅");
        Pro.add(`muteto_${message.author.id}`, 1);
        interaction.message.delete();
      }
    });

    collector.on('end', (collected, reason) => {
      if (!interactionDetected) {
        message.reply("**يرجى اختيار سبب!**").then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 80000);
        });
      }
    });

    async function applyMute(member, time, reason, message) {
      let muteRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
      if (!muteRole) {
        muteRole = await createMuteRole(message);
        if (!muteRole) {
          return message.reply("**حدث خطأ أثناء إنشاء رتبة 'Muted'!**");
        }
      }

      await member.roles.add(muteRole, `Muted for ${reason}`);
      const endDate = moment().add(ms(time));
      const logData = { time: time, end: endDate.format('LLLL'), reason: reason, channel: message.channel.id, by: message.author.id, to: member.id };
      await Pro.set(`mute_${member.id}`, logData);
      await Pro.add(`Total_Mutes_${member.id}`, 1);
      await Pro.set(`Muted_Member_${member.id}`, logData);
      Pro.set(`Muted_By_${member.id}`, message.author.id);

      const logChannelId = Pro.get(`selectedType_mute_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if(logChannel) {
        sendMuteLog(logChannel, logData, member, message);
      }

      setTimeout(async () => {
        await member.roles.remove(muteRole, `Mute duration ended for ${reason}`);
        Pro.delete(`mute_${member.id}`);
      }, ms(time));
    }

    async function createMuteRole(message) {
      try {
        const muteRole = await message.guild.roles.create({
          name: 'Muted',
          color: '#000000',
          permissions: [],
          reason: 'Created to mute members'
        });

        message.guild.channels.cache.forEach(async (channel) => {
          if (channel.isText()) {
            await channel.permissionOverwrites.edit(muteRole, {
              SEND_MESSAGES: false,
              ADD_REACTIONS: false
            });
          }
        });
        return muteRole;
      } catch (error) {
        console.error('Error creating role:', error);
        return null;
      }
    }

    function sendMuteLog(logChannel, logData, member, message) {
      const logEmbed = new MessageEmbed()
        .setColor('#5c5e64')
        .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**اسكات\n\nالعضو : <@${logData.to}>\nبواسطة : <@${logData.by}>\nالرسالة : [here](${message.url})\nالوقت : \`${logData.time}\`**\n\`\`\`Prison : ${logData.reason}\`\`\``)
        .setThumbnail(`https://f.top4top.io/p_3087o7q1p1.png`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      logChannel.send({ embeds: [logEmbed] });
    }

    function getUniqueOptions(reasons) {
      const seenValues = new Set();
      return reasons.filter(reason => {
        if (seenValues.has(reason.value)) return false;
        seenValues.add(reason.value);
        return true;
      }).map(reason => ({
        label: `${reason.label} (${reason.value})`,
        value: reason.value
      }));
    }

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === 'Cancel2') {
        await interaction.message.delete();
      }
    });
  }
};