export * from './lavalink';
export * from './events';

export interface QueueStore {
  get(guildId: string): Promise<QueueData | null>;
  set(guildId: string, data: QueueData): Promise<void>;
  delete(guildId: string): Promise<void>;
  has(guildId: string): Promise<boolean>;
}

export interface QueueData {
  current: any;
  tracks: any[];
  previous: any[];
}

export interface PlayerOptions {
  guildId: string;
  voiceChannelId: string;
  textChannelId?: string;
  selfDeaf?: boolean;
  selfMute?: boolean;
  volume?: number;
  audioNormalizer?: boolean;
  queueStore?: QueueStore;
  node?: string;
}

export interface ConnectOptions {
  mute?: boolean;
  deaf?: boolean;
}

export interface PlayOptions {
  startTime?: number;
  endTime?: number;
  noReplace?: boolean;
  pause?: boolean;
  volume?: number;
}

export interface SearchQuery {
  query: string;
  source?: string;
}
