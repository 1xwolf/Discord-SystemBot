# Discord System Bot

A powerful, modular Discord bot built with Node.js, designed for server management, automation, and media processing.

---

## Features

* Moderation system (ban, kick, mute, logs)
* Image generation & manipulation
* Voice support
* Database integration (SQLite)
* API integrations (AI, external services)
* Rate limiting & security
* Scalable architecture

---

## Tech Stack

* **Core:** discord.js, @discordjs/voice
* **Backend:** express, pm2
* **Database:** sqlite3, pro.db
* **Media:** canvas, sharp, jimp
* **APIs:** axios, node-fetch, cloudinary, deepai

---

## Installation

```bash id="a1b2c3"
git clone <repo>
cd project
npm install
```

---

## Usage

```bash id="d4e5f6"
npm start
```

---

## Environment

Create a `.env` file:

```env id="g7h8i9"
 BOT_TOKEN=your_discord_bot_token_here
 BOT_ID=your_bot_id_here
 DASHBOARD_API_KEY=change_this_to_a_strong_random_key
 DASHBOARD_PORT=4523```

---

## Structure

```
commands/
events/
handlers/
utils/
index.js
```

---

## License

MIT
