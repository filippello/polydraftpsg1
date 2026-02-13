import { useEffect, useRef, useCallback, useState } from 'react';
import { type MotionValue, animate } from 'framer-motion';
import { GP, isGamepadButtonPressed, getDpadDirection } from '@/lib/gamepad';

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

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const directionRef = useRef<'left' | 'right' | null>(null);
  const completedRef = useRef(false);
  const lastProgressUpdateRef = useRef(0);

  // Gamepad polling refs
  const gamepadRafRef = useRef<number | null>(null);
  const prevBRef = useRef(false);
  const prevYRef = useRef(false);
  const prevXRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    directionRef.current = null;
    completedRef.current = false;
    lastProgressUpdateRef.current = 0;
    setChargeDirection(null);
    setChargeProgress(0);
  }, []);

  const snapBack = useCallback(() => {
    cleanup();
    animate(motionX, 0, { type: 'spring', stiffness: 300, damping: 30 });
  }, [cleanup, motionX]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const tick = (now: number) => {
      if (startTimeRef.current === null || directionRef.current === null) return;

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / holdDuration, 1);
      // Cubic ease-in: slow start, accelerating
      const eased = progress * progress * progress;

      const displacement = directionRef.current === 'right'
        ? eased * MAX_DISPLACEMENT
        : eased * -MAX_DISPLACEMENT;

      motionX.set(displacement);

      // Throttle React state updates to ~15fps
      if (now - lastProgressUpdateRef.current > 66) {
        setChargeProgress(progress);
        lastProgressUpdateRef.current = now;
      }

      if (progress >= 1) {
        completedRef.current = true;
        setChargeProgress(1);
        const dir = directionRef.current;
        // Reset refs before calling handler (handler may trigger re-renders)
        directionRef.current = null;
        startTimeRef.current = null;
        rafRef.current = null;
        setChargeDirection(null);
        setChargeProgress(0);

        if (dir === 'right') {
          onYes();
        } else {
          onNo();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startCharge = (dir: 'left' | 'right') => {
      if (directionRef.current !== null) return;
      directionRef.current = dir;
      completedRef.current = false;
      startTimeRef.current = performance.now();
      lastProgressUpdateRef.current = 0;
      setChargeDirection(dir);
      setChargeProgress(0);
      rafRef.current = requestAnimationFrame(tick);
    };

    const stopCharge = (dir: 'left' | 'right') => {
      if (directionRef.current === dir && !completedRef.current) {
        snapBack();
      }
    };

    // --- Keyboard handlers ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onPass();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        startCharge(e.key === 'ArrowRight' ? 'right' : 'left');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        stopCharge(e.key === 'ArrowRight' ? 'right' : 'left');
      }
    };

    // --- Gamepad polling (buttons + D-pad) ---
    let prevRight = false;
    let prevLeft = false;
    let prevDown = false;

    const pollGamepad = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      const yNow = isGamepadButtonPressed(GP.Y);
      const xNow = isGamepadButtonPressed(GP.X);
      const dpad = getDpadDirection();

      // B button → YES (hold)
      if (bNow && !prevBRef.current) startCharge('right');
      if (!bNow && prevBRef.current) stopCharge('right');

      // Y button → NO (hold)
      if (yNow && !prevYRef.current) startCharge('left');
      if (!yNow && prevYRef.current) stopCharge('left');

      // X button → PASS (instant)
      if (xNow && !prevXRef.current) onPass();

      // D-pad right → YES (hold), same as ArrowRight
      if (dpad.right && !prevRight) startCharge('right');
      if (!dpad.right && prevRight) stopCharge('right');

      // D-pad left → NO (hold), same as ArrowLeft
      if (dpad.left && !prevLeft) startCharge('left');
      if (!dpad.left && prevLeft) stopCharge('left');

      // D-pad down → PASS, same as ArrowDown
      if (dpad.down && !prevDown) onPass();

      prevBRef.current = bNow;
      prevYRef.current = yNow;
      prevXRef.current = xNow;
      prevRight = dpad.right;
      prevLeft = dpad.left;
      prevDown = dpad.down;

      gamepadRafRef.current = requestAnimationFrame(pollGamepad);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gamepadRafRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (gamepadRafRef.current !== null) {
        cancelAnimationFrame(gamepadRafRef.current);
      }
    };
  }, [enabled, holdDuration, motionX, onYes, onNo, onPass, cleanup, snapBack]);

  return { chargeDirection, chargeProgress };
}
