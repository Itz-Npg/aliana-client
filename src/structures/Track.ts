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

  constructor(data: UnresolvedTrack) {
    this.title = data.title;
    this.author = data.author;
    this.duration = data.duration;
    this.uri = data.uri;
    this.requester = data.requester;
    this.resolveFunc = data.resolve as any;
  }

  async resolve(): Promise<Track | null> {
    if (this.resolveFunc) {
      return await this.resolveFunc();
    }
    return null;
  }

  isResolved(): boolean {
    return false;
  }
}
