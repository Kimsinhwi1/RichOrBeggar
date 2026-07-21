// DESIGN 4.2: service worker — IndexedDB 저장, 원격 셀렉터 갱신.
// Phase 1: content script가 보낸 파싱 결과를 Dexie에 저장.

import { getExtractConfig } from '../lib/selectors/loadSelectors';
import { saveOrders, countOrders, db } from '../lib/db/db';
import { classifyItems } from '../lib/category/classify';
import type { RequestMsg, SaveOrdersResult } from '../lib/messaging/types';

chrome.runtime.onInstalled.addListener(async () => {
  console.info('[쿠팡 가계부] 설치/업데이트됨');
  try {
    const config = await getExtractConfig();
    console.info('[쿠팡 가계부] 셀렉터 버전:', config.version, 'verified:', config.verified);
  } catch (err) {
    console.warn('[쿠팡 가계부] 셀렉터 초기화 실패:', err);
  }
});

async function handleSave(items: RequestMsg['items']): Promise<SaveOrdersResult> {
  // DESIGN 3.1: 규칙 기반 자동 분류(사용자 수정 규칙 우선)
  const rules = await db.rules.toArray();
  const saved = await saveOrders(classifyItems(items, rules));
  const total = await countOrders();
  await chrome.storage.local.set({ lastCollectedAt: new Date().toISOString(), lastSaved: saved });
  return { saved, total };
}

chrome.runtime.onMessage.addListener((msg: RequestMsg, _sender, sendResponse) => {
  if (msg.type === 'SAVE_ORDERS') {
    handleSave(msg.items)
      .then(sendResponse)
      .catch((err) => {
        console.error('[쿠팡 가계부] 저장 실패:', err);
        sendResponse({ saved: 0, total: -1 });
      });
    return true; // 비동기 응답
  }
  return false;
});

// TODO(Phase 3): chrome.alarms로 주 1회 백그라운드 수집
