const Discord = require("discord.js");
const Pro = require(`pro.db`);
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "untimeout",
  aliases: ["untimeout"],
  description: "Remove timeout from a member",
  usage: ["!untimeout @user"],
  run: async (client, message, args) => {
    const Color = Pro.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    // Check for allowed role
    const db = Pro.get(`Allow_Command_untimeout_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    
    // Check if user is in allow list
    const allowList = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);
    
    // Check for Manage Channels permission
    const hasManageChannels = message.member.permissions.has('MANAGE_CHANNELS');

    // If the user doesn't have permission or allowed role, stop the command
    if (!hasManageChannels && !isAuthorAllowed && !isAllowedMember) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    // Check for mentioned member
    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    // Validate member
    if (!member) {
      const embed = new Discord.MessageEmbed()
        .setColor('#ff4444') // Red for error
        .setTitle('خطأ في استخدام الأمر')
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة:**\n\`${prefix}untimeout <@user>\``)
        .setFooter({ text: 'يرجى ذكر العضو بشكل صحيح.' });

      return message.reply({ embeds: [embed] });
    }

    // Check for timeout data in the database
    const timeoutData = Pro.get(`timeout_${member.id}_${message.guild.id}`);
    if (!timeoutData) {
      const embed = new Discord.MessageEmbed()
        .setColor('#ff4444') // Red for error
        .setTitle('خطأ')
        .setDescription(`**هذا العضو ليس في حالة تايم أوت.**`)
        .setFooter({ text: 'يمكنك التحقق من حالة التايم أوت الخاصة بالعضو.' });

      return message.reply({ embeds: [embed] });
    }

    // Check if the timeout system is enabled
    const isTimeoutEnabled = await Pro.get(`check_untime_enabled_${message.guild.id}`);
    
    if (isTimeoutEnabled) {
      // Retrieve the author of the timeout
      const timeoutBy = timeoutData.by;

      // If they are not the last author but are allowed from allowList
      if (timeoutBy !== message.author.id && !isAllowedMember) {
        return message.reply("❌ - **لا يمكنك إلغاء التايم أوت لهذا العضو لأنك لم تقم بإعطائه.**");
      }
    }

    // Retrieve the log channel ID from the database
    let logChannelId = Pro.get(`logtimeuntime_${message.guild.id}`);
    
    // Remove timeout
    member.timeout(null)
      .then(async () => {
        // Delete timeout data from database
        Pro.delete(`timeout_${member.id}_${message.guild.id}`);
        message.reply(`**تم الغاء التايم أوت للعضو <@${member.id}> بنجاح.**`);

        // Logging the untimeout action
        const logChannel = message.guild.channels.cache.find((c) => c.id === logChannelId);

        if (logChannel) {
          const embedLog = new Discord.MessageEmbed()
            .setColor("#00ff00") // Green for success
            .setTitle("Timeout Removed")
            .setDescription(`**تم الغاء التايم أوت**\n\n**العضو:** <@${member.id}>\n**بواسطة:** <@${message.author.id}>`)
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTimestamp()
            .setThumbnail(`https://cdn.discordapp.com/attachments/1325773226835705919/1325774755894136863/whistle.png?ex=677d0375&is=677bb1f5&hm=d556e1db93b3dd45116ee351e3e305a7a64bb2e5c74bc7c9c5c7a5c70defd3aa&`);

          await logChannel.send({ embeds: [embedLog] });
        }
      })
      .catch((err) => {
        console.log(`فشل في الغاء التايم أوت للعضو: ${err.message}`);
        message.reply({ content: `**حدث خطأ أثناء محاولة إلغاء التايم أوت.**` });
      });
  },
};