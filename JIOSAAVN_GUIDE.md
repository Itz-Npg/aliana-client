# JioSaavn Plugin Support Guide

Aliana-Client ab **JioSaavn plugin** ko support karta hai! JioSaavn ek Indian music streaming service hai jo Bollywood, Punjabi, aur Hindi songs ke liye best hai.

## Table of Contents
1. [Why JioSaavn?](#why-jiosaavn)
2. [Lavalink Setup](#lavalink-setup)
3. [Usage Examples](#usage-examples)
4. [Supported Features](#supported-features)
5. [Performance Benefits](#performance-benefits)

---

## Why JioSaavn?

### Advantages
✅ **No region blocking** - Worldwide kahi bhi kaam karega  
✅ **Better quality** - 320KBPS MP3 (Deezer se better)  
✅ **Indian content** - Bollywood, Punjabi, Tamil, Telugu sab kuch  
✅ **No decryption needed** - Simple aur fast  
✅ **Large library** - Spotify aur Apple Music jitna bada collection  

### Perfect For
- Bollywood music enthusiasts
- Indian regional music (Punjabi, Tamil, Telugu, etc.)
- Alternative to YouTube for Indian content
- Users who want high-quality Indian music

---

## Lavalink Setup

### Step 1: Add Plugin to Lavalink

Apne Lavalink server ke `application.yml` mein yeh add karo:

```yaml
lavalink:
  plugins:
    - dependency: "com.github.appujet:jiosaavn-plugin:1.0.6"
      repository: "https://maven.appujet.site/releases"
```

### Step 2: Configure Plugin

```yaml
plugins:
  jiosaavn:
    apiURL: "https://jiosaavn-plugin-api.vercel.app/api"
    playlistTrackLimit: 50
    recommendationsTrackLimit: 10
```

### Step 3: Restart Lavalink Server

```bash
java -jar Lavalink.jar
```

Aapko log mein dekhna chahiye:
```
✅ Loaded plugin jiosaavn-plugin v1.0.6
```

---

## Usage Examples

### 1. Search for Songs

```typescript
import { LavalinkManager } from 'aliana-client';

const manager = new LavalinkManager({
  nodes: [/* ... */],
  defaultSearchPlatform: 'jiosaavn',
});

const result = await manager.search('Tum Hi Ho', undefined, 'jiosaavn');

console.log('Found:', result.data[0].title);
```

### 2. Using Search Prefix

JioSaavn ke special prefixes:

```typescript
const result = await manager.search('jssearch:Arijit Singh Tum Hi Ho');
```

### 3. Recommendations

```typescript
const result = await manager.search('jsrec:track_identifier');
```

### 4. Direct URLs

JioSaavn URLs directly support hote hain:

```typescript
const urls = [
  'https://www.jiosaavn.com/song/apna-bana-le/ATIfejZ9bWw',
  'https://www.jiosaavn.com/album/bhediya/wSM2AOubajk_',
  'https://www.jiosaavn.com/artist/arijit-singh-songs/LlRWpHzy3Hk_',
  'https://www.jiosaavn.com/featured/jai-hanuman/8GIEhrr8clSO0eMLZZxqsA__',
];

for (const url of urls) {
  const result = await manager.search(url);
  await player.queue.add(result.data);
}
```

### 5. With Fast Track Fetcher

```typescript
import { FastTrackFetcher } from 'aliana-client';

const fetcher = new FastTrackFetcher(manager);

await fetcher.quickPlay(guildId, 'Kesariya', {
  source: 'jiosaavn',
  requester: user,
});
```

---

## Supported Features

### ✅ Supported
- Search queries (`jssearch:query`)
- Direct track URLs
- Album URLs (sare tracks load honge)
- Artist top tracks
- Playlist URLs
- Recommendations (`jsrec:identifier`)

### ❌ Not Required
- API keys (plugin handles everything)
- Authentication
- Region restrictions

---

## Performance Benefits

### Speed Comparison

| Source | Search Time | Quality |
|--------|------------|---------|
| YouTube | 400-600ms | Variable |
| JioSaavn | 200-400ms | 320kbps MP3 |
| Spotify | Needs mirror | Depends |

### Quality

- **Bitrate**: 320KBPS MP3 (vs YouTube's compressed audio)
- **Consistency**: Always high quality
- **No buffering**: Direct stream from JioSaavn servers

---

## Complete Discord Bot Example

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { LavalinkManager, FastTrackFetcher } from 'aliana-client';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const manager = new LavalinkManager({
  nodes: [{
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
  }],
  defaultSearchPlatform: 'jiosaavn',
  sendPayload: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

const fetcher = new FastTrackFetcher(manager);

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play ')) {
    const query = message.content.slice(6);
    
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Voice channel mein aao!');
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

    const success = await fetcher.quickPlay(
      message.guild.id,
      query,
      {
        source: 'jiosaavn',
        requester: message.author,
      }
    );

    if (success) {
      message.reply(`🎵 Playing from JioSaavn: **${query}**`);
    } else {
      message.reply('❌ JioSaavn par nahi mila, YouTube try karte hain...');
      await fetcher.quickPlay(message.guild.id, query, {
        source: 'youtube',
        requester: message.author,
      });
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

---

## Mixed Source Strategy

Best approach: JioSaavn pehle try karo, phir fallback to YouTube:

```typescript
async function smartPlay(guildId: string, query: string, requester: any) {
  try {
    const jsResult = await fetcher.quickPlay(guildId, query, {
      source: 'jiosaavn',
      requester,
    });
    
    if (jsResult) {
      return { source: 'JioSaavn', success: true };
    }
  } catch (error) {
    console.log('JioSaavn failed, trying YouTube...');
  }

  const ytResult = await fetcher.quickPlay(guildId, query, {
    source: 'youtube',
    requester,
  });
  
  return { source: 'YouTube', success: ytResult };
}
```

---

## Popular JioSaavn Playlists

Pre-load karne ke liye:

```typescript
const popularPlaylists = [
  'https://www.jiosaavn.com/featured/jai-hanuman/8GIEhrr8clSO0eMLZZxqsA__',
  'https://www.jiosaavn.com/featured/trending-today/I0rIsJUUqH8_',
  'https://www.jiosaavn.com/featured/bollywood-top-50/EgEEAB5FCT8_',
];

for (const url of popularPlaylists) {
  const result = await manager.search(url);
  await player.queue.add(result.data.tracks);
}
```

---

## Troubleshooting

### Plugin not loading?

1. Check Lavalink version (v4.0+ required)
2. Verify `application.yml` syntax
3. Ensure proper internet connection to maven repository

### No results found?

1. Try `jssearch:` prefix explicitly
2. Check if Lavalink server has the plugin loaded
3. Verify JioSaavn API URL is accessible

### Poor quality?

JioSaavn always streams at 320kbps. If quality is poor:
- Check your network connection
- Verify Lavalink server's internet speed
- Consider hosting Lavalink closer to India for better latency

---

## API Reference

### Search Platform Type

```typescript
type SearchPlatform = 'jiosaavn' | 'youtube' | 'youtubemusic' | /* ... */;
```

### Search Methods

```typescript
manager.search(query, requester, 'jiosaavn')
fetcher.fetch(query, { source: 'jiosaavn' })
fetcher.quickPlay(guildId, query, { source: 'jiosaavn' })
```

---

## Credits

- **Aliana-Client**: https://github.com/Itz-Npg/aliana-client
- **Discord Support**: https://discord.gg/Ty2waDpdqb
- **JioSaavn Plugin Author**: [appujet](https://github.com/appujet)
- **JioSaavn Plugin Repository**: https://github.com/appujet/jiosaavn-plugin
- **License**: MIT (Aliana-Client), Apache-2.0 (JioSaavn Plugin)

---

## Summary

✨ **Benefits**:
- Indian music ke liye best
- High quality (320kbps)
- No region blocking
- Fast loading
- Free to use

🚀 **Usage**:
```typescript
const result = await manager.search('Kesariya', undefined, 'jiosaavn');
```

💡 **Tip**: JioSaavn Indian content ke liye use karo, international tracks ke liye YouTube!
