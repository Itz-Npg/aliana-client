import type { Track, NodeStats, DestroyReasons } from './lavalink';
import type { Player } from '../structures/Player';
import type { Node } from '../structures/Node';

export interface ManagerEvents {
  ready: [node: Node];
  nodeConnect: [node: Node];
  nodeReconnect: [node: Node];
  nodeDisconnect: [node: Node, reason: string];
  nodeError: [node: Node, error: Error];
  nodeRaw: [node: Node, payload: any];
  
  playerCreate: [player: Player];
  playerDestroy: [player: Player, reason: DestroyReasons];
  playerMove: [player: Player, oldChannel: string, newChannel: string];
  playerDisconnect: [player: Player, oldChannel: string];
  
  trackStart: [player: Player, track: Track];
  trackEnd: [player: Player, track: Track, reason: TrackEndReason];
  trackStuck: [player: Player, track: Track, thresholdMs: number];
  trackError: [player: Player, track: Track, error: TrackException];
  
  queueEnd: [player: Player];
  
  socketClosed: [player: Player, code: number, reason: string, byRemote: boolean];
}

export type TrackEndReason = 
  | 'finished'
  | 'loadFailed'
  | 'stopped'
  | 'replaced'
  | 'cleanup';

export interface TrackException {
  message: string;
  severity: 'common' | 'suspicious' | 'fault';
  cause: string;
}

export interface NodeEvents {
  raw: [payload: any];
  disconnect: [reason: string];
  reconnecting: [];
  connect: [];
  error: [error: Error];
  stats: [stats: NodeStats];
}

export interface WebSocketClosedEvent {
  guildId: string;
  code: number;
  reason: string;
  byRemote: boolean;
}

export interface TrackStartEvent {
  guildId: string;
  track: Track;
}

export interface TrackEndEvent {
  guildId: string;
  track: Track;
  reason: TrackEndReason;
}

export interface TrackExceptionEvent {
  guildId: string;
  track: Track;
  exception: TrackException;
}

export interface TrackStuckEvent {
  guildId: string;
  track: Track;
  thresholdMs: number;
}
