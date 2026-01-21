/**
 * Balatro-style motion presets for Framer Motion
 *
 * These presets capture the bouncy, playful feel of Balatro's UI animations.
 */

/**
 * Transition presets for different animation styles
 */
export const balatroTransitions = {
  /** Bouncy spring animation - good for cards entering/exiting */
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },

  /** Snappy pop animation - good for buttons and feedback */
  pop: { type: 'spring' as const, stiffness: 500, damping: 20 },

  /** Quick snap with overshoot - good for micro-interactions */
  snap: { duration: 0.12, ease: [0.68, -0.55, 0.265, 1.55] as const },

  /** Smooth settle - good for layout changes */
  settle: { type: 'spring' as const, stiffness: 300, damping: 25 },
};

/**
 * Hover animation preset
 * Cards lift up slightly, tilt, and scale up
 */
export const balatroHover = {
  scale: 1.05,
  rotate: -1,
  y: -4,
  transition: { duration: 0.15 },
};

/**
 * Tap/press animation preset
 * Cards press down on click for tactile feedback
 */
export const balatroTap = {
  scale: 0.95,
  y: 2,
};

/**
 * Card entrance animation
 * Pop in with bounce and slight rotation
 */
export const balatroCardEntrance = {
  initial: {
    scale: 0.3,
    opacity: 0,
    rotate: -5,
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
  },
  transition: balatroTransitions.bouncy,
};

/**
 * Card exit animation
 * Shrink out with spin
 */
export const balatroCardExit = {
  exit: {
    scale: 0,
    opacity: 0,
    rotate: 10,
  },
  transition: { duration: 0.2 },
};

/**
 * Stagger children animation config
 * For revealing multiple cards/items in sequence
 */
export const balatroStagger = {
  staggerChildren: 0.08,
  delayChildren: 0.1,
};

/**
 * Float animation for idle state
 * Subtle up/down movement for attention
 */
export const balatroFloat = {
  animate: {
    y: [0, -6, 0],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/**
 * Shake animation for errors/warnings
 */
export const balatroShake = {
  animate: {
    x: [0, -8, 8, -4, 4, 0],
  },
  transition: {
    duration: 0.4,
  },
};

/**
 * Pulse glow animation for special cards
 */
export const balatroPulse = {
  animate: {
    scale: [1, 1.02, 1],
    boxShadow: [
      '0 0 0 rgba(255, 215, 0, 0)',
      '0 0 20px rgba(255, 215, 0, 0.6)',
      '0 0 0 rgba(255, 215, 0, 0)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
  },
};
