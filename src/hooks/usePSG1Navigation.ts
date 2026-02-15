import { useState, useEffect, useCallback, useRef } from 'react';
import { GP, isGamepadButtonPressed, getDpadDirection } from '@/lib/gamepad';

interface UsePSG1NavigationOptions {
  enabled: boolean;
  itemCount: number;
  columns?: number;       // 1 = vertical list, N = grid (default 1)
  onSelect?: (index: number) => void;
  onBack?: () => void;    // Escape / Gamepad A
  wrap?: boolean;         // wrap at edges (default false)
  initialIndex?: number;  // default 0
}

interface UsePSG1NavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
}

export function usePSG1Navigation({
  enabled,
  itemCount,
  columns = 1,
  onSelect,
  onBack,
  wrap = false,
  initialIndex = 0,
}: UsePSG1NavigationOptions): UsePSG1NavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const prevItemCountRef = useRef(itemCount);

  // Reset to 0 when itemCount actually changes (not on mount)
  useEffect(() => {
    if (prevItemCountRef.current !== itemCount) {
      prevItemCountRef.current = itemCount;
      setFocusedIndex(0);
    }
  }, [itemCount]);

  const move = useCallback(
    (delta: number) => {
      setFocusedIndex((prev) => {
        const next = prev + delta;
        if (next < 0) {
          return wrap ? itemCount - 1 : 0;
        }
        if (next >= itemCount) {
          return wrap ? 0 : itemCount - 1;
        }
        return next;
      });
    },
    [itemCount, wrap]
  );

  // Original keyboard handler (unchanged)
  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move(columns === 1 ? -1 : -columns);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(columns === 1 ? 1 : columns);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (columns > 1) move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (columns > 1) move(1);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect?.(focusedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          onBack?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, itemCount, columns, focusedIndex, onSelect, onBack, move]);

  // Gamepad polling (separate effect: B=select, A=back, D-pad=navigate)
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;

  const moveRef = useRef(move);
  moveRef.current = move;

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    let rafId: number | null = null;
    // Snapshot current button state so a held button from a previous
    // interaction isn't detected as a new press when the effect restarts
    let prevB = isGamepadButtonPressed(GP.B);
    let prevA = isGamepadButtonPressed(GP.A);
    const initDpad = getDpadDirection();
    let prevUp = initDpad.up;
    let prevDown = initDpad.down;
    let prevLeft = initDpad.left;
    let prevRight = initDpad.right;

    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      const aNow = isGamepadButtonPressed(GP.A);
      const dpad = getDpadDirection();

      if (bNow && !prevB) onSelect?.(focusedIndexRef.current);
      if (aNow && !prevA) onBack?.();

      // D-pad navigation (edge detection, same logic as keyboard handler)
      const cols = columnsRef.current;
      if (dpad.up && !prevUp) moveRef.current(cols === 1 ? -1 : -cols);
      if (dpad.down && !prevDown) moveRef.current(cols === 1 ? 1 : cols);
      if (dpad.left && !prevLeft && cols > 1) moveRef.current(-1);
      if (dpad.right && !prevRight && cols > 1) moveRef.current(1);

      prevB = bNow;
      prevA = aNow;
      prevUp = dpad.up;
      prevDown = dpad.down;
      prevLeft = dpad.left;
      prevRight = dpad.right;
      rafId = requestAnimationFrame(poll);
    };

    rafId = requestAnimationFrame(poll);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled, itemCount, onSelect, onBack]);

  return { focusedIndex, setFocusedIndex };
}
