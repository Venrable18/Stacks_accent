// Shared block time conversion & humanization utilities for Stacks (~10 min per block)

export const BLOCK_TIME_MINUTES = 10; // Approximate minutes per block on Stacks

export type DurationPreset = '10m' | '1h' | '6h' | '1d' | 'custom';

/** Convert blocks to total minutes (approximate). */
export function blocksToMinutes(blocks: number): number {
  return blocks * BLOCK_TIME_MINUTES;
}

/** Convert minutes to blocks (rounding up to ensure minimum duration). */
export function minutesToBlocks(minutes: number): number {
  return Math.max(1, Math.ceil(minutes / BLOCK_TIME_MINUTES));
}

/** Human-readable approximation for a block count ("~X minutes/hours/days"). */
export function humanizeBlocks(blocks: number): string {
  const minutes = blocksToMinutes(blocks);
  if (minutes < 60) return `~${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = minutes / 60;
  if (hours < 24) return `~${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'}`;
  const days = hours / 24;
  return `~${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'}`;
}

/** Map a duration preset to its block count. */
export function presetToBlocks(preset: Exclude<DurationPreset, 'custom'>): number {
  switch (preset) {
    case '10m':
      return 1; // ~10 minutes
    case '1h':
      return 6; // ~60 minutes
    case '6h':
      return 36; // 6 * 60 / 10
    case '1d':
      return 144; // 24 * 60 / 10
    default:
      return 1;
  }
}

/** Attempt to parse a preset string into blocks; returns undefined if custom/invalid. */
export function maybePresetBlocks(preset: DurationPreset): number | undefined {
  if (preset === 'custom') return undefined;
  return presetToBlocks(preset);
}
