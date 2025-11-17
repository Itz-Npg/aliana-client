import type { Track as LavalinkTrack, UnresolvedTrack, TrackInfo } from '../types';

export class Track implements LavalinkTrack {
  encoded: string;
  info: TrackInfo;
  pluginInfo?: Record<string, any>;
  userData?: Record<string, any>;
  requester?: any;

  constructor(data: LavalinkTrack, requester?: any) {
    this.encoded = data.encoded;
    this.info = data.info;
    this.pluginInfo = data.pluginInfo;
    this.userData = data.userData || {};
    this.requester = requester;
  }

  get title(): string {
    return this.info.title;
  }

  get author(): string {
    return this.info.author;
  }

  get duration(): number {
    return this.info.length;
  }

  get uri(): string | undefined {
    return this.info.uri;
  }

  get thumbnail(): string | undefined {
    return this.info.artworkUrl;
  }

  get identifier(): string {
    return this.info.identifier;
  }

  get isStream(): boolean {
    return this.info.isStream;
  }

  get isSeekable(): boolean {
    return this.info.isSeekable;
  }

  get sourceName(): string {
    return this.info.sourceName;
  }

  toJSON(): LavalinkTrack {
    return {
      encoded: this.encoded,
      info: this.info,
      pluginInfo: this.pluginInfo,
      userData: this.userData,
    };
  }

  clone(): Track {
    return new Track(this.toJSON(), this.requester);
  }
}

export class UnresolvedTrackImpl implements UnresolvedTrack {
  title: string;
  author?: string;
  duration?: number;
  uri?: string;
  requester?: any;
  private resolveFunc?: () => Promise<any>;
  private resolved: Track | null = null;
  private resolutionAttempted: boolean = false;
  private resolutionError: Error | null = null;

  constructor(data: UnresolvedTrack) {
    this.title = data.title;
    this.author = data.author;
    this.duration = data.duration;
    this.uri = data.uri;
    this.requester = data.requester;
    this.resolveFunc = data.resolve as any;
  }

  async resolve(): Promise<Track | null> {
    if (this.resolved) return this.resolved;
    
    if (this.resolutionAttempted) {
      if (this.resolutionError) {
        throw this.resolutionError;
      }
      const notFoundError = new Error(`Track "${this.title}" could not be resolved: no matching track found`);
      this.resolutionError = notFoundError;
      throw notFoundError;
    }
    
    this.resolutionAttempted = true;
    
    if (!this.resolveFunc) {
      const noResolverError = new Error(`Track "${this.title}" has no resolver function configured`);
      this.resolutionError = noResolverError;
      throw noResolverError;
    }
    
    try {
      const track = await this.resolveFunc();
      if (track) {
        if (track instanceof Track) {
          this.resolved = track;
        } else if (track.encoded && track.info) {
          this.resolved = new Track(track, this.requester);
        } else {
          throw new Error(`Invalid track data returned from resolver for "${this.title}": missing encoded or info`);
        }
        return this.resolved;
      }
      const notFoundError = new Error(`Track "${this.title}" could not be resolved: resolver returned null/undefined`);
      this.resolutionError = notFoundError;
      throw notFoundError;
    } catch (error) {
      this.resolutionError = error instanceof Error ? error : new Error(String(error));
      throw this.resolutionError;
    }
  }

  isResolved(): boolean {
    return this.resolved !== null;
  }

  getResolved(): Track | null {
    return this.resolved;
  }
  
  getResolutionError(): Error | null {
    return this.resolutionError;
  }
}
