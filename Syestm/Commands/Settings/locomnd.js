const { MessageEmbed } = require('discord.js');
const { owners, prefix } = require(`${process.cwd()}/config`);
const Data = require('pro.db');

module.exports = {
  name: 'locomnd',
  run: (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');

    const commandName = args[0]; // اسم الملف الذي تريد تغيير حالته

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    if (!args[0]) {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}locomnd ban**`);
      return message.reply({ embeds: [embed] });
    }

    // التحقق مما إذا كان الأمر مفعل بالفعل
    const commandEnabled = Data.get(`command_enabled_${commandName}`);
    if (commandEnabled === undefined) {
      // إذا كان الأمر غير موجود في البيانات، فقم بتعطيله
      Data.set(`command_enabled_${commandName}`, false); 
      message.react('✅');
    } else if (!commandEnabled) {
      // إذا كان الأمر معطل، قم بتفعيله
      Data.set(`command_enabled_${commandName}`, true); 
      message.react('✅');
    } else {
      // إذا كان الأمر مفعل، قم بتعطيله
      Data.set(`command_enabled_${commandName}`, false); 
      message.react('✅');
    }
  }
};
