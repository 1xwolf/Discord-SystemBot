require('dotenv').config();

const config = {
  token:   process.env.BOT_TOKEN,
  botId:   process.env.BOT_ID,
  prefix:  '!',
  owners:  [''],
  Guild:   '',
  dashboardApiKey: process.env.DASHBOARD_API_KEY || 'syestm_dash_2025_secure_key',
  dashboardPort:   parseInt(process.env.DASHBOARD_PORT) || 4523,
};

// Validate critical fields on startup
if (!config.token) {
  console.error('[CONFIG] ERROR: BOT_TOKEN is not set. Add it to your .env file.');
  process.exit(1);
}

module.exports = config;
