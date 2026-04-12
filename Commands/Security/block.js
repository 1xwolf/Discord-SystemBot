const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const Pro = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "block",
  run: async (client, message) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const allowDb = Pro.get(`Allow - Command block = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has("KICK_MEMBERS") && !owners.includes(message.author.id)) {
      return;
    }

    let targetId;

    // إذا تم ذكر عضو في الرسالة
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      targetId = mentionedUser.id;
    } else {
      // إذا تم إرفاق الأمر مع الأيدي مباشرة
      targetId = message.content.split(/\s+/)[1];
    }

    if (!targetId) {
      const embed = new MessageEmbed()
        .setColor(`${Color || "#1e1f22"}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}block <@${message.author.id}>**`);

      return message.reply({ embeds: [embed] });
    }

    const reasons = [
      { label: 'الحسابات الوهمية', description: `مؤبد`, value: 'الحسابات الوهمية' },
      { label: 'قذف - سب - روابط', description: `مؤبد`, value: 'قذف - سب - روابط' },
      { label: 'دخول وخروج من سيرفر', description: `مؤبد`, value: 'دخول وخروج من سيرفر' },
      { label: 'الدخول الي خاص والنشر', description: `مؤبد`, value: 'الدخول الي خاص والنشر' },
      { label: 'فري ميك - سب في الاصوات', description: `مؤبد`, value: 'فري ميك - سب في الاصوات' },
    ];

    const reasonMenu = new MessageSelectMenu()
      .setCustomId('block_reason')
      .setPlaceholder('اختر سبب الحظر')
      .addOptions(reasons);

    const deleteButton = new MessageButton()
      .setCustomId('Cancel4')
      .setLabel('الغاء')
      .setStyle('SECONDARY');

    const row = new MessageActionRow().addComponents(reasonMenu);
    const block = new MessageActionRow().addComponents(deleteButton);

    const replyMessage = await message.reply({ content: `**يرجي تحديد سبب البلاك لست.**\n** * <@${targetId}>**`, components: [row, block] });

    const filter = (interaction) => interaction.isSelectMenu() && interaction.user.id === message.author.id;

    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      const selectedReason = interaction.values[0];

      try {
        // قم بطرد العضو باستخدام الأيدي المحدد
        await message.guild.members.kick(targetId, `${selectedReason}`);
        
        // حفظ إيدي الشخص في قاعدة البيانات
        Pro.push(`blockedUsers_${targetId}`, true);


        const selectedUser = await client.users.fetch(targetId); // جلب معلومات المستخدم المحظور

        const logblocklist = Pro.get(`logblocklist_${message.guild.id}`);
        const logChannel = message.guild.channels.cache.find((c) => c.id === logblocklist);

        if (logChannel) {
          const logEmbed = new MessageEmbed()
            .setTitle('Blacklist')
            .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
            .addField('User', `<@${targetId}>`, true)
            .addField('By', `<@${message.author.id}>`, true)
            .addField('Time', '\`( مؤبد )\`', true) // يمكنك تعديل هذا الجزء حسب الحاجة
            .addField('Reason', selectedReason, true)
            .setColor("#525C74")
            .setFooter(selectedUser.username, selectedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 128 }))
            .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1223516030593274046/businessman.png?ex=661a2319&is=6607ae19&hm=ee6f09d5234ef05be8c162b92075a55b04fd503ef44140524ad0d0aca0de6370&")
            logChannel.send({ embeds: [logEmbed] });
        }




        const logkick = Pro.get(`logkick_${message.guild.id}`); // Fetching log kick channel ID from the database
        const loogChannel = message.guild.channels.cache.get(logkick);
        if (loogChannel) {
            const executor = message.author;
            const logEmbed = new MessageEmbed()
                .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
                .setDescription(`**طرد عضو**\n\n**العضو : <@${targetId}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`Reason : ${selectedReason}\`\`\`\ `)
                .setColor(`#493042`)
                .setFooter(selectedUser.username, selectedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 128 }))
                .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1209563150119211138/F4570260-9C71-432E-87CC-59C7B4B13FD4.png?ex=65e76077&is=65d4eb77&hm=5d7ef4be2c19a4f52c29255991dc129b53cf33d11c8d962ea0573cd72feaf3ac&`);
            loogChannel.send({ embeds: [logEmbed] });
        }

        message.react("✅");
      } catch (error) {
        console.error(error);
        message.react("❌");
      }

      interaction.message.delete();
    });


    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel4') {
        interaction.message.delete();
      }
    });
  },
};
