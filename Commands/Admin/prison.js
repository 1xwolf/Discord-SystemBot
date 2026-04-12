// Import necessary components
const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const db = require('pro.db');

module.exports = {
  name: 'prison',
  aliases: ['سجن'],
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
    if (!Color) return;

    const allowDb = db.get(`Allow - Command prison = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has('MUTE_MEMBERS')) {
      return message.reply('❌ - **ليس لديك الصلاحية لتنفيذ هذا الأمر.**');
    }

    let args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new MessageEmbed()
        .setColor(Color || '#f5f5ff')
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}سجن <@user>**`);
      return message.reply({ embeds: [embed] });
    }

    // منع السجن عن النفس أو عن البوت
    if (member.id === message.member.id || member.user.bot) {
      return message.react('❌');
    }

    // منع السجن عن الأعضاء ذوي المراكز العليا
    if (message.member.roles.highest.position <= member.roles.highest.position) {
      return message.react('❌');
    }

    const menuOptions = [
      { label: 'مشاكل متكررة | 1', value: 'مشاكل متكررة' },
      { label: 'قذف , سب , تشفير | 2', value: 'قذف , سب , تشفير' },
      { label: 'يدخل حسابات وهمية | 3', value: 'يدخل حسابات وهمية' },
      { label: 'يُروج فالخاص لسيرفر | 4', value: 'يُروج فالخاص لسيرفر' },
    ];

    const menu = new MessageSelectMenu()
      .setCustomId('prison_menu')
      .setPlaceholder('اختر عقوبة العضو ووقت السجن')
      .addOptions(menuOptions);

    const deleteButton = new MessageButton()
      .setCustomId('Cancel')
      .setLabel('الغاء')
      .setStyle('SECONDARY');

    const menuRow = new MessageActionRow().addComponents(menu);
    const buttonRow = new MessageActionRow().addComponents(deleteButton);

    message.reply({ content: `**يرجي تحديد سبب العقوبه.**\n** * <@${member.id}>**`, components: [menuRow, buttonRow] });

    const filter = (interaction) => interaction.isSelectMenu() && interaction.user.id === message.author.id;

    const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 });

    collector.on('collect', async (interaction) => {
      const selectedOption = interaction.values[0];
      const time = selectedOption === 'مشاكل متكررة' ? '1d' :
                   selectedOption === 'قذف , سب , تشفير' ? '2d' :
                   selectedOption === 'يدخل حسابات وهمية' ? '2d' :
                   selectedOption === 'يُروج فالخاص لسيرفر' ? '5d' : Infinity;

      const endDate = moment().add(ms(time));

      let prisonRole = message.guild.roles.cache.find(role => role.name === 'prison');
      if (!prisonRole) {
        prisonRole = await message.guild.roles.create({
          name: 'prison',
          permissions: [],
        });

        message.guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT').forEach(channel => {
          channel.permissionOverwrites.create(prisonRole, {
            SEND_MESSAGES: false,
            VIEW_CHANNEL: false,
          });
        });
      }

      if (member.roles.cache.has(prisonRole.id)) {
        return interaction.reply(`**هذا العضو بالفعل في السجن.**`);
      }

      await member.roles.add(prisonRole);

       const logData = {
       time: time,
       reason: selectedOption,
       channel: message.channel.id,
       by: message.author.id,
       to: member.id,
       endDate: endDate.toISOString(),  // Save the end date too
     };

      db.set(`prison_${member.id}`, logData);
	  // بعد كود إضافة العقوبة
      const prisonData = {
      time: time,
      reason: selectedOption,
      channel: message.channel.id,
      by: message.author.id,
      to: member.id,
      endDate: endDate.toISOString(), // Save the end date too
      };

      // Retrieve existing prison records or initialize an empty array
      const existingPrisons = db.get(`Prisoned_Members_${member.id}`) || [];
      existingPrisons.push(prisonData); // Add the new prison record to the existing records

      db.set(`prison_${member.id}`, logData);
      db.add(`Total_Prisons_${member.id}`, 1); // Increment total prisons count
      db.set(`Prisoned_Members_${member.id}`, existingPrisons);

      const timeLeft = ms(ms(time), { long: true });
      message.react("✅");
      interaction.message.delete();

      const logChannelID = db.get(`logprisonunprison_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find(channel => channel.id === logChannelID);

      if (logChannel) {
        const logEmbed = new MessageEmbed()
          .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
          .setColor('#707487')
          .setDescription(`**سجن عضو\n\nالعضو : <@${member.id}>\nبواسطة : <@${message.author.id}>\n[Message](${message.url})\nالوقت : \`${timeLeft}\`\nينفك فيـ : \`${endDate.format('LLLL')}\`**\n\`\`\`Prison : ${selectedOption}\`\`\``)
          .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1224588302393540638/bars.png?ex=661e09bb&is=660b94bb&hm=198f684aacf261c80430479f57f365b8c3dd11aa914b5c382240a2adbe33b00a&')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        logChannel.send({ embeds: [logEmbed] });
      }

      // Check if unprison system is enabled
      const unprisonEnabled = db.get(`check_unprison_enabled_${message.guild.id}`);
      if (unprisonEnabled) {
        // Remove from the server after certain time
        setTimeout(async () => {
          db.delete(`prison_${member.id}`);
          await member.roles.remove(prisonRole);
          message.channel.send(`:ballot_box_with_check: <@${member.id}> تم رفع العقوبة!`);

          // Optional: Log the release
          if (logChannel) {
            const releaseEmbed = new MessageEmbed()
              .setColor('#00FF00')
              .setDescription(`**رفع العقوبة:** \n<@${member.id}> has been released from prison. Reason was: \`${selectedOption}\``);
            logChannel.send({ embeds: [releaseEmbed] });
          }
        }, ms(time));
      }
    });

    collector.on('end', (collected, reason) => {
      if (!collected.size) {
        message.reply("**يرجى اختيار سبب !**").then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 80000);
        });
      }
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel') {
        const muteRole = message.guild.roles.cache.find(role => role.name === 'prison');
        if (muteRole) {
          await member.roles.remove(muteRole);
          await interaction.message.delete();
          interaction.reply(`❌ - **تم إلغاء العقوبة للعضو <@${member.id}>**.`);
        }
      }
    });
  }
};