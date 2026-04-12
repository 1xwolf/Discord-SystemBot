const { MessageActionRow, MessageSelectMenu, MessageButton, MessageEmbed } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
const db = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: 'edit-wlc',
    description: 'Edit user details',
    run: async (client, message, args) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) return;

        registerFont(`./Fonts/Cairo-Regular.ttf`, { family: 'Cairo' });

        // ── Helper: بناء الـ embed preview ──────────────────────────────────
        async function buildWelcomeEmbed(member, canvasBuffer, gifURL = null, isGif = false) {
            const createdAt = member.user.createdAt;
            const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
            const years   = Math.floor(ageDays / 365);
            const months  = Math.floor((ageDays % 365) / 30);
            const days    = ageDays % 30;
            let ageText = '';
            if (years  > 0) ageText += `${years} سنة `;
            if (months > 0) ageText += `${months} شهر `;
            if (days   > 0) ageText += `${days} يوم`;
            if (!ageText)   ageText  = 'أقل من يوم';

            const Color = db.get(`Guild_Color-${member.guild.id}`) || '#5865F2';

            const embed = new MessageEmbed()
                .setColor(Color)
                .setTitle(`🎉 Welcome User! **${member.guild.name}**`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(`<@${member.id}> **(${member.user.tag})**
has joined the server!`)
                .addFields(
                    { name: '📅 Account Age', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>
*(${ageText})*`, inline: true },
                    { name: '👥 Member Count', value: `**${member.guild.memberCount}**`, inline: true }
                )
                .setFooter(`${member.guild.name}`, member.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            if (isGif && gifURL) {
                // GIF محلي → attachment دائماً (لا يمكن استخدام المسار المحلي كـ URL)
                embed.setImage('attachment://welcome_embed.gif');
                return { embeds: [embed], files: [{ attachment: gifURL, name: 'welcome_embed.gif' }] };
            } else if (canvasBuffer) {
                // صورة عادية → attachment
                embed.setImage('attachment://welcome.png');
                return { embeds: [embed], files: [{ attachment: canvasBuffer, name: 'welcome.png' }] };
            } else {
                return { embeds: [embed], files: [] };
            }
        }

        const initialMenu = new MessageSelectMenu()
            .setCustomId('edit_select')
            .setPlaceholder('اختر ما تريد تحريره')
            .addOptions([
                { label: 'إحديثات الاسم',  value: 'username', emoji: '⚒️' },
                { label: 'إحديثات الافتار', value: 'avatar',   emoji: '⚒️' },
                { label: 'صورة الإمبيد',   value: 'image_embed', emoji: '🖼️' },
                { label: 'صورة الرسالة',   value: 'image_msg',   emoji: '📷' },
                { label: 'شات الولكم',      value: 'channel',  emoji: '⚒️' },
                { label: 'رسالة الولكم',    value: 'messg',    emoji: '⚒️' },
                { label: 'نوع الولكم',      value: 'style',    emoji: '🎨' },
                { label: 'معاينة الولكم',   value: 'preview',  emoji: '👁️' },
            ]);

        const deleteButton = new MessageButton()
            .setCustomId('Cancele')
            .setLabel('إلغاء')
            .setStyle('DANGER');

        const Cancele        = new MessageActionRow().addComponents(deleteButton);
        const initialMenuRow = new MessageActionRow().addComponents(initialMenu);

        await message.reply({
            embeds: [{
                title: '**يرجى تحديد نوع التعديل**',
                footer: { text: client.user.username, iconURL: client.user.displayAvatarURL() }
            }],
            components: [initialMenuRow, Cancele]
        });

        const filter    = (interaction) => interaction.user.id === message.author.id && interaction.isSelectMenu();
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) return;
            let selectedOption;
            if (!interaction.optionUsed) {
                selectedOption = interaction.values[0];
                interaction.optionUsed = true;
            }

            // ── تحرير الاسم ─────────────────────────────────────────────────
            if (selectedOption === 'username') {
                await interaction.message.delete();
                if (message.author.bot) return;

                const canvas = createCanvas(826, 427);
                const ctx    = canvas.getContext('2d');
                let x        = canvas.width / 2;
                let y        = canvas.height / 2;
                let fontSize = 40;
                const username     = message.author.displayName;
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);

                let backgroundImage;
                if (backgroundImageURL) {
                    backgroundImage   = await loadImage(backgroundImageURL);
                    canvas.width      = backgroundImage.width;
                    canvas.height     = backgroundImage.height;
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = 'rgba(0,0,0,0)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                const userAvatarURL  = message.author.displayAvatarURL({ format: 'png', size: 1024 });
                const avatar         = await loadImage(userAvatarURL);
                const avatarUpdates  = Data.get(`editwel_${message.guild.id}`) || { size: 260, x: 233, y: 83.5, isCircular: true };
                const { size, x: avatarX, y: avatarY, isCircular } = avatarUpdates;

                ctx.save();
                if (isCircular) {
                    ctx.beginPath();
                    ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(avatar, avatarX, avatarY, size, size);
                ctx.restore();

                ctx.font      = `${fontSize}px Cairo`;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(username, x, y);

                const row1 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('up').setEmoji('⬆️').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('down').setEmoji('⬇️').setStyle('PRIMARY')
                );
                const row2 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('left').setEmoji('⬅️').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('right').setEmoji('➡️').setStyle('PRIMARY')
                );
                const row3 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('decrease').setEmoji('➖').setStyle('DANGER'),
                    new MessageButton().setCustomId('increase').setEmoji('➕').setStyle('SUCCESS')
                );
                const row4 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('save').setEmoji('✅').setStyle('SUCCESS')
                );

                const embedPayload   = await buildWelcomeEmbed(message.member, canvas.toBuffer());
                const sentMessage    = await message.channel.send({
                    content: '**تعديل إعدادات الترحيب ⚙️**',
                    ...embedPayload,
                    components: [row1, row2, row3, row4]
                });

                const btnFilter = (i) => i.message.id === sentMessage.id && i.isButton();
                const btnCol    = sentMessage.createMessageComponentCollector({ filter: btnFilter, time: 2000000 });
                let speed = 10;

                btnCol.on('collect', async (i) => {
                    if (i.user.id !== message.author.id) return;
                    if (i.replied) return;

                    if      (i.customId === 'up')       y -= speed;
                    else if (i.customId === 'down')     y += speed;
                    else if (i.customId === 'left')     x -= speed;
                    else if (i.customId === 'right')    x += speed;
                    else if (i.customId === 'increase') fontSize += 5;
                    else if (i.customId === 'decrease') fontSize = Math.max(8, fontSize - 5);
                    else if (i.customId === 'save') {
                        Data.set(`editname_${message.guild.id}`, { size: fontSize, x, y, isCircular });
                        [row1, row2, row3, row4].forEach(r => r.components.forEach(c => c.setDisabled(true)));
                        await i.update({ content: '**تم حفظ التحديثات بنجاح ✅**', embeds: [], files: [], components: [] });
                        return;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    else { ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, size, size);
                    ctx.restore();
                    ctx.font = `${fontSize}px Cairo`;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(username, x, y);

                    await i.deferUpdate().catch(() => {});
                    const updated = await buildWelcomeEmbed(message.member, canvas.toBuffer());
                    await sentMessage.edit({ content: '**تعديل إعدادات الترحيب ⚙️**', ...updated, components: [row1, row2, row3, row4] });
                });

                btnCol.on('end', () => {
                    [row1, row2, row3, row4].forEach(r => r.components.forEach(c => c.setDisabled(true)));
                    sentMessage.edit({ content: '**أنتهى وقت التعديل ❌**', embeds: [], files: [], components: [row1, row2, row3, row4] }).catch(() => {});
                });
            }

            // ── تعديل الافتار ────────────────────────────────────────────────
            if (selectedOption === 'avatar') {
                await interaction.message.delete();
                if (message.author.bot) return;

                const canvas = createCanvas(826, 427);
                const ctx    = canvas.getContext('2d');
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);

                let backgroundImage;
                if (backgroundImageURL) {
                    backgroundImage = await loadImage(backgroundImageURL);
                    canvas.width    = backgroundImage.width;
                    canvas.height   = backgroundImage.height;
                }

                const user       = message.author;
                const avatar     = await loadImage(user.displayAvatarURL({ format: 'png' }));
                let avatarSize   = 260;
                let avatarX      = (canvas.width - avatarSize) / 2;
                let avatarY      = (canvas.height - avatarSize) / 2;
                let isCircular   = true;

                if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                else { ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

                ctx.save();
                if (isCircular) {
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                const row1 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('zoomIn').setEmoji('➕').setStyle('SECONDARY'),
                    new MessageButton().setCustomId('up').setEmoji('⬆️').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('zoomOut').setEmoji('➖').setStyle('SECONDARY')
                );
                const row2 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('left').setEmoji('⬅️').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('save').setEmoji('✅').setStyle('SUCCESS'),
                    new MessageButton().setCustomId('right').setEmoji('➡️').setStyle('PRIMARY')
                );
                const row3 = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId('toggleShape').setEmoji('#️⃣').setStyle('SECONDARY'),
                    new MessageButton().setCustomId('down').setEmoji('⬇️').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('delete').setEmoji('❌').setStyle('DANGER')
                );

                const embedPayload = await buildWelcomeEmbed(message.member, canvas.toBuffer());
                const sentMessage  = await message.channel.send({
                    content: '**تعديل إعدادات الترحيب ⚙️**',
                    ...embedPayload,
                    components: [row1, row2, row3]
                });

                const btnFilter = (i) => i.message.id === sentMessage.id && i.isButton();
                const btnCol    = sentMessage.createMessageComponentCollector({ filter: btnFilter, time: 2000000 });
                let speed = 10, zoomSpeed = 15;

                btnCol.on('collect', async (i) => {
                    if (i.replied) return;
                    const member = i.member;
                    if (!member) return;

                    if      (i.customId === 'up')          avatarY -= speed;
                    else if (i.customId === 'down')        avatarY += speed;
                    else if (i.customId === 'left')        avatarX -= speed;
                    else if (i.customId === 'right')       avatarX += speed;
                    else if (i.customId === 'zoomIn')      avatarSize += zoomSpeed;
                    else if (i.customId === 'zoomOut')     avatarSize -= zoomSpeed;
                    else if (i.customId === 'toggleShape') isCircular = !isCircular;
                    else if (i.customId === 'save') {
                        Data.set(`editwel_${message.guild.id}`, { x: avatarX, y: avatarY, size: avatarSize, isCircular });
                        [row1, row2, row3].forEach(r => r.components.forEach(c => c.setDisabled(true)));
                        await i.update({ content: '**تم حفظ التحديثات بنجاح ✅**', embeds: [], files: [], components: [] });
                        return;
                    }
                    else if (i.customId === 'delete') {
                        ['mesg_message', 'imgwlc', 'chat_wlc', 'editwel'].forEach(k => {
                            if (Data.has(`${k}_${message.guild.id}`)) Data.delete(`${k}_${message.guild.id}`);
                        });
                        [row1, row2, row3].forEach(r => r.components.forEach(c => c.setDisabled(true)));
                        await i.update({ content: '**تم حذف إعدادات الولكم ✅**', embeds: [], files: [], components: [] });
                        return;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    else { ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                    ctx.restore();

                    await i.deferUpdate().catch(() => {});
                    const updated = await buildWelcomeEmbed(message.member, canvas.toBuffer());
                    await sentMessage.edit({ content: '**تعديل إعدادات الترحيب ⚙️**', ...updated, components: [row1, row2, row3] });
                });

                btnCol.on('end', () => {
                    [row1, row2, row3].forEach(r => r.components.forEach(c => c.setDisabled(true)));
                    sentMessage.edit({ content: '**أنتهى وقت التعديل ❌**', embeds: [], files: [], components: [row1, row2, row3] }).catch(() => {});
                });
            }

            // ── دالة حفظ الصورة ──────────────────────────────────────────────
            async function saveImgToDB(guildId, imageUrl, dbKey, filePrefix) {
                try {
                    const isGif  = imageUrl.toLowerCase().includes('.gif');
                    const ext    = isGif ? 'gif' : 'png';
                    const imgPath = path.join(process.cwd(), 'Fonts', `${filePrefix}.${ext}`);
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const buffer = await response.buffer();
                    fs.writeFileSync(imgPath, buffer);
                    Data.set(dbKey, imgPath);
                    return { ok: true, path: imgPath, isGif };
                } catch (e) {
                    console.error('saveImg error:', e);
                    return { ok: false };
                }
            }

            // ── صورة الإمبيد ─────────────────────────────────────────────────
            if (selectedOption === 'image_embed') {
                await interaction.message.delete();
                if (message.author.bot) return;
                let imageURL = null;
                if (args[0]) imageURL = args[0];
                else if (message.attachments.size > 0) imageURL = message.attachments.first().url;

                if (imageURL) {
                    const res = await saveImgToDB(message.guild.id, imageURL, `imgwlc_embed_${message.guild.id}`, 'welcome_embed');
                    res.ok ? message.react('✅') : message.reply('**فشل تحميل الصورة ❌**');
                } else {
                    const askMsg = await message.reply('**أرفق صورة الإمبيد (PNG / GIF) ⚙️**');
                    let saved = false;
                    const msgCol = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 60000 });
                    msgCol.on('collect', async (msg) => {
                        let url = null;
                        if (msg.attachments.size > 0)            url = msg.attachments.first().url;
                        else if (msg.content.startsWith('http')) url = msg.content.trim();
                        if (url) {
                            const res = await saveImgToDB(message.guild.id, url, `imgwlc_embed_${message.guild.id}`, 'welcome_embed');
                            await msg.delete().catch(() => {});
                            saved = true;
                            await askMsg.edit(res.ok ? '**تم حفظ صورة الإمبيد ✅**' : '**فشل التحميل ❌**');
                            msgCol.stop();
                        } else {
                            msg.reply('**أرسل صورة أو رابط https:// ⚙️**');
                        }
                    });
                    msgCol.on('end', () => { if (!saved) askMsg.edit('**انتهى الوقت ❌**').catch(() => {}); });
                }
            }

            // ── صورة الرسالة ─────────────────────────────────────────────────
            if (selectedOption === 'image_msg') {
                await interaction.message.delete();
                if (message.author.bot) return;
                let imageURL = null;
                if (args[0]) imageURL = args[0];
                else if (message.attachments.size > 0) imageURL = message.attachments.first().url;

                if (imageURL) {
                    const res = await saveImgToDB(message.guild.id, imageURL, `imgwlc_msg_${message.guild.id}`, 'welcome_msg');
                    res.ok ? message.react('✅') : message.reply('**فشل تحميل الصورة ❌**');
                } else {
                    const askMsg = await message.reply('**أرفق صورة الرسالة (PNG / GIF) ⚙️**');
                    let saved = false;
                    const msgCol = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 60000 });
                    msgCol.on('collect', async (msg) => {
                        let url = null;
                        if (msg.attachments.size > 0)            url = msg.attachments.first().url;
                        else if (msg.content.startsWith('http')) url = msg.content.trim();
                        if (url) {
                            const res = await saveImgToDB(message.guild.id, url, `imgwlc_msg_${message.guild.id}`, 'welcome_msg');
                            await msg.delete().catch(() => {});
                            saved = true;
                            await askMsg.edit(res.ok ? '**تم حفظ صورة الرسالة ✅**' : '**فشل التحميل ❌**');
                            msgCol.stop();
                        } else {
                            msg.reply('**أرسل صورة أو رابط https:// ⚙️**');
                        }
                    });
                    msgCol.on('end', () => { if (!saved) askMsg.edit('**انتهى الوقت ❌**').catch(() => {}); });
                }
            }
            // ── شات الولكم ──────────────────────────────────────────────────
            if (selectedOption === 'channel') {
                await interaction.message.delete();

                let selectedChannelID;

                if (args[0]) {
                    const channelID = args[0].replace(/\D/g, '');
                    if (message.guild.channels.cache.has(channelID)) selectedChannelID = channelID;
                }

                if (!selectedChannelID) {
                    const channelMention = message.mentions.channels.first();
                    if (channelMention) {
                        selectedChannelID = channelMention.id;
                    } else {
                        const requestMessage = await message.reply('**يرجى ارفاق منشن الشات او الايدي .** ⚙️');
                        const msgFilter = m => m.author.id === message.author.id;
                        const msgCol    = message.channel.createMessageCollector({ filter: msgFilter, time: 30000 });

                        msgCol.on('collect', async (msg) => {
                            const channel = msg.mentions.channels.first();
                            if (channel) {
                                selectedChannelID = channel.id;
                                msgCol.stop();
                            } else {
                                const channelID = msg.content.replace(/\D/g, '');
                                if (message.guild.channels.cache.has(channelID)) {
                                    selectedChannelID = channelID;
                                    msgCol.stop();
                                } else {
                                    msg.reply('**يرجى ارفاق منشن الشات او الايدي .** ⚙️');
                                }
                            }
                        });

                        msgCol.on('end', () => {
                            if (!selectedChannelID) {
                                requestMessage.edit('**أنتهى وقت التعديل ❌**');
                            } else {
                                Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                                requestMessage.edit('**تم حفظ القناة بنجاح.** ✅');
                            }
                        });
                    }
                } else {
                    Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                    message.reply('**تم حفظ القناة بنجاح.** ✅');
                }
            }

            // ── رسالة الولكم ─────────────────────────────────────────────────
            if (selectedOption === 'messg') {
                await interaction.message.delete();

                let selectedContent;

                if (args[0]) selectedContent = args.join(' ');

                if (!selectedContent) {
                    const requestMessage = await message.reply('**يرجى إرفاق رسالة الترحيب** ⚙️\n```[user] : يذكر إسم العضو\n[inviter] : يذكر إسم الداعي\n[servername] : يذكر إسم السيرفر\n[membercount] : يذكر عدد أعضاء السيرفر```');
                    const msgFilter = m => m.author.id === message.author.id;
                    const msgCol    = message.channel.createMessageCollector({ filter: msgFilter, time: 30000 });

                    msgCol.on('collect', async (msg) => {
                        selectedContent = msg.content;
                        msgCol.stop();
                    });

                    msgCol.on('end', () => {
                        if (!selectedContent) {
                            requestMessage.edit('**أنتهى وقت التعديل ❌**');
                        } else {
                            Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                            requestMessage.edit('**تم حفظ النص بنجاح.** ✅');
                        }
                    });
                } else {
                    Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                    message.reply('**تم حفظ النص بنجاح.** ✅');
                }
            }

            // ── نوع الولكم ────────────────────────────────────────────────────
            if (selectedOption === 'style') {
                const currentStyle = Data.get(`wlc_style_${message.guild.id}`) || 'embed';

                const embedBtn = new MessageButton()
                    .setCustomId('style_embed')
                    .setLabel('🖼️ إمبيد')
                    .setStyle(currentStyle === 'embed' ? 'SUCCESS' : 'SECONDARY');

                const msgBtn = new MessageButton()
                    .setCustomId('style_message')
                    .setLabel('📷 رسالة (صورة فقط)')
                    .setStyle(currentStyle === 'message' ? 'SUCCESS' : 'SECONDARY');

                const styleRow = new MessageActionRow().addComponents(embedBtn, msgBtn);

                const styleMsg = await message.channel.send({
                    embeds: [{
                        title: '🎨 اختر نوع رسالة الولكم',
                        description: `**الوضع الحالي:** ${currentStyle === 'embed' ? '🖼️ إمبيد' : '📷 رسالة'}\n\n🖼️ **إمبيد** — يظهر معلومات العضو + الداعي + الصورة داخل بطاقة منظمة\n📷 **رسالة** — يرسل الصورة مباشرة بدون بطاقة`,
                        color: 0x5865F2
                    }],
                    components: [styleRow]
                });

                const styleFilter = i => i.message.id === styleMsg.id && i.isButton() && i.user.id === message.author.id;
                const styleCol    = styleMsg.createMessageComponentCollector({ filter: styleFilter, time: 30000 });

                styleCol.on('collect', async i => {
                    const chosen = i.customId === 'style_embed' ? 'embed' : 'message';
                    Data.set(`wlc_style_${message.guild.id}`, chosen);
                    await i.update({
                        embeds: [{ title: `✅ تم تعيين نوع الولكم على: ${chosen === 'embed' ? '🖼️ إمبيد' : '📷 رسالة'}`, color: 0x57F287 }],
                        components: []
                    });
                    styleCol.stop();
                });

                styleCol.on('end', collected => {
                    if (collected.size === 0) styleMsg.edit({ content: '**انتهى وقت التعديل ❌**', embeds: [], components: [] }).catch(() => {});
                });
            }

            // ── معاينة الولكم ────────────────────────────────────────────────
            if (selectedOption === 'preview') {
                await interaction.message.delete();

                const previewStyle = Data.get(`wlc_style_${message.guild.id}`) || 'embed';
                const canvas = createCanvas(826, 427);
                const ctx    = canvas.getContext('2d');
                const bgURL  = Data.get(`imgwlc_embed_${message.guild.id}`) || Data.get(`imgwlc_${message.guild.id}`) || `${process.cwd()}/Fonts/wlc.png`;
                const isGif  = bgURL && bgURL.toString().includes('.gif');

                // ── رسم الخلفية دائماً
                try {
                    const bg      = await loadImage(bgURL);
                    canvas.width  = bg.width;
                    canvas.height = bg.height;
                    ctx.drawImage(bg, 0, 0);
                } catch (e) {}

                // ── رسم الأفاتار والاسم فقط في وضع الرسالة
                if (previewStyle === 'message') {
                    const avatarOpts = Data.get(`editwel_${message.guild.id}`) || { size: 260, x: 233, y: 83.5, isCircular: true };
                    const { size, x, y, isCircular } = avatarOpts;
                    try {
                        const avatar = await loadImage(message.author.displayAvatarURL({ format: 'png', size: 512 }));
                        ctx.save();
                        if (isCircular) {
                            ctx.beginPath();
                            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                            ctx.closePath();
                            ctx.clip();
                        }
                        ctx.drawImage(avatar, x, y, size, size);
                        ctx.restore();
                    } catch (e) {}

                    const nameOpts = Data.get(`editname_${message.guild.id}`);
                    if (nameOpts) {
                        ctx.font      = `bold ${nameOpts.size}px Cairo`;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillText(message.author.displayName, nameOpts.x, nameOpts.y);
                    }
                }

                if (previewStyle === 'embed') {
                    // ── وضع الإمبيد: الأفاتار فقط كـ thumbnail، البنر نظيف
                    const payload = await buildWelcomeEmbed(message.member, isGif ? null : canvas.toBuffer(), bgURL, isGif);
                    await message.channel.send({ content: '**👁️ معاينة رسالة الولكم**', ...payload });
                } else {
                    // ── وضع الرسالة: صورة مجردة بالأفاتار مرسوم عليها
                    if (isGif && bgURL) {
                        await message.channel.send({ content: '**👁️ معاينة رسالة الولكم**', files: [bgURL] });
                    } else {
                        await message.channel.send({ content: '**👁️ معاينة رسالة الولكم**', files: [{ attachment: canvas.toBuffer(), name: 'welcome.png' }] });
                    }
                }
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'Cancele') {
                collector.stop();
                interaction.message.delete();
            }
        });

        collector.on('end', () => {
            initialMenuRow.components.forEach(component => component.setDisabled(true));
        });
    }
};