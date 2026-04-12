const Data = require("pro.db");
module.exports = {
    name: 'رابط', // اسم الأمر
    aliases: ["link",],
    run: (client, message, args) => {

      const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
          return; 
      }

      setTimeout(() => {
        message.delete();
      }, 10000);
      const user = message.guild.members.cache.get(message.author.id) || message.member;
      const maxUses = 3;
      const maxAge = Math.floor(Math.random() * 86399) + 86400;
      message.channel.createInvite({ maxUses: maxUses, maxAge: maxAge, inviter: message.author })
        .then(invite => {
          user.send(`ينتهي الرابط بعد: ** يـــوم **
  عدد إستخدامات الرابط :**  3 **
  
  ${invite.url}
  `)
            .catch((err) => { console.log(err.message); });
          message.react("✅");
        });
    }
  };
  