import type { FilterData, EqualizerBand, ChannelMixFilter } from '../types';
import { FILTER_PRESETS, type PresetName } from './presets';

export class FilterManager {
  private filters: FilterData = {};
  private updateCallback: (filters: FilterData) => Promise<void>;

  constructor(updateCallback: (filters: FilterData) => Promise<void>) {
    this.updateCallback = updateCallback;
  }

  get current(): FilterData {
    return { ...this.filters };
  }

  async setEqualizer(bands: EqualizerBand[]): Promise<void> {
    this.filters.equalizer = bands;
    await this.updateCallback(this.filters);
  }

  async setBassBoost(level: number = 0.5): Promise<void> {
    const preset = FILTER_PRESETS.bassBoost(level);
    this.filters.equalizer = preset.equalizer;
    await this.updateCallback(this.filters);
  }

  async setNightcore(enable: boolean): Promise<void> {
    if (enable) {
      const preset = FILTER_PRESETS.nightcore();
      this.filters.timescale = preset.timescale;
      this.filters.tremolo = preset.tremolo;
    } else {
      delete this.filters.timescale;
      delete this.filters.tremolo;
    }
    await this.updateCallback(this.filters);
  }

  async setVaporwave(enable: boolean): Promise<void> {
    if (enable) {
      const preset = FILTER_PRESETS.vaporwave();
      this.filters.timescale = preset.timescale;
      this.filters.equalizer = preset.equalizer;
      this.filters.tremolo = preset.tremolo;
    } else {
      delete this.filters.timescale;
      delete this.filters.equalizer;
      delete this.filters.tremolo;
    }
    await this.updateCallback(this.filters);
  }

  async set8D(enable: boolean): Promise<void> {
    if (enable) {
      const preset = FILTER_PRESETS.eightD();
      this.filters.rotation = preset.rotation;
    } else {
      delete this.filters.rotation;
    }
    await this.updateCallback(this.filters);
  }

  async setKaraoke(enable: boolean): Promise<void> {
    if (enable) {
      const preset = FILTER_PRESETS.karaoke();
      this.filters.karaoke = preset.karaoke;
    } else {
      delete this.filters.karaoke;
    }
    await this.updateCallback(this.filters);
  }

  async setPreset(preset: PresetName): Promise<void> {
    const presetFunction = FILTER_PRESETS[preset];
    if (typeof presetFunction !== 'function') {
      throw new Error(`Invalid preset: ${preset}. Available presets: ${Object.keys(FILTER_PRESETS).join(', ')}`);
    }
    const presetFilters = presetFunction();
    this.filters = { ...this.filters, ...presetFilters };
    await this.updateCallback(this.filters);
  }

  async setTimescale(speed?: number, pitch?: number, rate?: number): Promise<void> {
    if (!speed && !pitch && !rate) {
      delete this.filters.timescale;
    } else {
      this.filters.timescale = { speed, pitch, rate };
    }
    await this.updateCallback(this.filters);
  }

  async setTremolo(frequency?: number, depth?: number): Promise<void> {
    if (!frequency && !depth) {
      delete this.filters.tremolo;
    } else {
      this.filters.tremolo = { frequency, depth };
    }
    await this.updateCallback(this.filters);
  }

  async setVibrato(frequency?: number, depth?: number): Promise<void> {
    if (!frequency && !depth) {
      delete this.filters.vibrato;
    } else {
      this.filters.vibrato = { frequency, depth };
    }
    await this.updateCallback(this.filters);
  }

  async setRotation(rotationHz?: number): Promise<void> {
    if (!rotationHz) {
      delete this.filters.rotation;
    } else {
      this.filters.rotation = { rotationHz };
    }
    await this.updateCallback(this.filters);
  }

  async setDistortion(options: {
    sinOffset?: number;
    sinScale?: number;
    cosOffset?: number;
    cosScale?: number;
    tanOffset?: number;
    tanScale?: number;
    offset?: number;
    scale?: number;
  }): Promise<void> {
    if (Object.keys(options).length === 0) {
      delete this.filters.distortion;
    } else {
      this.filters.distortion = options;
    }
    await this.updateCallback(this.filters);
  }

  async setChannelMix(options: {
    leftToLeft?: number;
    leftToRight?: number;
    rightToLeft?: number;
    rightToRight?: number;
  }): Promise<void> {
    if (Object.keys(options).length === 0) {
      delete this.filters.channelMix;
    } else {
      this.filters.channelMix = options;
    }
    await this.updateCallback(this.filters);
  }

  async setLowPass(smoothing?: number): Promise<void> {
    if (!smoothing) {
      delete this.filters.lowPass;
    } else {
      this.filters.lowPass = { smoothing };
    }
    await this.updateCallback(this.filters);
  }

  async clearFilters(): Promise<void> {
    this.filters = {};
    await this.updateCallback(this.filters);
  }

  async setVolume(volume: number): Promise<void> {
    this.filters.volume = Math.max(0, Math.min(5, volume));
    await this.updateCallback(this.filters);
  }

