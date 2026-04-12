const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const moment = require('moment');
const Data = require('pro.db');

module.exports = {
  name: 'unprison',
  aliases: ['عفو'],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#5c5e64';
    if (!Color) return;

    const db = Pro.get(`Allow - Command unprison = [ ${message.guild.id} ]`)
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Check if user is in allow list
    const allowList = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);

    if (!isAuthorAllowed && !isAllowedMember && message.author.id !== db && !message.member.permissions.has('MUTE_MEMBERS')) {
      return;
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
        .setColor(`${Color || `#5c5e64`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}عفو <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    let role = member.guild.roles.cache.find((role) => role.name === 'prison');
    if (!role || !Pro.get(`prison_${member.id}`)) {
      // إذا لم يكن العضو مسجونًا، أرسل رسالة توضح ذلك
      return message.reply(`**${member} ليس مسجونًا!**`);
    }

    const prisonData = Pro.get(`prison_${member.id}`);
    const prisonReason = prisonData ? prisonData.reason : "سبب السجن غير معروف";

    // Check if unprison system is enabled
    const isUnprisonEnabled = await Pro.get(`check_unprison_enabled_${message.guild.id}`);
    
    if (isUnprisonEnabled) {
      const lastPrisoner = prisonData.by;  // Get who imprisoned the member
      // If they are not the last author but are allowed from allowList
      if (lastPrisoner !== message.author.id && !isAllowedMember) {
        return message.reply("❌ - **لا يمكنك فك سجن هذا العضو لأنك لم تقم بإعطائه.**");
      }
    }

    member.roles.remove(role)
      .then(() => {
        message.react('✅');
        Data.add(`unprisonpp_${message.author.id}`, 1); // Increment total mutes count

        let logChannel = Data.get(`logprisonunprison_${message.guild.id}`);
        logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

        if (logChannel) {
          const logEmbed = new MessageEmbed()
            .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
            .setColor('#5c5e64')
            .setDescription(`**فك سجن\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})\nفّك فيـ : \`${moment().format('HH:mm')}\`**\n\`\`\`Prison : ${prisonReason}\`\`\` `)       
            .setThumbnail('https://b.top4top.io/p_3087ni77r1.png')
            .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
          logChannel.send({ embeds: [logEmbed] });
        }

        // حذف معلومات السجن من قاعدة البيانات
        Pro.delete(`prison_${member.id}`);
      })
      .catch((error) => {
        console.error(error);
        console.log('An error occurred while unmuting the member.');
      });
  },
};