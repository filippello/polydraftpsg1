export type Platform = 'web' | 'psg1';

// Build-time detection (primary)
export const PLATFORM: Platform =
  (process.env.NEXT_PUBLIC_PLATFORM as Platform) || 'web';

export function isPSG1(): boolean {
  return PLATFORM === 'psg1';
}
