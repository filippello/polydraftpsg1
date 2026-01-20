import { atom } from 'jotai';
import type { PackOpeningPhase, CardFlipState } from '@/types';

// ============================================
// Pack Opening Animation Atoms
// ============================================

/** Current phase of pack opening animation */
export const packOpeningPhaseAtom = atom<PackOpeningPhase>('idle');

/** Whether pack opening is in progress */
export const isPackOpeningAtom = atom((get) => {
  const phase = get(packOpeningPhaseAtom);
  return phase !== 'idle' && phase !== 'complete';
});

// ============================================
// Card Animation Atoms
// ============================================

/** State of each card flip (position -> state) */
export const cardFlipStatesAtom = atom<Record<number, CardFlipState>>({});

/** Set a single card flip state */
export const setCardFlipStateAtom = atom(
  null,
  (get, set, { position, state }: { position: number; state: CardFlipState }) => {
    const current = get(cardFlipStatesAtom);
    set(cardFlipStatesAtom, { ...current, [position]: state });
  }
);

/** Reset all card flip states */
export const resetCardFlipStatesAtom = atom(null, (get, set) => {
  set(cardFlipStatesAtom, {});
});

// ============================================
// Confetti & Celebration Atoms
// ============================================

/** Trigger confetti animation */
export const confettiTriggerAtom = atom(false);

/** Confetti configuration */
export const confettiConfigAtom = atom({
  particleCount: 100,
  spread: 70,
  origin: { x: 0.5, y: 0.5 },
});

/** Trigger confetti with custom config */
export const triggerConfettiAtom = atom(
  null,
  (get, set, config?: Partial<{ particleCount: number; spread: number; origin: { x: number; y: number } }>) => {
    if (config) {
      set(confettiConfigAtom, { ...get(confettiConfigAtom), ...config });
    }
    set(confettiTriggerAtom, true);
    // Auto-reset after animation
    setTimeout(() => set(confettiTriggerAtom, false), 100);
  }
);

// ============================================
// Shake Effect Atoms
// ============================================

/** Current shake intensity (0 = none, 1 = light, 2 = medium, 3 = intense) */
export const shakeIntensityAtom = atom(0);

/** Trigger shake effect */
export const triggerShakeAtom = atom(null, (get, set, intensity: number = 2) => {
  set(shakeIntensityAtom, intensity);
  // Auto-reset after animation
  setTimeout(() => set(shakeIntensityAtom, 0), 500);
});

// ============================================
// Points Animation Atoms
// ============================================

/** Points popup data */
export interface PointsPopup {
  id: string;
  points: number;
  x: number;
  y: number;
  isWin: boolean;
}

/** Active points popups */
export const pointsPopupsAtom = atom<PointsPopup[]>([]);

/** Add a points popup */
export const addPointsPopupAtom = atom(
  null,
  (get, set, popup: Omit<PointsPopup, 'id'>) => {
    const id = `popup-${Date.now()}-${Math.random()}`;
    const current = get(pointsPopupsAtom);
    set(pointsPopupsAtom, [...current, { ...popup, id }]);

    // Remove after animation
    setTimeout(() => {
      const updated = get(pointsPopupsAtom).filter((p) => p.id !== id);
      set(pointsPopupsAtom, updated);
    }, 1500);
  }
);

// ============================================
// UI State Atoms
// ============================================

/** Current active modal */
export type ModalType = 'none' | 'settings' | 'profile' | 'leaderboard' | 'how-to-play';
export const activeModalAtom = atom<ModalType>('none');

/** Toast notifications */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const toastsAtom = atom<Toast[]>([]);

/** Add a toast notification */
export const addToastAtom = atom(
  null,
  (get, set, toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`;
    const current = get(toastsAtom);
    set(toastsAtom, [...current, { ...toast, id }]);

    // Auto-remove after duration
    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      const updated = get(toastsAtom).filter((t) => t.id !== id);
      set(toastsAtom, updated);
    }, duration);
  }
);

/** Remove a toast */
export const removeToastAtom = atom(null, (get, set, id: string) => {
  const current = get(toastsAtom);
  set(toastsAtom, current.filter((t) => t.id !== id));
});

// ============================================
// Sound Atoms
// ============================================

/** Sound enabled state */
export const soundEnabledAtom = atom(true);

/** Sound to play */
export type SoundType = 'pack-open' | 'card-flip' | 'pick' | 'win' | 'lose' | 'points' | 'click';
export const playSoundAtom = atom<SoundType | null>(null);

/** Trigger sound playback */
export const triggerSoundAtom = atom(null, (get, set, sound: SoundType) => {
  if (get(soundEnabledAtom)) {
    set(playSoundAtom, sound);
    // Reset after a tick
    setTimeout(() => set(playSoundAtom, null), 50);
  }
});
