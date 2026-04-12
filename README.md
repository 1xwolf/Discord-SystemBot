# Discord System Bot


<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/64a087bd-55b1-4304-b22a-3cf2713d4e79" />


Lightweight and scalable Discord bot built with Node.js for moderation, automation, and media tools.

---
<img width="1135" height="805" alt="image" src="https://github.com/user-attachments/assets/7f4c29e3-5020-47da-bf50-871299905054" />

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


