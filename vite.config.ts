/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.config';

// Vite + @crxjs/vite-plugin 기반 MV3 빌드 설정 (DESIGN 4.1)
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [react(), crx({ manifest })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
