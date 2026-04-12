const db = require("pro.db");
const Discord = require('discord.js');
const path = require("path");
const { createCanvas, loadImage, registerFont } = require('canvas');

// ── تحميل إيموجي من Twemoji ────────────────────────────────────────
const _emojiCache = {};
async function loadEmoji(emoji) {
    if (_emojiCache[emoji]) return _emojiCache[emoji];
    const cp = [...emoji]
        .map(c => c.codePointAt(0).toString(16))
        .filter(c => c !== 'fe0f')
        .join('-');

    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${cp}.png`;

    try {
        const img = await loadImage(url);
        _emojiCache[emoji] = img;
        return img;
    } catch (e) {
        return null;
    }
}

async function drawEmoji(ctx, emoji, x, y, size = 20) {
    const img = await loadEmoji(emoji);
    if (img) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

// ── تحميل أيقونات muted/deafened من ملفات محلية ───────────────────
const mutedIconPath = path.join(process.cwd(), "assets", "icons", "muted.svg");
const deafenedIconPath = path.join(process.cwd(), "assets", "icons", "deafened.svg");

const _iconCache = {};

async function loadLocalIcon(iconPath) {
    if (_iconCache[iconPath]) return _iconCache[iconPath];

    try {
        const img = await loadImage(iconPath);
        _iconCache[iconPath] = img;
        return img;
    } catch (e) {
        console.error("Failed to load icon:", iconPath, e.message || e);
        return null;
    }
}

async function drawIcon(ctx, iconPath, x, y, size = 18) {
    const img = await loadLocalIcon(iconPath);
    if (img) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        return true;
    }
    return false;
}

// ── يرسم الروم بشكل يشبه واجهة ديسكورد ────────────────────────────
async function buildVoiceRoomImage(channel, highlightMember, action) {
    try {
        registerFont(`${process.cwd()}/Fonts/Cairo-Regular.ttf`, { family: 'Cairo' });
    } catch (e) {}

    const members   = [...channel.members.values()].filter(m => !m.user.bot);
    const ROW_H     = 56;
    const AVATAR    = 38;
    const WIDTH     = 360;
    const HEADER_H  = 60;
    const HEIGHT    = HEADER_H + Math.max(members.length, 1) * ROW_H + 16;
    const FONT      = 'Cairo, sans-serif';

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx    = canvas.getContext('2d');

    // ── خلفية
    ctx.fillStyle = '#2b2d31';
    ctx.roundRect(0, 0, WIDTH, HEIGHT, 10);
    ctx.fill();

    // ── هيدر
    ctx.fillStyle = '#232428';
    ctx.roundRect(0, 0, WIDTH, HEADER_H, [10, 10, 0, 0]);
    ctx.fill();

    // ── أيقونة الفويس
    await drawEmoji(ctx, '🔊', 24, HEADER_H / 2 - 8, 22);

    // ── اسم القناة
    ctx.font         = `bold 15px ${FONT}`;
    ctx.fillStyle    = '#f2f3f5';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(channel.name, 46, HEADER_H / 2 - 4);

    // ── عدد الأعضاء
    ctx.font      = `12px ${FONT}`;
    ctx.fillStyle = '#80848e';
    ctx.fillText(`${members.length} مستخدم`, 46, HEADER_H / 2 + 13);

    // ── خط فاصل
    ctx.strokeStyle = '#1e1f22';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(WIDTH, HEADER_H);
    ctx.stroke();

    // ── لا يوجد أعضاء
    if (members.length === 0) {
        ctx.font         = `13px ${FONT}`;
        ctx.fillStyle    = '#4e5058';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('القناة فارغة', WIDTH / 2, HEADER_H + ROW_H / 2);
        return canvas.toBuffer();
    }

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const y      = HEADER_H + i * ROW_H;
        const isHL   = member.id === highlightMember.id;
        const cx     = 20 + AVATAR / 2;
        const cy     = y + ROW_H / 2;

        // ── تظليل صف
        if (isHL) {
            ctx.fillStyle = action === 'join'
                ? 'rgba(87,242,135,0.10)'
                : 'rgba(237,66,69,0.10)';
            ctx.fillRect(0, y, WIDTH, ROW_H);
        }

        // ── أفاتار
        try {
            const img = await loadImage(member.user.displayAvatarURL({ format: 'png', size: 64 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, AVATAR / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, cx - AVATAR / 2, cy - AVATAR / 2, AVATAR, AVATAR);
            ctx.restore();
        } catch (e) {
            ctx.fillStyle = '#5865f2';
            ctx.beginPath();
            ctx.arc(cx, cy, AVATAR / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── نقطة حالة
        const dotC = isHL ? (action === 'join' ? '#57f287' : '#ed4245') : '#23a55a';
        ctx.beginPath();
        ctx.arc(cx + AVATAR / 2 - 5, cy + AVATAR / 2 - 5, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#2b2d31';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx + AVATAR / 2 - 5, cy + AVATAR / 2 - 5, 5, 0, Math.PI * 2);
        ctx.fillStyle = dotC;
        ctx.fill();

        // ── اسم العضو (كامل بدون قص)
        const nameX = 20 + AVATAR + 12;
        const nameW = WIDTH - nameX - 52; // مساحة للأيقونات
        ctx.font         = `${isHL ? 'bold ' : ''}14px ${FONT}`;
        ctx.fillStyle    = isHL ? (action === 'join' ? '#57f287' : '#ed4245') : '#dbdee1';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';

        let name = member.displayName;
        ctx.save();
        ctx.rect(nameX, y, nameW, ROW_H);
        ctx.clip();
        ctx.fillText(name, nameX, cy);
        ctx.restore();

        // ── أيقونات ميوت/ديفن
        const isMuted = member.voice.selfMute || member.voice.serverMute;
        const isDeaf  = member.voice.selfDeaf || member.voice.serverDeaf;

        if (isMuted && isDeaf) {
            const mutedOk = await drawIcon(ctx, mutedIconPath, WIDTH - 38, cy, 18);
            const deafOk  = await drawIcon(ctx, deafenedIconPath, WIDTH - 16, cy, 18);

            if (!mutedOk) await drawEmoji(ctx, '🎙️', WIDTH - 38, cy, 20);
            if (!deafOk)  await drawEmoji(ctx, '🔇', WIDTH - 16, cy, 20);
        } else if (isMuted) {
            const mutedOk = await drawIcon(ctx, mutedIconPath, WIDTH - 16, cy, 18);
            if (!mutedOk) await drawEmoji(ctx, '🎙️', WIDTH - 16, cy, 20);
        } else if (isDeaf) {
            const deafOk = await drawIcon(ctx, deafenedIconPath, WIDTH - 16, cy, 18);
            if (!deafOk) await drawEmoji(ctx, '🔇', WIDTH - 16, cy, 20);
        }

        // ── فاصل
        if (i < members.length - 1) {
            ctx.strokeStyle = '#1e1f22';
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(nameX, y + ROW_H);
            ctx.lineTo(WIDTH - 14, y + ROW_H);
            ctx.stroke();
        }
    }

    return canvas.toBuffer();
}

// ──────────────────────────────────────────────────────────────────
module.exports = async (client, oldState, newState) => {
    let logvjoinvexit = db.get(`logvjoinvexit_${oldState.guild.id}`);
    let logmove       = db.get(`logmove_${oldState.guild.id}`);

    let logChannelJoinExit = oldState.member.guild.channels.cache.find(c => c.id === logvjoinvexit);
    let logChannelMove     = oldState.member.guild.channels.cache.find(c => c.id === logmove);

    if (!logChannelJoinExit || !logChannelMove) return;
    if (oldState.member.bot || newState.member.bot) return;
    if (oldState.guild.id !== logChannelJoinExit.guild.id) return;

    // ── دخول ─────────────────────────────────────────────────────
    if (!oldState.channelId && newState.channelId) {
        try {
            const ch     = newState.channel;
            const imgBuf = await buildVoiceRoomImage(ch, newState.member, 'join');
            const embed  = new Discord.MessageEmbed()
                .setAuthor(newState.member.displayName, newState.member.user.displayAvatarURL())
                .setColor('#57f287')
                .setDescription(`🟢 **انضم** <@${newState.member.id}> إلى <#${ch.id}>`)
                .setImage('attachment://voice.png')
                .setFooter(client.user.username, client.user.displayAvatarURL())
                .setTimestamp();

            await logChannelJoinExit.send({
                embeds: [embed],
                files: [{ attachment: imgBuf, name: 'voice.png' }]
            });
        } catch (e) {
            console.error('Voice join log error:', e);
        }

    // ── خروج ─────────────────────────────────────────────────────
    } else if (oldState.channelId && !newState.channelId) {
        try {
            const ch     = oldState.channel;
            const imgBuf = await buildVoiceRoomImage(ch, oldState.member, 'leave');
            const embed  = new Discord.MessageEmbed()
                .setAuthor(oldState.member.displayName, oldState.member.user.displayAvatarURL())
                .setColor('#ed4245')
                .setDescription(`🔴 **غادر** <@${oldState.member.id}> من <#${ch.id}>`)
                .setImage('attachment://voice.png')
                .setFooter(client.user.username, client.user.displayAvatarURL())
                .setTimestamp();

            await logChannelJoinExit.send({
                embeds: [embed],
                files: [{ attachment: imgBuf, name: 'voice.png' }]
            });
        } catch (e) {
            console.error('Voice leave log error:', e);
        }

    // ── نقل ──────────────────────────────────────────────────────
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        try {
            const fromCh = oldState.channel;
            const toCh   = newState.channel;
            const imgBuf = await buildVoiceRoomImage(toCh, newState.member, 'join');
            const embed  = new Discord.MessageEmbed()
                .setAuthor(newState.member.displayName, newState.member.user.displayAvatarURL())
                .setColor('#faa61a')
                .setDescription(`🔀 **نقل** <@${newState.member.id}>\nمن <#${fromCh.id}> ← إلى <#${toCh.id}>`)
                .setImage('attachment://voice.png')
                .setFooter(client.user.username, client.user.displayAvatarURL())
                .setTimestamp();

            await logChannelMove.send({
                embeds: [embed],
                files: [{ attachment: imgBuf, name: 'voice.png' }]
            });
        } catch (e) {
            console.error('Voice move log error:', e);
        }
    }
};