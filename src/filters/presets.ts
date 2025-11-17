import type { FilterData } from '../types';

export const FILTER_PRESETS = {
  bassBoost: (level?: number): FilterData => {
    const gain = Math.max(0, Math.min(1, level ?? 0.5));
    return {
      equalizer: [
        { band: 0, gain: gain * 0.6 },
        { band: 1, gain: gain * 0.67 },
        { band: 2, gain: gain * 0.33 },
        { band: 3, gain: 0 },
        { band: 4, gain: -0.5 * gain },
      ],
    };
  },

  nightcore: (): FilterData => ({
    timescale: {
      speed: 1.165,
      pitch: 1.125,
      rate: 1.0,
    },
    tremolo: {
      frequency: 4.0,
      depth: 0.75,
    },
  }),

  vaporwave: (): FilterData => ({
    timescale: {
      speed: 0.8,
      pitch: 0.75,
      rate: 1.0,
    },
    equalizer: [
      { band: 0, gain: 0.3 },
      { band: 1, gain: 0.3 },
    ],
    tremolo: {
      frequency: 14.0,
      depth: 0.5,
    },
  }),

  eightD: (): FilterData => ({
    rotation: {
      rotationHz: 0.2,
    },
  }),

  trebleBass: (): FilterData => ({
    equalizer: [
      { band: 0, gain: 0.2 },
      { band: 1, gain: 0.15 },
      { band: 2, gain: 0 },
      { band: 3, gain: 0 },
      { band: 4, gain: 0.15 },
      { band: 5, gain: 0.2 },
    ],
  }),

  soft: (): FilterData => ({
    lowPass: {
      smoothing: 20.0,
    },
  }),

  pop: (): FilterData => ({
    equalizer: [
      { band: 0, gain: -0.02 },
      { band: 1, gain: -0.01 },
      { band: 2, gain: 0.08 },
      { band: 3, gain: 0.1 },
      { band: 4, gain: 0.15 },
      { band: 5, gain: 0.1 },
      { band: 6, gain: 0.03 },
    ],
  }),

  electronic: (): FilterData => ({
    equalizer: [
      { band: 0, gain: 0.375 },
      { band: 1, gain: 0.35 },
      { band: 2, gain: 0.125 },
      { band: 3, gain: 0 },
      { band: 4, gain: -0.125 },
      { band: 5, gain: 0.125 },
      { band: 6, gain: 0.25 },
      { band: 7, gain: 0.125 },
    ],
  }),

  rock: (): FilterData => ({
    equalizer: [
      { band: 0, gain: 0.3 },
      { band: 1, gain: 0.25 },
      { band: 2, gain: 0.2 },
      { band: 3, gain: 0.1 },
      { band: 4, gain: 0.05 },
      { band: 5, gain: -0.05 },
      { band: 6, gain: -0.15 },
    ],
  }),

  classical: (): FilterData => ({
    equalizer: [
      { band: 0, gain: 0.375 },
      { band: 1, gain: 0.35 },
      { band: 2, gain: 0.125 },
      { band: 3, gain: 0 },
      { band: 4, gain: 0 },
      { band: 5, gain: 0.125 },
      { band: 6, gain: 0.15 },
      { band: 7, gain: 0.05 },
    ],
  }),

  karaoke: (): FilterData => ({
    karaoke: {
      level: 1.0,
      monoLevel: 1.0,
      filterBand: 220.0,
      filterWidth: 100.0,
    },
  }),
};

export type PresetName = keyof typeof FILTER_PRESETS;
