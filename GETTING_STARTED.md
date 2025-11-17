# Getting Started with Aliana-client

## Installation

```bash
npm install aliana-client
```

## Prerequisites

- Node.js 18.0.0 or higher
- A Lavalink v4 server running
- Discord bot with voice permissions

## Quick Setup

### 1. Initialize the Manager

```typescript
import { LavalinkManager } from 'aliana-client';

const manager = new LavalinkManager({
  nodes: [
    {
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
      secure: false,
      identifier: 'main-node',
    },
  ],
  sendPayload: (guildId, payload) => {
    // Send payload to Discord gateway
    // Example with discord.js:
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
});
```

### 2. Set Up Event Listeners

```typescript
manager.on('ready', (node) => {
  console.log(`Node ${node.identifier} is ready!`);
});

manager.on('trackStart', (player, track) => {
  console.log(`Now playing: ${track.title} by ${track.author}`);
});

manager.on('trackEnd', (player, track, reason) => {
  console.log(`Track ended: ${reason}`);
});

manager.on('queueEnd', (player) => {
  console.log('Queue is empty');
});

manager.on('nodeError', (node, error) => {
  console.error(`Node ${node.identifier} error:`, error);
});
```

### 3. Initialize the Manager

```typescript
await manager.init('YOUR_BOT_USER_ID');
```

### 4. Create a Player

```typescript
const player = manager.createPlayer({
  guildId: 'GUILD_ID',
  voiceChannelId: 'VOICE_CHANNEL_ID',
  textChannelId: 'TEXT_CHANNEL_ID',
  volume: 100,
  selfDeaf: true,
});

await player.connect();
```

### 5. Search and Play Music

```typescript
const result = await manager.search('Never Gonna Give You Up', 'USER_ID');

if (result.tracks.length > 0) {
  await player.queue.add(result.tracks[0]);
  await player.play();
}
```

## Voice State Updates

You need to forward voice state updates from Discord to Aliana-client:

### With discord.js

```typescript
client.on('voiceStateUpdate', (oldState, newState) => {
  manager.updateVoiceState(newState);
});

client.ws.on('VOICE_SERVER_UPDATE' as any, (data: any) => {
  manager.updateVoiceServer(data);
});
```

## Configuration Options

### LavalinkManager Options

```typescript
interface LavalinkManagerOptions {
  nodes: NodeOptions[];
  sendPayload: (guildId: string, payload: any) => void;
  validationOptions?: ValidationOptions;
  autoResume?: boolean;
  clientId?: string;
  defaultSearchPlatform?: SearchPlatform;
  playerOptions?: DefaultPlayerOptions;
}
```

### Validation Options

```typescript
const manager = new LavalinkManager({
  nodes: [...],
  sendPayload: ...,
  validationOptions: {
    allowedDomains: ['youtube.com', 'soundcloud.com'],
    blockedDomains: ['malicious-site.com'],
    allowedProtocols: ['http', 'https'],
    maxTrackLength: 3600000, // 1 hour in ms
    maxPlaylistSize: 1000,
  },
});
```

### Player Options

```typescript
const player = manager.createPlayer({
  guildId: 'GUILD_ID',
  voiceChannelId: 'VOICE_CHANNEL_ID',
  textChannelId: 'TEXT_CHANNEL_ID',
  volume: 100,
  selfDeaf: true,
  selfMute: false,
  audioNormalizer: true,
});
```

## Search Platforms

Supported platforms:
- `youtube` (default)
- `youtubemusic`
- `soundcloud`
- `spotify`
- `deezer`
- `applemusic`
- `yandex`

```typescript
const result = await manager.search('song name', 'USER_ID', 'spotify');
```

## Next Steps

- [API Reference](./API_REFERENCE.md)
- [Examples](./EXAMPLES.md)
- [Audio Filters Guide](./README.md#-audio-filters--presets)
