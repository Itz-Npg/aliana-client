# API Reference

## LavalinkManager

The main class for managing Lavalink nodes and players.

### Constructor

```typescript
new LavalinkManager(options: LavalinkManagerOptions)
```

#### LavalinkManagerOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| nodes | NodeOptions[] | Yes | Array of Lavalink node configurations |
| sendPayload | (guildId: string, payload: any) => void | Yes | Function to send Discord gateway payloads |
| validationOptions | ValidationOptions | No | URL and track validation options |
| autoResume | boolean | No | Enable automatic session resuming |
| defaultSearchPlatform | SearchPlatform | No | Default platform for searches |
| playerOptions | DefaultPlayerOptions | No | Default player configuration |

### Methods

#### `init(clientId: string): Promise<void>`
Initialize the manager and connect to all nodes.

#### `search(query: string, requester?: any, source?: SearchPlatform): Promise<SearchResult>`
Search for tracks.

#### `createPlayer(options: PlayerOptions, queueStore?: QueueStore): Player`
Create a new player for a guild.

#### `getPlayer(guildId: string): Player | undefined`
Get an existing player.

#### `destroyPlayer(guildId: string, reason?: DestroyReasons): Promise<void>`
Destroy a player and clean up resources.

#### `updateVoiceState(data: any): void`
Update voice state from Discord.

#### `updateVoiceServer(data: any): void`
Update voice server from Discord.

### Events

```typescript
manager.on('ready', (node: Node) => {});
manager.on('nodeConnect', (node: Node) => {});
manager.on('nodeDisconnect', (node: Node, reason: string) => {});
manager.on('nodeError', (node: Node, error: Error) => {});
manager.on('trackStart', (player: Player, track: Track) => {});
manager.on('trackEnd', (player: Player, track: Track, reason: TrackEndReason) => {});
manager.on('trackError', (player: Player, track: Track, error: TrackException) => {});
manager.on('trackStuck', (player: Player, track: Track, thresholdMs: number) => {});
manager.on('autoPlayTrack', (player: Player, track: Track) => {});
manager.on('queueEnd', (player: Player) => {});
manager.on('playerCreate', (player: Player) => {});
manager.on('playerDestroy', (player: Player, reason: DestroyReasons) => {});
```

---

## Player

Represents a music player for a guild.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| guildId | string | Guild ID |
| voiceChannelId | string | Voice channel ID |
| textChannelId | string \| undefined | Text channel ID |
| node | Node | Connected Lavalink node |
| queue | Queue | Player queue |
| filters | FilterManager | Audio filter manager |
| volume | number | Current volume (0-1000) |
| paused | boolean | Whether player is paused |
| playing | boolean | Whether player is playing |
| connected | boolean | Whether player is connected |
| position | number | Current track position in ms |
| ping | number | Player ping in ms |
| autoPlay | boolean | Whether autoplay is enabled |

### Methods

#### `connect(options?: ConnectOptions): Promise<void>`
Connect to voice channel.

#### `play(options?: PlayOptions): Promise<void>`
Start playing current or next track.

#### `stop(): Promise<void>`
Stop playback.

#### `pause(pause?: boolean): Promise<void>`
Pause or unpause playback.

#### `resume(): Promise<void>`
Resume playback.

#### `seek(position: number): Promise<void>`
Seek to position in ms.

#### `setVolume(volume: number): Promise<void>`
Set volume (0-1000).

#### `skip(): Promise<Track | null>`
Skip to next track.

#### `destroy(reason?: DestroyReasons): Promise<void>`
Destroy the player.

#### `setAutoPlay(enabled: boolean): void`
Enable or disable autoplay. When enabled, the player will automatically play related YouTube tracks when the queue ends.

---

## Queue

Manages the track queue for a player.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| current | Track \| null | Currently playing track |
| tracks | Track[] | Upcoming tracks |
| previous | Track[] | Previously played tracks |
| size | number | Number of upcoming tracks |
| totalSize | number | Total tracks including current |
| isEmpty | boolean | Whether queue is empty |
| duration | number | Total duration in ms |

### Methods

#### `add(track: Track | Track[]): Promise<void>`
Add track(s) to queue.

