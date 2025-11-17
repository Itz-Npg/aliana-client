import { EventEmitter } from 'events';
import type {
  LavalinkManagerOptions,
  PlayerOptions,
  SearchResult,
  SearchPlatform,
  QueueStore,
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
        this.emit('trackStart', player, startTrack);
        player.setPlaying(true);
        break;

      case 'TrackEndEvent':
        const endTrack = new Track(payload.track);
        this.emit('trackEnd', player, endTrack, payload.reason);
        player.setPlaying(false);

        if (payload.reason === 'finished' || payload.reason === 'loadFailed') {
          this.handleTrackEnd(player);
        }
        break;

      case 'TrackExceptionEvent':
        const exceptionTrack = new Track(payload.track);
        this.emit('trackError', player, exceptionTrack, payload.exception);
        this.handleTrackEnd(player);
        break;

      case 'TrackStuckEvent':
        const stuckTrack = new Track(payload.track);
        this.emit('trackStuck', player, stuckTrack, payload.thresholdMs);
        this.handleTrackEnd(player);
        break;

      case 'WebSocketClosedEvent':
        this.emit('socketClosed', player, payload.code, payload.reason, payload.byRemote);
        break;
    }
  }

  private async handleTrackEnd(player: Player): Promise<void> {
    await player.queue.initialize();
    
    if (player.queue.size > 0) {
      await player.skip();
    } else {
      this.emit('queueEnd', player);
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

    const result = await node.request<SearchResult>(
      `/loadtracks?identifier=${encodeURIComponent(searchQuery)}`
    );

    if (result.tracks && result.tracks.length > 0) {
      const trackInstances = result.tracks.map(track => new Track(track, requester));
      
      if (result.loadType === 'playlist' && result.playlist) {
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
      
      result.tracks = trackInstances as any;
    }

    return result;
  }

  updateVoiceState(data: any): void {
    const player = this.players.get(data.guild_id);
    if (!player) return;

    if (data.channel_id === null) {
      this.emit('playerDisconnect', player, player.voiceChannelId);
      return;
    }

    if (player.voiceChannelId !== data.channel_id) {
      this.emit('playerMove', player, player.voiceChannelId, data.channel_id);
      player.voiceChannelId = data.channel_id;
    }

    player.setVoiceState({ sessionId: data.session_id });
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
