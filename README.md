# Discord System Bot 

Lightweight and scalable Discord bot built with Node.js for moderation, automation, and media tools.

Dashboard System Bot :

<img width="1393" height="833" alt="Screenshot 2026-04-12 204644" src="https://github.com/user-attachments/assets/b792024d-6f5a-4daf-b0f1-95f1dbaef69a" />

---

<img width="1391" height="883" alt="Screenshot 2026-04-12 204654" src="https://github.com/user-attachments/assets/e0c77746-cfc0-42d6-b343-17aff547d23c" />

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
git clone
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

const config = {
  token: process.env.BOT_TOKEN,
  botId: process.env.BOT_ID,
  prefix: '!',
  owners: [''],
  Guild: '',
};


```

---

## Run

```bash id="run1"
npm start
```

---


