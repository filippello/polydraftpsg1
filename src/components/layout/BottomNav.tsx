'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useActivePacksCount, useTotalPendingReveals } from '@/stores';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { href: '/game', label: 'Home', icon: '🏠' },
  { href: '/my-packs', label: 'My Packs', icon: '📦', showBadge: true },
  { href: '/leaderboard', label: 'Ranks', icon: '🏆' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activePacksCount = useActivePacksCount();
  const pendingReveals = useTotalPendingReveals();

  // Badge shows pending reveals if any, otherwise active packs count
  const badgeCount = pendingReveals > 0 ? pendingReveals : activePacksCount;

  const psg1 = isPSG1();

  // Find active nav index for initialIndex
  const activeIndex = useMemo(() => {
    const idx = navItems.findIndex(
      (item) => pathname === item.href || (item.href === '/game' && pathname === '/')
    );
    return idx >= 0 ? idx : 0;
  }, [pathname]);

  const onNavSelect = useCallback(
    (index: number) => {
      router.push(navItems[index].href);
    },
    [router]
  );

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1,
    itemCount: navItems.length,
    columns: 1,
    onSelect: onNavSelect,
    wrap: true,
    initialIndex: activeIndex,
  });

  // PSG1: vertical side rail
  if (psg1) {
    return (
      <nav className="fixed left-0 top-0 bottom-0 z-50 w-20 bg-game-primary/95 backdrop-blur-sm border-r border-card-border flex flex-col items-center justify-center gap-2 py-4">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || (item.href === '/game' && pathname === '/');
          const showBadge = item.showBadge && badgeCount > 0;
          const isFocused = focusedIndex === i;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-colors ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              } ${isFocused ? 'psg1-focus' : ''}`}
            >
              <div className="relative">
                <span className={`text-2xl ${isActive ? '' : 'grayscale opacity-60'}`}>
                  {item.icon}
                </span>

                {/* Badge */}
                {showBadge && (
                  <motion.span
                    className={`absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                      pendingReveals > 0
                        ? 'bg-game-gold text-black'
                        : 'bg-game-accent text-black'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {badgeCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 leading-tight text-center ${
                  isActive ? 'text-game-accent font-bold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 w-1 h-6 bg-game-accent rounded-r-full"
                  layoutId="nav-indicator"
                  initial={false}
                  style={{ y: '-50%' }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Web: bottom tab bar
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-game-primary/95 backdrop-blur-sm border-t border-card-border safe-area-inset-bottom md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-[430px] md:w-full md:bottom-4 md:rounded-b-2xl">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/game' && pathname === '/');
          const showBadge = item.showBadge && badgeCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center py-2 px-4"
            >
              <div className="relative">
                <motion.div
                  className={`text-2xl ${isActive ? '' : 'grayscale opacity-60'}`}
                  whileTap={{ scale: 0.9 }}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {item.icon}
                </motion.div>

                {/* Badge */}
                {showBadge && (
                  <motion.span
                    className={`absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                      pendingReveals > 0
                        ? 'bg-game-gold text-black'
                        : 'bg-game-accent text-black'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {badgeCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-game-accent font-bold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 left-1/2 w-1 h-1 bg-game-accent rounded-full"
                  layoutId="nav-indicator"
                  initial={false}
                  style={{ x: '-50%' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
