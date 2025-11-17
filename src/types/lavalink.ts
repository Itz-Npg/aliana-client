export interface NodeOptions {
  host: string;
  port: number;
  password: string;
  secure?: boolean;
  identifier?: string;
  retryAmount?: number;
  retryDelay?: number;
  requestTimeout?: number;
  resumeKey?: string;
  resumeTimeout?: number;
  sessionId?: string;
  regions?: string[];
}

export interface LavalinkManagerOptions {
  nodes: NodeOptions[];
  sendPayload: (guildId: string, payload: any) => void;
  validationOptions?: ValidationOptions;
  autoResume?: boolean;
  clientId?: string;
  defaultSearchPlatform?: SearchPlatform;
  playerOptions?: DefaultPlayerOptions;
}

export interface ValidationOptions {
  allowedDomains?: string[];
  blockedDomains?: string[];
  allowedProtocols?: string[];
  maxTrackLength?: number;
  maxPlaylistSize?: number;
}

export interface DefaultPlayerOptions {
  autoPlay?: boolean;
  volume?: number;
  selfDeaf?: boolean;
  selfMute?: boolean;
  leaveOnEmpty?: boolean;
  leaveOnEmptyDelay?: number;
  leaveOnEnd?: boolean;
  leaveOnEndDelay?: number;
  leaveOnStop?: boolean;
  leaveOnStopDelay?: number;
  applyVolumeAsFilter?: boolean;
  audioNormalizer?: boolean;
}

export type SearchPlatform = 'youtube' | 'youtubemusic' | 'soundcloud' | 'spotify' | 'deezer' | 'applemusic' | 'yandex' | 'jiosaavn';

export interface Track {
  encoded: string;
  info: TrackInfo;
  pluginInfo?: Record<string, any>;
  userData?: Record<string, any>;
}

export interface TrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri?: string;
  artworkUrl?: string;
  isrc?: string;
  sourceName: string;
}

export interface UnresolvedTrack {
  title: string;
  author?: string;
  duration?: number;
  uri?: string;
  requester?: any;
  resolve?: () => Promise<Track | null>;
}

export interface SearchResult {
  loadType: 'track' | 'playlist' | 'search' | 'empty' | 'error';
  data: Track[] | {
    info: PlaylistInfo;
    pluginInfo: Record<string, any>;
    tracks: Track[];
  };
}

export interface PlaylistInfo {
  name: string;
  selectedTrack: number;
}

export interface ExceptionInfo {
  message: string;
  severity: 'common' | 'suspicious' | 'fault';
  cause: string;
}

export interface VoiceState {
  sessionId: string;
  event: VoiceServerUpdate;
}

export interface VoiceServerUpdate {
  token: string;
  guild_id: string;
  endpoint: string;
}

export interface PlayerUpdateInfo {
  guildId: string;
  state: {
    time: number;
    position: number;
    connected: boolean;
    ping: number;
  };
}

export interface PlayerState {
  time: number;
  position: number;
  connected: boolean;
  ping: number;
}

export interface LavalinkPlayerVoice {
  token: string;
  endpoint: string;
  sessionId: string;
}

export interface LavalinkPlayer {
  guildId: string;
  track?: {
    encoded: string;
    info?: TrackInfo;
  };
  volume: number;
  paused: boolean;
  state: PlayerState;
  voice: LavalinkPlayerVoice;
  filters?: FilterData;
}

export interface FilterData {
  volume?: number;
  equalizer?: EqualizerBand[];
  karaoke?: KaraokeFilter;
  timescale?: TimescaleFilter;
  tremolo?: TremoloFilter;
  vibrato?: VibratoFilter;
  rotation?: RotationFilter;
  distortion?: DistortionFilter;
  channelMix?: ChannelMixFilter;
  lowPass?: LowPassFilter;
  pluginFilters?: Record<string, any>;
}

export interface EqualizerBand {
  band: number;
  gain: number;
}

export interface KaraokeFilter {
  level?: number;
  monoLevel?: number;
  filterBand?: number;
  filterWidth?: number;
}

export interface TimescaleFilter {
  speed?: number;
  pitch?: number;
  rate?: number;
}

export interface TremoloFilter {
  frequency?: number;
  depth?: number;
}

export interface VibratoFilter {
  frequency?: number;
  depth?: number;
}

export interface RotationFilter {
  rotationHz?: number;
}

export interface DistortionFilter {
  sinOffset?: number;
  sinScale?: number;
  cosOffset?: number;
  cosScale?: number;
  tanOffset?: number;
  tanScale?: number;
  offset?: number;
  scale?: number;
}

export interface ChannelMixFilter {
  leftToLeft?: number;
  leftToRight?: number;
  rightToLeft?: number;
  rightToRight?: number;
}

export interface LowPassFilter {
  smoothing?: number;
}

export enum DestroyReasons {
  NodeDestroy = 'NodeDestroy',
  NodeReconnect = 'NodeReconnect',
  LavalinkNoVoice = 'LavalinkNoVoice',
  NodeDeleted = 'NodeDeleted',
  PlayerReconnect = 'PlayerReconnect',
  Disconnected = 'Disconnected',
  PlayerMovedChannels = 'PlayerMovedChannels',
  ChannelDeleted = 'ChannelDeleted',
  QueueEmpty = 'QueueEmpty',
  TrackStuck = 'TrackStuck',
  TrackError = 'TrackError',
  Cleanup = 'Cleanup',
}

export interface NodeStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  frameStats?: {
    sent: number;
    nulled: number;
    deficit: number;
  };
}

export interface LavalinkNodeInfo {
  version: {
    semver: string;
    major: number;
    minor: number;
    patch: number;
    preRelease?: string;
  };
  buildTime: number;
  git: {
    branch: string;
    commit: string;
    commitTime: number;
  };
  jvm: string;
  lavaplayer: string;
  sourceManagers: string[];
  filters: string[];
  plugins: PluginInfo[];
}

export interface PluginInfo {
  name: string;
  version: string;
}
