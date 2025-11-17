import { EventEmitter } from 'events';
import type {
  LavalinkManagerOptions,
  PlayerOptions,
  SearchResult,
  SearchPlatform,
  QueueStore,
  PlaylistInfo,
} from '../types';
import { Node } from './Node';
import { Player } from './Player';
import { Track } from './Track';
import { Validator } from '../utils/Validator';

export class LavalinkManager extends EventEmitter {
  public nodes: Map<string, Node> = new Map();
  public players: Map<string, Player> = new Map();
  
  private options: LavalinkManagerOptions;
  private validator: Validator;
  private _clientId?: string;
  private initiated = false;
  private playedTracksHistory: Map<string, Set<string>> = new Map();

  get clientId(): string | undefined {
    return this._clientId;
  }

  constructor(options: LavalinkManagerOptions) {
    super();
    
    if (!options.nodes || options.nodes.length === 0) {
      throw new Error('At least one node is required');
    }
    
    if (!options.sendPayload || typeof options.sendPayload !== 'function') {
      throw new Error('sendPayload callback is required and must be a function');
    }

    this.options = options;
    this.validator = new Validator(options.validationOptions);

    for (const nodeOptions of options.nodes) {
      const node = new Node(nodeOptions);
      this.setupNodeListeners(node);
      this.nodes.set(node.identifier, node);
    }
  }

  private setupNodeListeners(node: Node): void {
    node.on('connect', () => {
      this.emit('nodeConnect', node);
    });

    node.on('ready', () => {
      this.emit('ready', node);
    });

    node.on('reconnecting', () => {
      this.emit('nodeReconnect', node);
    });

    node.on('disconnect', (reason: string) => {
      this.emit('nodeDisconnect', node, reason);
    });

    node.on('error', (error: Error) => {
      this.emit('nodeError', node, error);
    });

    node.on('raw', (payload: any) => {
      this.emit('nodeRaw', node, payload);
    });

    node.on('event', (payload: any) => {
      this.handleNodeEvent(node, payload);
    });

    node.on('playerUpdate', (payload: any) => {
      const player = this.players.get(payload.guildId);
      if (player) {
        player.updateState(payload);
      }
    });
  }

  private handleNodeEvent(_node: Node, payload: any): void {
    const player = this.players.get(payload.guildId);
    if (!player) return;

    switch (payload.type) {
      case 'TrackStartEvent':
        const startTrack = new Track(payload.track);
        if (player.queue.current) {
          player.setLastPlayedTrack(player.queue.current);
        }
        this.emit('trackStart', player, startTrack);
        player.setPlaying(true);
        break;

      case 'TrackEndEvent':
        const endTrack = new Track(payload.track);
        this.emit('trackEnd', player, endTrack, payload.reason);
        player.setPlaying(false);

        if (payload.reason === 'finished' || payload.reason === 'loadFailed') {
          this.handleTrackEnd(player, endTrack);
        }
        break;

      case 'TrackExceptionEvent':
        const exceptionTrack = new Track(payload.track);
        this.emit('trackError', player, exceptionTrack, payload.exception);
        this.handleTrackEnd(player, exceptionTrack);
        break;

      case 'TrackStuckEvent':
        const stuckTrack = new Track(payload.track);
        this.emit('trackStuck', player, stuckTrack, payload.thresholdMs);
        this.handleTrackEnd(player, stuckTrack);
        break;

      case 'WebSocketClosedEvent':
        this.emit('socketClosed', player, payload.code, payload.reason, payload.byRemote);
        break;
    }
  }

  private async handleTrackEnd(player: Player, finishedTrack: Track): Promise<void> {
    await player.queue.initialize();
    
    const trackForAutoplay = player.lastPlayedTrack || player.queue.current || finishedTrack;
    
    if (player.queue.size > 0) {
      await player.skip();
    } else if (player.autoPlay && trackForAutoplay) {
      try {
        const relatedTracks = await this.getRelatedTracks(trackForAutoplay);
        if (relatedTracks.length > 0) {
          const randomTrack = relatedTracks[Math.floor(Math.random() * Math.min(5, relatedTracks.length))];
          await player.queue.add(randomTrack);
          await player.skip();
          this.emit('autoPlayTrack', player, randomTrack);
        } else {
          this.emit('queueEnd', player);
        }
      } catch (error) {
        console.error('AutoPlay failed:', error);
        this.emit('queueEnd', player);
      }
    } else {
      this.emit('queueEnd', player);
    }
  }

