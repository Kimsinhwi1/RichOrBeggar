// DESIGN 4.2: content script — 쿠팡 주문목록 페이지에 주입.
// Phase 1: 수집 버튼 삽입 → 현재 페이지 파싱 → service worker로 저장.
// (멀티페이지 순회는 다음 증분에서 URL 파라미터 확정 후 추가)

import { collectCurrentPage, isOrderListPage } from './collect';
import { injectButton, setButtonEnabled, showToast } from './ui';
import type { SaveOrdersMsg, SaveOrdersResult } from '../lib/messaging/types';

async function handleCollect(): Promise<void> {
  setButtonEnabled(false, '수집 중…');
  try {
    const result = await collectCurrentPage();

    // DESIGN 4.4.3 / 시나리오 C: 파싱 실패 시 조용히 죽지 않고 명확히 알림.
    if (result.aborted) {
      showToast(
        '내역을 읽지 못했습니다. 쿠팡 화면이 변경됐을 수 있어요 (보통 48시간 내 수정).',
        'error',
      );
      return;
    }

    const msg: SaveOrdersMsg = { type: 'SAVE_ORDERS', items: result.items };
    const res = (await chrome.runtime.sendMessage(msg)) as SaveOrdersResult;

    const more = result.pageInfo.hasNext ? ' (다음 페이지가 더 있어요)' : '';
    showToast(`${result.items.length}건 수집 완료 · 누적 ${res.total}건${more}`, 'ok');
  } catch (err) {
    // 에러를 삼키지 않는다 (DESIGN 4.6).
    console.error('[쿠팡 가계부] 수집 실패:', err);
    showToast('수집 중 오류가 발생했습니다. 콘솔을 확인해주세요.', 'error');
  } finally {
    setButtonEnabled(true, '쿠팡 가계부: 내역 가져오기');
  }
}

if (isOrderListPage()) {
  injectButton(() => void handleCollect());
} else {
  console.info('[쿠팡 가계부] 주문목록 페이지가 아니어서 버튼을 표시하지 않습니다:', location.href);
}
