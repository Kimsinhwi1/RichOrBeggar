import { describe, it, expect } from 'vitest';
import { shouldAskForReview, ASK_AFTER, REVIEW_URL, STORE_ITEM_ID } from './review';

describe('shouldAskForReview (DESIGN 6.1)', () => {
  it(`${ASK_AFTER}회 미만이면 묻지 않는다`, () => {
    expect(shouldAskForReview(1, false)).toBe(false);
    expect(shouldAskForReview(2, false)).toBe(false);
  });

  it(`${ASK_AFTER}회째에 묻는다`, () => {
    expect(shouldAskForReview(3, false)).toBe(true);
  });

  it('이미 보여줬거나 "다시 보지 않기"면 절대 묻지 않는다', () => {
    expect(shouldAskForReview(3, true)).toBe(false);
    expect(shouldAskForReview(50, true)).toBe(false);
  });

  it('리뷰 URL이 스토어 항목을 가리킨다', () => {
    expect(REVIEW_URL).toContain(STORE_ITEM_ID);
    expect(REVIEW_URL).toMatch(/^https:\/\/chromewebstore\.google\.com\//);
  });
});
