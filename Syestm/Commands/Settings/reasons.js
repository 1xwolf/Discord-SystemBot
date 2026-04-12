const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const db = require('pro.db');
const { prefix, owners, Guild } = require(`${process.cwd()}/config`);
const ms = require('ms'); 

module.exports = {
  name: 'reasons',
  aliases: ['اضافه-سبب'],
  run: async (client, message, args) => {
    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';
    if (!Color) return;

    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('add_reason')
        .setLabel('إضافة')
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('edit_reason')
        .setLabel('تعديل')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('remove_reason')
        .setLabel('حذف')
        .setStyle('DANGER')
    );

    const embed = new MessageEmbed()
      .setColor(Color)
      .setDescription('يرجى اختيار العملية: إضافة، تعديل، أو حذف سبب.');

    const sentMessage = await message.reply({ embeds: [embed], components: [buttons] });

    const filter = interaction => interaction.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async interaction => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'add_reason') {
        await handleAddReason(interaction, message);
      } else if (interaction.customId === 'edit_reason') {
        const selectedType = await selectReasonType(interaction, message);
        if (!selectedType) return;

        const currentReasons = db.get(`${selectedType}_${message.guild.id}`) || [];
        if (currentReasons.length === 0) {
          await interaction.followUp({ content: 'لا توجد أسباب متاحة لتعديلها.', ephemeral: true });
          return;
        }

        const selectedReason = await selectReasonToEdit(interaction, currentReasons);
        if (!selectedReason) return;

        await handleEditReason(interaction, selectedType, currentReasons, selectedReason);
      } else if (interaction.customId === 'remove_reason') {
        const selectedType = await selectReasonType(interaction, message);
        if (!selectedType) return;

        const currentReasons = db.get(`${selectedType}_${message.guild.id}`) || [];
        if (currentReasons.length === 0) {
          await interaction.followUp({ content: 'لا توجد أسباب متاحة لحذفها.', ephemeral: true });
          return;
        }

        const selectedReason = await selectReasonToRemove(interaction, currentReasons);
        if (!selectedReason) return;

        await handleRemoveReason(interaction, selectedType, currentReasons, selectedReason);
      }
    });
  }
};

async function selectReasonType(interaction, message) {
  const menu = new MessageSelectMenu()
    .setCustomId('select_reason_type')
    .setPlaceholder('اختر نوع السبب')
    .addOptions([
      { label: 'أسباب الاسكات', value: 'mute_reasons' },
      { label: 'أسباب الميوت', value: 'vmute_reasons' }
      // Removed prisoner reasons here
    ]);

  const row = new MessageActionRow().addComponents(menu);

  await interaction.reply({ content: 'يرجى اختيار نوع السبب من القائمة:', components: [row], ephemeral: true });

  return new Promise(resolve => {
    const filter = i => i.user.id === message.author.id && i.isSelectMenu();
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', i => {
      resolve(i.values[0]);
      i.deferUpdate();
      collector.stop();
    });

    collector.on('end', () => resolve(null));
  });
}

async function handleAddReason(interaction, message) {
  const selectedType = await selectReasonType(interaction, message);
  if (!selectedType) return;

  await interaction.followUp({ content: 'يرجى إدخال سبب جديد والوقت (مثل "1h" لساعة واحدة):', ephemeral: true });

  const filter = response => response.author.id === interaction.user.id;
  const responseCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });

  responseCollector.on('collect', async response => {
    const [label, value] = response.content.split(' ');

    const timeInMillis = ms(value);
    if (!timeInMillis) {
      await interaction.followUp({ content: 'تنسيق الوقت غير صحيح. يرجى إدخال وقت صحيح مثل "1h".', ephemeral: true });
      return;
    }

    const currentReasons = db.get(`${selectedType}_${message.guild.id}`) || [];
    currentReasons.push({ label, value });
    db.set(`${selectedType}_${message.guild.id}`, currentReasons);

    await interaction.followUp({ content: `تم إضافة السبب "${label}" مع الوقت "${value}" بنجاح!`, ephemeral: true });
    responseCollector.stop();
  });
}

