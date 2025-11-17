# ⚡ Quick Start Guide

Get your Aliana-Client project running on GitHub in 5 minutes!

## 🎯 Step-by-Step Setup

### 1. Clone this repository (if working locally)
```bash
git clone https://github.com/YOUR_USERNAME/aliana-client.git
cd aliana-client
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

### 4. Test the example bot

#### First, create a testbot config file:
```bash
cd testbot
cp config.example.json config.json
```

#### Edit `testbot/config.json` with your settings:
```json
{
  "prefix": "!",
  "lavalink": {
    "nodes": [
      {
        "host": "localhost",
        "port": 2333,
        "password": "youshallnotpass",
        "secure": false,
        "identifier": "Main"
      }
    ]
  }
}
```

#### Set your Discord bot token:
```bash
export DISCORD_BOT_TOKEN="your-bot-token-here"
```

#### Run the testbot:
```bash
cd testbot
npm install
npm run build
node dist/index.js
```

---

## 🌐 View Documentation Locally

```bash
npm install -g serve
serve docs -l 5000
```

Open: http://localhost:5000

---

## 🚀 Deploy to GitHub Pages

See [GITHUB_SETUP_GUIDE.md](./GITHUB_SETUP_GUIDE.md) for full instructions.

Quick version:
```bash
# Make sure you're on main branch
git checkout main

# Push to GitHub
git push origin main
```

Documentation will be live at: `https://YOUR_USERNAME.github.io/aliana-client/`

---

## 📦 Use in Your Project

```bash
npm install aliana-client
```

```typescript
import { LavalinkManager } from 'aliana-client';

const manager = new LavalinkManager({
  nodes: [{ host: 'localhost', port: 2333, password: 'youshallnotpass' }],
  sendPayload: (guildId, payload) => {
    // Your Discord gateway send logic
  },
});

await manager.init('YOUR_BOT_USER_ID');
```

---

## 🎵 Example Commands (for testbot)

- `!play <song name>` - Play a song
- `!pause` - Pause playback
- `!resume` - Resume playback
- `!skip` - Skip current track
- `!queue` - Show queue
- `!autoplay` - Toggle autoplay mode
- `!filter <preset>` - Apply audio filter
- `!card` - Generate music card
- `!help` - Show all commands

---

## 📚 Learn More

- [Full Documentation](./README.md)
- [API Reference](./API_REFERENCE.md)
- [Examples](./EXAMPLES.md)
- [GitHub Setup Guide](./GITHUB_SETUP_GUIDE.md)

---

## 🆘 Need Help?

Check out:
- [GitHub Issues](https://github.com/YOUR_USERNAME/aliana-client/issues)
- [Examples folder](./EXAMPLES.md)
- [Testing Guide](./TESTING_GUIDE.md)
