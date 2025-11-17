import type { QueueStore, QueueData } from '../types';

export class MemoryStore implements QueueStore {
  private data: Map<string, QueueData> = new Map();

  async get(guildId: string): Promise<QueueData | null> {
    return this.data.get(guildId) || null;
  }

  async set(guildId: string, data: QueueData): Promise<void> {
    this.data.set(guildId, data);
  }

  async delete(guildId: string): Promise<void> {
    this.data.delete(guildId);
  }

  async has(guildId: string): Promise<boolean> {
    return this.data.has(guildId);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  get size(): number {
    return this.data.size;
  }
}
