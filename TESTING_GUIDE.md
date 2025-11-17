# 🧪 Testing Guide for Aliana-Client

This guide will help you verify that your `aliana-client` package is working correctly.

## Prerequisites

Before testing, ensure you have:
- ✅ Node.js 18.0.0 or higher
- ✅ A Discord bot token
- ✅ A Lavalink server running (v4.x)

## Quick Test Checklist

### 1. ✅ Package Build Test
```bash
npm run build
```
**Expected Result**: Package builds without errors and generates files in `dist/` folder.

### 2. ✅ Type Checking Test
```bash
npm run type-check
```
**Expected Result**: No TypeScript errors.

### 3. ✅ Linting Test
```bash
npm run lint
```
**Expected Result**: No ESLint errors.

### 4. ✅ Integration Test (Using Test Bot)
The `testbot/` folder contains a fully functional Discord music bot that uses your package.

## Testing with the Test Bot

### Setup Instructions

1. **Navigate to the test bot folder:**
```bash
cd testbot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure your bot:**
   - Set up your Discord bot token (the bot will prompt you)
   - Configure Lavalink connection in `testbot/config.json`

4. **Start your Lavalink server:**
   - Download Lavalink v4 from https://github.com/lavalink-devs/Lavalink/releases
   - Run it with: `java -jar Lavalink.jar`

5. **Run the test bot:**
```bash
npm start
```

### Test Bot Features to Verify

The test bot includes these commands to test your package:

| Command | Tests | Expected Behavior |
|---------|-------|-------------------|
| `!play <song>` | Track loading & playback | Bot joins voice, plays music |
| `!skip` | Queue management | Skips to next track |
| `!queue` | Queue display | Shows current queue |
| `!pause` | Player controls | Pauses playback |
| `!resume` | Player controls | Resumes playback |
| `!stop` | Player cleanup | Stops & clears queue |
| `!volume <1-100>` | Volume control | Adjusts volume |
| `!filter <preset>` | Filter system | Applies audio filters |
| `!nowplaying` | Track info | Shows current track |

### Filter Presets to Test

Test the filter system with these presets:
- `bassboost` - Enhanced bass
- `nightcore` - Higher pitch & speed
- `vaporwave` - Slowed & reverb
- `8d` - 8D audio effect
- `clear` - Remove all filters

## Manual Testing Scenarios

### Scenario 1: Basic Playback
1. Join a voice channel
2. Use `!play never gonna give you up`
3. Verify: Bot joins, searches, and plays the track
4. Use `!nowplaying` to check track info
5. Use `!stop` to cleanup

### Scenario 2: Queue Management
1. Queue multiple songs: `!play song1`, `!play song2`, `!play song3`
2. Use `!queue` to verify all tracks are queued
3. Use `!skip` to verify it moves to next track
4. Verify autoplay continues to next track

### Scenario 3: Filters & Audio
1. Play a song
2. Apply filter: `!filter bassboost`
3. Verify audio changes
4. Clear filter: `!filter clear`
5. Verify audio returns to normal

### Scenario 4: Error Handling
1. Try `!play invalidSongThatDoesntExist123456`
2. Verify: Bot handles search errors gracefully
3. Try disconnecting bot manually
4. Verify: Player cleanup happens properly

### Scenario 5: Reconnection
1. Play a song
2. Disconnect from voice channel
3. Rejoin and play again
4. Verify: New player is created properly

## Checking Package Functionality

### Core Components to Verify

#### ✅ LavalinkManager
- Node connection established
- Event handlers working
- Proper initialization

#### ✅ Player
- Creates and manages players per guild
- Handles voice state updates
- Proper playback control

#### ✅ Queue
- Adds tracks correctly
- Returns current track
- Manages queue order

#### ✅ Track
- Resolves from search queries
- Contains correct metadata
- Plays successfully

#### ✅ Filters
- Applies filter presets
- Clears filters
- Audio effects work correctly

#### ✅ Node
- WebSocket connection stable
- Sends/receives Lavalink messages
- Handles reconnection

## Troubleshooting

### Package Not Working?

1. **Check build output:**
```bash
ls -la dist/
```
Should contain: `index.js`, `index.mjs`, `index.d.ts`, `index.d.mts`

2. **Verify package.json exports:**
```bash
cat package.json | grep -A 10 exports
```

3. **Test import:**
```javascript
// Create test.js
const { LavalinkManager } = require('./dist/index.js');
console.log('LavalinkManager:', typeof LavalinkManager);
```

### Test Bot Not Working?

1. **Lavalink not connected:**
   - Verify Lavalink is running on configured host/port
   - Check `application.yml` configuration
   - Verify password matches

2. **Bot not responding:**
   - Check bot token is correct
   - Verify bot has necessary Discord permissions
   - Check console for errors

3. **No audio playing:**
   - Verify Lavalink server has Java 17+
   - Check voice channel permissions
   - Verify bot can connect to voice

## Success Criteria

Your package is working if:
- ✅ Builds without errors
- ✅ All TypeScript types are properly exported
- ✅ Test bot can connect to Lavalink
- ✅ Music plays successfully
- ✅ Queue management works
- ✅ Filters apply correctly
- ✅ Events are emitted properly
- ✅ No memory leaks during extended playback

## Publishing Verification

If your package is already published to npm:

```bash
# Test installing from npm
mkdir test-install
cd test-install
npm init -y
npm install aliana-client
node -e "console.log(require('aliana-client'))"
```

Should output the exported modules without errors.

## Additional Resources

- [Getting Started Guide](./GETTING_STARTED.md)
- [API Reference](./API_REFERENCE.md)
- [Examples](./EXAMPLES.md)
- [Lavalink Documentation](https://lavalink.dev/)

## Reporting Issues

If you find issues during testing:
1. Check if Lavalink v4 is running correctly
2. Verify your configuration matches the examples
3. Review console logs for error details
4. Create an issue with reproduction steps

---

Happy testing! 🎵
