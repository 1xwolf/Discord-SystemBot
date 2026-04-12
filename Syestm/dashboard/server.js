/**
 * dashboard/server.js
 * Express API server for the Syestm Bot Dashboard
 * ─────────────────────────────────────────────────
 * Features:
 *  - API key authentication on all /api/* routes
 *  - Rate limiting (60 req/min per IP)
 *  - Bot info, guilds, settings, security, protection, leaderboard, audit log
 */

require('dotenv').config();
const express     = require('express');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const db          = require('pro.db');
const { getProtectionAudit, DEFAULT_LIMITS } = require('../handler/protection');

const config = require('../config');

module.exports = function startDashboard(client) {
  const app  = express();
  const PORT = config.dashboardPort || 4523;

  // ── Middleware ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(__dirname)));

  // Rate limiter — 60 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests. Slow down.' },
  });
  app.use('/api/', limiter);

  // API key authentication for all /api/ routes
  app.use('/api/', (req, res, next) => {
    // Allow the dashboard HTML page to skip auth check on public status
    const key = req.headers['x-api-key'] || req.query.apiKey;
    if (key !== config.dashboardApiKey) {
      return res.status(401).json({ error: 'Unauthorized. Provide a valid x-api-key header.' });
    }
    next();
  });

  // ── GET /api/bot-info ───────────────────────────────────────────────
  app.get('/api/bot-info', (req, res) => {
    if (!client?.user) return res.json({ online: false });
    const presence = client.user.presence;
    const activity = presence?.activities?.[0];
    res.json({
      online:       true,
      name:         client.user.tag,
      avatar:       client.user.displayAvatarURL({ format: 'png', size: 128 }),
      ping:         client.ws.ping,
      guilds:       client.guilds.cache.size,
      members:      client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      uptime:       process.uptime(),
      status:       presence?.status || 'online',
      activityType: activity?.type   || 'PLAYING',
      activityText: activity?.name   || '',
      prefix:       config.prefix,
      nodeVersion:  process.version,
      memUsageMB:   Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  });

  // ── POST /api/bot/avatar ─────────────────────────────────────────────
  app.post('/api/bot/avatar', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
      await client.user.setAvatar(url);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/bot/name ───────────────────────────────────────────────
  app.post('/api/bot/name', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    try {
      await client.user.setUsername(name);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/bot/status ─────────────────────────────────────────────
  app.post('/api/bot/status', async (req, res) => {
    const { status, activityType, activityText, streamUrl } = req.body;
    const validStatus = ['online','idle','dnd','invisible'].includes(status) ? status : 'online';
    const validType   = ['PLAYING','STREAMING','LISTENING','WATCHING','COMPETING'].includes(activityType) ? activityType : 'PLAYING';
    try {
      const presenceData = { status: validStatus, activities: [] };
      if (activityText) {
        const act = { name: activityText, type: validType };
        if (validType === 'STREAMING') act.url = streamUrl || 'https://twitch.tv/placeholder';
        presenceData.activities.push(act);
      }
      await client.user.setPresence(presenceData);
      db.set('bot_presence_status',       validStatus);
      db.set('bot_presence_activityType', validType);
      db.set('bot_presence_activityText', activityText || '');
      db.set('bot_presence_streamUrl',    streamUrl    || '');
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/bot/restart ────────────────────────────────────────────
  app.post('/api/bot/restart', (req, res) => {
    res.json({ ok: true });
    setTimeout(() => process.exit(0), 500);
  });

  // ── GET /api/guilds ──────────────────────────────────────────────────
  app.get('/api/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id:          g.id,
      name:        g.name,
      icon:        g.iconURL({ format: 'png', size: 64 }),
      memberCount: g.memberCount,
      ownerId:     g.ownerId,
    }));
    res.json(guilds);
  });

  // ── GET /api/settings/:guildId ───────────────────────────────────────
  app.get('/api/settings/:guildId', (req, res) => {
    const { guildId } = req.params;
    const g = client.guilds.cache.get(guildId);
    const channels = g ? g.channels.cache
      .filter(c => c.type === 'GUILD_TEXT')
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .map(c => ({ id: c.id, name: c.name })) : [];
    const roles = g ? g.roles.cache
      .filter(r => r.id !== guildId)
      .sort((a, b) => b.rawPosition - a.rawPosition)
      .map(r => ({ id: r.id, name: r.name, color: r.hexColor })) : [];

    res.json({
      welcome: {
        channel:  db.get(`chat_wlc_${guildId}`)     || '',
        style:    db.get(`wlc_style_${guildId}`)    || 'embed',
        message:  db.get(`mesg_message_${guildId}`) || '',
        color:    db.get(`Guild_Color-${guildId}`)  || '#5865F2',
        imgEmbed: db.get(`imgwlc_embed_${guildId}`) || '',
        imgMsg:   db.get(`imgwlc_msg_${guildId}`)   || '',
      },
      logs: {
        messages:  db.get(`channelmessage_${guildId}`)    || '',
        pic:       db.get(`logpic_${guildId}`)            || '',
        channels:  db.get(`logchannels_${guildId}`)       || '',
        nickname:  db.get(`lognickname_${guildId}`)       || '',
        joinLeave: db.get(`logjoinleave_${guildId}`)      || '',
        links:     db.get(`loglinks_${guildId}`)          || '',
        bots:      db.get(`logbots_${guildId}`)           || '',
        roles:     db.get(`logroles_${guildId}`)          || '',
        voice:     db.get(`logvjoinvexit_${guildId}`)     || '',
        move:      db.get(`logmove_${guildId}`)           || '',
        ban:       db.get(`logbanunban_${guildId}`)       || '',
        kick:      db.get(`logkick_${guildId}`)           || '',
        mute:      db.get(`logmutedeafen_${guildId}`)     || '',
        timeout:   db.get(`logtimeuntime_${guildId}`)     || '',
        emoji:     db.get(`logemoji_${guildId}`)          || '',
        prison:    db.get(`logprisonunprison_${guildId}`) || '',
        warns:     db.get(`logwarns_${guildId}`)          || '',
        voiceMute: db.get(`logtvoicemute_${guildId}`)     || '',
        tmute:     db.get(`logtmuteuntmute_${guildId}`)   || '',
      },
      security: {
        antibots:            db.get(`antibots-${guildId}`)              === 'on',
        antilink:            db.get(`antilinks-${guildId}`)             === 'on',
        antispam:            !!db.get(`spamProtectionEnabled_${guildId}`),
        antidelete:          !!db.get(`antiDelete-${guildId}`),
        anticreate:          !!db.get(`anticreate-${guildId}`),
        antiwebhook:         !!db.get(`antiWebhook_${guildId}`),
        antiperms:           !!db.get(`antiPerms_${guildId}`),
        antijoin:            !!db.get(`antijoinEnabled_${guildId}`),
        antiservername:      !!db.get(`antiServerName_${guildId}`),
        antiserveravatar:    !!db.get(`antiServerAvatar_${guildId}`),
        antijoinPunishment:  db.get(`antijoinPunishment_${guildId}`)   || '',
        banLimit:            db.get(`banLimit_${guildId}`)             || '',
        logChannel:          db.get(`securityLog_${guildId}`)          || '',
      },
      channels,
      roles,
    });
  });

  // ── POST /api/settings/:guildId/welcome ──────────────────────────────
  app.post('/api/settings/:guildId/welcome', (req, res) => {
    const { guildId } = req.params;
    const { channel, style, message, color } = req.body;
    if (channel !== undefined) db.set(`chat_wlc_${guildId}`,     channel);
    if (style   !== undefined) db.set(`wlc_style_${guildId}`,    style);
    if (message !== undefined) db.set(`mesg_message_${guildId}`, message);
    if (color   !== undefined) db.set(`Guild_Color-${guildId}`,  color);
    res.json({ ok: true });
  });

  // ── POST /api/settings/:guildId/logs ─────────────────────────────────
  app.post('/api/settings/:guildId/logs', (req, res) => {
    const { guildId } = req.params;
    const map = {
      messages:  `channelmessage_${guildId}`,
      pic:       `logpic_${guildId}`,
      channels:  `logchannels_${guildId}`,
      nickname:  `lognickname_${guildId}`,
      joinLeave: `logjoinleave_${guildId}`,
      links:     `loglinks_${guildId}`,
      bots:      `logbots_${guildId}`,
      roles:     `logroles_${guildId}`,
      voice:     `logvjoinvexit_${guildId}`,
      move:      `logmove_${guildId}`,
      ban:       `logbanunban_${guildId}`,
      kick:      `logkick_${guildId}`,
      mute:      `logmutedeafen_${guildId}`,
      timeout:   `logtimeuntime_${guildId}`,
      emoji:     `logemoji_${guildId}`,
      prison:    `logprisonunprison_${guildId}`,
      warns:     `logwarns_${guildId}`,
      voiceMute: `logtvoicemute_${guildId}`,
      tmute:     `logtmuteuntmute_${guildId}`,
    };
    for (const [k, dbKey] of Object.entries(map)) {
      if (req.body[k] !== undefined) db.set(dbKey, req.body[k]);
    }
    res.json({ ok: true });
  });

  // ── POST /api/settings/:guildId/security ─────────────────────────────
  app.post('/api/settings/:guildId/security', (req, res) => {
    const { guildId } = req.params;
    const b = req.body;
    if (b.antibots    !== undefined) db.set(`antibots-${guildId}`,              b.antibots    ? 'on' : 'off');
    if (b.antilink    !== undefined) db.set(`antilinks-${guildId}`,             b.antilink    ? 'on' : 'off');
    if (b.antispam    !== undefined) db.set(`spamProtectionEnabled_${guildId}`, b.antispam);
    if (b.antidelete  !== undefined) db.set(`antiDelete-${guildId}`,            b.antidelete);
    if (b.anticreate  !== undefined) db.set(`anticreate-${guildId}`,            b.anticreate);
    if (b.antiwebhook !== undefined) db.set(`antiWebhook_${guildId}`,           b.antiwebhook);
    if (b.antiperms   !== undefined) db.set(`antiPerms_${guildId}`,             b.antiperms);
    if (b.antijoin    !== undefined) db.set(`antijoinEnabled_${guildId}`,       b.antijoin);
    if (b.antiservername   !== undefined) db.set(`antiServerName_${guildId}`,   b.antiservername);
    if (b.antiserveravatar !== undefined) db.set(`antiServerAvatar_${guildId}`, b.antiserveravatar);
    if (b.antijoinPunishment !== undefined) db.set(`antijoinPunishment_${guildId}`, b.antijoinPunishment);
    if (b.banLimit   !== undefined) db.set(`banLimit_${guildId}`,    b.banLimit);
    if (b.logChannel !== undefined) db.set(`securityLog_${guildId}`, b.logChannel);
    res.json({ ok: true });
  });

  // ── GET/POST /api/settings/:guildId/disabled-commands ────────────────
  app.get('/api/settings/:guildId/disabled-commands', (req, res) => {
    const { guildId } = req.params;
    res.json({ disabled: db.get(`disabled_cmds_${guildId}`) || [] });
  });
  app.post('/api/settings/:guildId/disabled-commands', (req, res) => {
    const { guildId } = req.params;
    const { disabled } = req.body;
    if (Array.isArray(disabled)) db.set(`disabled_cmds_${guildId}`, disabled);
    res.json({ ok: true });
  });

  // ── NEW: GET /api/protection/:guildId ────────────────────────────────
  // Returns protection status, action limits, punishment, bypass list
  app.get('/api/protection/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const enabled    = db.get(`protectionEnabled_${guildId}`) || false;
    const punishment = db.get(`punishment_${guildId}`)        || 'remove_roles';
    const logChannel = db.get(`logChannel_${guildId}`)        || '';
    const bypassed   = db.get(`bypassedMembers_${guildId}`)   || [];
    const limits     = {};
    for (const type of Object.keys(DEFAULT_LIMITS)) {
      limits[type] = db.get(`maxLimit_${guildId}_${type}`) || DEFAULT_LIMITS[type];
    }
    const audit = getProtectionAudit(guildId);
    res.json({ enabled, punishment, logChannel, bypassed, limits, audit });
  });

  // ── NEW: POST /api/protection/:guildId ───────────────────────────────
  app.post('/api/protection/:guildId', (req, res) => {
    const { guildId } = req.params;
    const { enabled, punishment, logChannel, bypassed, limits } = req.body;
    if (enabled    !== undefined) db.set(`protectionEnabled_${guildId}`, enabled);
    if (punishment !== undefined) db.set(`punishment_${guildId}`,        punishment);
    if (logChannel !== undefined) db.set(`logChannel_${guildId}`,        logChannel);
    if (Array.isArray(bypassed))  db.set(`bypassedMembers_${guildId}`,   bypassed);
    if (limits && typeof limits === 'object') {
      for (const [type, val] of Object.entries(limits)) {
        if (DEFAULT_LIMITS[type] !== undefined && typeof val === 'number') {
          db.set(`maxLimit_${guildId}_${type}`, val);
        }
      }
    }
    res.json({ ok: true });
  });

  // ── NEW: GET /api/leaderboard/:guildId ───────────────────────────────
  // Returns top 20 users by XP for the guild
  app.get('/api/leaderboard/:guildId', (req, res) => {
    const { guildId } = req.params;
    const g = client.guilds.cache.get(guildId);
    if (!g) return res.json({ leaderboard: [] });

    const entries = [];
    // Collect all XP keys for this guild
    // pro.db stores everything — iterate known members
    g.members.cache.forEach(member => {
      const xp    = db.get(`xp_${guildId}_${member.id}`)    || 0;
      const level = db.get(`level_${guildId}_${member.id}`) || 0;
      const pts   = db.get(`points_${guildId}_${member.id}`)|| 0;
      if (xp > 0 || level > 0 || pts > 0) {
        entries.push({
          id:          member.id,
          username:    member.user.tag,
          avatar:      member.user.displayAvatarURL({ format: 'png', size: 64 }),
          displayName: member.displayName,
          xp, level, pts,
        });
      }
    });

    entries.sort((a, b) => b.xp - a.xp || b.level - a.level);
    res.json({ leaderboard: entries.slice(0, 20) });
  });

  // ── NEW: GET /api/stats/:guildId ─────────────────────────────────────
  // Returns server statistics
  app.get('/api/stats/:guildId', (req, res) => {
    const { guildId } = req.params;
    const g = client.guilds.cache.get(guildId);
    if (!g) return res.status(404).json({ error: 'Guild not found' });

    const members     = g.members.cache;
    const bots        = members.filter(m => m.user.bot).size;
    const humans      = members.size - bots;
    const online      = members.filter(m => m.presence?.status === 'online').size;
    const textChannels  = g.channels.cache.filter(c => c.type === 'GUILD_TEXT').size;
    const voiceChannels = g.channels.cache.filter(c => c.type === 'GUILD_VOICE').size;
    const roles       = g.roles.cache.size;
    const boosts      = g.premiumSubscriptionCount || 0;
    const boostTier   = g.premiumTier;

    res.json({
      name:          g.name,
      icon:          g.iconURL({ format: 'png', size: 128 }),
      memberCount:   g.memberCount,
      humans, bots, online,
      textChannels, voiceChannels,
      roles, boosts, boostTier,
      createdAt:     g.createdAt,
      ownerId:       g.ownerId,
      verificationLevel: g.verificationLevel,
    });
  });

  // ── NEW: GET /api/audit/:guildId ─────────────────────────────────────
  // Returns protection audit log
  app.get('/api/audit/:guildId', (req, res) => {
    const { guildId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const audit = getProtectionAudit(guildId).slice(0, limit);
    res.json({ audit });
  });

  // ── Serve dashboard index ─────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`[Dashboard] Running → http://localhost:${PORT}`);
    console.log(`[Dashboard] API Key  → ${config.dashboardApiKey}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Dashboard] Port ${PORT} is already in use. Dashboard not started.`);
    } else {
      console.error('[Dashboard] Server error:', err.message);
    }
  });
};
