const { prefix, owners } = require(`${process.cwd()}/config`);
const { MessageEmbed } = require('discord.js');
const Data = require("pro.db");

module.exports = {
    name: "addalias",
    aliases: ["addalias", "acomnd"],
    run: async function (client, message) {

        // Check if the user is an owner
        if (!owners.includes(message.author.id)) return message.react('❌');
        
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = Data.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const commandName = message.content.split(" ")[1];
        const aliasName = message.content.split(" ")[2];
        const command = client.commands.get(commandName);

        // Check if the command exists
        if (!command) {
            const embed = new MessageEmbed()
                .setColor(Color)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}acomnd ban حظر**`);
            return message.reply({ embeds: [embed] });
        }

        // Check if alias name is provided
        if (!aliasName) return message.reply("**يرجى ادخال اسم الاختصار.**");
        
        // Check if the alias already exists
        if (command.aliases.includes(aliasName)) {
            return message.reply("**الإختصار موجود بالفعل.**");
        }

        // Add the alias to the command
        command.aliases.push(aliasName);
        client.commands.set(command.name, command);

        // Save the updated aliases to the database
        Data.set(`aliases_${command.name}`, command.aliases);

        // Create and send the success embed
        const embed = new MessageEmbed()
            .setColor(Color)
            .setDescription(`**تم إضافة اختصار \`${aliasName}\` للأمر \`${commandName}\` بنجاح!**`)
            .addField('Current Aliases:', command.aliases.join(', ') || 'لا يوجد.');
        
        message.reply({ embeds: [embed] });
    },
};