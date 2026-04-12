
const { prefix, owners } = require(`${process.cwd()}/config`);
const { MessageEmbed } = require('discord.js');
const Data = require("pro.db");
const Pro = require("pro.db");

module.exports = {
    name: `removealias`,
    aliases: [`removeshortcut`],
    run: async function (client, message) {


      if (!owners.includes(message.author.id)) return message.react('❌');
      const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
          return; 
      }

      const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
      if (!Color) return;
      

        const commandName = message.content.split(` `)[1];
        const aliasName = message.content.split(` `)[2];

        const command = client.commands.get(commandName);

        if (!command) {
            const embed = new MessageEmbed()
                .setColor(`${Color || `#f5f5ff`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}removealias ban حظر**`);
            return message.reply({ embeds: [embed] });
        }


        if (!command.aliases.includes(aliasName)) return message.reply(`**الامر غير موجود بالفعل**`);
        const aliasIndex = command.aliases.indexOf(aliasName);
        command.aliases.splice(aliasIndex, 1);
        Data.set(`aliases_${command.name}`, command.aliases); 
        message.react("✅");
    }
};
