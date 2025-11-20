# 🎵 Aliana-Client

[![npm version](https://img.shields.io/npm/v/aliana-client.svg)](https://www.npmjs.com/package/aliana-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

A premium TypeScript Lavalink v4 client library for building powerful Discord music bots with enhanced audio quality, advanced filters, and comprehensive queue management.

## ✨ Features

- 🎯 **Multi-Source Support** - YouTube, Spotify, SoundCloud, Apple Music, Deezer, JioSaavn, Yandex Music (via Lavalink plugins)
- 🔄 **Autoplay System** - Configurable autoplay for continuous playback
- 🎛️ **Advanced Audio Filters** - 10+ presets including bassboost, nightcore, vaporwave, 8D, karaoke
- 📋 **Queue Management** - Full queue control with persistence support
- 🖼️ **Music Card Generation** - Beautiful visual music cards with built-in generator
- 🔊 **Audio Normalization** - Automatic volume leveling across tracks
- 🌐 **Multi-Node Support** - Load balancing across multiple Lavalink servers
- 🔌 **Auto-Reconnection** - Automatic reconnection with session resumption
- 📦 **TypeScript** - Full type safety and IntelliSense support
- 🚀 **High Performance** - Optimized for speed and low memory usage

## 📦 Installation

```bash
npm install aliana-client
```

**Requirements:**
- Node.js 18 or higher
- A running Lavalink v4 server
- Discord.js v14 or compatible Discord library

## 🚀 Quick Start

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { LavalinkManager } from 'aliana-client';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize Lavalink Manager
const manager = new LavalinkManager({
  nodes: [
    {
      id: 'main',
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass'
    }
  ],
  sendPayload: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
});

// Handle voice state updates
client.on('raw', (d) => {
  if (d.t === 'VOICE_STATE_UPDATE') {
    manager.updateVoiceState(d.d);
  }
  if (d.t === 'VOICE_SERVER_UPDATE') {
    manager.updateVoiceServer(d.d);
  }
});

// Initialize manager when bot is ready
client.once('ready', async () => {
  await manager.init(client.user.id);
  console.log('Bot is ready!');
});

// Play a song
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play')) {
    const query = message.content.slice(6).trim();
    
    // Search for tracks
    const result = await manager.search(query, message.author);
    
    if (result.tracks.length === 0) {
      return message.reply('No tracks found!');
    }
    
    // Get or create player
    const player = manager.createPlayer({
      guildId: message.guild.id,
      voiceChannelId: message.member.voice.channelId,
      textChannelId: message.channel.id,
      selfDeaf: true
    });
    
    // Add track to queue and play
    player.queue.add(result.tracks[0]);
    
    if (!player.playing && !player.paused) {
      await player.play();
    }
    
    message.reply(`Added to queue: **${result.tracks[0].title}**`);
  }
});

