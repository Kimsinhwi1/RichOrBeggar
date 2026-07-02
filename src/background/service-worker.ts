// DESIGN 4.2: service worker — IndexedDB 저장, 원격 셀렉터 갱신, (Pro) 주기 수집 알람.
// Phase 0에서는 뼈대 + 셀렉터 갱신 훅만.

import { getExtractConfig } from '../lib/selectors/loadSelectors';

chrome.runtime.onInstalled.addListener(async () => {
  console.info('[쿠팡 가계부] 설치/업데이트됨');
  // 최초 설치 시 셀렉터 캐시 워밍 (실패해도 조용히 폴백)
  try {
    const config = await getExtractConfig();
    console.info('[쿠팡 가계부] 셀렉터 버전:', config.version, 'verified:', config.verified);
  } catch (err) {
    console.warn('[쿠팡 가계부] 셀렉터 초기화 실패:', err);
  }
});

// TODO(Phase 1): content script로부터 파싱 결과 수신 → saveOrders()
// TODO(Phase 3): chrome.alarms로 주 1회 백그라운드 수집
export {};
