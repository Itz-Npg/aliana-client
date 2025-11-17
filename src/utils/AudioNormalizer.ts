import type { EqualizerBand, FilterData } from '../types';

export class AudioNormalizer {
  private targetVolume: number;
  private enabled: boolean;

  constructor(enabled: boolean = true, targetVolume: number = 1.0) {
    this.enabled = enabled;
    this.targetVolume = Math.max(0.0, Math.min(5.0, targetVolume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  normalize(currentVolume: number): number {
    if (!this.enabled) return currentVolume;

    const normalized = currentVolume * this.targetVolume;
    return Math.max(0, Math.min(1000, normalized));
  }

  getRecommendedEqualizer(trackLoudness?: number): EqualizerBand[] {
    if (!this.enabled || !trackLoudness) {
      return [];
    }

    const adjustment = this.calculateAdjustment(trackLoudness);
    
    return [
      { band: 0, gain: adjustment * 0.1 },
      { band: 1, gain: adjustment * 0.08 },
      { band: 2, gain: adjustment * 0.05 },
      { band: 3, gain: adjustment * 0.03 },
      { band: 4, gain: adjustment * 0.02 },
    ];
  }

  private calculateAdjustment(loudness: number): number {
    const targetLoudness = -14;
    const difference = targetLoudness - loudness;
    
    return Math.max(-0.25, Math.min(0.25, difference / 10));
  }

  applyNormalization(filters: FilterData, currentVolume: number): FilterData {
    if (!this.enabled) return filters;

    const normalizedFilters = { ...filters };
    
    if (!normalizedFilters.volume) {
      normalizedFilters.volume = this.normalize(currentVolume) / 100;
    }

    return normalizedFilters;
  }
}
