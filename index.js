/**
 * Syestm Discord Bot — Main Entry Point
 * ─────────────────────────────────────
 * Loads config → client → handler → protection → events → dashboard
 */

require('dotenv').config();

const { Client, Collection } = require('discord.js');
const fs     = require('fs');
const db     = require('pro.db');
const config = require('./config');

// ── Client ──────────────────────────────────────────────────────────
const client = new Client({ intents: 32767 });

// Reasonable max listeners (one per event type, with headroom)
require('events').EventEmitter.defaultMaxListeners = 50;

// ── Attach shared state ─────────────────────────────────────────────
client.commands = new Collection();
client.config   = config;

// ── Export client before loading anything that requires it ──────────
module.exports = client;

// ── Load command handler ─────────────────────────────────────────────
require('./handler')(client);

// ── Load protection system ───────────────────────────────────────────
require('./handler/protection')(client);

// ── Login ────────────────────────────────────────────────────────────
client.login(config.token);

// ── Ready ────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`[Bot] Logged in as ${client.user.tag}`);

  // Apply saved presence from database
  applyPresence();

  // Re-apply presence after shard reconnect (Discord clears it)
  client.on('shardResume', applyPresence);
  client.on('shardReady',  applyPresence);

  // Start dashboard server
  try {
    require('./dashboard/server')(client);
  } catch (err) {
    console.error('[Dashboard] Failed to start:', err.message);
  }
});

// ── Load events dynamically from /events/<folder>/<name>.js ──────────
fs.readdir(`${__dirname}/events/`, (err, folders) => {
  if (err) return console.error('[Events]', err);
  folders.forEach(folder => {
    if (folder.includes('.')) return; // skip files
    fs.readdir(`${__dirname}/events/${folder}`, (err, files) => {
      if (err) return console.error('[Events]', err);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const eventName = file.split('.')[0];
        const relPath   = `${folder}/${file}`;
        try {
          const handler = require(`${__dirname}/events/${relPath}`);
          if (typeof handler !== 'function') {
            // File loaded but exports an object/undefined — skip binding silently
            // (e.g. fully-commented files, stub files, self-registering files)
            if (handler !== undefined && Object.keys(handler).length > 0) {
              console.warn(`[Events] Skipped ${relPath}: exports is not a function (got ${typeof handler})`);
            }
            return;
          }
          client.on(eventName, handler.bind(null, client));
        } catch (e) {
          console.error(`[Events] Failed to load ${relPath}:`, e.message);
        }
      });
    });
  });
});

// ── Owner restart command ─────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(config.prefix)) return;
  const args    = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command !== 'restart') return;
  if (!config.owners.includes(message.author.id)) return message.react('❌');
  await message.reply('جاري إعادة تشغيل البوت... 🔄');
  client.destroy();
  // Let PM2 / process monitor restart; or use process.exit for manual restart
  setTimeout(() => process.exit(0), 1500);
});

// ── Presence helper ───────────────────────────────────────────────────
function applyPresence() {
  const status = db.get('bot_presence_status')       || 'online';
  const type   = db.get('bot_presence_activityType') || 'PLAYING';
  const text   = db.get('bot_presence_activityText') || '';
  const url    = db.get('bot_presence_streamUrl')    || '';

  const presenceData = { status, activities: [] };
  if (text) {
    const act = { name: text, type };
    if (type === 'STREAMING') act.url = url || 'https://twitch.tv/placeholder';
    presenceData.activities.push(act);
  }
  // setPresence() is synchronous in discord.js v13 — returns Presence, not Promise
  try {
    client.user.setPresence(presenceData);
  } catch (err) {
    console.error('[Presence] Failed to set presence:', err.message);
  }
  console.log(`[Presence] ${status} | ${type}: ${text || '(none)'}`);
}

// ── Global error handling ─────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});
