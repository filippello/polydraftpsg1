'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';

interface ModeSelectorProps {
  className?: string;
}

const modeHrefs = ['/explore', '/game'];

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  }),
  hover: {
    scale: 1.05,
    y: -8,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.98,
  },
};

export function ModeSelector({ className = '' }: ModeSelectorProps) {
  const router = useRouter();
  const psg1 = isPSG1();

  const onSelect = useCallback(
    (index: number) => {
      router.push(modeHrefs[index]);
    },
    [router]
  );

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1,
    itemCount: 2,
    columns: 2,
    onSelect,
    wrap: true,
  });

  return (
    <div className={`flex flex-col items-center justify-center gap-8 ${className}`}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl font-bold font-pixel-heading text-shadow-balatro mb-2">
          POLYDRAFT
        </h1>
        <p className="text-gray-400 text-sm">Choose your mode</p>
      </motion.div>

      {/* Mode Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md sm:max-w-2xl px-4">
        {/* Explore Card */}
        <Link href="/explore" className="flex-1">
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            className="relative group cursor-pointer"
          >
            <div className={`bg-card-bg border-balatro-thick border-purple-500/60 rounded-balatro-card p-6 h-[220px] flex flex-col items-center justify-center gap-4 shadow-hard-lg overflow-hidden ${psg1 && focusedIndex === 0 ? 'psg1-focus' : ''}`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Inner border */}
              <div className="balatro-card-inner border-purple-400/30" />

              {/* Icon */}
              <motion.div
                className="z-10"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/images/jupiter-logo.png"
                  alt="Jupiter"
                  width={56}
                  height={56}
                  className="w-14 h-14"
                />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-pixel-heading text-purple-300 z-10">
                EXPLORE
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-400 text-center z-10">
                Browse prediction markets
              </p>

              {/* Badge */}
              <span className="absolute top-3 right-3 text-[10px] px-2 py-1 bg-purple-500/80 text-white rounded font-bold uppercase">
                Jupiter
              </span>
            </div>
          </motion.div>
        </Link>

        {/* Play Draft Card */}
        <Link href="/game" className="flex-1">
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            className="relative group cursor-pointer"
          >
            <div className={`bg-card-bg border-balatro-thick border-game-gold/60 rounded-balatro-card p-6 h-[220px] flex flex-col items-center justify-center gap-4 shadow-hard-lg overflow-hidden ${psg1 && focusedIndex === 1 ? 'psg1-focus' : ''}`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Inner border */}
              <div className="balatro-card-inner border-game-gold/30" />

              {/* Icon */}
              <motion.div
                className="text-6xl z-10"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span>🃏</span>
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-pixel-heading text-game-gold z-10 text-center">
                PLAY DRAFT
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-400 text-center z-10">
                Open packs & make picks
              </p>

              {/* Badge */}
              <span className="absolute top-3 right-3 text-[10px] px-2 py-1 bg-game-gold/80 text-black rounded font-bold uppercase">
                Weekly
              </span>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
