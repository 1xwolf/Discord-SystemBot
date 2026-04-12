const { MessageActionRow, MessageSelectMenu, MessageButton, Permissions } = require("discord.js");
const proDb = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require('pro.db');
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "tipanel",
  description: "Edit avatar commands",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    const selectMenu = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('vipMenu')
          .setPlaceholder('اختر إحدى الخيارات')
          .addOptions([
            {
              label: 'صورة التذكرة',
              description: 'تحديد صورة التذكرة',
              value: 'setimaget',
            },{
              label: 'تحديد الرولات',
              description: 'اضافة رولات التذكرة',
              value: 'settrole',
            },{
                label: 'تحديد لوج',

                description: 'تعين شات لوج التذكرة',
                value: 'setlog',
              },{
                label: 'تحديد كاتجوري',

                description: 'تحديد ايدي كاتجوري التذكرة',
                value: 'setcategory',
              },{
                label: 'تحديد أسباب',

                description: 'تحديد أسباب فتح التذاكر',
                value: 'setoptions',
              },{
                label: 'حذف سبب',

                description: 'حذف سبب محدد من الإسباب المضافة',
                value: 'deleteoption',
              },{
                label: 'ارسال رساله',

                description: 'ارسال رسالة عند فتح التذكرة',
                value: 'tcsend',
              },{
                label: 'إعادة تعين',

                description: 'حذف جميع إعدادت التذكرة',
                value: 'tcrestart',
              }
          ])
      );

    const deleteButton = new MessageButton()
      .setCustomId('Cancel')
      .setLabel('إلغاء')
      .setStyle('DANGER');

    const Cancel = new MessageActionRow()
      .addComponents(deleteButton);

    message.reply({ content:"**قائمة آوامر تعديل التذاكر**.",  components: [selectMenu, Cancel] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
      collector.stop();
    
      const choice = interaction.values[0];
    
      if (choice === "setimaget") {
        await interaction.message.delete(); 
        
        if (message.author.bot) return;
        
        let imageURL;
        
        if (args[0]) {
            imageURL = args[0];
            await saveImage(message.guild.id, imageURL);
            await message.reply('**تم حفظ الصورة بنجاح.** ✅');
        } else if (message.attachments.size > 0) {
            imageURL = message.attachments.first().url;
            await saveImage(message.guild.id, imageURL);
            await message.reply('**تم حفظ الصورة بنجاح.** ✅');
        } else {
            return message.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️").then(sentMessage => {
                const filter = m => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ filter, time: 60000 });
    
                collector.on('collect', async (msg) => {
                    if (msg.attachments.size > 0) {
                        imageURL = msg.attachments.first().url;
                        await saveImage(message.guild.id, imageURL);
                        message.react('✅');
                        sentMessage.edit("**تم حفظ الصورة بنجاح. ✅**");
                         await msg.delete().catch(console.error); // حذف الصورة من الشات بعد حفظها
                        collector.stop();
                    } else {
                        msg.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
                    }
                });
    
                collector.on('end', () => {
                    if (!imageURL) {
                        sentMessage.edit("**أنتهى وقت التعديل** ❌");
                    }
                });
            });
        }
    }
    
    async function saveImage(guildId, imageUrl) {
        const imageName = "Ticket.png"; // اسم الصورة الناتجة
        const imagePath = path.join(process.cwd(), "Fonts", imageName);
    
        // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
    
        // Save the image to the specified directory
        fs.writeFileSync(imagePath, buffer);
    
        Pro.set(`Image = [${guildId}]`, imagePath);
        
        
    }if (choice === "settrole") {
        await interaction.message.delete();
      
        const filter = m => m.author.id === message.author.id;
        const settroleMsg = await message.reply("**يرجى أرفاق منشن الرول او الايدي.** ⚙️");
      
        let roleID; // تعريف المتغير roleID خارج نطاق دالة المجمع
      
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });
      
        collector.on('collect', async (msg) => {
            collector.stop();
      
            // التحقق مما إذا كانت القيمة هي منشن لرول أو ايدي رول
            const mentionedRole = msg.mentions.roles.first();
            if (mentionedRole) {
                roleID = mentionedRole.id;
            } else {
                // يتم التحقق مما إذا كان النص المدخل يمثل ايدي رول صالح في السيرفر
                roleID = msg.content;
                const role = message.guild.roles.cache.get(roleID);
                if (!role) {
                    return message.reply("**يرجى تحديد رول صحيح!** ❌").then(sentMessage => {
                        sentMessage.delete({ timeout: 5000 });
                    });
                }
            }
      
            // حفظ الرول في قاعدة البيانات
            Pro.set(`Role = [${message.guild.id}]`, roleID);
            settroleMsg.edit("**تم حفظ الرول بنجاح.** ✅");
      
            // حذف رسالة الشخص التي تم إرسالها
            msg.delete();
        });
      
        collector.on('end', (collected, reason) => {
            if (reason === 'time' && !roleID) {
                settroleMsg.edit("**انتهى وقت التعديل** ❌");
            }
        });
        
        
    
    


    }if (choice === 'setlog') {
        await interaction.message.delete();
    
        let selectedChannelID;
    
        if (args[0]) {
            // إذا كان الإدخال عبارة عن ايدي للشات
            const channelID = args[0].replace(/\D/g, ''); // استخراج الأرقام فقط من النص
            if (message.guild.channels.cache.has(channelID)) {
                selectedChannelID = channelID;
            }
        }
    
        if (!selectedChannelID) {
            // إذا لم يتم تحديد قناة باستخدام الايدي، قم بالبحث عن منشن الشات في الرسالة
            const channelMention = message.mentions.channels.first();
            if (channelMention) {
                selectedChannelID = channelMention.id;
            } else {
                const requestMessage = await message.reply("**يرجى ارفاق منشن الشات او الايدي .** ⚙️");
                const filter = m => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ filter, time: 30000 });
    
                collector.on('collect', async (message) => {
                    const channel = message.mentions.channels.first();
                    if (channel) {
                        selectedChannelID = channel.id;
                        collector.stop();
                    } else {
                        const channelID = message.content.replace(/\D/g, '');
                        if (message.guild.channels.cache.has(channelID)) {
                            selectedChannelID = channelID;
                            collector.stop();
                        } else {
                            message.reply("**يرجى ارفاق منشن الشات او الايدي .**⚙️");
                        }
                    }
                });
    
                collector.on('end', () => {
                    if (!selectedChannelID) {
                        requestMessage.edit("**أنتهى وقت التعديل** ❌");
                    } else {
                        // حفظ القناة المحددة
                        Pro.set(`Channel = [${message.guild.id}]`, selectedChannelID);
                        requestMessage.edit("**تم حفظ القناة بنجاح.** ✅");
                        message.delete();
                    }
                });
            }
        } else {
            Pro.set(`Channel = [${message.guild.id}]`, selectedChannelID);
            message.reply("**تم حفظ القناة بنجاح.** ✅");
        }

    } if (choice === 'setcategory') {
        await interaction.message.delete();
    
        let categoryId;
    
        if (args[0]) {
            const categoryID = args[0];
            const channel = message.guild.channels.cache.get(categoryID);
            if (channel && channel.type === 'GUILD_CATEGORY') {
                categoryId = categoryID;
            }
        }
    
        if (!categoryId) {
            const requestMessage = await message.reply("**يرجى ارسال ايدي الكاتجوري.** ⚙️");
            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, time: 30000 });
    
            collector.on('collect', async (msg) => {
                const categoryID = msg.content;
                const channel = message.guild.channels.cache.get(categoryID);
                if (channel && channel.type === 'GUILD_CATEGORY') {
                    categoryId = categoryID;
                    collector.stop();
                } else {
                    msg.reply("**يرجى ارسال ايدي الكاتجوري.** ⚙️");
                }
            });
    
            collector.on('end', () => {
                if (!categoryId) {
                    requestMessage.edit("**انتهى الوقت المخصص للتعديل** ❌");
                } else {
                    Pro.set(`Cat = [${interaction.guild.id}]`, categoryId);
                    requestMessage.edit("**تم حفظ الكاتجوري بنجاح.** ✅");
                }
            });
        } else {
            Pro.set(`Cat = [${interaction.guild.id}]`, categoryId);
            message.reply("**تم حفظ الكاتجوري بنجاح.** ✅");
        }
        
        
        
            } if (choice === "setoptions") {
                await interaction.message.delete();
                const messageCollector = message.channel.createMessageCollector({
                  filter: (msg) => msg.author.id === message.author.id,
                  max: 1,
                });
              
                const options = await message.reply(`**يرجى ارفاق سبب فتح التذكرة.** ⚙️`);
              
                messageCollector.on("collect", async (msg) => {
                  let menuOptions = Pro.get(`menuOptions_${message.guild.id}`) || [];
              
                  // Check if the person has reached the limit
                  if (menuOptions.length >= 12) {
                    await message.reply({ content: `**لقد وصلت إلى الحد الأقصى! 🛑**`, ephemeral: true });
                    return messageCollector.stop(); // Stop collecting messages
                  }
              
                  // Check if the reason already exists
                  const newReason = msg.content.trim();
                  const existingReason = menuOptions.find((option) => option.label === newReason);
                  if (existingReason) {
                    await message.reply("**هذا الخيار موجود من قبل ❌**");
                    return messageCollector.stop(); // Stop collecting messages
                  }
              
                  // Ask for and collect the description
                  await options.edit(`**يرجى ارفاق وصف التذكرة.** 👏`);
              
                  const descriptionCollector = message.channel.createMessageCollector({
                    filter: (descMsg) => descMsg.author.id === message.author.id,
                    max: 1,
                  });
              
                  descriptionCollector.on("collect", async (descMsg) => {
                    const description = descMsg.content.trim();
              
                    // Generate new value
                    const newValue = `M${menuOptions.length + 1}`;
              
                    // Add new reason with description
                    menuOptions.push({
                      label: newReason,
                      value: newValue,
                      description: description,
                    });
              
                    Pro.set(`menuOptions_${message.guild.id}`, menuOptions);
                    await options.edit(`**يرجى ارفاق الاموجي.** 👌`);
              
              
                    const emojiCollector = message.channel.createMessageCollector({
                      filter: (emojiMsg) => emojiMsg.author.id === message.author.id,
                      max: 1,
                    });
              
                    emojiCollector.on("collect", async (emojiMsg) => {
                        const emojiInput = emojiMsg.content.trim();
                    
                        // Check if the input is emoji
                        if (!emojiInput.match(/<(a)?:.+:\d+>/)) {
                            await message.reply("**الرجاء ادخال اموجي صحيح! ❌**");
                            return;
                        }
                    
                        const emoji = emojiInput;
                    
                        const updatedOption = menuOptions.find((option) => option.label === newReason);
                        updatedOption.emoji = emoji;
                    
                        Pro.set(`menuOptions_${message.guild.id}`, menuOptions);
                        await options.edit("**تمت الإضافة بنجاح الآن**! ✅");
                    });
                    
                  });
                });
              
              



    } if (choice === "tcrestart") {
    await interaction.message.delete();

    const guildId = message.guild.id;

    if (Pro.get(`Channel = [${guildId}]`)) Pro.delete(`Channel = [${guildId}]`);
    if (Pro.get(`Role = [${guildId}]`)) Pro.delete(`Role = [${guildId}]`);
    if (Pro.get(`Image = [${guildId}]`)) Pro.delete(`Image = [${guildId}]`);
    if (Pro.get(`Cat = [${guildId}]`)) Pro.delete(`Cat = [${guildId}]`);
    if (Pro.get(`menuOptions_${guildId}`)) Pro.delete(`menuOptions_${guildId}`);
        const memberKey = `member${message.author.id}`;
        const channelKey = `channel${message.author.id}_${message.channel.id}`;
    if (Pro.get(memberKey)) Pro.delete(memberKey);
    if (Pro.get(channelKey)) Pro.delete(channelKey);

    message.reply("**تم إعادة تعين جميع إعدادت التذكرة بنجاح.** ✅")

    } if (choice === "deleteoption") {
        await interaction.message.delete();
        const messageCollector = message.channel.createMessageCollector({
            filter: (msg) => msg.author.id === message.author.id,
            max: 1,
        });
    
        const deletePrompt = await message.reply(`**الرجاء ارفاق اسم السبب الذي تريد حذفه.** ⚙️`);
    
        messageCollector.on("collect", async (msg) => {
            const reasonToDelete = msg.content.trim();
    
            let menuOptions = Pro.get(`menuOptions_${message.guild.id}`) || [];
    
            // Check if the reason exists
            const existingReasonIndex = menuOptions.findIndex((option) => option.label === reasonToDelete);
            if (existingReasonIndex === -1) {
                await message.reply("**هذا السبب غير موجود! ❌**");
                return messageCollector.stop(); // Stop collecting messages
            }
    
            // Delete the reason
            menuOptions.splice(existingReasonIndex, 1);
    
            Pro.set(`menuOptions_${message.guild.id}`, menuOptions);
            await deletePrompt.edit(`**تم حذف السبب بنجاح! ✅**`);
        });
    } if (choice === "tcsend") {
      await interaction.message.delete();

        
      let selectedContent;
  
      if (args[0]) {
          selectedContent = args.join(" ");
      }
  
      if (!selectedContent) {
          // إذا لم يتم تحديد نص
          const requestMessage = await message.reply("**يرجى إرفاق النص المراد إرسالة عند فتح التذكره.** ⚙️");
          const filter = m => m.author.id === message.author.id;
          const collector = message.channel.createMessageCollector({ filter, time: 30000 });
  
          collector.on('collect', async (msg) => {
            tcsend = msg.content;
              collector.stop();
          });
  
          collector.on('end', () => {
              if (!tcsend) {
                  requestMessage.edit("**أنتهى وقت التعديل** ❌");
              } else {
                  Pro.set(`tcsend_${message.guild.id}`, tcsend);
                  requestMessage.edit("**تم حفظ النص بنجاح.** ✅");
              }
          });
      } else {
          Pro.set(`tcsend_${message.guild.id}`, tcsend);
          message.reply("**تم حفظ النص بنجاح.** ✅");
  
      }
  }
    


    
        
    
    
    
    });
    

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel') {
        collector.stop();
        interaction.message.delete();
      }
    });
  },
};
