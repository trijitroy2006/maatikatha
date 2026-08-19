import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow Leaflet CSS to be imported in client components
  transpilePackages: ['leaflet', 'react-leaflet'],

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
