import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow Leaflet and Three.js to be imported in client components
  transpilePackages: ['leaflet', 'react-leaflet', 'three', '@react-three/fiber', '@react-three/drei'],

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
