# Fast Track Fetching & Playing - Complete Examples

Yeh file complete examples hai fast track fetching aur playing ke liye. Har example practical use case dikhata hai.

## Table of Contents
1. [Basic Fast Fetch](#basic-fast-fetch)
2. [Quick Play (Single Command)](#quick-play)
3. [Batch Fetching (Multiple Tracks)](#batch-fetching)
4. [Pre-loading Tracks](#pre-loading)
5. [Cache Usage](#cache-usage)
6. [Real Discord Bot Example](#discord-bot-example)

---

## Basic Fast Fetch

Sabse simple way track fetch karne ka:

```typescript
import { LavalinkManager } from 'aliana-client';
import { FastTrackFetcher } from 'aliana-client/utils/FastTrackFetcher';

const manager = new LavalinkManager({
  nodes: [{
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
  }],
});

const fetcher = new FastTrackFetcher(manager);

const result = await fetcher.fetch('Imagine Dragons Believer');

console.log('Tracks found:', result.data.length);
```

---

## Quick Play

**Ek command se track fetch + play** (sabse fast method):

```typescript
const success = await fetcher.quickPlay(
  guildId,           // Discord server ID
  'Shape of You',    // Query
  {
    source: 'youtube',
    requester: message.author,
  }
);

if (success) {
  message.reply('✅ Track play ho raha hai!');
} else {
  message.reply('❌ Track nahi mila');
}
```

### Full Example with Error Handling

```typescript
async function playCommand(message: Message, args: string[]) {
  const query = args.join(' ');
  
  if (!query) {
    return message.reply('Song ka naam batao!');
  }

  try {
    const success = await fetcher.quickPlay(message.guild.id, query, {
      source: 'youtubemusic',
      requester: message.author,
    });

    if (success) {
      message.reply(`🎵 Playing: **${query}**`);
    } else {
      message.reply('Koi track nahi mila is naam se');
    }
  } catch (error) {
    message.reply('Error aagaya bhai: ' + error.message);
  }
}
```

---

## Batch Fetching

**Multiple tracks ek saath fetch karo** (playlists ya recommendations ke liye):

```typescript
const queries = [
  'Coldplay Yellow',
  'The Weeknd Blinding Lights',
  'Dua Lipa Levitating',
  'Bruno Mars 24K Magic',
];

const results = await fetcher.batchFetch(queries, {
  source: 'youtube',
  useCache: true,
});

results.forEach((result, index) => {
  if (Array.isArray(result.data)) {
    console.log(`Query ${index + 1}: ${result.data.length} tracks found`);
  }
});
```

### Playlist Creation Example

```typescript
async function createPlaylist(guildId: string, trackNames: string[]) {
  const results = await fetcher.batchFetch(trackNames);
  const player = manager.getPlayer(guildId);
  
  const allTracks: Track[] = [];
  for (const result of results) {
    if (Array.isArray(result.data) && result.data.length > 0) {
      allTracks.push(result.data[0]);
    }
  }

  if (allTracks.length > 0) {
    await player.queue.add(allTracks);
    await player.play();
    return `✅ ${allTracks.length} tracks added!`;
  }
  
  return '❌ Koi track nahi mila';
}
```

---

## Pre-loading

**Tracks ko pehle se load karlo** (fast playback ke liye):

```typescript
const popularSongs = [
  'Trending Hindi Songs 2024',
  'Bollywood Hits',
  'Arijit Singh Best',
];

await fetcher.preloadTracks(popularSongs);

console.log('Pre-loading complete! Ab instant play hoga');
```

### Smart Pre-loading Example

```typescript
const fetcher = new FastTrackFetcher(manager, 600000);

async function smartPreload(userId: string) {
  const userHistory = await getUserListeningHistory(userId);
  
  const predictedSongs = userHistory.slice(0, 10);
  
  await fetcher.preloadTracks(predictedSongs, {
    source: 'youtubemusic',
  });
  
  console.log(`✅ ${predictedSongs.length} tracks pre-loaded for instant playback`);
}
```

---

## Cache Usage

**Cache se 10x faster fetching:**

```typescript
const fetcher = new FastTrackFetcher(
  manager,
  300000  // 5 minute cache timeout
);

const result1 = await fetcher.fetch('Diljit Dosanjh Born To Shine');

const result2 = await fetcher.fetch('Diljit Dosanjh Born To Shine');

const stats = fetcher.getCacheStats();
console.log('Cache stats:', stats);
```

### Cache Stats Output

```javascript
{
  size: 15,              // Total cached items
  hits: 8,               // Cache hits
  misses: 7,             // Cache misses
  hitRate: 0.533         // 53.3% hit rate
}
```

### Clear Cache When Needed

```typescript
fetcher.clearCache();
console.log('Cache cleared');
```

---

## Discord Bot Example

**Complete working Discord bot with fast track system:**

```typescript
import { Client, Message } from 'discord.js';
import { LavalinkManager } from 'aliana-client';
import { FastTrackFetcher } from 'aliana-client/utils/FastTrackFetcher';

const client = new Client({
  intents: ['Guilds', 'GuildVoiceStates', 'GuildMessages', 'MessageContent'],
});

const manager = new LavalinkManager({
  nodes: [{
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
  }],
  sendGatewayPayload: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

const fetcher = new FastTrackFetcher(manager, 600000);

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'play') {
    const query = args.join(' ');
    
    if (!query) {
      return message.reply('Koi song ka naam do bhai!');
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('Pehle voice channel mein aao!');
    }

    let player = manager.getPlayer(message.guild.id);
    if (!player) {
      player = manager.createPlayer({
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
      });
      await player.connect();
    }

    const success = await fetcher.quickPlay(message.guild.id, query, {
      source: 'youtubemusic',
      requester: message.author,
    });

    if (success) {
      const currentTrack = player.queue.current;
      message.reply(`🎵 **Playing:** ${currentTrack?.title || query}`);
    } else {
      message.reply('❌ Track nahi mila');
    }
  }

  if (command === 'playlist') {
    const playlistQueries = [
      'Sidhu Moose Wala 295',
      'AP Dhillon Brown Munde',
      'Diljit Dosanjh GOAT',
      'Karan Aujla Softly',
    ];

    const results = await fetcher.batchFetch(playlistQueries, {
      source: 'youtube',
      useCache: true,
    });

    const player = manager.getPlayer(message.guild.id);
    if (!player) {
      return message.reply('Pehle !play use karo');
    }

    let addedCount = 0;
    for (const result of results) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        await player.queue.add(result.data[0]);
        addedCount++;
      }
    }

    message.reply(`✅ ${addedCount} tracks playlist mein add hogaye!`);
  }

  if (command === 'stats') {
    const stats = fetcher.getCacheStats();
    message.reply(
      `📊 **Cache Stats:**\n` +
      `Size: ${stats.size}\n` +
      `Hits: ${stats.hits}\n` +
      `Misses: ${stats.misses}\n` +
      `Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`
    );
  }
});

client.on('ready', () => {
  console.log('✅ Bot ready hai!');
  
  const popularSongs = [
    'Trending Songs 2024',
    'Bollywood Top 10',
  ];
  
  fetcher.preloadTracks(popularSongs).then(() => {
    console.log('✅ Popular tracks pre-loaded!');
  });
});

manager.on('trackStart', (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel?.isTextBased()) {
    channel.send(`▶️ **Now Playing:** ${track.title} by ${track.author}`);
  }
});

client.login('YOUR_BOT_TOKEN');
```

---

## Performance Tips

### 1. Use Cache for Repeated Queries
```typescript
const fetcher = new FastTrackFetcher(manager, 600000);
```

### 2. Batch Fetch Related Tracks
```typescript
const relatedTracks = ['Song 1', 'Song 2', 'Song 3'];
await fetcher.batchFetch(relatedTracks);
```

### 3. Pre-load Popular Content
```typescript
await fetcher.preloadTracks(trendingSongs);
```

### 4. Use Quick Play for Single Tracks
```typescript
await fetcher.quickPlay(guildId, query);
```

---

## Comparison: Regular vs Fast Fetcher

### Regular Method (Slow)
```typescript
const result = await manager.search(query);
const player = manager.getPlayer(guildId);
await player.queue.add(result.data);
await player.play();
```
**Time: ~500-800ms**

### Fast Method (Quick Play)
```typescript
await fetcher.quickPlay(guildId, query);
```
**Time: ~50-100ms (with cache)**

---

## Summary

- **`quickPlay()`**: Sabse fast method - ek line mein sab kuch
- **`batchFetch()`**: Multiple tracks ek saath fetch
- **`preloadTracks()`**: Pehle se tracks load karlo
- **Cache**: Automatic hai, 5-10x faster repeated queries
- **Stats**: `getCacheStats()` se performance track karo

Yeh sab methods fast aur efficient hai! 🚀

---

## Links & Support

- **GitHub Repository**: https://github.com/Itz-Npg/aliana-client
- **Discord Support Server**: https://discord.gg/Ty2waDpdqb
- **Documentation**: See `docs/index.html` or run `npm run docs:dev`

For more help, join our Discord server!
