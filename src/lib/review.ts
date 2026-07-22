// DESIGN 6.1: 평점 요청 — 3회째 수집 성공 시 1회만. "다시 보지 않기" 제공, 반복 노출 금지.
// 사용자를 귀찮게 하면 오히려 역효과라, 조건을 엄격하게 건다.

const COUNT_KEY = 'collectSuccessCount';
const DONE_KEY = 'reviewPromptDone';

/** 스토어 항목 ID (리뷰 페이지 링크용) */
export const STORE_ITEM_ID = 'abifielhojkgohomnhabbplnnjjfgmpf';
export const REVIEW_URL = `https://chromewebstore.google.com/detail/${STORE_ITEM_ID}/reviews`;

/** 몇 번째 성공부터 물어볼지 */
export const ASK_AFTER = 3;

/** 순수 판단 로직 (테스트 대상). */
export function shouldAskForReview(successCount: number, alreadyDone: boolean): boolean {
  if (alreadyDone) return false;
  return successCount >= ASK_AFTER;
}

/** 수집 성공을 1회 기록하고, 지금 리뷰를 요청할지 알려준다. */
export async function recordCollectionSuccess(): Promise<boolean> {
  const r = await chrome.storage.local.get([COUNT_KEY, DONE_KEY]);
  const done = r[DONE_KEY] === true;
  const count = (typeof r[COUNT_KEY] === 'number' ? r[COUNT_KEY] : 0) + 1;
  await chrome.storage.local.set({ [COUNT_KEY]: count });
  return shouldAskForReview(count, done);
}

/** 다시 묻지 않도록 표시 (노출 즉시 호출 — '1회만' 보장). */
export async function markReviewPromptDone(): Promise<void> {
  await chrome.storage.local.set({ [DONE_KEY]: true });
}
