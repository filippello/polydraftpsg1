'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/leaderboard', label: 'Ranks', icon: '🏆' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-game-primary/95 backdrop-blur-sm border-t border-card-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center py-2 px-4"
            >
              <motion.div
                className={`text-2xl ${isActive ? '' : 'grayscale opacity-60'}`}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                {item.icon}
              </motion.div>
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
