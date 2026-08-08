import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  },
  turbopack: {
    resolveAlias: {
      '~/lib': path.resolve(__dirname, '../../packages/core/src/lib'),
      '~/stores': path.resolve(__dirname, '../../packages/core/src/stores'),
      '~/types': path.resolve(__dirname, '../../packages/core/src/types'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~/lib': path.resolve(__dirname, '../../packages/core/src/lib'),
      '~/stores': path.resolve(__dirname, '../../packages/core/src/stores'),
      '~/types': path.resolve(__dirname, '../../packages/core/src/types'),
    };
    return config;
  },
};

export default nextConfig;
