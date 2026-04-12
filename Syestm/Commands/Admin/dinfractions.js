const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const db = require('pro.db');

module.exports = {
  name: 'dinfractions',
  aliases: ['عقوبات'],
  run: async (client, message, args) => {
    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
    if (!Color) return;

    const allowedRoleId = db.get(`Allow_Command_modifyinfraction_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.react('❌');
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}modifyinfraction <@عضو>**`);
      return message.reply({ embeds: [embed] });
    }

    // Create buttons for selecting punishment type, split into two rows
    const row1 = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('add_mute')
          .setLabel('إضافة اسكات')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('add_voicemute')
          .setLabel('إضافة ميوت ')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('add_prison')
          .setLabel('إضافة سجن')
          .setStyle('SECONDARY')
      );

    const row2 = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('remove_mute')
          .setLabel('حذف اسكات')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('remove_voicemute')
          .setLabel('حذف ميوت ')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('remove_prison')
          .setLabel('حذف سجن')
          .setStyle('SECONDARY')
      );

    const embed = new MessageEmbed()
      .setColor(Color)
      .setDescription(`**يرجى اختيار نوع العقوبة التي تريد تعديلها للمستخدم ${member.user.tag}:**`);

    const msg = await message.reply({ embeds: [embed], components: [row1, row2] });

    const filter = interaction => interaction.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async interaction => {
      const action = interaction.customId.split('_')[0];
      const type = interaction.customId.split('_')[1];
      const isAdding = action === 'add';

      // Ask for the amount
      await interaction.reply(`**يرجى إدخال عدد العقوبات التي تريد ${isAdding ? 'إضافتها' : 'إزالتها'} لنوع ${type}.**`);

      const collectorAmount = message.channel.createMessageCollector({
        filter: response => response.author.id === message.author.id,
        time: 30000
      });

      collectorAmount.on('collect', async response => {
        const number = parseInt(response.content);

        if (isNaN(number) || number <= 0) {
          return response.reply('**يرجى إدخال رقم صحيح أكبر من الصفر.**');
        }

        // Update database based on action and type
        const field = isAdding ? 'add' : 'subtract';
        if (type === 'mute') {
          db[field](`Total_Mutes_${member.id}`, number);
        } else if (type === 'voicemute') {
          db[field](`Total_voice_${member.id}`, number);
        } else if (type === 'prison') {
          db[field](`Total_Prisons_${member.id}`, number);
        }

        const actionDescription = isAdding ? 'إضافة' : 'حذف';
        const logEmbed = new MessageEmbed()
          .setColor(Color)
          .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
          .setDescription(`**تم ${actionDescription} ${number} عقوبة/عقوبات من نوع ${type} للمستخدم ${member.user.tag}**`);

        await interaction.editReply({ embeds: [logEmbed], components: [] });
        collectorAmount.stop();
      });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        msg.edit({ components: [] });
      }
    });
  }
};
