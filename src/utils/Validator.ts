import type { ValidationOptions } from '../types';

export class Validator {
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      allowedDomains: options.allowedDomains || [],
      blockedDomains: options.blockedDomains || [],
      allowedProtocols: options.allowedProtocols || ['http', 'https'],
      maxTrackLength: options.maxTrackLength || 3600000,
      maxPlaylistSize: options.maxPlaylistSize || 1000,
    };
  }

  validateUrl(url: string): { valid: boolean; reason?: string } {
    try {
      const parsed = new URL(url);
      
      if (!this.options.allowedProtocols!.includes(parsed.protocol.replace(':', ''))) {
        return { valid: false, reason: `Protocol ${parsed.protocol} not allowed` };
      }

      const hostname = parsed.hostname;

      if (this.options.blockedDomains!.length > 0) {
        for (const blocked of this.options.blockedDomains!) {
          if (hostname.includes(blocked)) {
            return { valid: false, reason: `Domain ${hostname} is blocked` };
          }
        }
      }

      if (this.options.allowedDomains!.length > 0) {
        const allowed = this.options.allowedDomains!.some(domain => hostname.includes(domain));
        if (!allowed) {
          return { valid: false, reason: `Domain ${hostname} is not in allowed list` };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  validateTrackLength(length: number): { valid: boolean; reason?: string } {
    if (length > this.options.maxTrackLength!) {
      return { 
        valid: false, 
        reason: `Track length ${length}ms exceeds maximum ${this.options.maxTrackLength}ms` 
      };
    }
    return { valid: true };
  }

  validatePlaylistSize(size: number): { valid: boolean; reason?: string } {
    if (size > this.options.maxPlaylistSize!) {
      return { 
        valid: false, 
        reason: `Playlist size ${size} exceeds maximum ${this.options.maxPlaylistSize}` 
      };
    }
    return { valid: true };
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 1000);
  }
}