#### `remove(index: number): Promise<Track | null>`
Remove track at index.

#### `clear(): Promise<void>`
Clear all tracks.

#### `shuffle(): Promise<void>`
Shuffle the queue.

#### `skipTo(index: number): Promise<Track | null>`
Skip to track at index.

#### `get(index: number): Track | null`
Get track at index.

---

## FilterManager

Manages audio filters for a player.

### Methods

#### `setEqualizer(bands: EqualizerBand[]): Promise<void>`
Set custom equalizer bands (0-14).

#### `setBassBoost(level: number): Promise<void>`
Apply bass boost (0-1).

#### `setNightcore(enable: boolean): Promise<void>`
Toggle nightcore effect.

#### `setVaporwave(enable: boolean): Promise<void>`
Toggle vaporwave effect.

#### `set8D(enable: boolean): Promise<void>`
Toggle 8D audio effect.

#### `setKaraoke(enable: boolean): Promise<void>`
Toggle karaoke effect.

#### `setPreset(preset: PresetName): Promise<void>`
Apply a filter preset.

Available presets:
- `bassBoost`
- `nightcore`
- `vaporwave`
- `eightD`
- `trebleBass`
- `soft`
- `pop`
- `electronic`
- `rock`
- `classical`
- `karaoke`

#### `setTimescale(speed?, pitch?, rate?): Promise<void>`
Set timescale filter.

#### `setTremolo(frequency?, depth?): Promise<void>`
Set tremolo effect.

#### `setVibrato(frequency?, depth?): Promise<void>`
Set vibrato effect.

#### `setRotation(rotationHz?): Promise<void>`
Set rotation effect.

#### `setDistortion(options): Promise<void>`
Set distortion filter.

#### `setChannelMix(options): Promise<void>`
Set channel mix filter.

#### `setLowPass(smoothing?): Promise<void>`
Set low-pass filter.

#### `setAudioOutput(type: 'mono' | 'stereo' | 'left' | 'right'): Promise<void>`
Set audio output channel configuration.

#### `setEcho(delay?, decay?): Promise<void>`
Set echo effect (requires lavalink-filter-plugin).
- `delay`: Echo delay in seconds (default: 1)
- `decay`: Echo decay factor 0-1 (default: 0.5)

#### `setReverb(delays?, gains?): Promise<void>`
Set reverb effect (requires lavalink-filter-plugin).
- `delays`: Array of delay values (default: [0.037, 0.042, 0.048, 0.053])
- `gains`: Array of gain values (default: [0.84, 0.83, 0.82, 0.81])

#### `setHighPass(cutoffFrequency?, boostFactor?): Promise<void>`
Set high-pass filter (requires lavadspx-plugin).
- `cutoffFrequency`: Frequency cutoff in Hz (default: 1475)
- `boostFactor`: Volume boost factor (default: 1.0)

#### `setPluginLowPass(cutoffFrequency?, boostFactor?): Promise<void>`
Set plugin low-pass filter (requires lavadspx-plugin).
- `cutoffFrequency`: Frequency cutoff in Hz (default: 284)
- `boostFactor`: Volume boost factor (default: 1.0)

#### `setNormalization(maxAmplitude?, adaptive?): Promise<void>`
Set audio normalization (requires lavadspx-plugin).
- `maxAmplitude`: Maximum amplitude 0-1 (default: 0.75)
- `adaptive`: Enable adaptive normalization (default: true)

#### `clearFilters(): Promise<void>`
Remove all filters.

#### `setVolume(volume: number): Promise<void>`
Set volume as filter (0-5).

---

## Track

Represents a music track.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| encoded | string | Lavalink track encoding |
| title | string | Track title |
| author | string | Track author |
| duration | number | Track duration in ms |
| uri | string \| undefined | Track URL |
| thumbnail | string \| undefined | Artwork URL |
| identifier | string | Track identifier |
| isStream | boolean | Whether track is a stream |
| isSeekable | boolean | Whether track is seekable |
| sourceName | string | Source platform name |
| requester | any | User who requested track |

### Methods

#### `toJSON(): LavalinkTrack`
Convert to JSON.

