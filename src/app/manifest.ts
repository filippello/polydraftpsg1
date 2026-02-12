import type { MetadataRoute } from 'next';
import { isPSG1 } from '@/lib/platform';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Polydraft',
    short_name: 'Polydraft',
    description: 'Fantasy betting with pixel art packs. Open packs, make picks, win points!',
    start_url: '/',
    display: 'standalone',
    orientation: isPSG1() ? 'landscape' : 'portrait',
    background_color: '#1a1a2e',
    theme_color: '#1a1a2e',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
