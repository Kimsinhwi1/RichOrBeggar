// DESIGN 4.2 / 4.4.4: content script — 수집 버튼 삽입 + 페이지네이션 자동 순회.
// 실사용 제보 반영: (1) 언제든 중지 가능 (2) 쿠팡 계정별 프로필 분리.

import { collectCurrentPage, isOrderListPage, nextPageUrl, politeWait, MAX_PAGES } from './collect';
import { getSession, setSession, clearSession, type CollectSession } from './session';
import { injectButton, setButtonState, showToast } from './ui';
import { getActiveProfile } from '../lib/profile';
import type { OrderItem } from '../lib/types';
import type { SaveOrdersResult } from '../lib/messaging/types';

const LABEL = '쿠팡 가계부: 내역 가져오기';
const STOP_LABEL = '■ 수집 중지';

let collecting = false;

async function saveItems(items: OrderItem[]): Promise<SaveOrdersResult> {
  return (await chrome.runtime.sendMessage({ type: 'SAVE_ORDERS', items })) as SaveOrdersResult;
}

function finish(message: string, kind: 'ok' | 'error' = 'ok'): void {
  collecting = false;
  setButtonState(LABEL, 'idle');
  showToast(message, kind);
}

/** 현재 페이지 수집 → 저장 → 다음 페이지가 있으면 이동, 없으면 종료. */
async function runStep(session: CollectSession): Promise<void> {
  collecting = true;
  setButtonState(`${STOP_LABEL} (${session.pagesDone}페이지)`, 'stop');

  const result = await collectCurrentPage();
  if (result.aborted) {
    await clearSession();
    finish('내역을 읽지 못했습니다. 쿠팡 화면이 변경됐을 수 있어요 (보통 48시간 내 수정).', 'error');
    return;
  }

  // 수집 시점의 프로필로 태깅 → 계정별로 분리 보관.
  const profile = await getActiveProfile();
  const res = await saveItems(result.items.map((i) => ({ ...i, profile })));
  session.pagesDone += 1;
  session.itemsSaved += result.items.length;

  const idx = result.pageInfo.nextPageIndex;
  const canNext = result.pageInfo.hasNext && idx != null && session.pagesDone < MAX_PAGES;
  if (!canNext) {
    await clearSession();
    const capped = session.pagesDone >= MAX_PAGES ? ` (최대 ${MAX_PAGES}페이지)` : '';
    finish(`수집 완료 · ${session.pagesDone}페이지 ${session.itemsSaved}건 · [${profile}] 누적 ${res.total}건${capped}`);
    return;
  }

  await setSession(session);
  setButtonState(`${STOP_LABEL} (${session.pagesDone}페이지)`, 'stop');
  showToast(`수집 중… ${session.pagesDone}페이지 · [${profile}] 누적 ${res.total}건`, 'ok');
  await politeWait();

  // 대기 중에 사용자가 중지했을 수 있으므로 이동 직전에 재확인.
  const still = await getSession();
  if (!still?.active) {
    finish('수집을 중지했습니다. 지금까지 수집한 내역은 저장돼 있어요.');
    return;
  }
  location.href = nextPageUrl(idx); // 재로드 → 다음 로드에서 이어감
}

async function guard(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error('[쿠팡 가계부] 수집 실패:', err); // 에러 미삼킴(DESIGN 4.6)
    await clearSession();
    finish('수집 중 오류가 발생했습니다. 콘솔을 확인해주세요.', 'error');
  }
}

async function startCollection(): Promise<void> {
  const existing = await getSession();
  if (existing?.active) return;
  await runStep({ active: true, pagesDone: 0, itemsSaved: 0, startedAt: new Date().toISOString() });
}

/** 사용자가 중지 버튼을 누른 경우: 세션을 지워 다음 페이지로 넘어가지 않게 한다. */
async function stopCollection(): Promise<void> {
  await clearSession();
  finish('수집을 중지했습니다. 지금까지 수집한 내역은 저장돼 있어요.');
}

async function onClick(): Promise<void> {
  if (collecting) return stopCollection();
  return guard(startCollection);
}

async function resumeIfActive(): Promise<void> {
  const session = await getSession();
  if (session?.active) await runStep(session);
}

if (isOrderListPage()) {
  injectButton(() => void onClick());
  void guard(resumeIfActive);
} else {
  console.info('[쿠팡 가계부] 주문목록 페이지가 아니어서 버튼을 표시하지 않습니다:', location.href);
}
