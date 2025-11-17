# Aliana-client Examples

## Basic Music Bot

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { LavalinkManager } from 'aliana-client';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

const manager = new LavalinkManager({
  nodes: [
    {
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
    },
  ],
  sendPayload: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
});

manager.on('trackStart', (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel?.isTextBased()) {
    channel.send(`Now playing: **${track.title}** by ${track.author}`);
  }
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user!.tag}`);
  await manager.init(client.user!.id);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  manager.updateVoiceState(newState);
});

client.ws.on('VOICE_SERVER_UPDATE' as any, (data: any) => {
  manager.updateVoiceServer(data);
});

client.login('YOUR_BOT_TOKEN');
```

## Play Command

```typescript
import { SlashCommandBuilder } from 'discord.js';

const playCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name or URL')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('query', true);
    const member = interaction.member;
    
    if (!member.voice.channel) {
      return interaction.reply('You need to be in a voice channel!');
    }

    let player = manager.getPlayer(interaction.guildId);
    
    if (!player) {
      player = manager.createPlayer({
        guildId: interaction.guildId,
        voiceChannelId: member.voice.channelId,
        textChannelId: interaction.channelId,
      });
      await player.connect();
    }

    const result = await manager.search(query, interaction.user.id);

    if (!result.tracks.length) {
      return interaction.reply('No tracks found!');
    }

    const track = result.tracks[0];
    await player.queue.add(track);

    if (!player.playing) {
      await player.play();
      return interaction.reply(`Now playing: **${track.title}**`);
    } else {
      return interaction.reply(`Added to queue: **${track.title}**`);
    }
  },
};
```

## Queue Management

```typescript
const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current queue'),
  async execute(interaction) {
    const player = manager.getPlayer(interaction.guildId);
    
    if (!player || player.queue.isEmpty) {
      return interaction.reply('The queue is empty!');
    }

    const current = player.queue.current;
    const upcoming = player.queue.tracks.slice(0, 10);

    let description = `**Now Playing:**\n${current!.title} by ${current!.author}\n\n`;
    
    if (upcoming.length) {
      description += `**Up Next:**\n`;
      upcoming.forEach((track, i) => {
        description += `${i + 1}. ${track.title} by ${track.author}\n`;
      });
    }

    return interaction.reply({ embeds: [{ description }] });
  },
};
```

## Skip Command

```typescript
const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  async execute(interaction) {
    const player = manager.getPlayer(interaction.guildId);
    
    if (!player) {
      return interaction.reply('No player found!');
    }

    const skipped = player.queue.current;
    await player.skip();

    return interaction.reply(`Skipped: **${skipped!.title}**`);
  },
};
```

## Audio Filters

```typescript
const bassBoostCommand = {
  data: new SlashCommandBuilder()
    .setName('bassboost')
    .setDescription('Apply bass boost filter')
    .addNumberOption(option =>
      option.setName('level')
        .setDescription('Bass boost level (0-1)')
        .setMinValue(0)
        .setMaxValue(1)
    ),
  async execute(interaction) {
    const player = manager.getPlayer(interaction.guildId);
    const level = interaction.options.getNumber('level') ?? 0.5;
    
    await player.filters.setBassBoost(level);
    return interaction.reply(`Applied bass boost at ${level * 100}%`);
  },
};

const nightcoreCommand = {
  data: new SlashCommandBuilder()
    .setName('nightcore')
    .setDescription('Toggle nightcore effect'),
  async execute(interaction) {
    const player = manager.getPlayer(interaction.guildId);
    await player.filters.setNightcore(true);
    return interaction.reply('Nightcore effect enabled!');
  },
};

const filterPresetCommand = {
  data: new SlashCommandBuilder()
    .setName('preset')
    .setDescription('Apply a filter preset')
    .addStringOption(option =>
      option.setName('preset')
        .setDescription('Choose a preset')
        .setRequired(true)
        .addChoices(
          { name: 'Bass Boost', value: 'bassBoost' },
          { name: 'Nightcore', value: 'nightcore' },
          { name: 'Vaporwave', value: 'vaporwave' },
          { name: '8D Audio', value: 'eightD' },
          { name: 'Karaoke', value: 'karaoke' }
        )
    ),
  async execute(interaction) {
    const player = manager.getPlayer(interaction.guildId);
    const preset = interaction.options.getString('preset', true);
    
    await player.filters.setPreset(preset as any);
    return interaction.reply(`Applied ${preset} preset!`);
  },
};
```

## Custom Queue Store (Redis)

```typescript
import { createClient } from 'redis';
import { RedisStoreAdapter } from 'aliana-client';

const redisClient = createClient();
await redisClient.connect();

const redisStore = new RedisStoreAdapter({
  get: async (key) => await redisClient.get(key),
  set: async (key, value) => await redisClient.set(key, value),
  del: async (key) => await redisClient.del(key),
  exists: async (key) => await redisClient.exists(key) === 1,
});

const player = manager.createPlayer({
  guildId: 'GUILD_ID',
  voiceChannelId: 'VOICE_CHANNEL_ID',
  queueStore: redisStore,
});
```

## Advanced Player Controls

```typescript
const player = manager.getPlayer(guildId);

await player.setVolume(150);

await player.seek(60000);

await player.pause();
await player.resume();

await player.queue.shuffle();

await player.queue.skipTo(5);

await player.queue.clear();

await player.destroy();
```

## Error Handling

```typescript
manager.on('trackError', (player, track, error) => {
  console.error(`Error playing ${track.title}:`, error.message);
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel?.isTextBased()) {
    channel.send(`Error playing track: ${error.message}`);
  }
});

manager.on('trackStuck', (player, track, threshold) => {
  console.warn(`Track ${track.title} is stuck for ${threshold}ms`);
});

manager.on('nodeDisconnect', (node, reason) => {
  console.error(`Node ${node.identifier} disconnected: ${reason}`);
});
```

## Auto-leave on Empty Queue

```typescript
manager.on('queueEnd', async (player) => {
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel?.isTextBased()) {
    channel.send('Queue ended. Leaving voice channel...');
  }
  
  await player.destroy();
});
```
