const { MessageEmbed } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "stats",
  aliases: ["الاحصائيات"],
  description: "يظهر عدد مرات السجن والميوت والإسكات للعضو الذي قام بإرسال الأمر أو العضو المذكور",
  usage: [`${prefix}stats [@user]`],
  run: async (client, message, args) => {
    try {
      // تحقق من صلاحيات المستخدم
      if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply("ليس لديك الأذونات اللازمة لاستخدام هذا الأمر.");
      }

      let member;

      // التحقق مما إذا تم منشن عضو
      if (message.mentions.users.size) {
        member = message.mentions.users.first();
      } else {
        member = message.author;
      }

      const muteCount = db.get(`muteto_${member.id}`) || 0;
      const prisonCount = db.get(`mutepri_${member.id}`) || 0;
      const vmuteCount = db.get(`mutevo_${member.id}`) || 0;
      const unprison = db.get(`unprisonpp_${member.id}`) || 0;
      const vunmute = db.get(`unvmutepp_${member.id}`) || 0;
      const unmute = db.get(`unmutepp_${member.id}`) || 0;

      const embed = new MessageEmbed()
        .setAuthor(member.tag, member.displayAvatarURL({ dynamic: true }))
        .setColor("#5c5e64")
        .setTitle("المعلومات")
        .setDescription(`**
السجن :
اعطاء سجن : ${prisonCount}
فك السجن : ${unprison}

الاسكات :
اعطاء اسكات : ${muteCount}
فك الاسكات : ${unmute}

الميوت :
اعطاء ميوت : ${vmuteCount}
فك ميوت : ${vunmute}
        **`);

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("حدث خطأ أثناء جلب الإحصائيات:", error);
    }
  }
};