client.login('YOUR_BOT_TOKEN');
```

## 🎵 Supported Sources

Aliana-Client forwards queries to Lavalink, which supports multiple music sources:

> **⚠️ Note:** Source availability depends on your Lavalink configuration and installed plugins. The client supports these search prefixes, but the actual source must be enabled in your Lavalink server.

| Platform | Source ID | Search Prefix | Lavalink Plugin Required |
|----------|-----------|---------------|--------------------------|
| **YouTube** | `youtube` | `ytsearch:` | ❌ Built-in to Lavalink |
| **YouTube Music** | `youtubemusic` | `ytmsearch:` | ❌ Built-in to Lavalink |
| **SoundCloud** | `soundcloud` | `scsearch:` | ❌ Built-in to Lavalink |
| **Spotify** | `spotify` | `spsearch:` | ✅ [LavaSrc Plugin](https://github.com/topi314/LavaSrc) |
| **Apple Music** | `applemusic` | `amsearch:` | ✅ [LavaSrc Plugin](https://github.com/topi314/LavaSrc) |
| **Deezer** | `deezer` | `dzsearch:` | ✅ [LavaSrc Plugin](https://github.com/topi314/LavaSrc) |
| **JioSaavn** | `jiosaavn` | `jssearch:` | ✅ [JioSaavn Plugin](https://github.com/DuncteBot/skybot-lavalink-plugin) |
| **Yandex Music** | `yandex` | `ymsearch:` | ✅ [LavaSrc Plugin](https://github.com/topi314/LavaSrc) |

### Usage Examples

```typescript
// Direct URLs - auto-detected
await manager.search('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
await manager.search('https://open.spotify.com/track/...');
await manager.search('https://music.apple.com/...');

// Search queries - specify source
await manager.search('Imagine Dragons', user, 'youtube');
await manager.search('Arijit Singh', user, 'jiosaavn');
await manager.search('The Weeknd', user, 'spotify');

// Using search prefixes
await manager.search('spsearch:Coldplay');
await manager.search('ytmsearch:Believer');
```

## 🎛️ Audio Filters

Apply professional audio effects with built-in filter presets:

```typescript
const player = manager.getPlayer(guildId);

// Apply preset filters
await player.filters.setEqualizer('bassboost');
await player.filters.setEqualizer('nightcore');
await player.filters.setEqualizer('vaporwave');
await player.filters.setEqualizer('8d');
await player.filters.setEqualizer('karaoke');

// Custom filters
await player.filters.setFilters({
  equalizer: [
    { band: 0, gain: 0.25 },
    { band: 1, gain: 0.25 }
  ],
  timescale: { speed: 1.1, pitch: 1.1, rate: 1 },
  tremolo: { frequency: 4.0, depth: 0.5 }
});

// Clear all filters
await player.filters.clearFilters();
```

Available presets: `bassboost`, `nightcore`, `vaporwave`, `8d`, `karaoke`, `soft`, `pop`, `electronic`, `rock`, `classical`

## 📋 Queue Management

```typescript
const player = manager.getPlayer(guildId);

// Add tracks to queue
player.queue.add(track);
player.queue.add([track1, track2, track3]);

// Get queue information
const current = player.queue.current;
const upcoming = player.queue.tracks;
const previous = player.queue.previous;

// Queue controls
player.queue.shuffle();
player.queue.clear();
player.queue.remove(index);

// Enable persistence with Redis
import { RedisStoreAdapter } from 'aliana-client';
import Redis from 'ioredis'; // or your preferred Redis client

const redis = new Redis();
const manager = new LavalinkManager({
  // ... other options
  queueStore: new RedisStoreAdapter(redis)
});
```

## 🔄 Autoplay System

Enable autoplay for continuous playback:

```typescript
const player = manager.createPlayer({
  guildId: message.guild.id,
  voiceChannelId: voiceChannelId,
  textChannelId: textChannelId
});

// Enable or disable autoplay at any time
player.setAutoPlay(true);

// Check if autoplay is enabled
if (player.autoPlay) {
  console.log('Autoplay is enabled');
}
```

## 🔊 Audio Normalization

Automatically level audio across tracks:

```typescript
const player = manager.createPlayer({
  guildId: message.guild.id,
  voiceChannelId: voiceChannelId,
  textChannelId: textChannelId,
  audioNormalizer: true  // Enable audio normalization
});

// Normalization automatically adjusts volume to prevent
// sudden loudness changes between tracks
```

## 🖼️ Music Cards

Generate beautiful visual music cards:

```typescript
import { MusicCardGenerator } from 'aliana-client';

const player = manager.getPlayer(guildId);
const track = player.queue.current;

// Generate card with default options
const card = await MusicCardGenerator.generateCard(track);

// Or customize the card
const customCard = await MusicCardGenerator.generateCard(
  track,
  {
    backgroundColor: '#070707',
    progressColor: '#FF7A00',
    nameColor: '#FF7A00',
    authorColor: '#696969'
  },
  'classic' // Theme: 'classic', 'classicPro', or 'dynamic'
);

// Send the card
message.channel.send({ files: [customCard] });
```

## 📚 Example Bot

Check out **[Ayira-Bot](https://github.com/Itz-Npg/Ayira-Bot)** - a production-ready Discord music bot built with Aliana-Client!

**Ayira-Bot features:**
- Full music playback with queue management
- Advanced audio filters and effects
- Smart autoplay system
- Music card generation
- Multi-source support (YouTube, Spotify, JioSaavn, etc.)
- Slash commands and button interactions
- And much more!

[View Ayira-Bot on GitHub →](https://github.com/Itz-Npg/Ayira-Bot)

## 🎯 Advanced Features

### Multiple Lavalink Nodes

```typescript
const manager = new LavalinkManager({
  nodes: [
    { id: 'node1', host: 'lavalink1.example.com', port: 2333, password: 'pass1' },
    { id: 'node2', host: 'lavalink2.example.com', port: 2333, password: 'pass2' }
  ],
  // Load balancing strategy
  nodeStrategy: 'roundrobin'
});
```

### Event Handling

```typescript
// Manager events
manager.on('nodeConnect', (node) => {
  console.log(`Node ${node.id} connected`);
});

manager.on('nodeError', (node, error) => {
  console.error(`Node ${node.id} error:`, error);
});

// Player events
player.on('trackStart', (track) => {
  console.log(`Now playing: ${track.title}`);
});

player.on('trackEnd', (track) => {
  console.log(`Finished: ${track.title}`);
});

player.on('queueEnd', () => {
  console.log('Queue finished');
});
```

### Custom Queue Storage

```typescript
import { QueueStore } from 'aliana-client';

class MyCustomStore implements QueueStore {
  async get(guildId: string): Promise<any> {
    // Your custom storage logic
  }
  
  async set(guildId: string, data: any): Promise<void> {
    // Your custom storage logic
  }
  
  async delete(guildId: string): Promise<void> {
    // Your custom storage logic
  }
  
  async has(guildId: string): Promise<boolean> {
    // Your custom storage logic
  }
}

const manager = new LavalinkManager({
  queueStore: new MyCustomStore()
});
```

## 📖 Documentation

For detailed documentation, visit the [full documentation](https://github.com/Itz-Npg/aliana-client/tree/main/docs) or check out the `docs/` folder.

### API Reference

- [LavalinkManager](docs/index.html#manager)
- [Player](docs/index.html#player)
- [Queue](docs/index.html#queue)
- [Filters](docs/index.html#filters)
- [Events](docs/index.html#events)

## 🔧 Lavalink Setup

Aliana-Client requires a Lavalink v4 server. Here's a quick setup:

1. **Download Lavalink v4** from [GitHub Releases](https://github.com/lavalink-devs/Lavalink/releases)

2. **Create `application.yml`:**

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "youshallnotpass"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
```

3. **Install plugins (optional):**
   - [LavaSrc](https://github.com/topi314/LavaSrc) - For Spotify, Apple Music, Deezer
   - [JioSaavn Plugin](https://github.com/DuncteBot/skybot-lavalink-plugin) - For JioSaavn

4. **Run Lavalink:**

```bash
java -jar Lavalink.jar
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with inspiration from:
- [Lavalink-Client](https://github.com/Tomato6966/lavalink-client)
- [Shoukaku](https://github.com/Deivu/Shoukaku)
- [Kazagumo](https://github.com/Takiyo0/Kazagumo)

## 💬 Support

- **Example Bot:** [Ayira-Bot](https://github.com/Itz-Npg/Ayira-Bot)
- **Issues:** [GitHub Issues](https://github.com/Itz-Npg/aliana-client/issues)
- **Documentation:** [Full Docs](https://github.com/Itz-Npg/aliana-client/tree/main/docs)

---

Made with ❤️ by the Npg
