import { useState, useEffect, useCallback } from 'react';

const SCROLL_STEP = 80; // pixels per D-pad press

/**
 * Hook for PSG1 pages that need D-pad scrolling (no navigable items).
 * Listens for ArrowUp/ArrowDown keyboard events (OS maps D-pad to arrow keys)
 * and scrolls the page. Returns scroll position for a visual indicator.
 */
export function usePSG1Scroll(enabled: boolean): {
  scrollPercent: number;
  isScrollable: boolean;
} {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const updateScrollInfo = useCallback(() => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    setIsScrollable(scrollHeight > 10);
    setScrollPercent(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' });
      }
    };

    const handleScroll = () => updateScrollInfo();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    updateScrollInfo();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, updateScrollInfo]);

  return { scrollPercent, isScrollable };
}
