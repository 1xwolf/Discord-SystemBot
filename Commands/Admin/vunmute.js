const { MessageEmbed } = require("discord.js");
const db = require("pro.db");
const Data = require("pro.db");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "vunmute",
  aliases: ["فك", "unvmute"],
  description: "فك الميوت عن عضو في القناة الصوتية",
  usage: ["!vunmute @user"],
  run: async (client, message, args) => {
    try {
      const featureEnabled = db.get(`muteFeatureEnabled_${message.guild.id}`);
      const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) return;

      const Color = Data.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
      if (!Color) return;

      const allowedRoleId = Pro.get(`Allow_Command_vmute_${message.guild.id}`);
      const allowedRole = message.guild.roles.cache.get(allowedRoleId);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      const membercheck = await message.guild.members.fetch(message.author.id);
      const rolesArray = Array.from(membercheck.roles.cache.values());

      let state = false;
      for (const role of rolesArray) {
        const check_data = Pro.get(`permissions_${message.guild.id}_${role.id}`);
        if (check_data && check_data.length > 0 && check_data.includes('vmute')) {
          state = true;
          break;
        }
      }

      // تعريف المتغير member هنا
      const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      if (!member) {
        const embed = new MessageEmbed()
          .setColor(Color)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}فك <@${message.author.id}>**`);
        return message.reply({ embeds: [embed] });
      }

      if (!member.voice.channel) {
        return message.reply({ content: `**المستخدم ليس في قناة صوتية.**` });
      }

      // تحقق مما إذا كان العضو لديه ميوت مفعل
      const muteData = db.get(`voicemute_${member.id}`);
      if (!muteData) {
        return message.reply({ content: `**العضو ليس لديه ميوت مفعل.**` });
      }

      // تحقق من أن رتبة الشخص الذي يحاول فك الميوت أعلى من رتبة الشخص الذي قام بإعطاء الميوت
      if (featureEnabled) {
        if (muteData.by !== message.author.id) {
          return message.reply("**لا يمكنك فك الميوت لأنك لم تكن من قام بتطبيقه.**");
        }
      } else {
        // إذا كانت الميزة غير مفعلة، تحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('MUTE_MEMBERS')) {
          return message.reply({ content: `**ليس لديك الصلاحيات الكافية لفك الميوت.**` });
        }
      }


      // إزالة العقوبة من قاعدة البيانات
      if (Data.has(`voicemute_${member.id}`)) {
        await Data.delete(`voicemute_${member.id}`);
      }

      await member.voice.setMute(false);
      message.reply({ content: `**تم فك الميوت عن ${member.user.username}.**` });
      db.add(`Total_voice_${member.id}`, 1); // Increment total unmute count


      // إرسال الحدث إلى قناة اللوق إذا كانت موجودة
      const logEmbed = new MessageEmbed()
        .setColor(Color)
        .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**فك الميوت \n\nالعضو : <@${member.id}>\nبواسطة : <@${message.author.id}>**`)
        .setThumbnail(`https://l.top4top.io/p_30871ktpe1.png`)
        .setTimestamp();

      const logChannelId = Data.get(`logtvoicemute_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find(channel => channel.id === logChannelId);

      if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error('Channel not found for logging.');
      }
    } catch (error) {
      console.error('Error in vunmute command:', error);
      message.reply({ content: `حدث خطأ أثناء تنفيذ الأمر.` });
    }
  }
};
