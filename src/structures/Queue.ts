import type { QueueStore, QueueData } from '../types';
import { Track } from './Track';
import { EventEmitter } from 'events';

export class Queue extends EventEmitter {
  private guildId: string;
  private store: QueueStore;
  public current: Track | null = null;
  public tracks: Track[] = [];
  public previous: Track[] = [];
  private initPromise: Promise<void> | null = null;
  private initialized: boolean = false;
  private modified: boolean = false;
  private player: any;
  
  constructor(guildId: string, store: QueueStore) {
    super();
    this.guildId = guildId;
    this.store = store;
  }
  
  setPlayer(player: any): void {
    this.player = player;
  }
  
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    if (this.initialized) {
      return;
    }
    
    this.initPromise = this.performLoad();
    return this.initPromise;
  }
  
  private async performLoad(): Promise<void> {
    try {
      if (this.modified) {
        return;
      }
      
      await this.load();
      this.initialized = true;
    } catch (error) {
      console.error(`Failed to load queue for guild ${this.guildId}:`, error);
    }
  }
  
  private markModified(): void {
    this.modified = true;
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && !this.initPromise) {
      await this.initialize();
    } else if (this.initPromise) {
      await this.initPromise;
    }
  }

  get size(): number {
    return this.tracks.length;
  }

  get totalSize(): number {
    return this.tracks.length + (this.current ? 1 : 0);
  }

  get isEmpty(): boolean {
    return this.tracks.length === 0 && !this.current;
  }

  get duration(): number {
    return this.tracks.reduce((acc, track) => acc + track.duration, 0) + 
           (this.current?.duration || 0);
  }

  async add(track: Track | Track[], isAutoPlay: boolean = false): Promise<void> {
    await this.ensureInitialized();
    this.markModified();
    const tracksToAdd = Array.isArray(track) ? track : [track];
    this.tracks.push(...tracksToAdd);
    
    if (!isAutoPlay && this.player) {
      if (typeof this.player.setAutoPlaySession === 'function') {
        this.player.setAutoPlaySession(false);
      }
      if (typeof this.player.setAutoPlay === 'function') {
        this.player.setAutoPlay(false);
      }
    }
    
    await this.save();
    this.emit('add', tracksToAdd);
  }

  async remove(index: number): Promise<Track | null> {
    await this.ensureInitialized();
    if (index < 0 || index >= this.tracks.length) return null;
    
    this.markModified();
    const removed = this.tracks.splice(index, 1)[0];
    await this.save();
    this.emit('remove', removed, index);
    return removed;
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    this.markModified();
    const oldTracks = [...this.tracks];
    this.tracks = [];
    await this.save();
    this.emit('clear', oldTracks);
  }

  async shuffle(): Promise<void> {
    await this.ensureInitialized();
    this.markModified();
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
    await this.save();
    this.emit('shuffle');
  }

  async setCurrent(track: Track | null): Promise<void> {
    await this.ensureInitialized();
    this.markModified();
    if (this.current) {
      this.previous.push(this.current);
      if (this.previous.length > 100) {
        this.previous.shift();
      }
    }
    this.current = track;
    await this.save();
  }

  async next(): Promise<Track | null> {
    await this.ensureInitialized();
    this.markModified();
    const track = this.tracks.shift();
    if (track) {
      await this.setCurrent(track);
      return track;
    }
    return null;
  }

  async skipTo(index: number): Promise<Track | null> {
    await this.ensureInitialized();
    if (index < 0 || index >= this.tracks.length) return null;
    
    this.markModified();
    const track = this.tracks[index];
    this.tracks.splice(0, index + 1);
    await this.setCurrent(track);
    return track;
  }

  get(index: number): Track | null {
    return this.tracks[index] || null;
  }

  async save(): Promise<void> {
    const data: QueueData = {
      current: this.current?.toJSON() || null,
      tracks: this.tracks.map(t => t.toJSON()),
      previous: this.previous.map(t => t.toJSON()),
    };
    await this.store.set(this.guildId, data);
  }

  async load(): Promise<void> {
    const data = await this.store.get(this.guildId);
    if (data) {
      this.current = data.current ? new Track(data.current) : null;
      this.tracks = data.tracks.map(t => new Track(t));
      this.previous = data.previous.map(t => new Track(t));
    }
  }
}
