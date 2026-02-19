import { useState, useEffect, useCallback, RefObject } from 'react';
import { getDpadDirection } from '@/lib/gamepad';
import { playSound } from '@/lib/audio';

const SCROLL_STEP = 80; // pixels per D-pad press

/**
 * Hook for PSG1 pages that need D-pad scrolling (no navigable items).
 * Listens for ArrowUp/ArrowDown keyboard events (desktop fallback)
 * AND polls Gamepad API D-pad (PSG1 D-pad doesn't fire keyboard events).
 * Returns scroll position for a visual indicator.
 *
 * When containerRef is provided, scrolls that element instead of window.
 */
export function usePSG1Scroll(
  enabled: boolean,
  containerRef?: RefObject<HTMLDivElement | null>
): {
  scrollPercent: number;
  isScrollable: boolean;
} {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const updateScrollInfo = useCallback(() => {
    const el = containerRef?.current;
    if (el) {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setIsScrollable(scrollHeight > 10);
      setScrollPercent(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    } else {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrollable(scrollHeight > 10);
      setScrollPercent(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    }
  }, [containerRef]);

  useEffect(() => {
    if (!enabled) return;

    const el = containerRef?.current;

    const scrollTarget = (top: number) => {
      if (el) {
        el.scrollBy({ top, behavior: 'smooth' });
      } else {
        window.scrollBy({ top, behavior: 'smooth' });
      }
    };

    // Keyboard handler (desktop fallback)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        playSound('nav_tick');
        scrollTarget(SCROLL_STEP);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playSound('nav_tick');
        scrollTarget(-SCROLL_STEP);
      }
    };

    const handleScroll = () => updateScrollInfo();

    window.addEventListener('keydown', handleKeyDown);

    const scrollEventTarget = el || window;
    scrollEventTarget.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollInfo();

    // Gamepad D-pad polling (PSG1 D-pad fires via Gamepad API, not keyboard)
    let rafId: number | null = null;
    const initDpad = getDpadDirection();
    let prevUp = initDpad.up;
    let prevDown = initDpad.down;

    const poll = () => {
      const dpad = getDpadDirection();
      if (dpad.down && !prevDown) { playSound('nav_tick'); scrollTarget(SCROLL_STEP); }
      if (dpad.up && !prevUp) { playSound('nav_tick'); scrollTarget(-SCROLL_STEP); }
      prevUp = dpad.up;
      prevDown = dpad.down;
      updateScrollInfo();
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      scrollEventTarget.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled, containerRef, updateScrollInfo]);

  return { scrollPercent, isScrollable };
}
