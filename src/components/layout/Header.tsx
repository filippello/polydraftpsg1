'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-game-bg/95 backdrop-blur-sm border-b border-card-border safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 bg-game-accent rounded flex items-center justify-center"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white font-bold text-lg">P</span>
          </motion.div>
          <span className="font-bold text-lg tracking-tight">
            Poly<span className="text-game-accent">draft</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Points badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-game-primary rounded border border-card-border">
            <span className="text-game-gold text-sm">★</span>
            <span className="text-sm font-bold">0</span>
          </div>

          {/* Profile */}
          <Link
            href="/profile"
            className="w-8 h-8 bg-game-secondary rounded-full flex items-center justify-center border-2 border-card-border hover:border-game-accent transition-colors"
          >
            <span className="text-xs">👤</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
