/**
 * Protection System Module
 * Handles anti-raid, action limits, and server protection.
 * Action counters persist across bot restarts via the database.
 */

const { MessageEmbed, MessageSelectMenu, MessageActionRow } = require('discord.js');
const db   = require('pro.db');
const dbq  = require('pro.db');
const moment = require('moment');
const ms   = require('ms');

// ── Default limits (can be overridden per guild via setlimit command) ──
const DEFAULT_LIMITS = {
  roleDelete:       3,
  roleCreate:       3,
  roleUpdate:       3,
  channelDelete:    3,
  channelCreate:    3,
  guildUpdate:      3,
  MemberBanAdd:     3,
  MemberKick:       3,
  channelUpdate:    3,
  voiceChannelDelete: 3,
  voiceChannelCreate: 3,
  memberRoleUpdate: 3,
  memberUpdate:     3,
};

// ── In-memory dedup set for channel edits ──
const recentExecutions = new Set();

// ── Helpers ────────────────────────────────────────────────────────────

/** Get current action count for an executor/type, with 1-hour window reset */
function getCount(executorId, actionType) {
  const key  = `prot_count_${executorId}_${actionType}`;
  const data = db.get(key);
  if (!data) return 0;
  // Reset counter if window has passed (60 minutes)
  if (Date.now() - data.ts > 60 * 60 * 1000) {
    db.delete(key);
    return 0;
  }
  return data.count;
}

/** Increment action count for an executor/type */
function increment(executorId, actionType) {
  const key  = `prot_count_${executorId}_${actionType}`;
  const data = db.get(key) || { count: 0, ts: Date.now() };
  // Reset if window expired
  if (Date.now() - data.ts > 60 * 60 * 1000) {
    db.set(key, { count: 1, ts: Date.now() });
  } else {
    db.set(key, { count: data.count + 1, ts: data.ts });
  }
}

/** Reset action count (e.g. after punishment) */
function resetCount(executorId, actionType) {
  db.delete(`prot_count_${executorId}_${actionType}`);
}

async function getLimit(guildId, actionType) {
  return (await dbq.get(`maxLimit_${guildId}_${actionType}`)) || DEFAULT_LIMITS[actionType] || 3;
}

async function isBypassed(guildId, executorId) {
  const list = (await dbq.get(`bypassedMembers_${guildId}`)) || [];
  return list.includes(executorId);
}

async function isProtected(guildId) {
  return (await dbq.get(`protectionEnabled_${guildId}`)) || false;
}

async function getPunishment(guildId) {
  return (await dbq.get(`punishment_${guildId}`)) || 'remove_roles';
}

async function applyPunishment(guild, executorId, punishmentType) {
  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;
    if (punishmentType === 'ban') {
      await member.ban({ reason: '[Protection] Exceeded action limit' });
    } else if (punishmentType === 'kick') {
      await member.kick('[Protection] Exceeded action limit');
    } else {
      await member.roles.set([]);
    }
  } catch (err) {
    console.error(`[Protection] applyPunishment error:`, err.message);
  }
}

async function sendLog(guild, logChannelId, embed) {
  if (!logChannelId) return;
  const ch = guild.channels.cache.get(logChannelId);
  if (ch) ch.send({ embeds: [embed], content: '@everyone' }).catch(() => {});
}

function makeEmbed(title, executorId, reason) {
  return new MessageEmbed()
    .setTitle(title)
    .setColor('#5c5e64')
    .setTimestamp()
    .setDescription(
      `**Reason:** ${reason}\n**User:** <@${executorId}>\n\`\`\`${moment().format('LLLL')}\`\`\``
    );
}

// ── Log protection action to audit trail ──
function logProtectionAction(guildId, executorId, actionType, punishment) {
  const key   = `prot_audit_${guildId}`;
  const audit = db.get(key) || [];
  audit.unshift({
    ts:         Date.now(),
    executorId,
    actionType,
    punishment,
  });
  // Keep last 100 entries
  db.set(key, audit.slice(0, 100));
}

// ══════════════════════════════════════════════════════════════════════
// REGISTRATION
// ══════════════════════════════════════════════════════════════════════

