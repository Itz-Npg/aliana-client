# 🤖 Aliana-Client Test Bot

A fully functional Discord music bot built to test the `aliana-client` package.

## Features

This test bot demonstrates all the core features of `aliana-client`:

- ✅ **Music Playback** - Play songs from YouTube and other sources
- ✅ **Queue Management** - Add, skip, and manage your music queue
- ✅ **Audio Filters** - Apply presets like bassboost, nightcore, vaporwave, and 8D
- ✅ **Player Controls** - Pause, resume, volume control
- ✅ **Event Handling** - Proper event listeners for all player events
- ✅ **Voice State Management** - Automatic cleanup and reconnection

## Prerequisites

Before running the test bot, you need:

1. **Node.js 18+** installed
2. **A Discord Bot Token**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the token
   - Enable "Message Content Intent" in the bot settings
   
3. **Lavalink Server Running**
   - Download Lavalink v4: https://github.com/lavalink-devs/Lavalink/releases
   - Create `application.yml`:
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
           local: false
         bufferDurationMs: 400
         frameBufferDurationMs: 5000
         youtubePlaylistLoadLimit: 6
         playerUpdateInterval: 5
         youtubeSearchEnabled: true
         soundcloudSearchEnabled: true
         gc-warnings: true
     ```
   - Run: `java -jar Lavalink.jar`

## Setup Instructions

### 1. Install Dependencies

```bash
cd testbot
npm install
```

### 2. Configure Lavalink Connection

Edit `config.json` if your Lavalink server is not on localhost:

```json
{
  "prefix": "!",
  "lavalink": {
    "nodes": [
      {
        "id": "main",
        "host": "localhost",
        "port": 2333,
        "password": "youshallnotpass"
      }
    ]
  }
}
```

### 3. Set Bot Token

The bot token will be requested when you run the bot (managed by Replit Secrets).

### 4. Invite Bot to Server

Use this URL (replace `YOUR_CLIENT_ID` with your bot's client ID from Discord Developer Portal):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36703232&scope=bot
```

Required permissions:
- View Channels
- Send Messages
- Connect to Voice
- Speak

### 5. Run the Bot

```bash
npm start
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!play <query>` | Play a song or add to queue | `!play never gonna give you up` |
| `!pause` | Pause playback | `!pause` |
| `!resume` | Resume playback | `!resume` |
| `!skip` | Skip current track | `!skip` |
| `!stop` | Stop and clear queue | `!stop` |
| `!queue` | Show current queue | `!queue` |
| `!nowplaying` | Show current track info | `!nowplaying` or `!np` |
| `!volume <0-100>` | Set volume | `!volume 50` |
| `!filter <preset>` | Apply audio filter | `!filter bassboost` |
| `!help` | Show help message | `!help` |

## Audio Filters

Test the filter system with these presets:

- `!filter bassboost` - Enhanced bass
- `!filter nightcore` - Higher pitch and tempo
- `!filter vaporwave` - Slowed and reverb
- `!filter 8d` - 8D audio effect
- `!filter clear` - Remove all filters

## Testing Checklist

Use this bot to verify `aliana-client` is working:

- [ ] Bot connects to Lavalink successfully
- [ ] `!play` searches and plays music
- [ ] Track starts event fires correctly
- [ ] Queue management works (add, skip, show)
- [ ] Pause/resume functions properly
- [ ] Volume control adjusts audio
- [ ] Filters apply and affect audio
- [ ] Track end transitions to next song
- [ ] Queue end event fires when queue finishes
- [ ] Player cleanup on disconnect
- [ ] Error handling for invalid songs
- [ ] Multiple guilds work independently

## Troubleshooting

### Bot doesn't respond to commands
- Check if bot is online in Discord
- Verify "Message Content Intent" is enabled
- Check console for errors

### No audio plays
- Ensure Lavalink server is running
- Verify Lavalink configuration matches `config.json`
- Check if bot has permission to join voice channel
- Verify Java 17+ is installed for Lavalink

### Lavalink connection fails
- Check if port 2333 is accessible
- Verify password matches in `application.yml` and `config.json`
- Check Lavalink console for errors

### Filters don't work
- Ensure you're using valid preset names
- Check if track is playing before applying filter
- Verify Lavalink supports filter plugins

## Project Structure

```
testbot/
├── src/
│   └── index.ts          # Main bot code
├── config/
├── config.json           # Lavalink configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## What This Tests

This bot tests the following `aliana-client` components:

1. **LavalinkManager** - Initialization, node management, search
2. **Player** - Creation, playback, voice connection
3. **Queue** - Adding tracks, retrieving current/next
4. **Track** - Loading from search results
5. **Filters** - Applying and clearing filter presets
6. **Events** - All manager and player events
7. **Voice State** - Discord voice state updates

## Next Steps

After verifying the test bot works:

1. Review the source code to see how to use `aliana-client`
2. Check the main [TESTING_GUIDE.md](../TESTING_GUIDE.md) for more test scenarios
3. Read the [API_REFERENCE.md](../API_REFERENCE.md) for detailed API docs
4. Build your own bot with `aliana-client`!

## Support

If you encounter issues:
1. Check Lavalink server logs
2. Check bot console output
3. Verify all configurations are correct
4. Review the main package documentation

---

Built with ❤️ using `aliana-client`
