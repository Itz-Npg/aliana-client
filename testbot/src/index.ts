import { Client, GatewayIntentBits, Message, VoiceState, TextChannel, AttachmentBuilder } from 'discord.js';
import { LavalinkManager, Player, Track, DestroyReasons, Node, MusicCardGenerator } from 'aliana-client';
import type { SearchResult } from 'aliana-client';
import config from '../config.json';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const manager = new LavalinkManager({
  nodes: config.lavalink.nodes,
  sendPayload: (guildId: string, payload: any) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
});

client.on('ready', () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`🎵 Connecting to Lavalink nodes...`);
  manager.init(client.user!.id);
  console.log(`📝 Prefix: ${config.prefix}`);
  console.log(`💡 Try: ${config.prefix}play <song name>`);
});

client.on('raw', (packet: any) => {
  if (packet.t === 'VOICE_STATE_UPDATE') {
    console.log('📡 Received VOICE_STATE_UPDATE:', packet.d.guild_id);
    manager.updateVoiceState(packet.d);
  } else if (packet.t === 'VOICE_SERVER_UPDATE') {
    console.log('📡 Received VOICE_SERVER_UPDATE:', packet.d.guild_id);
    manager.updateVoiceServer(packet.d);
  }
});

client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
  const player = manager.players.get(newState.guild.id);
  if (!player) return;

  if (oldState.channelId && !newState.channelId && newState.member?.id === client.user?.id) {
    player.destroy(DestroyReasons.Disconnected);
    console.log(`🔌 Disconnected from voice in ${newState.guild.name}`);
  }
});

manager.on('nodeConnect', (node: Node) => {
  console.log(`✅ Node "${node.options.identifier}" connected!`);
});

manager.on('nodeRaw', (node: Node, payload: any) => {
  console.log(`📦 Raw from Lavalink:`, JSON.stringify(payload));
});

manager.on('nodeError', (node: Node, error: Error) => {
  console.error(`❌ Node "${node.options.identifier}" error:`, error.message);
});

manager.on('trackError', (player: Player, track: Track, error: any) => {
  console.error(`❌ Track error: ${track.info.title}`, error);
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && 'send' in channel) {
    (channel as TextChannel).send(`❌ Error playing: **${track.info.title}** - ${error.message || 'Unknown error'}`);
  }
});

manager.on('trackStart', (player: Player, track: Track) => {
  console.log(`🎵 Track started: ${track.info.title}`);
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && 'send' in channel) {
    (channel as TextChannel).send(`🎵 Now playing: **${track.info.title}** by **${track.info.author}**`);
  }
});

manager.on('trackEnd', (player: Player, track: Track) => {
  console.log(`✅ Track ended: ${track.info.title}`);
});

manager.on('autoPlayTrack', (player: Player, track: Track) => {
  console.log(`🎵 AutoPlay: ${track.info.title}`);
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && 'send' in channel) {
    (channel as TextChannel).send(`🎵 **AutoPlay**: Now playing **${track.info.title}** by **${track.info.author}**`);
  }
});

manager.on('queueEnd', (player: Player) => {
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && 'send' in channel) {
    if (!player.autoPlay) {
      (channel as TextChannel).send('📭 Queue finished! Add more songs or I\'ll leave in 5 minutes. (Use !autoplay to enable continuous playback)');
    }
  }
  
  if (!player.autoPlay) {
    setTimeout(() => {
      if (player.queue.tracks.length === 0 && !player.playing) {
        player.destroy(DestroyReasons.QueueEmpty);
        if (channel && 'send' in channel) {
          (channel as TextChannel).send('👋 Left due to inactivity.');
        }
      }
    }, 5 * 60 * 1000);
  }
});