  private async getRelatedTracks(track: Track): Promise<Track[]> {
    try {
      const guildId = track.requester?.guildId || 'default';
      
      if (!this.playedTracksHistory.has(guildId)) {
        this.playedTracksHistory.set(guildId, new Set());
      }
      const playedTracks = this.playedTracksHistory.get(guildId)!;
      
      playedTracks.add(track.info.identifier);
      
      if (playedTracks.size > 50) {
        const tracksArray = Array.from(playedTracks);
        playedTracks.clear();
        tracksArray.slice(-25).forEach(id => playedTracks.add(id));
      }
      
      const searchStrategies = [
        `${track.info.author} songs`,
        `${track.info.author} popular`,
        `similar to ${track.info.title}`,
        `${track.info.title.split(' ').slice(0, 3).join(' ')} type beat`,
      ];
      
      const randomStrategy = searchStrategies[Math.floor(Math.random() * searchStrategies.length)];
      const result = await this.search(randomStrategy, track.requester, 'youtube');
      
      if (result.loadType === 'search' && Array.isArray(result.data)) {
        const tracks = result.data as any as Track[];
        const filteredTracks = tracks.filter((t) => 
          !playedTracks.has(t.info.identifier) && 
          t.info.identifier !== track.info.identifier
        );
        
        if (filteredTracks.length > 0) {
          return filteredTracks.slice(0, 15);
        }
      }
      
      const fallbackQuery = `${track.info.author}`;
      const fallbackResult = await this.search(fallbackQuery, track.requester, 'youtube');
      
      if (fallbackResult.loadType === 'search' && Array.isArray(fallbackResult.data)) {
        const tracks = fallbackResult.data as any as Track[];
        return tracks.filter((t) => 
          !playedTracks.has(t.info.identifier) &&
          t.info.identifier !== track.info.identifier
        ).slice(0, 15);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get related tracks:', error);
      return [];
    }
  }

  async init(clientId: string): Promise<void> {
    if (this.initiated) {
      throw new Error('Manager already initiated');
    }

    this._clientId = clientId;
    this.initiated = true;

    const promises = Array.from(this.nodes.values()).map(node => 
      node.connect(clientId).catch(error => {
        this.emit('nodeError', node, error);
      })
    );

    await Promise.allSettled(promises);
  }

  createPlayer(options: PlayerOptions, queueStore?: QueueStore): Player {
    if (this.players.has(options.guildId)) {
      return this.players.get(options.guildId)!;
    }

    const node = this.getBestNode(options.node);
    if (!node) {
      throw new Error('No available nodes');
    }

    const defaultOptions = {
      ...this.options.playerOptions,
      ...options,
    };

    const player = new Player(defaultOptions, node, this.options.sendPayload, queueStore);
    this.players.set(options.guildId, player);
    
    this.emit('playerCreate', player);
    
    return player;
  }

  getPlayer(guildId: string): Player | undefined {
    return this.players.get(guildId);
  }

  async destroyPlayer(guildId: string, reason?: any): Promise<void> {
    const player = this.players.get(guildId);
    if (!player) return;

    await player.destroy(reason);
    this.players.delete(guildId);
    
    this.playedTracksHistory.delete(guildId);
    
    this.emit('playerDestroy', player, reason);
  }

  private getBestNode(identifier?: string): Node | null {
    if (identifier) {
      const node = this.nodes.get(identifier);
      if (node?.isConnected) return node;
    }

    const connectedNodes = Array.from(this.nodes.values())
      .filter(node => node.isConnected);

    if (connectedNodes.length === 0) return null;

    return connectedNodes.reduce((best, node) => {
      const bestPlayers = best.stats?.players || 0;
      const nodePlayers = node.stats?.players || 0;
      return nodePlayers < bestPlayers ? node : best;
    });
  }

  async search(
    query: string,
    requester?: any,
    source?: SearchPlatform
  ): Promise<SearchResult> {
    const node = this.getBestNode();
    if (!node) {
      throw new Error('No available nodes');
    }

    const searchSource = source || this.options.defaultSearchPlatform || 'youtube';
    let searchQuery = query;

    if (!query.startsWith('http')) {
      const sourceMap: Record<string, string> = {
        youtube: 'ytsearch',
        youtubemusic: 'ytmsearch',
        soundcloud: 'scsearch',
        spotify: 'spsearch',
        deezer: 'dzsearch',
        applemusic: 'amsearch',
        yandex: 'ymsearch',
      };
      searchQuery = `${sourceMap[searchSource]}:${query}`;
    } else {
      const validation = this.validator.validateUrl(query);
      if (!validation.valid) {
        throw new Error(`URL validation failed: ${validation.reason}`);
      }
    }

    const result = await node.request<any>(
      `/loadtracks?identifier=${encodeURIComponent(searchQuery)}`
    );

    let tracks: Track[] = [];
    let playlistInfo: PlaylistInfo | undefined;

    if (result.loadType === 'search' || result.loadType === 'track') {
      tracks = Array.isArray(result.data) ? result.data : [];
    } else if (result.loadType === 'playlist') {
      if (result.data && typeof result.data === 'object' && 'tracks' in result.data) {
        tracks = result.data.tracks || [];
        playlistInfo = result.data.info;
      }
    }

    if (tracks.length > 0) {
      const trackInstances = tracks.map(track => new Track(track, requester));
      
      if (result.loadType === 'playlist' && playlistInfo) {
        const playlistValidation = this.validator.validatePlaylistSize(trackInstances.length);
        if (!playlistValidation.valid) {
          throw new Error(playlistValidation.reason);
        }
      }
      
      for (const track of trackInstances) {
        const lengthValidation = this.validator.validateTrackLength(track.duration);
        if (!lengthValidation.valid) {
          console.warn(`Track ${track.title} validation warning: ${lengthValidation.reason}`);
        }
      }
      
      tracks = trackInstances as any;
    }

    return {
      loadType: result.loadType,
      data: result.loadType === 'playlist' && playlistInfo
        ? { info: playlistInfo, pluginInfo: {}, tracks }
        : tracks,
    } as SearchResult;
  }

  updateVoiceState(data: any): void {
    const player = this.players.get(data.guild_id);
    if (!player) return;

    if (data.user_id && data.user_id !== this._clientId) {
      return;
    }

    if (data.channel_id === null) {
      this.emit('playerDisconnect', player, player.voiceChannelId);
      return;
    }

    if (player.voiceChannelId !== data.channel_id) {
      this.emit('playerMove', player, player.voiceChannelId, data.channel_id);
      player.voiceChannelId = data.channel_id;
    }

    if (data.session_id) {
      player.setVoiceState({ sessionId: data.session_id });
    }
  }

  updateVoiceServer(data: any): void {
    const player = this.players.get(data.guild_id);
    if (!player) return;

    player.setVoiceState({
      event: {
        token: data.token,
        guild_id: data.guild_id,
        endpoint: data.endpoint,
      },
    });
  }
}
