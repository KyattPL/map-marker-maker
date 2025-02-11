import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'export',
  basePath: '/map-marker-maker',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
