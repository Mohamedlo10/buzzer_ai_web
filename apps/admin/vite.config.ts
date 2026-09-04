import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
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
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
