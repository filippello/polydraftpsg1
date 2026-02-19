/**
 * Lightweight audio manager for game SFX.
 * Uses HTMLAudioElement + cloneNode() for overlapping playback.
 * Gracefully handles missing files (no crash).
 */

const SOUNDS = {
  nav_tick: '/audio/nav_tick.mp3',
  nav_back: '/audio/nav_back.mp3',
  pack_open: '/audio/pack_open.mp3',
  card_deal: '/audio/card_deal.mp3',
  card_pick: '/audio/card_pick.mp3',
  charge_loop: '/audio/charge_loop.mp3',
  charge_confirm: '/audio/charge_confirm.mp3',
  reveal_common: '/audio/reveal_common.mp3',
  reveal_rare: '/audio/reveal_rare.mp3',
  reveal_epic: '/audio/reveal_epic.mp3',
  reveal_legendary: '/audio/reveal_legendary.mp3',
  carousel_slide: '/audio/carousel_slide.mp3',
  focus_pop: '/audio/focus_pop.mp3',
  modal_open: '/audio/modal_open.mp3',
  modal_close: '/audio/modal_close.mp3',
  amount_tick: '/audio/amount_tick.mp3',
  purchase_confirm: '/audio/purchase_confirm.mp3',
  purchase_success: '/audio/purchase_success.mp3',
  error: '/audio/error.mp3',
} as const;

export type SoundName = keyof typeof SOUNDS;

const cache = new Map<string, HTMLAudioElement>();

let muted = false;

// Restore muted state from localStorage
if (typeof window !== 'undefined') {
  try {
    muted = localStorage.getItem('audio_muted') === 'true';
  } catch {
    // localStorage unavailable
  }
}

function getOrCreate(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  const path = SOUNDS[name];
  let audio = cache.get(path);
  if (!audio) {
    audio = new Audio(path);
    audio.preload = 'auto';
    cache.set(path, audio);
  }
  return audio;
}

export function playSound(name: SoundName): void {
  if (muted) return;

  const audio = getOrCreate(name);
  if (!audio) return;

  // Clone to allow overlapping plays
  const clone = audio.cloneNode() as HTMLAudioElement;
  clone.volume = audio.volume;
  clone.play().catch(() => {
    // Autoplay blocked or file missing — fail silently
  });
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem('audio_muted', String(value));
  } catch {
    // localStorage unavailable
  }
}

export function isMuted(): boolean {
  return muted;
}

/**
 * Preload all sounds. Call on first user interaction to satisfy Chrome autoplay policy.
 */
export function preloadSounds(): void {
  for (const name of Object.keys(SOUNDS) as SoundName[]) {
    getOrCreate(name);
  }
}