  async setAudioOutput(type: 'mono' | 'stereo' | 'left' | 'right'): Promise<void> {
    const audioOutputsData: Record<string, ChannelMixFilter> = {
      mono: { leftToLeft: 0.5, leftToRight: 0.5, rightToLeft: 0.5, rightToRight: 0.5 },
      stereo: { leftToLeft: 1, leftToRight: 0, rightToLeft: 0, rightToRight: 1 },
      left: { leftToLeft: 1, leftToRight: 0, rightToLeft: 1, rightToRight: 0 },
      right: { leftToLeft: 0, leftToRight: 1, rightToLeft: 0, rightToRight: 1 },
    };
    
    if (type === 'stereo') {
      delete this.filters.channelMix;
    } else {
      this.filters.channelMix = audioOutputsData[type];
    }
    await this.updateCallback(this.filters);
  }

  async setEcho(delay?: number, decay?: number): Promise<void> {
    if (!delay && !decay) {
      if (this.filters.pluginFilters?.['lavalink-filter-plugin']) {
        delete this.filters.pluginFilters['lavalink-filter-plugin'].echo;
        if (Object.keys(this.filters.pluginFilters['lavalink-filter-plugin']).length === 0) {
          delete this.filters.pluginFilters['lavalink-filter-plugin'];
        }
        if (Object.keys(this.filters.pluginFilters).length === 0) {
          delete this.filters.pluginFilters;
        }
      }
    } else {
      if (!this.filters.pluginFilters) {
        this.filters.pluginFilters = {};
      }
      if (!this.filters.pluginFilters['lavalink-filter-plugin']) {
        this.filters.pluginFilters['lavalink-filter-plugin'] = {};
      }
      this.filters.pluginFilters['lavalink-filter-plugin'].echo = {
        delay: delay ?? 1,
        decay: decay ?? 0.5
      };
    }
    await this.updateCallback(this.filters);
  }

  async setReverb(delays?: number[], gains?: number[]): Promise<void> {
    if (!delays && !gains) {
      if (this.filters.pluginFilters?.['lavalink-filter-plugin']) {
        delete this.filters.pluginFilters['lavalink-filter-plugin'].reverb;
        if (Object.keys(this.filters.pluginFilters['lavalink-filter-plugin']).length === 0) {
          delete this.filters.pluginFilters['lavalink-filter-plugin'];
        }
        if (Object.keys(this.filters.pluginFilters).length === 0) {
          delete this.filters.pluginFilters;
        }
      }
    } else {
      if (!this.filters.pluginFilters) {
        this.filters.pluginFilters = {};
      }
      if (!this.filters.pluginFilters['lavalink-filter-plugin']) {
        this.filters.pluginFilters['lavalink-filter-plugin'] = {};
      }
      this.filters.pluginFilters['lavalink-filter-plugin'].reverb = {
        delays: delays ?? [0.037, 0.042, 0.048, 0.053],
        gains: gains ?? [0.84, 0.83, 0.82, 0.81]
      };
    }
    await this.updateCallback(this.filters);
  }

  async setHighPass(cutoffFrequency?: number, boostFactor?: number): Promise<void> {
    if (!cutoffFrequency && !boostFactor) {
      if (this.filters.pluginFilters) {
        delete this.filters.pluginFilters['high-pass'];
        if (Object.keys(this.filters.pluginFilters).length === 0) {
          delete this.filters.pluginFilters;
        }
      }
    } else {
      if (!this.filters.pluginFilters) {
        this.filters.pluginFilters = {};
      }
      this.filters.pluginFilters['high-pass'] = {
        cutoffFrequency: cutoffFrequency ?? 1475,
        boostFactor: boostFactor ?? 1.0
      };
    }
    await this.updateCallback(this.filters);
  }

  async setPluginLowPass(cutoffFrequency?: number, boostFactor?: number): Promise<void> {
    if (!cutoffFrequency && !boostFactor) {
      if (this.filters.pluginFilters) {
        delete this.filters.pluginFilters['low-pass'];
        if (Object.keys(this.filters.pluginFilters).length === 0) {
          delete this.filters.pluginFilters;
        }
      }
    } else {
      if (!this.filters.pluginFilters) {
        this.filters.pluginFilters = {};
      }
      this.filters.pluginFilters['low-pass'] = {
        cutoffFrequency: cutoffFrequency ?? 284,
        boostFactor: boostFactor ?? 1.0
      };
    }
    await this.updateCallback(this.filters);
  }

  async setNormalization(maxAmplitude?: number): Promise<void> {
    if (!maxAmplitude) {
      if (this.filters.pluginFilters) {
        delete this.filters.pluginFilters['normalization'];
        if (Object.keys(this.filters.pluginFilters).length === 0) {
          delete this.filters.pluginFilters;
        }
      }
    } else {
      if (!this.filters.pluginFilters) {
        this.filters.pluginFilters = {};
      }
      this.filters.pluginFilters['normalization'] = {
        maxAmplitude: maxAmplitude ?? 0.75
      };
    }
    await this.updateCallback(this.filters);
  }

  setFilters(filters: FilterData): void {
    this.filters = { ...filters };
  }
}
