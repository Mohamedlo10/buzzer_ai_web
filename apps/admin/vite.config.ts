import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://apiquiz.mouhadev.com'),
  },
  resolve: {
    alias: {
      '~/lib': path.resolve(__dirname, '../../packages/core/src/lib'),
      '~/stores': path.resolve(__dirname, '../../packages/core/src/stores'),
      '~/types': path.resolve(__dirname, '../../packages/core/src/types'),
      '@xalaat/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '~': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});
