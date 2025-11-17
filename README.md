<<<<<<< HEAD
# aliana-client
=======
# 🎵 Aliana-client

> A premium TypeScript Lavalink v4 client with enhanced audio quality, advanced features, and comprehensive documentation.

[![npm version](https://img.shields.io/npm/v/aliana-client.svg?style=for-the-badge&logo=npm&logoColor=red)](https://www.npmjs.com/package/aliana-client)
[![npm downloads](https://img.shields.io/npm/dt/aliana-client.svg?style=for-the-badge&logo=npm&logoColor=red)](https://www.npmjs.com/package/aliana-client)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- 💯 **Lavalink v4 Native**: Full support for Lavalink v4, including its powerful plugin ecosystem
- ✅ **Detailed Player-Destroy Reasons**: Understand precisely why a player was destroyed (e.g., channel deleted, bot disconnected)
- ✨ **Flexible Queue Stores**: Use the default in-memory store or bring your own (Redis, databases, etc.) to sync queues across multiple processes
- 🎶 **Unresolved Tracks**: Supports unresolved track objects, fetching full data only when a track is about to play, saving API requests and resources
- 🎚️ **Built-in Filters & EQ**: Easy-to-use management for audio filters and equalizers with presets
- ⚙️ **Advanced Player Options**: Fine-tune player behavior for disconnects, empty queues, volume handling, and more
- 🛡️ **Lavalink-Side Validation**: Ensures you only use filters, plugins, and sources that your Lavalink node actually supports
- 🔒 **Client-Side Validation**: Whitelist and blacklist URLs or domains to prevent unwanted requests and protect your bot
- 🧑‍💻 **Developer-Friendly**: A memory-efficient design with a clean, intuitive API
- 🤖 **Automated Handling**: Automatically handles track skipping on errors, voice channel deletions, server-wide mutes, and much more
- 🎵 **Enhanced Audio Quality**: Built-in audio normalizer for consistent volume levels
- 🌈 **Rich Filter Presets**: Bass boost, nightcore, vaporwave, 8D audio, and more

---

## 📦 Installation

**Latest Stable Version: `v1.0.0`**

```bash
# via npm
npm install aliana-client

# via yarn
yarn add aliana-client

# via pnpm
pnpm add aliana-client

# via bun
bun add aliana-client
```

---

## 🎯 Quick Start

```typescript
import { LavalinkManager } from 'aliana-client';

const manager = new LavalinkManager({
  nodes: [
    {
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
      secure: false,
    },
  ],
  sendPayload: (guildId, payload) => {
    // Send payload to Discord gateway
  },
});

manager.on('ready', (node) => {
  console.log(`Node ${node.identifier} is ready!`);
});

manager.on('trackStart', (player, track) => {
  console.log(`Now playing: ${track.info.title}`);
});

await manager.init('YOUR_BOT_USER_ID');

const player = manager.createPlayer({
  guildId: 'GUILD_ID',
  voiceChannelId: 'VOICE_CHANNEL_ID',
  textChannelId: 'TEXT_CHANNEL_ID',
});

await player.connect();

const result = await manager.search('Never Gonna Give You Up', 'USER_ID');
if (result.tracks.length) {
  await player.queue.add(result.tracks[0]);
  await player.play();
}
```

---

## 📖 Documentation

Full documentation with interactive examples coming soon!

---

## 🎨 Audio Filters & Presets

```typescript
// Apply bass boost
await player.filters.setBassBoost(0.5);

// Apply nightcore effect
await player.filters.setNightcore(true);

// Apply 8D audio effect
await player.filters.set8D(true);

// Custom equalizer
await player.filters.setEqualizer([
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.15 },
]);
```

---

## 🔧 Advanced Features

### Flexible Queue Stores

```typescript
// Use default in-memory store
const player = manager.createPlayer({ ... });

// Or bring your own Redis store
import { RedisStore } from './stores/RedisStore';
const player = manager.createPlayer({
  queueStore: new RedisStore(redisClient),
  ...
});
```

### Client-Side Validation

```typescript
const manager = new LavalinkManager({
  nodes: [...],
  validationOptions: {
    allowedDomains: ['youtube.com', 'soundcloud.com'],
    blockedDomains: ['malicious-site.com'],
  },
});
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 📝 License

This project is [MIT](LICENSE) licensed.

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

Built with ❤️ for the Discord music bot community
>>>>>>> 5458e10 (Add comprehensive documentation and examples for the music client library)
