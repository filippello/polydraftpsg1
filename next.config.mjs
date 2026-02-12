import withSerwist from '@serwist/next';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ndzpmzjnyndyvscwhiyp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: isDev,
})(nextConfig);
