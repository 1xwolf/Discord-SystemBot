const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`)
const { prefix, owners } = require(`${process.cwd()}/config`);
module.exports = {
    name: "addrole",
    run: async (client, message) => {

      const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
      if (!Color) return;
        
      const db = Pro.get(`Allow - Command allrole = [ ${message.guild.id} ]`)
      const allowedRole = message.guild.roles.cache.get(db);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
      if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has('MANAGE_ROLES') && !owners.includes(message.author.id) && !owners.includes(message.author.id)) {
          // إجراءات للتصرف عندما لا يتحقق الشرط
          return message.react(`❌`)
      }


              const roleName = message.content.slice(8).trim(); 
              if (!roleName) {
                const embed = new MessageEmbed()
                .setColor(`${Color || "#f5f5ff"}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}addrole اسم الرول**`);
                message.reply({ embeds: [embed] });
                return;
              }
              message.guild.roles.create({
                name: roleName,
              })
                .then(role => {
                  message.react("✅");
                })
        

    }
}
