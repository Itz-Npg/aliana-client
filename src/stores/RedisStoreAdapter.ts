import type { QueueStore, QueueData } from '../types';

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class RedisStoreAdapter implements QueueStore {
  private client: RedisClient;
  private keyPrefix: string;

  constructor(client: RedisClient, keyPrefix: string = 'aliana:queue:') {
    this.client = client;
    this.keyPrefix = keyPrefix;
  }

  private getKey(guildId: string): string {
    return `${this.keyPrefix}${guildId}`;
  }

  async get(guildId: string): Promise<QueueData | null> {
    const data = await this.client.get(this.getKey(guildId));
    return data ? JSON.parse(data) : null;
  }

  async set(guildId: string, data: QueueData): Promise<void> {
    await this.client.set(this.getKey(guildId), JSON.stringify(data));
  }

  async delete(guildId: string): Promise<void> {
    await this.client.del(this.getKey(guildId));
  }

  async has(guildId: string): Promise<boolean> {
    return await this.client.exists(this.getKey(guildId));
  }
}
