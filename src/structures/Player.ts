import { EventEmitter } from 'events';
import type { 
  PlayerOptions, 
  ConnectOptions, 
  PlayOptions, 
  VoiceState, 
  FilterData,
  QueueStore 
} from '../types';
import { DestroyReasons } from '../types';
import { Queue } from './Queue';
import { Track } from './Track';
import { Node } from './Node';
import { FilterManager } from '../filters/FilterManager';
import { AudioNormalizer } from '../utils/AudioNormalizer';
import { MemoryStore } from '../stores/MemoryStore';

export class Player extends EventEmitter {
  public readonly guildId: string;
  public voiceChannelId: string;
  public textChannelId?: string;
  public node: Node;
  public queue: Queue;
  public filters: FilterManager;
  
  private normalizer: AudioNormalizer;
  private _volume: number = 100;
  private _paused: boolean = false;
  private _playing: boolean = false;
  private _connected: boolean = false;
  private _position: number = 0;
  private _ping: number = 0;
  private voiceState: Partial<VoiceState> = {};
  private sendPayload: (guildId: string, payload: any) => void;
  private selfDeaf: boolean;
  private selfMute: boolean;
  
  constructor(options: PlayerOptions, node: Node, sendPayload: (guildId: string, payload: any) => void, store?: QueueStore) {
    super();
    
    this.guildId = options.guildId;
    this.voiceChannelId = options.voiceChannelId;
    this.textChannelId = options.textChannelId;
    this.node = node;
    this.sendPayload = sendPayload;
    this.selfDeaf = options.selfDeaf ?? true;
    this.selfMute = options.selfMute ?? false;
    
    const queueStore = store || new MemoryStore();
    this.queue = new Queue(this.guildId, queueStore);
    
    this.normalizer = new AudioNormalizer(
      options.audioNormalizer ?? true,
      1.0
    );
    
    this.filters = new FilterManager(this.updateFilters.bind(this));
    
    if (options.volume !== undefined) {
      this._volume = options.volume;
    }
    
    this.queue.initialize().catch(err => {
      console.error(`Failed to initialize queue for ${this.guildId}:`, err);
    });
  }

  get volume(): number {
    return this._volume;
  }

  get paused(): boolean {
    return this._paused;
  }

  get playing(): boolean {
    return this._playing;
  }

  get connected(): boolean {
    return this._connected;
  }

  get position(): number {
    return this._position;
  }

  get ping(): number {
    return this._ping;
  }

  async connect(options: ConnectOptions = {}): Promise<void> {
    if (!this.voiceChannelId) {
      throw new Error('Cannot connect: voiceChannelId is not set');
    }
    
    if (!this.sendPayload) {
      throw new Error('Cannot connect: sendPayload callback is not configured');
    }
    
    const selfDeaf = options.deaf ?? this.selfDeaf;
    const selfMute = options.mute ?? this.selfMute;
    
    this.sendPayload(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: this.voiceChannelId,
        self_mute: selfMute,
        self_deaf: selfDeaf,
      },
    });
    
    this.voiceState = {
      sessionId: undefined,
      event: undefined,
    };
    
    this.emit('connectionUpdate', 'CONNECTING');
    this._connected = true;
  }
  
  async waitForQueueReady(): Promise<void> {
    await this.queue.initialize();
  }

  setVoiceState(data: Partial<VoiceState>): void {
    this.voiceState = { ...this.voiceState, ...data };
    
    if (this.voiceState.sessionId && this.voiceState.event) {
      this.sendVoiceUpdate();
    }
  }

  private sendVoiceUpdate(): void {
    this.node.send({
      op: 'voiceUpdate',
      guildId: this.guildId,
      sessionId: this.voiceState.sessionId,
      event: this.voiceState.event,
    });
  }

  async play(options: PlayOptions = {}): Promise<void> {
    await this.queue.initialize();
    
    if (!this.queue.current && this.queue.size === 0) {
      throw new Error('Queue is empty');
    }

    let track = this.queue.current;
    if (!track) {
      track = await this.queue.next();
      if (!track) throw new Error('No track to play');
    }

    const payload: any = {
      op: 'play',
      guildId: this.guildId,
      track: track.encoded,
      noReplace: options.noReplace ?? false,
      pause: options.pause ?? false,
    };

    if (options.startTime) payload.position = options.startTime;
    if (options.endTime) payload.endTime = options.endTime;
    if (options.volume !== undefined) {
      payload.volume = this.normalizer.normalize(options.volume);
      this._volume = options.volume;
    }

    this.node.send(payload);
    this._playing = true;
    this._paused = options.pause ?? false;
  }

  async stop(): Promise<void> {
    this.node.send({
      op: 'stop',
      guildId: this.guildId,
    });
    
    this._playing = false;
    this._paused = false;
    this._position = 0;
  }

  async pause(pause: boolean = true): Promise<void> {
    this.node.send({
      op: 'pause',
      guildId: this.guildId,
      pause,
    });
    
    this._paused = pause;
  }

  async resume(): Promise<void> {
    await this.pause(false);
  }

  async seek(position: number): Promise<void> {
    if (!this.queue.current) {
      throw new Error('No track is currently playing');
    }

    this.node.send({
      op: 'seek',
      guildId: this.guildId,
      position: Math.max(0, position),
    });
    
    this._position = position;
  }

  async setVolume(volume: number): Promise<void> {
    this._volume = Math.max(0, Math.min(1000, volume));
    const normalizedVolume = this.normalizer.normalize(this._volume);
    
    await this.filters.setVolume(normalizedVolume / 100);
  }

  private async updateFilters(filters: FilterData): Promise<void> {
    const normalizedFilters = this.normalizer.applyNormalization(
      filters, 
      this._volume
    );

    this.node.send({
      op: 'filters',
      guildId: this.guildId,
      ...normalizedFilters,
    });
  }

  async skip(): Promise<Track | null> {
    await this.queue.initialize();
    await this.stop();
    const nextTrack = await this.queue.next();
    
    if (nextTrack) {
      await this.play();
      return nextTrack;
    }
    
    return null;
  }

  async destroy(reason: DestroyReasons = DestroyReasons.Cleanup): Promise<void> {
    this.node.send({
      op: 'destroy',
      guildId: this.guildId,
    });

    await this.queue.clear();
    this._connected = false;
    this._playing = false;
    this._paused = false;
    
    this.emit('destroyed', reason);
    this.removeAllListeners();
  }

  updateState(state: any): void {
    this._position = state.state.position || 0;
    this._connected = state.state.connected;
    this._ping = state.state.ping || 0;
  }

  setPlaying(playing: boolean): void {
    this._playing = playing;
  }
}
