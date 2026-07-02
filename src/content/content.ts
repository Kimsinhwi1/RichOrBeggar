// DESIGN 4.2 / 4.4.4: content script — 쿠팡 주문목록에 수집 버튼 삽입 +
// 페이지네이션 자동 순회(페이지 이동마다 재로드되므로 세션으로 이어감).

import { collectCurrentPage, isOrderListPage, nextPageUrl, politeWait, MAX_PAGES } from './collect';
import { getSession, setSession, clearSession, type CollectSession } from './session';
import { injectButton, setButtonEnabled, showToast } from './ui';
import type { SaveOrdersMsg, SaveOrdersResult } from '../lib/messaging/types';

const LABEL = '쿠팡 가계부: 내역 가져오기';

async function saveItems(items: SaveOrdersMsg['items']): Promise<SaveOrdersResult> {
  return (await chrome.runtime.sendMessage({ type: 'SAVE_ORDERS', items })) as SaveOrdersResult;
}

/** 현재 페이지 수집 → 저장 → 다음 페이지가 있으면 이동, 없으면 종료. */
async function runStep(session: CollectSession): Promise<void> {
  setButtonEnabled(false, '수집 중…');
  const result = await collectCurrentPage();

  // 시나리오 C: 파싱 실패 시 조용히 죽지 않고 명확히 알림.
  if (result.aborted) {
    await clearSession();
    showToast('내역을 읽지 못했습니다. 쿠팡 화면이 변경됐을 수 있어요 (보통 48시간 내 수정).', 'error');
    setButtonEnabled(true, LABEL);
    return;
  }

  const res = await saveItems(result.items);
  session.pagesDone += 1;
  session.itemsSaved += result.items.length;

  const idx = result.pageInfo.nextPageIndex;
  const canNext = result.pageInfo.hasNext && idx != null && session.pagesDone < MAX_PAGES;

  if (canNext) {
    await setSession(session);
    showToast(`수집 중… ${session.pagesDone}페이지 · 누적 ${res.total}건`, 'ok');
    await politeWait();
    location.href = nextPageUrl(idx); // 재로드 → 다음 로드에서 resumeIfActive가 이어감
    return;
  }

  await clearSession();
  const capped = session.pagesDone >= MAX_PAGES ? ` (최대 ${MAX_PAGES}페이지)` : '';
  showToast(`수집 완료 · ${session.pagesDone}페이지 ${session.itemsSaved}건 · 누적 ${res.total}건${capped}`, 'ok');
  setButtonEnabled(true, LABEL);
}

async function guard(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error('[쿠팡 가계부] 수집 실패:', err); // 에러 미삼킴(DESIGN 4.6)
    await clearSession();
    showToast('수집 중 오류가 발생했습니다. 콘솔을 확인해주세요.', 'error');
    setButtonEnabled(true, LABEL);
  }
}

async function startCollection(): Promise<void> {
  const existing = await getSession();
  if (existing?.active) return; // 이미 진행 중
  await runStep({ active: true, pagesDone: 0, itemsSaved: 0, startedAt: new Date().toISOString() });
}

async function resumeIfActive(): Promise<void> {
  const session = await getSession();
  if (session?.active) await runStep(session);
}

if (isOrderListPage()) {
  injectButton(() => void guard(startCollection));
  void guard(resumeIfActive);
} else {
  console.info('[쿠팡 가계부] 주문목록 페이지가 아니어서 버튼을 표시하지 않습니다:', location.href);
}
