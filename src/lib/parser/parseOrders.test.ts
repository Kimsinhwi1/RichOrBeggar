import { describe, it, expect } from 'vitest';
import { parseOrders } from './parseOrders';
import { getByPath, toNumber, epochToISODate } from './fields';
import type { ExtractConfig } from '../selectors/schema';
import rawConfig from '../../../public/selectors.json';
import { SAMPLE_HTML, BROKEN_HTML, NO_DATA_HTML } from './fixtures/synthetic';

// 실제 배포되는 selectors.json을 그대로 로드 → config 자체도 함께 검증한다.
const CONFIG = rawConfig as ExtractConfig;
const OPTS = { collectedAt: '2026-07-02T00:00:00.000Z' };

describe('field helpers', () => {
  it('getByPath: dot-path 조회', () => {
    expect(getByPath({ a: { b: { c: 7 } } }, 'a.b.c')).toBe(7);
    expect(getByPath({ a: 1 }, 'a.x.y')).toBeUndefined();
  });
  it('toNumber: 숫자만 허용', () => {
    expect(toNumber(4500)).toBe(4500);
    expect(toNumber('4500')).toBe(4500);
    expect(toNumber(null)).toBeNull();
    expect(toNumber('없음')).toBeNull();
  });
  it('epochToISODate: epoch ms → ISO date', () => {
    expect(epochToISODate(Date.UTC(2026, 5, 30))).toBe('2026-06-30');
    expect(epochToISODate(null)).toBeNull();
  });
});

describe('selectors.json (배포 설정)', () => {
  it('검증 완료 상태여야 한다', () => {
    expect(CONFIG.verified).toBe(true);
    expect(CONFIG.orderListPath).toContain('orderList');
  });
});

describe('parseOrders — 정상 경로', () => {
  const result = parseOrders(SAMPLE_HTML, CONFIG, OPTS);

  it('3개 상품을 모두 파싱하고 중단하지 않는다', () => {
    expect(result.items).toHaveLength(3);
    expect(result.aborted).toBe(false);
    expect(result.failedCount).toBe(0);
  });

  it('할인 단가·총액·날짜·상태를 정확히 추출한다', () => {
    const banana = result.items.find((i) => i.productName === '유기농 바나나')!;
    expect(banana).toMatchObject({
      id: '111-10',
      orderId: '111',
      orderedAt: '2026-06-30',
      quantity: 2,
      unitPrice: 4500, // discountedUnitPrice 우선
      totalPrice: 9000, // 4500 * 2
      status: '배송중', // DELIVERING → 라벨
      category: null,
      collectedAt: OPTS.collectedAt,
    });
  });

  it('주문 전체 취소 시 상태를 취소 라벨로 표기', () => {
    const roll = result.items.find((i) => i.productName === '헤어롤')!;
    expect(roll.status).toBe('주문취소');
    expect(roll.orderedAt).toBe('2026-06-24');
  });

  it('페이지 정보(hasNext/nextPageIndex)를 추출', () => {
    expect(result.pageInfo).toEqual({ hasNext: true, nextPageIndex: 1 });
  });
});

describe('parseOrders — 실패율 임계 (DESIGN 4.4.3)', () => {
  it('실패율 30% 초과 시 aborted=true', () => {
    const result = parseOrders(BROKEN_HTML, CONFIG, OPTS);
    expect(result.totalAttempted).toBe(3);
    expect(result.failedCount).toBe(2);
    expect(result.failureRate).toBeCloseTo(2 / 3);
    expect(result.aborted).toBe(true);
    expect(result.items).toHaveLength(1);
  });
});

describe('parseOrders — 데이터 부재/미검증 가드 (시나리오 C)', () => {
  it('__NEXT_DATA__ 없으면 구조 변경으로 간주하고 중단', () => {
    const result = parseOrders(NO_DATA_HTML, CONFIG, OPTS);
    expect(result.aborted).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.errors[0].message).toContain('구조가 변경');
  });

  it('verified:false면 파싱하지 않고 중단', () => {
    const unverified = { ...CONFIG, verified: false };
    const result = parseOrders(SAMPLE_HTML, unverified, OPTS);
    expect(result.aborted).toBe(true);
    expect(result.errors[0].message).toContain('verified:false');
  });
});
