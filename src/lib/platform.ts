export type Platform = 'web' | 'psg1';

// Build-time detection (primary)
export const PLATFORM: Platform =
  (process.env.NEXT_PUBLIC_PLATFORM as Platform) || 'web';

export function isPSG1(): boolean {
  return PLATFORM === 'psg1';
}

// Test device override (e.g. Retroid Pocket 5 with different resolution)
export const TEST_DEVICE = process.env.NEXT_PUBLIC_TEST_DEVICE || '';

export function isTestDevice(): boolean {
  return TEST_DEVICE !== '';
}
