const Pro = require(`pro.db`)
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: "applay",
    run: async (client, message) => {

      if (!owners.includes(message.author.id)) return message.react('❌');
      const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
          return; 
      }
     
      message.channel.permissionOverwrites.create(message.guild.roles.everyone, {
        MENTION_EVERYONE: true,
        ATTACH_FILES: true
  
      });

      message.reply("**تم تفعيل المنشن والصور بالشات  **")

    }
}
