import { Client, GatewayIntentBits, Message } from 'discord.js';
import { LavalinkManager, FastTrackFetcher, Player } from '../src';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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
  sendGatewayPayload: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

const fetcher = new FastTrackFetcher(manager, 600000);

client.on('ready', () => {
  console.log('🎵 Fast Track Demo Bot Online!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Available Commands:');
  console.log('  !play <song> - Quick play (fastest)');
  console.log('  !search <query> - Search and show results');
  console.log('  !playlist - Load sample playlist');
  console.log('  !preload - Pre-load popular tracks');
  console.log('  !stats - Show cache statistics');
  console.log('  !batch <song1> | <song2> - Batch add tracks');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const popularTracks = [
    'Trending Songs 2024',
    'Bollywood Top 10',
    'Punjabi Hits',
  ];
  
  fetcher.preloadTracks(popularTracks).then(() => {
    console.log('✅ Pre-loaded popular tracks for instant playback!');
  });
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'play') {
    const query = args.join(' ');
    if (!query) {
      return message.reply('❌ Koi song ka naam do! Example: `!play Believer`');
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Pehle voice channel mein aao!');
    }

    let player = manager.getPlayer(message.guild!.id);
    if (!player) {
      player = manager.createPlayer({
        guildId: message.guild!.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
      });
      await player.connect();
    }

    const startTime = Date.now();
    const success = await fetcher.quickPlay(message.guild!.id, query, {
      source: 'youtubemusic',
      requester: message.author,
    });
    const timeTaken = Date.now() - startTime;

    if (success) {
      const track = player.queue.current;
      message.reply(
        `✅ **Playing:** ${track?.title || query}\n` +
        `⚡ Loaded in: **${timeTaken}ms**`
      );
    } else {
      message.reply('❌ Track nahi mila');
    }
  }

  if (command === 'search') {
    const query = args.join(' ');
    if (!query) {
      return message.reply('❌ Search query do!');
    }

    const startTime = Date.now();
    const result = await fetcher.fetch(query, {
      source: 'youtube',
      useCache: true,
    });
    const timeTaken = Date.now() - startTime;

    if (result.loadType === 'search' && Array.isArray(result.data)) {
      const tracks = result.data.slice(0, 5);
      const trackList = tracks
        .map((t, i) => `${i + 1}. **${t.title}** by ${t.author}`)
        .join('\n');
      
      message.reply(
        `🔍 **Search Results** (${timeTaken}ms):\n${trackList}\n\n` +
        `Use \`!play ${query}\` to play the first result!`
      );
    } else {
      message.reply('❌ Koi result nahi mila');
    }
  }

  if (command === 'playlist') {
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Voice channel mein aao pehle!');
    }

    let player = manager.getPlayer(message.guild!.id);
    if (!player) {
      player = manager.createPlayer({
        guildId: message.guild!.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
      });
      await player.connect();
    }

    message.reply('⏳ Loading playlist...');

    const playlistTracks = [
      'Imagine Dragons Believer',
      'OneRepublic Counting Stars',
      'Coldplay Paradise',
      'The Script Hall of Fame',
      'Maroon 5 Sugar',
    ];

    const startTime = Date.now();
    const results = await fetcher.batchFetch(playlistTracks, {
      source: 'youtube',
      useCache: true,
    });
    const timeTaken = Date.now() - startTime;

    let addedCount = 0;
    for (const result of results) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        await player.queue.add(result.data[0]);
        addedCount++;
      }
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }

    message.channel.send(
      `✅ **Playlist Loaded!**\n` +
      `📝 Added: **${addedCount}/${playlistTracks.length}** tracks\n` +
      `⚡ Time: **${timeTaken}ms** (avg ${Math.round(timeTaken / playlistTracks.length)}ms per track)`
    );
  }

  if (command === 'preload') {
    message.reply('⏳ Pre-loading tracks...');

    const tracksToPreload = [
      'Top Bollywood 2024',
      'Trending English Songs',
      'Punjabi Hits',
      'Arijit Singh Best',
      'Atif Aslam Songs',
    ];

    const startTime = Date.now();
    await fetcher.preloadTracks(tracksToPreload, {
      source: 'youtubemusic',
    });
    const timeTaken = Date.now() - startTime;

    message.channel.send(
      `✅ **Pre-loaded ${tracksToPreload.length} searches!**\n` +
      `⚡ Total time: **${timeTaken}ms**\n` +
      `💡 Ab yeh tracks instant play honge!`
    );
  }

  if (command === 'stats') {
    const stats = fetcher.getCacheStats();
    const hitRate = (stats.hitRate * 100).toFixed(1);
    
    message.reply(
      `📊 **Cache Statistics**\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 Cache Size: **${stats.size}** entries\n` +
      `✅ Cache Hits: **${stats.hits}**\n` +
      `❌ Cache Misses: **${stats.misses}**\n` +
      `📈 Hit Rate: **${hitRate}%**\n\n` +
      `💡 Higher hit rate = faster loading!`
    );
  }

  if (command === 'batch') {
    const songsInput = args.join(' ');
    if (!songsInput.includes('|')) {
      return message.reply('❌ Format: `!batch song1 | song2 | song3`');
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Voice channel mein aao!');
    }

    let player = manager.getPlayer(message.guild!.id);
    if (!player) {
      player = manager.createPlayer({
        guildId: message.guild!.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
      });
      await player.connect();
    }

    const songs = songsInput.split('|').map(s => s.trim());
    message.reply(`⏳ Batch fetching ${songs.length} tracks...`);

    const startTime = Date.now();
    const results = await fetcher.batchFetch(songs, { useCache: true });
    const timeTaken = Date.now() - startTime;

    let added = 0;
    for (const result of results) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        await player.queue.add(result.data[0]);
        added++;
      }
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }

    message.channel.send(
      `✅ Batch complete!\n` +
      `Added: **${added}/${songs.length}** tracks\n` +
      `Time: **${timeTaken}ms** (avg **${Math.round(timeTaken / songs.length)}ms** per track)`
    );
  }

  if (command === 'clear-cache') {
    fetcher.clearCache();
    message.reply('✅ Cache cleared! Next fetches will be slower but fresh.');
  }
});

manager.on('trackStart', (player: Player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel?.isTextBased()) {
    channel.send(
      `▶️ **Now Playing**\n` +
      `🎵 **${track.title}**\n` +
      `👤 ${track.author}\n` +
      `⏱️ Duration: ${formatDuration(track.duration)}`
    );
  }
});

manager.on('trackEnd', async (player: Player) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (player.queue.size === 0 && channel?.isTextBased()) {
    channel.send('✅ Queue complete! Add more tracks with `!play <song>`');
  }
});

manager.on('playerError', (player: Player, error) => {
  console.error('Player error:', error);
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel?.isTextBased()) {
    channel.send('❌ Playback error hogaya!');
  }
});

client.on('raw', (data) => {
  manager.handleRaw(data);
});

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

client.login('YOUR_BOT_TOKEN');
