# Discord System Bot

Lightweight and scalable Discord bot built with Node.js for moderation, automation, and media tools.

---

## Features

* Moderation system
* Image & canvas utilities
* Voice support
* API integrations
* Secure & rate-limited backend
* Modular structure

---

## Installation

```bash id="k1l2m3"
git clone <repo>
cd project
npm install
```

---

## Setup

### Option 1: config.json

Create `config.json`:

```json id="c0nfig1"
{
  "owners": [""],
  "Guild": "",
  "prefix": "!",
  "token": "",
  "botId": ""
}
```

---

### Option 2: config.js 

```js id="c0nfig2"
require('dotenv').config();

const config = {
  token: process.env.BOT_TOKEN,
  botId: process.env.BOT_ID,
  prefix: '!',
  owners: [''],
  Guild: '',
};

module.exports = config;
```

---

## Run

```bash id="run1"
npm start
```

---


