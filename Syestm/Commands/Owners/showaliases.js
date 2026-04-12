const { MessageEmbed } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require("pro.db");

module.exports = {
  name: "showaliases",
  aliases: ["aliases", "listaliases", "listlcomnd"],
  run: async function (client, message) {
    
    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const commandsMap = new Map();
    const processedCommands = new Set(); // لتتبع الأوامر التي تمت معالجتها بالفعل

    // تتبع الأوامر والاختصارات المتعلقة بها
    client.commands.forEach((command) => {
      if (!processedCommands.has(command.name)) {
        const aliases = Data.get(`aliases_${command.name}`);
        if (aliases) {
          if (!commandsMap.has(command.name)) {
            commandsMap.set(command.name, []);
          }
          const aliasesString = aliases.join(", ");
          commandsMap.get(command.name).push(aliasesString);
        }
        processedCommands.add(command.name);
      }
    });

    // إنشاء الرسالة
    let aliasesMessage = "";
    commandsMap.forEach((aliases, commandName) => {
      const aliasesString = aliases.join(", ");
      aliasesMessage += `**${commandName}** : \`${aliasesString}\`\n`;
    });

    const embed = new MessageEmbed()
      .setDescription(aliasesMessage || "**قائمة الأختصارت فارغه **")
      .setColor(Color || "#f5f5ff")
      .setFooter(client.user.username, client.user.displayAvatarURL());

    message.reply({ embeds: [embed] });
  },
};