manager.on('playerDestroy', (player: Player, reason: string) => {
  console.log(`🗑️ Player destroyed in guild ${player.guildId}. Reason: ${reason}`);
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (!command) return;

  try {
    switch (command) {
      case 'play':
        await handlePlay(message, args);
        break;
      case 'skip':
        await handleSkip(message);
        break;
      case 'stop':
        await handleStop(message);
        break;
      case 'pause':
        await handlePause(message);
        break;
      case 'resume':
        await handleResume(message);
        break;
      case 'queue':
        await handleQueue(message);
        break;
      case 'nowplaying':
      case 'np':
        await handleNowPlaying(message);
        break;
      case 'volume':
        await handleVolume(message, args);
        break;
      case 'filter':
        await handleFilter(message, args);
        break;
      case 'echo':
        await handleEcho(message, args);
        break;
      case 'reverb':
        await handleReverb(message);
        break;
      case 'audiooutput':
      case 'output':
        await handleAudioOutput(message, args);
        break;
      case 'musiccard':
      case 'card':
        await handleMusicCard(message, args);
        break;
      case 'autoplay':
        await handleAutoPlay(message);
        break;
      case 'help':
        await handleHelp(message);
        break;
      default:
        break;
    }
  } catch (error: any) {
    console.error('Command error:', error);
    message.reply(`❌ Error: ${error.message}`);
  }
});

async function handlePlay(message: Message, args: string[]) {
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    return message.reply('❌ You need to be in a voice channel!');
  }

  const query = args.join(' ');
  if (!query) {
    return message.reply('❌ Please provide a song name or URL!');
  }

  let player = manager.players.get(message.guild!.id);
  
  if (!player) {
    player = manager.createPlayer({
      guildId: message.guild!.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: message.channel.id,
      selfDeaf: true,
    });
    await player.connect();
  }

  const result = await manager.search(query, message.author.id, 'youtube');

  if (result.loadType === 'error' || result.loadType === 'empty') {
    return message.reply('❌ No results found!');
  }

  const tracks = Array.isArray(result.data) 
    ? result.data 
    : result.data && 'tracks' in result.data 
    ? result.data.tracks 
    : [];

  if (tracks.length === 0) {
    return message.reply('❌ No tracks found in search results!');
  }

  for (const track of tracks) {
    await player.queue.add(track as any);
  }

  if (result.loadType === 'playlist' && !Array.isArray(result.data) && result.data.info) {
    message.reply(`📋 Added **${tracks.length}** tracks from **${result.data.info.name}** to queue!`);
  } else {
    message.reply(`✅ Added **${tracks[0].info.title}** to queue!`);
  }

  console.log(`Player state - playing: ${player.playing}, paused: ${player.paused}, connected: ${player.connected}`);
  console.log(`Queue state - current: ${player.queue.current?.info.title || 'none'}, size: ${player.queue.size}`);
  
  if (!player.playing && !player.paused) {
    console.log('Attempting to start playback...');
    try {
      await player.play();
      console.log('Play command sent successfully');
    } catch (error: any) {
      console.error('Error during play:', error.message);
      message.reply(`❌ Playback error: ${error.message}`);
    }
  }
}

async function handleSkip(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  player.skip();
  message.reply('⏭️ Skipped!');
}

async function handleStop(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  player.destroy(DestroyReasons.Cleanup);
  message.reply('⏹️ Stopped and cleared the queue!');
}

async function handlePause(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  player.pause(true);
  message.reply('⏸️ Paused!');
}

async function handleResume(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  player.pause(false);
  message.reply('▶️ Resumed!');
}

async function handleQueue(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  const current = player.queue.current;
  const upcoming = player.queue.tracks.slice(0, 10);

  let queueText = '📋 **Current Queue**\n\n';
  
  if (current) {
    queueText += `🎵 **Now Playing:**\n${current.info.title} - ${current.info.author}\n\n`;
  }

  if (upcoming.length > 0) {
    queueText += '**Up Next:**\n';
    upcoming.forEach((track: Track, index: number) => {
      queueText += `${index + 1}. ${track.info.title} - ${track.info.author}\n`;
    });
    
    if (player.queue.tracks.length > 10) {
      queueText += `\n...and ${player.queue.tracks.length - 10} more tracks`;
    }
  } else {
    queueText += 'No upcoming tracks.';
  }

  message.reply(queueText);
}

