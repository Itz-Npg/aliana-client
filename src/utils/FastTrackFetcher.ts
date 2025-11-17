import { LavalinkManager } from '../structures/LavalinkManager';
import { Track } from '../structures/Track';
import { SearchResult, SearchPlatform } from '../types/lavalink';

interface CacheEntry {
  result: SearchResult;
  timestamp: number;
}

interface FetchOptions {
  source?: SearchPlatform;
  requester?: any;
  useCache?: boolean;
  preload?: boolean;
}

export class FastTrackFetcher {
  private manager: LavalinkManager;
  private cache: Map<string, CacheEntry>;
  private cacheTimeout: number;
  private preloadQueue: Set<string>;
  private fetching: Map<string, Promise<SearchResult>>;

  constructor(manager: LavalinkManager, cacheTimeout: number = 300000) {
    this.manager = manager;
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
    this.preloadQueue = new Set();
    this.fetching = new Map();

    setInterval(() => this.cleanCache(), 60000);
  }

  async fetch(query: string, options: FetchOptions = {}): Promise<SearchResult> {
    const cacheKey = this.getCacheKey(query, options.source);
    
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (this.fetching.has(cacheKey)) {
      return this.fetching.get(cacheKey)!;
    }

    const fetchPromise = this.performFetch(query, options);
    this.fetching.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });
      return result;
    } finally {
      this.fetching.delete(cacheKey);
    }
  }

  async batchFetch(queries: string[], options: FetchOptions = {}): Promise<SearchResult[]> {
    const promises = queries.map(query => this.fetch(query, options));
    return Promise.all(promises);
  }

  async fetchAndPlay(
    guildId: string,
    query: string,
    options: FetchOptions = {}
  ): Promise<Track | null> {
    const result = await this.fetch(query, options);
    const player = this.manager.getPlayer(guildId);
    
    if (!player) {
      throw new Error(`No player found for guild ${guildId}`);
    }

    if (result.loadType === 'empty' || result.loadType === 'error') {
      return null;
    }

    let tracks: any[] = [];
    if (result.loadType === 'playlist' && !Array.isArray(result.data)) {
      tracks = result.data.tracks as any[];
    } else if (Array.isArray(result.data)) {
      tracks = result.data as any[];
    }

    if (tracks.length === 0) return null;

    await player.queue.add(tracks as Track[]);

    if (!player.playing && !player.paused) {
      await player.play();
    }

    return tracks[0] as Track;
  }

  async preloadTracks(queries: string[], options: FetchOptions = {}): Promise<void> {
    queries.forEach(q => this.preloadQueue.add(q));
    
    const fetchPromises = queries
      .filter(query => !this.cache.has(this.getCacheKey(query, options.source)))
      .map(query => this.fetch(query, { ...options, preload: true }));

    await Promise.allSettled(fetchPromises);
    
    queries.forEach(q => this.preloadQueue.delete(q));
  }

  async fetchTopResult(query: string, options: FetchOptions = {}): Promise<Track | null> {
    const result = await this.fetch(query, options);

    if (result.loadType === 'empty' || result.loadType === 'error') {
      return null;
    }

    if (result.loadType === 'track' && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0] as Track;
    }

    if (result.loadType === 'search' && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0] as Track;
    }

    if (result.loadType === 'playlist' && !Array.isArray(result.data)) {
      return (result.data.tracks[0] as Track) || null;
    }

    return null;
  }

  async quickPlay(
    guildId: string,
    query: string,
    options: FetchOptions = {}
  ): Promise<boolean> {
    try {
      const track = await this.fetchTopResult(query, options);
      if (!track) return false;

      const player = this.manager.getPlayer(guildId);
      if (!player) {
        throw new Error(`No player found for guild ${guildId}`);
      }

      await player.queue.add(track);

      if (!player.playing && !player.paused) {
        await player.play();
      }

      return true;
    } catch (error) {
      console.error('Quick play error:', error);
      return false;
    }
  }

  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  private hits = 0;
  private misses = 0;

  private async performFetch(
    query: string,
    options: FetchOptions
  ): Promise<SearchResult> {
    return this.manager.search(query, options.requester, options.source);
  }

  private getCacheKey(query: string, source?: SearchPlatform): string {
    return `${source || 'youtube'}:${query.toLowerCase()}`;
  }

  private getFromCache(key: string): SearchResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.result;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}
