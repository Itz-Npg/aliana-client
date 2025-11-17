import type { FilterData, EqualizerBand } from '../types';
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
    const presetFilters = FILTER_PRESETS[preset]();
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

  setFilters(filters: FilterData): void {
    this.filters = { ...filters };
  }
}
