import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePSG1NavigationOptions {
  enabled: boolean;
  itemCount: number;
  columns?: number;       // 1 = vertical list, N = grid (default 1)
  onSelect?: (index: number) => void;
  onBack?: () => void;    // Escape
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

  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          // In vertical list (columns=1), move by 1; in grid, move by columns (row jump)
          move(columns === 1 ? -1 : -columns);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(columns === 1 ? 1 : columns);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // In vertical list, ignore; in grid, move by 1
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

  return { focusedIndex, setFocusedIndex };
}
