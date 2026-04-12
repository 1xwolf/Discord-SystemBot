const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const db = require('pro.db');
const Pro = require('pro.db');
const Data = require('pro.db');

module.exports = {
  name: 'vmute',
  aliases: ["ميوت"],
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
    if (!Color) return;

    const allowedRoleId = Pro.get(`Allow_Command_vmute_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Checking permissions
    const memberCheck = await message.guild.members.fetch(message.author.id);
    const rolesArray = Array.from(memberCheck.roles.cache.values());

    const hasVmutePermission = rolesArray.some(role => {
      const checkData = Pro.get(`permissions_${message.guild.id}_${role.id}`);
      return checkData && checkData.includes('vmute');
    });

    if (!hasVmutePermission && !message.member.permissions.has('MUTE_MEMBERS')) {
      return message.reply("**ليس لديك إذن لمستخدم ميوت هذا الأمر!**");
    }

    const args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}ميوت <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    const currentReasons = db.get(`vmute_reasons_${message.guild.id}`) || [];
    if (currentReasons.length === 0) {
      return message.reply("**لا توجد أسباب محددة للميوت في هذا الخادم!**");
    }

    const options = currentReasons.slice(0, 25).map(reason => ({
      label: `${reason.label} (${reason.value})`,
      value: reason.value,
    }));

    const currentMute = Pro.get(`voicemute_${member.id}`);
    if (currentMute) {
      return message.reply(`**العضو <@${member.id}> لديه ميوت حالي بالفعل.**`);
    }

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

    collector.on('collect', (interaction) => {
      interactionDetected = true;
      const selectedOption = interaction.values[0];
      const reasonData = currentReasons.find(option => option.value === selectedOption);

      if (reasonData) {
        applyMute(member, reasonData.value, reasonData.label);
      }

      message.react("✅");
      db.add(`mutevo_${message.author.id}`, 1); // Increment total mutes count
      interaction.message.delete();
    });

    collector.on('end', (collected, reason) => {
      if (!interactionDetected) {
        message.reply("**يرجى اختيار سبب!**").then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 8000);
        });
      }
    });

async function applyMute(member, time, selectedOption) {
    if (!member.voice.channel) {
        return message.reply("**العضو ليس في قناة صوتية حالياً!**");
    }

    await member.voice.setMute(true, `Muted for ${selectedOption}`);
    const endDate = moment().add(ms(time), 'milliseconds');
    const logData = {
        time: time,
        times: endDate.format('LLLL'),
        reason: selectedOption,
        channel: message.channel.id,
        by: message.author.id,
        to: member.id
    };
    
    db.set(`voicemute_${member.id}`, logData);
    db.set(`Total_voice_${member.id}`, 1); // Increment total mutes count

    // Set up logging details
    const blacklist = db.get(`selectedType_vmute_${message.guild.id}`);
    const logblack = message.guild.channels.cache.get(blacklist);
    const imagePath = path.join(__dirname, '..', 'photo', `sliblacklist_${message.guild.id}.png`);
    const defaultImagePath = path.join(__dirname, '..', 'photo', 'defaultLine.png');
    const finalImagePath = fs.existsSync(imagePath) ? imagePath : defaultImagePath;

    if (logblack) {
        logblack.send(`**العقوبة : ميوت\nالى : <@${logData.to}>\nبواسطة : <@${logData.by}>\nالوقت : \`${logData.time}\`\nالسبب : \`${logData.reason}\`**`);
        logblack.send({
            files: [{
                attachment: fs.createReadStream(finalImagePath),
                name: path.basename(finalImagePath)
            }]
        });
    }

    setTimeout(async () => {
        if (member.voice.channel) {
            await member.voice.setMute(false, `Mute duration ended for ${selectedOption}`);
        }
        // Remove the mute data once the duration ends
        db.delete(`voicemute_${member.id}`);
    }, ms(time));

    // Log the mute action
    const logEmbed = new MessageEmbed()
        .setColor(Color)
        .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**ميوت \n\nالعضو : <@${logData.to}>\nبواسطة : <@${logData.by}>\nالرسالة : [here](${message.url})\nالوقت : \`${logData.time}\`**\n\`\`\`Prison : ${logData.reason}\`\`\` `)
        .setThumbnail(`https://g.top4top.io/p_3087u8nzn1.png`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    let logChannel = db.get(`logtvoicemute_${message.guild.id}`);
    logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

    if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
    }
}
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel2') {
        interaction.message.delete();
      }
    });
  }
};