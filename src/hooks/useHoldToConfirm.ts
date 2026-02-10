import { useEffect, useRef, useCallback, useState } from 'react';
import { type MotionValue, animate } from 'framer-motion';

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

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore repeated keydown events from holding
      if (e.repeat) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onPass();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        // If already charging, ignore
        if (directionRef.current !== null) return;

        const dir = e.key === 'ArrowRight' ? 'right' as const : 'left' as const;
        directionRef.current = dir;
        completedRef.current = false;
        startTimeRef.current = performance.now();
        lastProgressUpdateRef.current = 0;
        setChargeDirection(dir);
        setChargeProgress(0);

        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const dir = e.key === 'ArrowRight' ? 'right' : 'left';
        // Only snap back if this key matches the current charge direction and didn't complete
        if (directionRef.current === dir && !completedRef.current) {
          snapBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, holdDuration, motionX, onYes, onNo, onPass, cleanup, snapBack]);

  return { chargeDirection, chargeProgress };
}
