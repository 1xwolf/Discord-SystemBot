const { MessageEmbed } = require('discord.js');
const db = require('pro.db');

module.exports = {
  name: 'top-invites',
  aliases: ['topinv'],
  run: async (client, message) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    let setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const guildColor = db.get(`Guild_Color_${message.guild?.id}`) || '#f5f5ff';
    if (!guildColor) return;

    const invites = await message.guild.invites.fetch();
    const uniqueInviters = new Map();

    invites.forEach((invite) => {
      const inviter = invite.inviter;
      const totalUses = uniqueInviters.get(inviter.id) || 0;
      uniqueInviters.set(inviter.id, totalUses + invite.uses);
    });

    const sortedInviters = Array.from(uniqueInviters.entries()).sort((a, b) => b[1] - a[1]);

    const embed = new MessageEmbed().setColor(guildColor);

    let description = '';
    let index = 1;

    sortedInviters.forEach(([inviterId, totalUses]) => {
      const inviter = message.guild.members.cache.get(inviterId);
      if (inviter && totalUses > 0) { // تحقق من أن عدد الدعوات أكبر من صفر
        description += `**#${index} - <@${inviter.user.id}> : ${totalUses}**\n`;
        index++;
      }
    });

    if (index > 1) {
      // إذا كان هناك شخص واحد على الأقل في القائمة، أرسل الرد
      embed.setDescription(description);
      message.reply({ embeds: [embed] });
    } else {
      // إذا لم يكن هناك أي شخص في القائمة، قم بإرسال رسالة تفيد بذلك
      message.reply("**لا يوجد أي شخص في القائمة.**");
    }
  },
};
