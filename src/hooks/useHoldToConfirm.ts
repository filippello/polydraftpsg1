import { useEffect, useRef, useState } from 'react';
import { type MotionValue, animate } from 'framer-motion';
import { GP, isGamepadButtonPressed, getDpadDirection } from '@/lib/gamepad';
import { playSound } from '@/lib/audio';

interface UseHoldToConfirmOptions {
  enabled: boolean;
  onYes: () => void;
  onNo: () => void;
  onPass: () => void;
  motionX: MotionValue<number>;
  holdDuration?: number;
}

interface UseHoldToConfirmReturn {
  chargeDirection: 'left' | 'right' | null;
  chargeProgress: number;
}

const MAX_DISPLACEMENT = 260;
// Number of consecutive "released" frames before cancelling a charge.
// ~130ms at 60fps — handles Retroid hardware button flicker.
const RELEASE_THRESHOLD = 8;
// Frames to wait after enabled transitions true before accepting charges.
// Lets the Gamepad API settle and ensures clean prev-state/gate tracking.
const ENABLE_WARMUP = 15; // ~250ms at 60fps

export function useHoldToConfirm({
  enabled,
  onYes,
  onNo,
  onPass,
  motionX,
  holdDuration = 2000,
}: UseHoldToConfirmOptions): UseHoldToConfirmReturn {
  const [chargeDirection, setChargeDirection] = useState<'left' | 'right' | null>(null);
  const [chargeProgress, setChargeProgress] = useState(0);

  // All external values in refs for stable closure (empty deps effect)
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const motionXRef = useRef(motionX);
  motionXRef.current = motionX;
  const holdDurationRef = useRef(holdDuration);
  holdDurationRef.current = holdDuration;
  const onYesRef = useRef(onYes);
  onYesRef.current = onYes;
  const onNoRef = useRef(onNo);
  onNoRef.current = onNo;
  const onPassRef = useRef(onPass);
  onPassRef.current = onPass;

  useEffect(() => {
    let rafId: number | null = null;

    // All charge state is LOCAL to this closure
    let chargeDir: 'left' | 'right' | null = null;
    let chargeStart: number | null = null;
    let lastProgressUpdate = 0;

    // Gamepad prev-state (local to closure)
    let prevB = false;
    let prevY = false;
    let prevX = false;
    let prevDown = false;
    let rightGateOpen = false;
    let leftGateOpen = false;
    let passGateOpen = false;

    // Frame counter for release detection (replaces setTimeout debounce)
    let releaseFrames = 0;

    // Enable-transition warmup: tracks whether we were previously enabled
    // and counts down frames before accepting charges after enable.
    let wasEnabled = false;
    let warmup = 0;

    const snapBack = () => {
      chargeDir = null;
      chargeStart = null;
      lastProgressUpdate = 0;
      releaseFrames = 0;
      setChargeDirection(null);
      setChargeProgress(0);
      animate(motionXRef.current, 0, { type: 'spring', stiffness: 300, damping: 30 });
    };

    const loop = (now: number) => {
      // --- Disabled: reset charge + prev-state, keep looping ---
      if (!enabledRef.current) {
        if (chargeDir !== null) snapBack();
        prevB = prevY = prevX = prevDown = false;
        rightGateOpen = leftGateOpen = passGateOpen = false;
        wasEnabled = false;
        rafId = requestAnimationFrame(loop);
        return;
      }

      // --- Enable-transition warmup ---
      // When enabled goes from false→true (or on first enabled frame),
      // read gamepad to build accurate prev-state/gates but don't
      // start charges for ENABLE_WARMUP frames.
      if (!wasEnabled) {
        wasEnabled = true;
        warmup = ENABLE_WARMUP;
      }

      // --- Read gamepad ---
      const bNow = isGamepadButtonPressed(GP.B);
      const yNow = isGamepadButtonPressed(GP.Y);
      const xNow = isGamepadButtonPressed(GP.X);
      const dpad = getDpadDirection();

      // --- Gates: require release before accepting after enable ---
      if (!rightGateOpen && !bNow) rightGateOpen = true;
      if (!leftGateOpen && !yNow) leftGateOpen = true;
      if (!passGateOpen && !xNow && !dpad.down) passGateOpen = true;

      // During warmup: track prev-state and gates, but don't start charges
      if (warmup > 0) {
        warmup--;
        prevB = bNow;
        prevY = yNow;
        prevX = xNow;
        prevDown = dpad.down;
        rafId = requestAnimationFrame(loop);
        return;
      }

      // --- Start charge on rising edge ---
      if (chargeDir === null) {
        if (rightGateOpen && bNow && !prevB) {
          motionXRef.current.stop();
          chargeDir = 'right';
          chargeStart = now;
          releaseFrames = 0;
          lastProgressUpdate = 0;
          setChargeDirection('right');
          setChargeProgress(0);
          playSound('charge_loop');
        }
        if (leftGateOpen && yNow && !prevY) {
          motionXRef.current.stop();
          chargeDir = 'left';
          chargeStart = now;
          releaseFrames = 0;
          lastProgressUpdate = 0;
          setChargeDirection('left');
          setChargeProgress(0);
          playSound('charge_loop');
        }
      }

      // --- Active charge: animate + check release ---
      if (chargeDir !== null && chargeStart !== null) {
        const held = chargeDir === 'right' ? bNow : yNow;

        if (held) {
          releaseFrames = 0;
        } else {
          releaseFrames++;
        }

        if (releaseFrames >= RELEASE_THRESHOLD) {
          snapBack();
        } else {
          const elapsed = now - chargeStart;
          const progress = Math.min(elapsed / holdDurationRef.current, 1);
          const eased = progress * progress * progress;
          const displacement = chargeDir === 'right'
            ? eased * MAX_DISPLACEMENT
            : eased * -MAX_DISPLACEMENT;

          motionXRef.current.set(displacement);

          // Throttle React state updates to ~15fps
          if (now - lastProgressUpdate > 66) {
            setChargeProgress(progress);
            lastProgressUpdate = now;
          }

          if (progress >= 1) {
            setChargeProgress(1);
            playSound('charge_confirm');
            const dir = chargeDir;
            chargeDir = null;
            chargeStart = null;
            setChargeDirection(null);
            setChargeProgress(0);
            if (dir === 'right') onYesRef.current();
            else onNoRef.current();
          }
        }
      }

      // --- PASS (instant) ---
      if (passGateOpen && xNow && !prevX) onPassRef.current();
      if (passGateOpen && dpad.down && !prevDown) onPassRef.current();

      // --- Update prev-state ---
      prevB = bNow;
      prevY = yNow;
      prevX = xNow;
      prevDown = dpad.down;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []); // empty deps — runs once on mount, never re-runs

  return { chargeDirection, chargeProgress };
}
