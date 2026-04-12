const { MessageActionRow, MessageButton } = require('discord.js');
const config = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
  name: 'mysub',
  aliases: ["اشتراك","my-sub"],
  run: async (client, message, args) => {

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    if (message.author.id !== config.owners[0]) {
      return;
    }

    try {
      const subscriptionDuration = config.subscriptionDuration;
      const remainingTime = subscriptionDuration - Date.now();

      // حساب الأيام والساعات والدقائق والثواني المتبقية
      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      const formattedTime = `${days ? `${days}d ` : ''}${hours ? `${hours}h ` : ''}${minutes ? `${minutes}m ` : ''}${seconds ? `${seconds}s` : ''}`;

      const subscriptionInfo = `**إسم الاشتراك : Syestm x1\nايدي الاشتراك : ${config.randomCode}\nمسجل لـ : <@${message.author.id}>\nينتهى بعد : \`${formattedTime}\`**`;

      // إنشاء زر الدعم الفني
      const supportButton = new MessageButton()
        .setStyle('LINK')
        .setLabel('الدعم الفني')
        .setURL('https://discord.gg/quill');

      // إنشاء صف الأزرار وإضافة الزر إليه
      const actionRow = new MessageActionRow()
        .addComponents(supportButton);

      // إرسال المعلومات مع الزر
      await message.channel.send({content: `${subscriptionInfo}`,  components: [actionRow] });
    } catch (error) {
      console.error('❌>', error);
      message.reply('حدث خطأ أثناء جلب معلومات الاشتراك.');
    }
  }
};
