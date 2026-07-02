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
  build: {
    rollupOptions: {
      // 대시보드는 web_accessible_resources로만 참조돼 crxjs가 script 태그를
      // 자동 변환하지 않는다. Vite 진입점으로 명시해 빌드 시 변환·번들되게 한다.
      input: { dashboard: resolve(__dirname, 'src/dashboard/index.html') },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
