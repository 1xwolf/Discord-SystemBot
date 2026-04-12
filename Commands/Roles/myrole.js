const { MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const Pro = require(`pro.db`);

module.exports = {
  name: "myrole",
  aliases: ["رولي"],
  run: async (client, message) => {
    const userID = message.author.id;
    const userRoles = Pro.get(`userRoles_${userID}`);

    if (userRoles && userRoles.length > 0) {
      const rolesMentions = userRoles.map(roleID => `<@&${roleID}>`).join(", ");

      const selectMenu = new MessageSelectMenu()
        .setCustomId('roleOptions')
        .setPlaceholder('يرجى الاختيار ..')
        .addOptions([
          {
            label: 'اسم الرول',
            description: 'تغير اسم رولك الخاص.',
            value: 'roleName',
          },
          {
            label: 'لون الرول',
            description: 'تغير لون رولك الخاص.',
            value: 'roleColor',
          },
          {
            label: 'صورة الرول',
            description: 'إضافة اموجي او صورة لروك الخاص.',
            value: 'roleImage',
          },
         ,{
            label: 'مشاركة الرول ',
            description: 'اعطاء الرول لأي شخص ليكون لدية نفس الرول',
            value: 'giveMyRole',
          },{
            label: 'إزالة مشاركة',
            description: 'ازالة الرول من شخص كان لدية الرول',
            value: 'removeRole',
          }, {
            label: 'حذف الرول',
            value: 'deleteRole',
          }
        ]);

        const deleteButton = new MessageButton()
        .setCustomId('Cancel3')
        .setLabel('الغاء')
        .setStyle('SECONDARY');

      const row = new MessageActionRow().addComponents(selectMenu);
      const buttonRow = new MessageActionRow().addComponents(deleteButton);

      const replyMessage = await message.reply({ content: `**الرول الخاص : ${rolesMentions}**`,  components: [row, buttonRow], ephemeral: true });

      const filter = (interaction) => interaction.customId === 'roleOptions' && interaction.user.id === userID;

      const collector = replyMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (interaction) => {
        const selectedOption = interaction.values[0];

        if (selectedOption === 'roleColor') {
          await interaction.deferUpdate();
      
          const colorMessage = await interaction.followUp({ content: '**أرسل كود اللون فـ الشات ( مثال #ffffff ) .**', ephemeral: true });
      
          const colorFilter = (response) => response.author.id === userID;
          const colorCollector = message.channel.createMessageCollector({ colorFilter, time: 60000 });
      
          colorCollector.on('collect', async (response) => {
            if (response.author.id !== userID) {
              // الرسالة ليست من قبل الشخص الذي استخدم الأمر
              return;
            }
      
            const roleColor = response.content;
      
            // تحديث لون الرول
            userRoles.forEach(roleID => {
              const role = message.guild.roles.cache.get(roleID);
              if (role) role.setColor(roleColor).catch(err => {
              });
            });
      
            // رد على الشخص بأن تم تحديث لون الرول بنجاح
            await message.react("✅");
            replyMessage.delete();
            colorCollector.stop();
          });
        
        } else if (selectedOption === 'deleteRole') {
          // قم بحذف الرول هنا
          userRoles.forEach(roleID => {
            const role = message.guild.roles.cache.get(roleID);
            if (role) role.delete();
          });

          Pro.delete(`userRoles_${userID}`);
          await message.react("✅");
          replyMessage.delete()


        } else if (selectedOption === 'roleName') {
          // اختيار اسم الرول
          await interaction.deferUpdate();

          const nameMessage = await interaction.followUp({ content: '**أرسل اسم الرول الجديد في الشات.**', ephemeral: true });

          const nameFilter = (response) => response.author.id === userID;
          const nameCollector = message.channel.createMessageCollector({ nameFilter, time: 60000 });

          nameCollector.on('collect', async (response) => {
            if (response.author.id !== userID) {
              // الرسالة ليست من قبل الشخص الذي استخدم الأمر
              return;
            }

            const newRoleName = response.content;

            // تحديث اسم الرول في السيرفر
            userRoles.forEach(roleID => {
              const role = message.guild.roles.cache.get(roleID);
              if (role) role.setName(newRoleName).catch(err => {
                console.error(err);
              });
            });

            // رد على الشخص بأن تم تحديث اسم الرول بنجاح
            await message.react("✅");
            replyMessage.delete();
            nameCollector.stop();
          });
        }
      });


      collector.on('collect', async (interaction) => {
        const selectedOption = interaction.values[0];
      
        if (selectedOption === 'roleImage') {
          await interaction.deferUpdate();
      
          const imageMessage = await interaction.followUp({ content: '**أرسل الإيموجي الذي تريد تعيينه كصورة للرول.**', ephemeral: true });
      
          const imageFilter = (response) => {
            return response.author.id === userID && (
              response.content.startsWith('<:') && response.content.endsWith('>') ||
              response.attachments.size > 0
            );
          };
          
          const imageCollector = message.channel.createMessageCollector({ filter: imageFilter, time: 60000 });
          
          imageCollector.on('collect', async (response) => {
            if (response.author.id !== userID) {
              return;
            }
          
            let emojiURL;
          
            if (response.content.startsWith('<:') && response.content.endsWith('>')) {
              // إذا كانت الرسالة تحتوي على إيموجي
              const emojiText = response.content;
              const emojiId = emojiText.match(/(?<=:)\d+(?=>)/);
          
              if (emojiId) {
                emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
              } else {
                await interaction.followUp({ content: '**الرجاء إرسال إيموجي صحيح.**', ephemeral: true });
                return;
              }
            } else if (response.attachments.size > 0) {
              // إذا كانت الرسالة تحتوي على صورة
              const attachment = response.attachments.first();
              emojiURL = attachment.url;
            } else {
              await interaction.followUp({ content: '**الرجاء إرسال إيموجي أو صورة صحيحة.**', ephemeral: true });
              return;
            }
          
            // تحديث صورة الرول
            userRoles.forEach(roleID => {
              const role = message.guild.roles.cache.get(roleID);
              if (role) role.setIcon(emojiURL).catch(err => {
                console.error(err);
              });
            });
          
            // رد على الشخص بأن تم تحديث صورة الرول بنجاح
            await message.react("✅");
            replyMessage.delete();
            imageCollector.stop();
          });
        } else if (selectedOption === 'giveMyRole') {
          await interaction.deferUpdate();
        
          const mentionMessage = await interaction.followUp({ content: '**ارسل منشن الشخص الذي تريد اعطاؤه الرول.**', ephemeral: true });
        
          const mentionFilter = (response) => response.author.id === userID && response.mentions.users.size > 0;
          const mentionCollector = message.channel.createMessageCollector({ filter: mentionFilter, time: 60000 });
        
          mentionCollector.on('collect', async (response) => {
            const mentionedUser = response.mentions.users.first();
        
            if (!mentionedUser) {
              await interaction.followUp({ content: '**الرجاء ارسال منشن صحيح للشخص.**', ephemeral: true });
              return;
            }
        
            const member = message.guild.members.cache.get(mentionedUser.id);
        
            if (!member) {
              await interaction.followUp({ content: '**هذا الشخص غير موجود في السيرفر.**', ephemeral: true });
              return;
            }
        
            // إعطاء الرول للشخص المنشن
            userRoles.forEach(roleID => {
              const role = message.guild.roles.cache.get(roleID);
              if (role) member.roles.add(role).catch(err => {
                console.error(err);
              });
            });
        
            await interaction.followUp({ content: `**تم اعطاء الرول بنجاح لـ ${mentionedUser}.**`, ephemeral: true });
            replyMessage.delete();
            mentionCollector.stop();
          });
        } else if (selectedOption === 'removeRole') {
          await interaction.deferUpdate();
        
          const mentionMessage = await interaction.followUp({ content: '**ارسل منشن الشخص الذي تريد ازالة الرول منه.**', ephemeral: true });
        
          const mentionFilter = (response) => response.author.id === userID && response.mentions.users.size > 0;
          const mentionCollector = message.channel.createMessageCollector({ filter: mentionFilter, time: 60000 });
        
          mentionCollector.on('collect', async (response) => {
            const mentionedUser = response.mentions.users.first();
        
            if (!mentionedUser) {
              await interaction.followUp({ content: '**الرجاء ارسال منشن صحيح للشخص.**', ephemeral: true });
              return;
            }
        
            const member = message.guild.members.cache.get(mentionedUser.id);
        
            if (!member) {
              await interaction.followUp({ content: '**هذا الشخص غير موجود في السيرفر.**', ephemeral: true });
              return;
            }
        
            // إزالة الرول من الشخص المنشن
            userRoles.forEach(roleID => {
              const role = message.guild.roles.cache.get(roleID);
              if (role) member.roles.remove(role).catch(err => {
                console.error(err);
              });
            });
        
            await interaction.followUp({ content: `**تم إزالة الرول بنجاح من ${mentionedUser}.**`, ephemeral: true });
            replyMessage.delete();
            mentionCollector.stop();
          });
        }
        
        

        
      })


      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
  
        if (interaction.customId === 'Cancel3') {
          interaction.message.delete();
        }
      }); 


    }
  },
};
