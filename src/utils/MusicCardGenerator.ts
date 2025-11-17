import type { Track } from '../structures/Track';

export interface MusicCardOptions {
  thumbnailImage?: string;
  backgroundColor?: string;
  progress?: number;
  progressColor?: string;
  progressBarColor?: string;
  name?: string;
  nameColor?: string;
  author?: string;
  authorColor?: string;
  startTime?: string;
  endTime?: string;
  timeColor?: string;
}

export type MusicCardTheme = 'classic' | 'classicPro' | 'dynamic';

export class MusicCardGenerator {
  private static musicardLoaded: boolean = false;
  private static musicard: any = null;

  private static async loadMusicard(): Promise<void> {
    if (this.musicardLoaded && this.musicard) {
      return;
    }

    try {
      this.musicard = await import('musicard');
      this.musicardLoaded = true;
    } catch (error) {
      throw new Error(
        'musicard package is not installed. Install it with: npm install musicard\n' +
        'Note: musicard is an optional dependency for generating music cards.'
      );
    }
  }

  static async generateCard(
    track: Track,
    options: MusicCardOptions = {},
    theme: MusicCardTheme = 'classic'
  ): Promise<Buffer> {
    await this.loadMusicard();

    const defaultOptions: MusicCardOptions = {
      thumbnailImage: track.info.artworkUrl || track.thumbnail || 'https://via.placeholder.com/300',
      backgroundColor: '#070707',
      progress: 0,
      progressColor: '#FF7A00',
      progressBarColor: '#5F2D00',
      name: track.info.title || track.title || 'Unknown Track',
      nameColor: '#FF7A00',
      author: track.info.author || track.author || 'Unknown Artist',
      authorColor: '#696969',
      startTime: '0:00',
      endTime: this.formatDuration(track.info.length || track.duration || 0),
      timeColor: '#FF7A00',
      ...options,
    };

    let cardBuffer: Buffer;

    switch (theme) {
      case 'classicPro':
        cardBuffer = await this.musicard.ClassicPro(defaultOptions);
        break;
      case 'dynamic':
        cardBuffer = await this.musicard.Dynamic(defaultOptions);
        break;
      case 'classic':
      default:
        cardBuffer = await this.musicard.Classic(defaultOptions);
        break;
    }

    return cardBuffer;
  }

  static async generateCardWithProgress(
    track: Track,
    currentPosition: number,
    options: MusicCardOptions = {},
    theme: MusicCardTheme = 'classic'
  ): Promise<Buffer> {
    const duration = track.info.length || track.duration || 0;
    const progress = duration > 0 ? Math.min(100, (currentPosition / duration) * 100) : 0;

    return this.generateCard(
      track,
      {
        ...options,
        progress,
        startTime: this.formatDuration(currentPosition),
        endTime: this.formatDuration(duration),
      },
      theme
    );
  }

  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static isAvailable(): boolean {
    try {
      require.resolve('musicard');
      return true;
    } catch {
      return false;
    }
  }
}