module.exports = function registerProtection(client) {

  // ── Voice mute persistence ────────────────────────────────────────
  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member.user.bot) return;
    const muteData       = db.get(`voicemute_${newState.member.id}`);
    const lastUnmuteData = db.get(`last_unmute_${newState.member.id}`);
    if (!muteData) return;
    if (oldState.serverMute === newState.serverMute) return;

    try {
      const remaining = moment(muteData.times, 'LLLL').diff(moment());
      if (newState.serverMute === false && remaining > 0) {
        const lastUnmuteTime = lastUnmuteData ? moment(lastUnmuteData.time) : moment(0);
        const diff = moment().diff(lastUnmuteTime);
        const delay = diff < 1000 ? 1000 - diff : 0;
        setTimeout(async () => {
          await newState.member.voice.setMute(true, `Reapplying mute: ${muteData.reason}`).catch(() => {});
          db.set(`voicemute_${newState.member.id}`, {
            ...muteData,
            times: moment().add(ms(muteData.time), 'milliseconds').format('LLLL'),
          });
          db.set(`last_unmute_${newState.member.id}`, { time: moment().format() });
        }, delay);
      } else if (remaining <= 0) {
        await newState.member.voice.setMute(false, 'Mute period expired').catch(() => {});
        db.delete(`voicemute_${newState.member.id}`);
        db.delete(`last_unmute_${newState.member.id}`);
      }
    } catch (err) {
      console.error(`[Protection] VoiceMute error for ${newState.member.user.tag}:`, err.message);
    }
  });

  // ── setlimit command ──────────────────────────────────────────────
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const { prefix, owners } = require('../config');
    if (!message.content.startsWith(prefix)) return;
    const args    = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setlimit') {
      if (!owners.includes(message.author.id)) return message.react('❌');
      const menu = new MessageSelectMenu()
        .setCustomId('select_limit_type')
        .setPlaceholder('اختر نوع الحد')
        .addOptions(Object.keys(DEFAULT_LIMITS).map(type => ({ label: type, value: type })));
      const row   = new MessageActionRow().addComponents(menu);
      const embed = new MessageEmbed().setColor('#5c5e64').setDescription('يرجى اختيار نوع الحد من القائمة أدناه.');
      const sent  = await message.reply({ embeds: [embed], components: [row] });
      const collector = sent.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 60000,
      });
      collector.on('collect', async interaction => {
        if (!interaction.isSelectMenu()) return;
        const selectedType = interaction.values[0];
        await interaction.reply({ content: 'يرجى إدخال الحد الجديد:', ephemeral: true });
        const rc = interaction.channel.createMessageCollector({
          filter: r => r.author.id === interaction.user.id,
          time: 60000,
          max: 1,
        });
        rc.on('collect', async response => {
          const limit = parseInt(response.content);
          if (isNaN(limit)) {
            return interaction.followUp({ content: 'الحد غير صالح.', ephemeral: true });
          }
          DEFAULT_LIMITS[selectedType] = limit;
          await dbq.set(`maxLimit_${message.guild.id}_${selectedType}`, limit);
          interaction.followUp({ content: `✅ تم تعيين الحد لـ **${selectedType}** على **${limit}**`, ephemeral: true });
        });
      });
      collector.on('end', collected => {
        if (!collected.size) sent.edit({ components: [] }).catch(() => {});
      });
    }

    if (command === 'status') {
      if (!owners.includes(message.author.id)) return message.react('❌');
      const guildId          = message.guild.id;
      const protectionEnabled = (await dbq.get(`protectionEnabled_${guildId}`)) || false;
      const logChannelId     = await dbq.get(`logChannel_${guildId}`);
      const embed = new MessageEmbed()
        .setColor('#5c5e64')
        .setTitle('حالة الحماية والحدود')
        .addField('الحماية', protectionEnabled ? '✅ مفعلة' : '❌ معطلة', true)
        .addField('قناة السجل', logChannelId ? `<#${logChannelId}>` : 'غير محدد', true);
      for (const type of Object.keys(DEFAULT_LIMITS)) {
        const limit = (await dbq.get(`maxLimit_${guildId}_${type}`)) || DEFAULT_LIMITS[type];
        embed.addField(type, limit.toString(), true);
      }
      message.channel.send({ embeds: [embed] });
    }
  });

  // ── setpunishment command ─────────────────────────────────────────
  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    const { prefix, owners } = require('../config');
    if (!message.content.startsWith(prefix)) return;
    const args    = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (command !== 'setpunishment') return;
    if (!owners.includes(message.author.id)) return message.react('❌');
    const punishmentType = args[0]?.toLowerCase();
    if (['ban', 'kick', 'remove_roles'].includes(punishmentType)) {
      await dbq.set(`punishment_${message.guild.id}`, punishmentType);
      message.channel.send(`✅ العقوبة: **${punishmentType}**`);
    } else {
      message.channel.send('يرجى اختيار: `ban`, `kick`, أو `remove_roles`.');
    }
  });

  // ── guildMemberUpdate — unauthorized role grant ───────────────────
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!(await isProtected(newMember.guild.id))) return;
    if (oldMember.roles.cache.size >= newMember.roles.cache.size) return;

    const auditLogs = await newMember.guild.fetchAuditLogs({ type: 'GUILD_MEMBER_UPDATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(newMember.guild.id, executor.id)) return;

    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const count      = getCount(executor.id, 'memberRoleUpdate');
    const limit      = await getLimit(newMember.guild.id, 'memberRoleUpdate');

    if (count >= limit) {
      const punishment = await getPunishment(newMember.guild.id);
      await applyPunishment(newMember.guild, executor.id, punishment);
      const rolesToKeep = newMember.roles.cache.filter(r => !addedRoles.has(r.id));
      await newMember.roles.set(rolesToKeep).catch(() => {});
      logProtectionAction(newMember.guild.id, executor.id, 'memberRoleUpdate', punishment);
      const logChannelId = await dbq.get(`logChannel_${newMember.guild.id}`);
      await sendLog(newMember.guild, logChannelId, makeEmbed('Roles Server is in Danger', executor.id, 'تم سحب جميع صلاحياته بسبب إعطاء الأدوار أكثر من مرة'));
      resetCount(executor.id, 'memberRoleUpdate');
      return;
    }
    increment(executor.id, 'memberRoleUpdate');
  });

  // ── guildUpdate ───────────────────────────────────────────────────
  client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (!(await isProtected(newGuild.id))) return;
    const auditLogs = await newGuild.fetchAuditLogs({ type: 'GUILD_UPDATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(newGuild.id, executor.id)) return;

    const count = getCount(executor.id, 'guildUpdate');
    const limit = await getLimit(newGuild.id, 'guildUpdate');

    if (count >= limit) {
      const punishment = await getPunishment(newGuild.id);
      await applyPunishment(newGuild, executor.id, punishment);
      // Revert guild changes
      try {
        if (oldGuild.name !== newGuild.name)     await newGuild.setName(oldGuild.name).catch(() => {});
        if (oldGuild.icon !== newGuild.icon)     { await newGuild.setIcon(null).catch(() => {}); setTimeout(() => newGuild.setIcon(oldGuild.iconURL()).catch(() => {}), 1200); }
        if (oldGuild.banner !== newGuild.banner) { await newGuild.setBanner(null).catch(() => {}); setTimeout(() => newGuild.setBanner(oldGuild.bannerURL()).catch(() => {}), 1200); }
      } catch {}
      logProtectionAction(newGuild.id, executor.id, 'guildUpdate', punishment);
      const logChannelId = await dbq.get(`logChannel_${newGuild.id}`);
      await sendLog(newGuild, logChannelId, makeEmbed('Guild Update is in Danger', executor.id, 'تم سحب جميع صلاحياته بسبب تغيير إعدادات السيرفر'));
      resetCount(executor.id, 'guildUpdate');
      return;
    }
    increment(executor.id, 'guildUpdate');
  });

  // ── guildBanAdd ───────────────────────────────────────────────────
  client.on('guildBanAdd', async (guild, user) => {
    if (!(await isProtected(guild.id))) return;
    const auditLogs = await guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(guild.id, executor.id)) return;

    const count = getCount(executor.id, 'MemberBanAdd');
    const limit = await getLimit(guild.id, 'MemberBanAdd');

    if (count >= limit) {
      const punishment = await getPunishment(guild.id);
      await applyPunishment(guild, executor.id, punishment);
      logProtectionAction(guild.id, executor.id, 'MemberBanAdd', punishment);
      const logChannelId = await dbq.get(`logChannel_${guild.id}`);
      await sendLog(guild, logChannelId, makeEmbed('Ban is in Danger', executor.id, 'تم تجاوز الحد الأقصى للحظر'));
      resetCount(executor.id, 'MemberBanAdd');
      return;
    }
    increment(executor.id, 'MemberBanAdd');
  });

  // ── guildMemberRemove (kick detection) ────────────────────────────
  client.on('guildMemberRemove', async (member) => {
    if (!(await isProtected(member.guild.id))) return;
    const auditLogs = await member.guild.fetchAuditLogs({ type: 'MEMBER_KICK', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry || entry.target?.id !== member.id) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(member.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'MemberKick');
    const limit = await getLimit(member.guild.id, 'MemberKick');

    if (count >= limit) {
      const punishment = await getPunishment(member.guild.id);
      await applyPunishment(member.guild, executor.id, punishment);
      logProtectionAction(member.guild.id, executor.id, 'MemberKick', punishment);
      const logChannelId = await dbq.get(`logChannel_${member.guild.id}`);
      await sendLog(member.guild, logChannelId, makeEmbed('Kick is in Danger', executor.id, 'تم تجاوز الحد الأقصى للطرد'));
      resetCount(executor.id, 'MemberKick');
      return;
    }
    increment(executor.id, 'MemberKick');
  });

  // ── channelUpdate ─────────────────────────────────────────────────
  client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!newChannel.guild) return;
    if (!(await isProtected(newChannel.guild.id))) return;
    const auditLogs = await newChannel.guild.fetchAuditLogs({ type: 'CHANNEL_UPDATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(newChannel.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'channelUpdate');
    const limit = await getLimit(newChannel.guild.id, 'channelUpdate');

    if (count >= limit) {
      if (recentExecutions.has(newChannel.id)) return;
      recentExecutions.add(newChannel.id);
      try {
        await newChannel.edit({
          name: oldChannel.name, topic: oldChannel.topic, nsfw: oldChannel.nsfw,
          bitrate: oldChannel.bitrate, userLimit: oldChannel.userLimit,
          permissionOverwrites: oldChannel.permissionOverwrites.cache,
        }).catch(() => {});
      } catch {}
      setTimeout(() => recentExecutions.delete(newChannel.id), 2000);
      logProtectionAction(newChannel.guild.id, executor.id, 'channelUpdate', 'revert');
      const logChannelId = await dbq.get(`logChannel_${newChannel.guild.id}`);
      await sendLog(newChannel.guild, logChannelId, makeEmbed('Channel Update is in Danger', executor.id, 'تم إعادة تعيين إعدادات القناة'));
      resetCount(executor.id, 'channelUpdate');
      return;
    }
    increment(executor.id, 'channelUpdate');
  });

  // ── roleDelete ────────────────────────────────────────────────────
  client.on('roleDelete', async (role) => {
    if (!(await isProtected(role.guild.id))) return;
    const auditLogs = await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(role.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'roleDelete');
    const limit = await getLimit(role.guild.id, 'roleDelete');

    if (count >= limit) {
      const punishment = await getPunishment(role.guild.id);
      const member = await role.guild.members.fetch(executor.id).catch(() => null);
      if (member) await member.roles.set([]).catch(() => {});
      // Recreate the deleted role
      await role.guild.roles.create({
        name: role.name, color: role.color, hoist: role.hoist,
        permissions: role.permissions, mentionable: role.mentionable,
        position: role.position,
      }).catch(() => {});
      logProtectionAction(role.guild.id, executor.id, 'roleDelete', punishment);
      const logChannelId = await dbq.get(`logChannel_${role.guild.id}`);
      await sendLog(role.guild, logChannelId, makeEmbed('Role Delete is in Danger', executor.id, 'تم سحب الصلاحيات وإعادة إنشاء الرول'));
      resetCount(executor.id, 'roleDelete');
      return;
    }
    increment(executor.id, 'roleDelete');
  });

  // ── roleCreate ────────────────────────────────────────────────────
  client.on('roleCreate', async (role) => {
    if (!(await isProtected(role.guild.id))) return;
    const auditLogs = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(role.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'roleCreate');
    const limit = await getLimit(role.guild.id, 'roleCreate');

    if (count >= limit) {
      const punishment = await getPunishment(role.guild.id);
      await applyPunishment(role.guild, executor.id, punishment);
      await role.delete('[Protection] Unauthorized role creation').catch(() => {});
      logProtectionAction(role.guild.id, executor.id, 'roleCreate', punishment);
      const logChannelId = await dbq.get(`logChannel_${role.guild.id}`);
      await sendLog(role.guild, logChannelId, makeEmbed('Role Create is in Danger', executor.id, 'تم سحب الصلاحيات وحذف الرول الجديد'));
      resetCount(executor.id, 'roleCreate');
      return;
    }
    increment(executor.id, 'roleCreate');
  });

  // ── roleUpdate ────────────────────────────────────────────────────
  client.on('roleUpdate', async (oldRole, newRole) => {
    if (!(await isProtected(newRole.guild.id))) return;
    const auditLogs = await newRole.guild.fetchAuditLogs({ type: 'ROLE_UPDATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(newRole.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'roleUpdate');
    const limit = await getLimit(newRole.guild.id, 'roleUpdate');

    if (count >= limit) {
      const punishment = await getPunishment(newRole.guild.id);
      await applyPunishment(newRole.guild, executor.id, punishment);
      await newRole.setPermissions(oldRole.permissions).catch(() => {});
      logProtectionAction(newRole.guild.id, executor.id, 'roleUpdate', punishment);
      const logChannelId = await dbq.get(`logChannel_${newRole.guild.id}`);
      await sendLog(newRole.guild, logChannelId, makeEmbed('Role Update is in Danger', executor.id, 'تم سحب الصلاحيات وإعادة صلاحيات الرول'));
      resetCount(executor.id, 'roleUpdate');
      return;
    }
    increment(executor.id, 'roleUpdate');
  });

  // ── channelDelete ─────────────────────────────────────────────────
  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    if (!(await isProtected(channel.guild.id))) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(channel.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'channelDelete');
    const limit = await getLimit(channel.guild.id, 'channelDelete');

    if (count >= limit) {
      const punishment = await getPunishment(channel.guild.id);
      await applyPunishment(channel.guild, executor.id, punishment);
      logProtectionAction(channel.guild.id, executor.id, 'channelDelete', punishment);
      const logChannelId = await dbq.get(`logChannel_${channel.guild.id}`);
      await sendLog(channel.guild, logChannelId, makeEmbed('Channel Delete is in Danger', executor.id, 'تم سحب الصلاحيات بسبب حذف قناة'));
      resetCount(executor.id, 'channelDelete');
      return;
    }
    increment(executor.id, 'channelDelete');
  });

  // ── channelCreate ─────────────────────────────────────────────────
  client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    if (!(await isProtected(channel.guild.id))) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE', limit: 1 }).catch(() => null);
    if (!auditLogs) return;
    const entry    = auditLogs.entries.first();
    if (!entry) return;
    const executor = entry.executor;
    if (executor.id === client.user.id) return;
    if (await isBypassed(channel.guild.id, executor.id)) return;

    const count = getCount(executor.id, 'channelCreate');
    const limit = await getLimit(channel.guild.id, 'channelCreate');

    if (count >= limit) {
      const punishment = await getPunishment(channel.guild.id);
      await applyPunishment(channel.guild, executor.id, punishment);
      await channel.delete('[Protection] Unauthorized channel creation').catch(() => {});
      logProtectionAction(channel.guild.id, executor.id, 'channelCreate', punishment);
      const logChannelId = await dbq.get(`logChannel_${channel.guild.id}`);
      await sendLog(channel.guild, logChannelId, makeEmbed('Channel Create is in Danger', executor.id, 'تم سحب الصلاحيات وحذف القناة الجديدة'));
      resetCount(executor.id, 'channelCreate');
      return;
    }
    increment(executor.id, 'channelCreate');
  });

  console.log('[Protection] Protection system loaded ✓');
};

// ── Export helpers for dashboard API ──────────────────────────────────
module.exports.DEFAULT_LIMITS     = DEFAULT_LIMITS;
module.exports.getProtectionAudit = (guildId) => db.get(`prot_audit_${guildId}`) || [];