async function handleNowPlaying(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  const current = player.queue.current;
  if (!current) return message.reply('❌ Nothing is playing!');

  const position = formatTime(player.position);
  const duration = formatTime(current.info.length);

  message.reply(
    `🎵 **Now Playing:**\n` +
    `**${current.info.title}**\n` +
    `By: ${current.info.author}\n` +
    `Progress: ${position} / ${duration}\n` +
    `Volume: ${player.volume}%`
  );
}

async function handleVolume(message: Message, args: string[]) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  const volume = parseInt(args[0]);
  if (isNaN(volume) || volume < 0 || volume > 100) {
    return message.reply('❌ Volume must be between 0 and 100!');
  }

  player.setVolume(volume);
  message.reply(`🔊 Volume set to ${volume}%`);
}

async function handleFilter(message: Message, args: string[]) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  const filterName = args[0]?.toLowerCase();
  
  if (!filterName) {
    return message.reply(
      '🎛️ **Available Filter Presets:**\n' +
      '`bassboost`, `nightcore`, `vaporwave`, `8d`, `karaoke`, `soft`, `pop`, `electronic`, `rock`, `classical`, `clear`\n\n' +
      '**Additional Filters:**\n' +
      `\`${config.prefix}echo [delay] [decay]\` - Echo effect\n` +
      `\`${config.prefix}reverb\` - Reverb effect\n` +
      `\`${config.prefix}output <mono|stereo|left|right>\` - Audio output\n\n` +
      `Usage: ${config.prefix}filter <preset>`
    );
  }

  if (filterName === 'clear') {
    await player.filters.clearFilters();
    return message.reply('🔄 All filters cleared!');
  }

  const filterMap: Record<string, string> = {
    'bassboost': 'bassBoost',
    'nightcore': 'nightcore',
    'vaporwave': 'vaporwave',
    '8d': 'eightD',
    'karaoke': 'karaoke',
    'soft': 'soft',
    'pop': 'pop',
    'electronic': 'electronic',
    'rock': 'rock',
    'classical': 'classical',
  };

  if (!filterMap[filterName]) {
    return message.reply('❌ Invalid filter! Check available filters with `!filter`');
  }

  await player.filters.setPreset(filterMap[filterName] as any);
  message.reply(`🎛️ Applied **${filterName}** filter!`);
}

async function handleEcho(message: Message, args: string[]) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  const delay = parseFloat(args[0]) || 1.0;
  const decay = parseFloat(args[1]) || 0.5;

  if (delay === 0 && decay === 0) {
    await player.filters.setEcho();
    return message.reply('❌ Echo effect disabled!');
  }

  await player.filters.setEcho(delay, decay);
  message.reply(`🔊 Echo effect applied! (Delay: ${delay}s, Decay: ${decay})`);
}

async function handleReverb(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  await player.filters.setReverb();
  message.reply('🎵 Reverb effect applied!');
}

async function handleAudioOutput(message: Message, args: string[]) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  const type = args[0]?.toLowerCase() as 'mono' | 'stereo' | 'left' | 'right';
  
  if (!type || !['mono', 'stereo', 'left', 'right'].includes(type)) {
    return message.reply(
      '🔊 **Audio Output Options:**\n' +
      '`mono` - Mono output\n' +
      '`stereo` - Stereo output (default)\n' +
      '`left` - Left channel only\n' +
      '`right` - Right channel only\n\n' +
      `Usage: ${config.prefix}output <type>`
    );
  }

  await player.filters.setAudioOutput(type);
  message.reply(`🔊 Audio output set to **${type}**!`);
}

