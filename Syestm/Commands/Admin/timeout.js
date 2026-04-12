const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const ms = require('ms');
const moment = require('moment');

module.exports = {
  name: "timeout",
  aliases: ["تايم"],
  description: "timeout a member",
  usage: ["!timeout @user"],
  run: async (client, message, args) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const db = Pro.get(`Allow - Command timeout = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id) || message.author.id === db || message.member.permissions.has('MUTE_MEMBERS');

    if (!isAuthorAllowed) {
      return;
    }

    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!args[0]) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}تايم <@${message.author.id}> 1h**`);
      return message.reply({ embeds: [embed] });
    }

    if (!member) {
      return message.reply({ content: `**لا يمكنني اعطاء ميوت لهاذا العضو .**` }).catch(console.error);
    }

    if (member.id === message.author.id) {
      return message.reply({ content: `**لا يمكنك اعطاء ميوت لنفسك .**` }).catch(console.error);
    }

    if (member.permissions.has('ADMINISTRATOR')) {
      return message.reply({ content: `**لا يمكنك اعطاء تايم أوت لأدمن ستريتر ${member.user.username}**` }).catch(console.error);
    }

    if (message.member.roles.highest.position < member.roles.highest.position) {
      return message.reply({ content: `:rolling_eyes: **You can't timeout ${member.user.username} since they have a higher role than you**` }).catch(console.error);
    }

    if (!args[1]) {
      return message.reply({ content: `**يرجي تحديد وقت التايم أوت.**` });
    }

    if (!args[1].endsWith('s') && !args[1].endsWith('m') && !args[1].endsWith('h') && !args[1].endsWith('d') && !args[1].endsWith('w')) {
      return message.reply({ content: `** يجب أن ينتهي الوقت بـ .** \`s / m / h / d / w\` ` });
    }

    message.reply(`**تم أعطاء تايم أوت للعضو <@${member.id}> بنجاح.**`);

    const timeoutDuration = ms(args[1]);
    const timeoutMessage = `**${message.member.nickname}** has timed you out for ${args[1]}.`;

    member.timeout(timeoutDuration, timeoutMessage)
      .then(() => {
        const timeoutData = {
          duration: timeoutDuration,
          reason: timeoutMessage,
          endsAt: Date.now() + timeoutDuration,
          by: message.author.id,
        };

        const existingTimeouts = Pro.get(`Timeout_Members_${member.id}`) || [];
        existingTimeouts.push(timeoutData);

        Pro.set(`Timeout_Members_${member.id}`, existingTimeouts);
        Pro.set(`timeout_${member.id}_${message.guild.id}`, timeoutData);

        // Fetch the log channel
        let logChannelId = Pro.get(`logtimeuntime_${message.guild.id}`);
        let logChannel = message.guild.channels.cache.get(logChannelId);

        if (logChannel) {        
          const logEmbed = new MessageEmbed()
            .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**تايم أوت\n\nالعضو : <@${member.user.id}>\nبواسطة : <@${message.member.id}>\nفيـ : [Message](${message.url})\nالوقت : ${args[1]}\nاعطى فيـ : ${moment().format('HH:mm')}**\n\`\`\`Reason : No reason\`\`\`\ `)
            .setColor(`#312e5d`)
            .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(`https://cdn.discordapp.com/attachments/1325773226835705919/1325774437320097802/deadline.png?ex=677d0329&is=677bb1a9&hm=0b3e7b0378494d193d125d6da72e17fd3bb556d3eb55c992323582f0d93414a4&`);

          // Send log to the log channel
          logChannel.send({ embeds: [logEmbed] });
        }

        // Notify member about the timeout
        member.send(`تم أعطاء تايم أوت لك بنجاح لمدة ${args[1]} من قبل <@${message.member.id}>.`)
          .catch(err => console.log(`لم أتمكن من إرسال رسالة إلى ${member.user.tag}: ${err.message}`));

        // The timeout end logic
        setTimeout(() => {
          member.timeout(null);
          Pro.delete(`timeout_${member.id}_${message.guild.id}`);
          const timeoutEndMessage = `**${member.user.username}**'s timeout has ended.`;
          if (logChannel) {
            logChannel.send(timeoutEndMessage);
          }
        }, timeoutDuration);
      })
      .catch((err) => {
        console.log(`Failed to timeout member: ${err.message}`);
      });
  },
};