async function handleEditReason(interaction, selectedType, currentReasons, selectedReason) {
  await interaction.followUp({ content: 'ماذا تريد تعديل: الاسم أو الوقت؟', ephemeral: true });

  const filter = response => response.author.id === interaction.user.id;
  const responseCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });

  responseCollector.on('collect', async response => {
    const editOption = response.content.toLowerCase();

    if (editOption === 'الاسم') {
      await interaction.followUp({ content: 'يرجى إدخال الاسم الجديد:', ephemeral: true });

      const nameCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });

      nameCollector.on('collect', async nameResponse => {
        const newName = nameResponse.content;

        const reasonIndex = currentReasons.findIndex(r => r.label === selectedReason.label);
        currentReasons[reasonIndex].label = newName;

        db.set(`${selectedType}_${interaction.guild.id}`, currentReasons);
        await interaction.followUp({ content: `تم تعديل الاسم إلى "${newName}" بنجاح!`, ephemeral: true });

        nameCollector.stop();
      });

    } else if (editOption === 'الوقت') {
      await interaction.followUp({ content: 'يرجى إدخال الوقت الجديد (مثل "1h"):', ephemeral: true });

      const timeCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });

      timeCollector.on('collect', async timeResponse => {
        const newTime = timeResponse.content;
        const timeInMillis = ms(newTime);

        if (!timeInMillis) {
          await interaction.followUp({ content: 'تنسيق الوقت غير صحيح. يرجى إدخال وقت صحيح مثل "1h".', ephemeral: true });
          return;
        }

        const reasonIndex = currentReasons.findIndex(r => r.label === selectedReason.label);
        currentReasons[reasonIndex].value = newTime;

        db.set(`${selectedType}_${interaction.guild.id}`, currentReasons);
        await interaction.followUp({ content: `تم تعديل الوقت إلى "${newTime}" بنجاح!`, ephemeral: true });

        timeCollector.stop();
      });

    } else {
      await interaction.followUp({ content: 'خيار غير صحيح. الرجاء المحاولة مجددًا.', ephemeral: true });
      return;
    }

    responseCollector.stop();
  });
}

async function handleRemoveReason(interaction, selectedType, currentReasons, selectedReason) {
  const updatedReasons = currentReasons.filter(reason => reason.label !== selectedReason.label);
  db.set(`${selectedType}_${interaction.guild.id}`, updatedReasons);

  await interaction.followUp({ content: `تم حذف السبب "${selectedReason.label}" بنجاح.`, ephemeral: true });
}

async function selectReasonToEdit(interaction, currentReasons) {
  const menu = new MessageSelectMenu()
    .setCustomId('select_reason_to_edit')
    .setPlaceholder('اختر السبب للتعديل')
    .addOptions(currentReasons.map(reason => ({ label: reason.label, value: reason.label })));

  const row = new MessageActionRow().addComponents(menu);

  await interaction.followUp({ content: 'يرجى اختيار السبب للتعديل:', components: [row], ephemeral: true });

  return new Promise(resolve => {
    const filter = i => i.user.id === interaction.user.id && i.isSelectMenu();
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', i => {
      const selectedReason = currentReasons.find(r => r.label === i.values[0]);
      resolve(selectedReason);
      i.deferUpdate();
      collector.stop();
    });

    collector.on('end', () => resolve(null));
  });
}

async function selectReasonToRemove(interaction, currentReasons) {
  const menu = new MessageSelectMenu()
    .setCustomId('select_reason_to_remove')
    .setPlaceholder('اختر السبب للحذف')
    .addOptions(currentReasons.map(reason => ({ label: reason.label, value: reason.label })));

  const row = new MessageActionRow().addComponents(menu);

  await interaction.followUp({ content: 'يرجى اختيار السبب للحذف:', components: [row], ephemeral: true });

  return new Promise(resolve => {
    const filter = i => i.user.id === interaction.user.id && i.isSelectMenu();
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', i => {
      const selectedReason = currentReasons.find(r => r.label === i.values[0]);
      resolve(selectedReason);
      i.deferUpdate();
      collector.stop();
    });

    collector.on('end', () => resolve(null));
  });
}