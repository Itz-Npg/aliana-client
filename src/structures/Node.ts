import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type { NodeOptions, NodeStats, LavalinkNodeInfo } from '../types';

interface ProcessedNodeOptions extends Omit<Required<NodeOptions>, 'resumeKey'> {
  resumeKey?: string;
}

export class Node extends EventEmitter {
  public identifier: string;
  public options: ProcessedNodeOptions;
  public stats: NodeStats | null = null;
  public info: LavalinkNodeInfo | null = null;
  public sessionId: string | null = null;
  
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private connected = false;

  constructor(options: NodeOptions) {
    super();
    
    this.identifier = options.identifier || `${options.host}:${options.port}`;
    this.options = {
      host: options.host,
      port: options.port,
      password: options.password,
      secure: options.secure ?? false,
      identifier: this.identifier,
      retryAmount: options.retryAmount ?? 5,
      retryDelay: options.retryDelay ?? 30000,
      requestTimeout: options.requestTimeout ?? 10000,
      resumeKey: options.resumeKey,
      resumeTimeout: options.resumeTimeout ?? 60,
      regions: options.regions || [],
    };
  }

  get isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  get address(): string {
    return `${this.options.host}:${this.options.port}`;
  }

  get wsAddress(): string {
    const protocol = this.options.secure ? 'wss' : 'ws';
    return `${protocol}://${this.address}/v4/websocket`;
  }

  get restAddress(): string {
    const protocol = this.options.secure ? 'https' : 'http';
    return `${protocol}://${this.address}/v4`;
  }

  async connect(clientId: string, resumeKey?: string): Promise<void> {
    if (this.isConnected) return;

    const headers: Record<string, string> = {
      'Authorization': this.options.password,
      'User-Id': clientId,
      'Client-Name': 'Aliana-client/1.0.0',
    };

    if (resumeKey || this.options.resumeKey) {
      headers['Session-Id'] = resumeKey || this.options.resumeKey!;
    }

    this.ws = new WebSocket(this.wsAddress, { headers });

    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('error', this.onError.bind(this));
    this.ws.on('close', this.onClose.bind(this));
  }

  private async onOpen(): Promise<void> {
    this.connected = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.options.resumeKey && this.sessionId) {
      try {
        await this.configureResuming();
      } catch (error) {
        console.error('Failed to configure session resuming:', error);
      }
    }
    
    this.emit('connect');
  }

  private async configureResuming(): Promise<void> {
    if (!this.sessionId || !this.options.resumeKey) return;
    
    const { request } = await import('undici');
    await request(`${this.restAddress}/sessions/${this.sessionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': this.options.password,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resuming: true,
        timeout: this.options.resumeTimeout,
      }),
    });
  }

  private async onMessage(data: WebSocket.Data): Promise<void> {
    try {
      const payload = JSON.parse(data.toString());
      this.emit('raw', payload);

      switch (payload.op) {
        case 'ready':
          this.sessionId = payload.sessionId || null;
          this.info = null;
          await this.fetchInfo();
          this.emit('ready', payload);
          break;
        case 'stats':
          this.stats = payload;
          this.emit('stats', payload);
          break;
        case 'event':
          this.emit('event', payload);
          break;
        case 'playerUpdate':
          this.emit('playerUpdate', payload);
          break;
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  private onError(error: Error): void {
    this.emit('error', error);
  }

  private onClose(_code: number, reason: Buffer): void {
    this.connected = false;
    this.emit('disconnect', reason.toString() || 'Unknown reason');

    if (this.reconnectAttempts < this.options.retryAmount) {
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => {
        this.emit('reconnecting');
      }, this.options.retryDelay);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return;
    
    this.connected = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.ws.close(1000, 'Disconnect');
    this.ws.removeAllListeners();
    this.ws = null;
  }

  send(payload: any): void {
    if (!this.isConnected) {
      throw new Error(`Node ${this.identifier} is not connected`);
    }
    console.log(`📤 Sending to Lavalink:`, JSON.stringify(payload));
    this.ws!.send(JSON.stringify(payload));
  }

  async fetchInfo(): Promise<LavalinkNodeInfo> {
    const { request } = await import('undici');
    const response = await request(`${this.restAddress}/info`, {
      headers: {
        'Authorization': this.options.password,
      },
    });
    
    this.info = await response.body.json() as LavalinkNodeInfo;
    return this.info;
  }

  async request<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const { request } = await import('undici');
    const response = await request(`${this.restAddress}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.options.password,
        ...options.headers,
      },
    });

    return await response.body.json() as T;
  }

  async updatePlayer(options: {
    guildId: string;
    playerOptions?: {
      track?: { encoded?: string; identifier?: string; userData?: any };
      position?: number;
      endTime?: number;
      volume?: number;
      paused?: boolean;
      filters?: any;
      voice?: {
        token: string;
        endpoint: string;
        sessionId: string;
      };
    };
    noReplace?: boolean;
  }): Promise<any> {
    if (!this.sessionId) {
      throw new Error('No session ID available');
    }

    const { request } = await import('undici');
    const body: any = {
      ...options.playerOptions,
    };

    if (options.noReplace !== undefined) {
      body.noReplace = options.noReplace;
    }

    console.log(`📤 REST updatePlayer:`, JSON.stringify(body));

    const response = await request(
      `${this.restAddress}/sessions/${this.sessionId}/players/${options.guildId}?noReplace=${options.noReplace || false}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': this.options.password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    return await response.body.json();
  }
}