async function handleMusicCard(message: Message, args: string[]) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing!');

  const current = player.queue.current;
  if (!current) return message.reply('❌ No track is currently playing!');

  try {
    const theme = (args[0] as 'classic' | 'classicPro' | 'dynamic') || 'dynamic';
    const validThemes = ['classic', 'classicPro', 'dynamic'];
    
    if (args[0] && !validThemes.includes(args[0])) {
      return message.reply(
        `❌ Invalid theme! Available themes:\n` +
        `• \`classic\` - Simple classic design\n` +
        `• \`classicPro\` - Enhanced classic with more details\n` +
        `• \`dynamic\` - Modern animated design (default)\n\n` +
        `Usage: ${config.prefix}card [theme]`
      );
    }

    const statusMsg = await message.reply('🎨 Generating music card...');
    
    const card = await MusicCardGenerator.generateCardWithProgress(
      current,
      player.position,
      {
        backgroundColor: theme === 'dynamic' ? '#070707' : '#1a1a1a',
        progressColor: '#1DB954',
        progressBarColor: theme === 'dynamic' ? '#2c2f33' : '#404040',
        nameColor: '#ffffff',
        authorColor: '#99aab5',
        timeColor: '#1DB954',
      },
      theme
    );

    const attachment = new AttachmentBuilder(card, { name: `musicard-${theme}.png` });
    await statusMsg.edit({
      content: `🎨 **Music Card Generated!**\n` +
        `📀 **${current.info.title}**\n` +
        `🎤 ${current.info.author}\n` +
        `🎭 Theme: **${theme}**`,
      files: [attachment],
    });
  } catch (error: any) {
    console.error('Music card generation error:', error);
    message.reply(`❌ Failed to generate music card: ${error.message}`);
  }
}

async function handleAutoPlay(message: Message) {
  const player = manager.players.get(message.guild!.id);
  if (!player) return message.reply('❌ Nothing is playing! Use !play first.');

  if (!message.member?.voice.channel) {
    return message.reply('❌ You need to be in the voice channel!');
  }

  player.setAutoPlay(!player.autoPlay);
  
  if (player.autoPlay) {
    message.reply('✅ **AutoPlay enabled!** 🎵\nI will automatically play related YouTube tracks when the queue ends, just like Spotify!');
  } else {
    message.reply('❌ **AutoPlay disabled.**\nMusic will stop when the queue ends.');
  }
}

async function handleHelp(message: Message) {
  const helpText = `
🎵 **Aliana-Client Test Bot Commands**

**Music Controls:**
\`${config.prefix}play <song>\` - Play a song or add to queue
\`${config.prefix}pause\` - Pause playback
\`${config.prefix}resume\` - Resume playback
\`${config.prefix}skip\` - Skip current track
\`${config.prefix}stop\` - Stop and clear queue
\`${config.prefix}volume <0-100>\` - Set volume
\`${config.prefix}autoplay\` - Toggle autoplay (plays similar songs)

**Queue:**
\`${config.prefix}queue\` - Show current queue
\`${config.prefix}nowplaying\` or \`${config.prefix}np\` - Show current track
\`${config.prefix}card [theme]\` - Generate music card (themes: classic, classicPro, dynamic)

**Filter Presets:**
\`${config.prefix}filter <preset>\` - Apply filter preset
Presets: bassboost, nightcore, vaporwave, 8d, karaoke, soft, pop, electronic, rock, classical, clear

**Advanced Filters:**
\`${config.prefix}echo [delay] [decay]\` - Echo effect
\`${config.prefix}reverb\` - Reverb effect
\`${config.prefix}output <type>\` - Audio output (mono/stereo/left/right)

**Other:**
\`${config.prefix}help\` - Show this message

**✨ New Features:**
• Smart autoplay with varied recommendations (tracks last 50 plays, avoids last 25)
• Echo & reverb filters (requires Lavalink plugins)
• High-pass, low-pass & normalization filters (requires LavaDSPX plugin)
• Audio output control (mono/stereo/left/right channel mixing)
• Built-in music card generator with 3 themes and real-time progress
  `;
  
  message.reply(helpText);
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is not set!');
  console.log('Please set your Discord bot token in the Secrets.');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});
