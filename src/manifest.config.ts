import { defineManifest } from '@crxjs/vite-plugin';

// DESIGN 8장 리스크: 권한 최소화(coupang.com host permission만), 데이터 미수집.
export default defineManifest({
  manifest_version: 3,
  name: '쿠팡 가계부 — 주문내역 엑셀 추출 & 지출 분석',
  version: '0.1.4',
  description:
    '쿠팡 주문내역을 클릭 한 번으로 추출해 자동 분류된 지출 리포트로. 서버 전송 없음, 내 브라우저에만 저장.',
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '쿠팡 가계부',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://mc.coupang.com/*'],
      js: ['src/content/content.ts'],
      run_at: 'document_idle',
    },
  ],
  // 권한 최소화(DESIGN 8장): 실제 사용하는 것만. alarms는 Phase 3(자동 수집) 도입 시 추가.
  permissions: ['storage'],
  host_permissions: ['https://mc.coupang.com/*'],
  web_accessible_resources: [
    {
      resources: ['src/dashboard/index.html', 'selectors.json'],
      matches: ['https://mc.coupang.com/*'],
    },
  ],
});