#### `clone(): Track`
Create a copy of the track.

---

## MusicCardGenerator

Utility for generating visual music cards using the musicard package.

**Note**: The `musicard` package is included with aliana-client, so no additional installation is required!

### Static Methods

#### `generateCard(track: Track, options?: MusicCardOptions, theme?: MusicCardTheme): Promise<Buffer>`
Generate a music card for a track.

**Parameters:**
- `track`: The track to generate a card for
- `options`: Optional customization options (see MusicCardOptions below)
- `theme`: Theme to use ('classic', 'classicPro', or 'dynamic')

**Returns:** PNG image buffer

#### `generateCardWithProgress(track: Track, currentPosition: number, options?: MusicCardOptions, theme?: MusicCardTheme): Promise<Buffer>`
Generate a music card with current playback progress.

**Parameters:**
- `track`: The track to generate a card for
- `currentPosition`: Current playback position in ms
- `options`: Optional customization options
- `theme`: Theme to use

**Returns:** PNG image buffer

#### `isAvailable(): boolean`
Check if musicard package is installed and available.

### MusicCardOptions

| Property | Type | Description |
|----------|------|-------------|
| thumbnailImage | string | Album artwork URL |
| backgroundColor | string | Card background color (hex) |
| progress | number | Progress percentage (0-100) |
| progressColor | string | Progress bar color (hex) |
| progressBarColor | string | Progress bar background color (hex) |
| name | string | Track title |
| nameColor | string | Title text color (hex) |
| author | string | Artist name |
| authorColor | string | Artist text color (hex) |
| startTime | string | Current time (e.g., "2:30") |
| endTime | string | Total duration (e.g., "4:00") |
| timeColor | string | Time text color (hex) |

### Example Usage

```typescript
import { MusicCardGenerator, Player } from 'aliana-client';
import fs from 'fs';

// Check if musicard is available
if (MusicCardGenerator.isAvailable()) {
  const player: Player = /* your player */;
  const track = player.queue.current;
  
  if (track) {
    // Generate a simple card
    const card = await MusicCardGenerator.generateCard(track);
    fs.writeFileSync('now-playing.png', card);
    
    // Generate card with progress
    const cardWithProgress = await MusicCardGenerator.generateCardWithProgress(
      track,
      player.position,
      {
        backgroundColor: '#1a1a1a',
        progressColor: '#00ff00',
      },
      'classicPro'
    );
    fs.writeFileSync('now-playing-progress.png', cardWithProgress);
  }
}
```

---

## Node

Represents a Lavalink node connection.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| identifier | string | Node identifier |
| options | ProcessedNodeOptions | Node configuration |
| stats | NodeStats \| null | Node statistics |
| info | LavalinkNodeInfo \| null | Node information |
| isConnected | boolean | Connection status |
| address | string | Node address |
| wsAddress | string | WebSocket URL |
| restAddress | string | REST API URL |

### Methods

#### `connect(clientId: string, resumeKey?: string): Promise<void>`
Connect to node.

#### `disconnect(): Promise<void>`
Disconnect from node.

#### `send(payload: any): void`
Send WebSocket payload.

#### `request<T>(endpoint: string, options?: any): Promise<T>`
Make REST API request.

#### `fetchInfo(): Promise<LavalinkNodeInfo>`
Fetch node information.

---

## Types

### SearchPlatform
```typescript
type SearchPlatform = 
  | 'youtube' 
  | 'youtubemusic' 
  | 'soundcloud' 
  | 'spotify' 
  | 'deezer' 
  | 'applemusic' 
  | 'yandex';
```

### DestroyReasons
```typescript
enum DestroyReasons {
  NodeDestroy,
  NodeReconnect,
  LavalinkNoVoice,
  NodeDeleted,
  PlayerReconnect,
  Disconnected,
  PlayerMovedChannels,
  ChannelDeleted,
  QueueEmpty,
  TrackStuck,
  TrackError,
  Cleanup,
}
```

### TrackEndReason
```typescript
type TrackEndReason = 
  | 'finished' 
  | 'loadFailed' 
  | 'stopped' 
  | 'replaced' 
  | 'cleanup';
```
