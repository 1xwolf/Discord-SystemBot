const { MessageSelectMenu, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const config = require(`${process.cwd()}/config`);
const Data = require('pro.db');
const Pro = require('pro.db');

module.exports = {
  name: "setrjoin",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');

    const punishmentMenu = new MessageSelectMenu()
      .setCustomId('punishmentMenu')
      .setPlaceholder('يرجى الاختيار ..')
      .addOptions([
        {
          label: 'Kick',
          value: 'kick',
          emoji: '💡',
          description: 'طرد الحسابات الجديدة من السيرفر',
        },
        {
          label: 'Ban',
          value: 'ban',
          emoji: '💡',
          description: 'حظر الحسابات الجديدة من السيرفر',
        },
        {
          label: 'prison',
          value: 'prison',
          emoji: '💡',
          description: 'سجن الحسابات الجديدة من السيرفر',
        },
      ]);

    const selectRow = new MessageActionRow()
      .addComponents(punishmentMenu);

    const deleteButton = new MessageButton()
      .setCustomId('joincanls')
      .setLabel('الغاء')
      .setStyle('SECONDARY');

    const buttonRow = new MessageActionRow().addComponents(deleteButton);

    const reply = await message.reply({ content: '**أختار الاجراء المنآسب لك.**', components: [selectRow, buttonRow] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (!interaction.isSelectMenu()) return;

      const punishment = interaction.values[0];

      // Save the chosen punishment to the database
      await Data.set(`antijoinPunishment_${message.guild.id}`, punishment);

      // Delete the message
      try {
        await reply.delete();
        message.react("✅");
      } catch (error) {
        console.error('Error deleting message:', error);
      }

      collector.stop();

      switch (punishment) {
        case 'kick':
          // Handle kick action
          break;
        case 'ban':
          // Handle ban action
          break;
        case 'prison':
          // Handle mute action
          break;
        default:
          // Handle default action
          break;
      }
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'joincanls') {
        try {
          await interaction.message.delete();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }
    });
  },
};
