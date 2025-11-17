export { LavalinkManager } from './structures/LavalinkManager';
export { Player } from './structures/Player';
export { Node } from './structures/Node';
export { Queue } from './structures/Queue';
export { Track, UnresolvedTrackImpl as UnresolvedTrack } from './structures/Track';
export { FilterManager } from './filters/FilterManager';
export { FILTER_PRESETS, type PresetName } from './filters/presets';
export { Validator } from './utils/Validator';
export { AudioNormalizer } from './utils/AudioNormalizer';
export { MemoryStore } from './stores/MemoryStore';
export { RedisStoreAdapter, type RedisClient } from './stores/RedisStoreAdapter';
export { DestroyReasons } from './types/lavalink';

export type {
  NodeOptions,
  LavalinkManagerOptions,
  ValidationOptions,
  DefaultPlayerOptions,
  SearchPlatform,
  Track as TrackData,
  TrackInfo,
  UnresolvedTrack as UnresolvedTrackData,
  SearchResult,
  PlaylistInfo,
  ExceptionInfo,
  VoiceState,
  VoiceServerUpdate,
  PlayerUpdateInfo,
  PlayerState,
  LavalinkPlayerVoice,
  LavalinkPlayer,
  FilterData,
  EqualizerBand,
  KaraokeFilter,
  TimescaleFilter,
  TremoloFilter,
  VibratoFilter,
  RotationFilter,
  DistortionFilter,
  ChannelMixFilter,
  LowPassFilter,
  NodeStats,
  LavalinkNodeInfo,
  PluginInfo,
} from './types/lavalink';

export type {
  ManagerEvents,
  TrackEndReason,
  TrackException,
  NodeEvents,
  WebSocketClosedEvent,
  TrackStartEvent,
  TrackEndEvent,
  TrackExceptionEvent,
  TrackStuckEvent,
} from './types/events';

export type {
  QueueStore,
  QueueData,
  PlayerOptions,
  ConnectOptions,
  PlayOptions,
  SearchQuery,
} from './types/index';
