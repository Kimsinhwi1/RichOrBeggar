import { describe, it, expect } from 'vitest';
import { summarizeByMonth, monthlyAverage } from './byMonth';
import { totalSpent, totalAmount, isCanceled } from './byOrder';
import type { OrderItem } from '../types';

function item(over: Partial<OrderItem>): OrderItem {
  return {
    id: 'x',
    profile: '기본',
    orderId: '1',
    orderedAt: '2026-06-30',
    productName: '상품',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    shippingFee: 0,
    status: '배송완료',
    canceled: false,
    category: null,
    categorySource: null,
    collectedAt: '2026-07-03T00:00:00.000Z',
    ...over,
  };
}

describe('summarizeByMonth', () => {
  const items = [
    item({ orderedAt: '2026-05-22', totalPrice: 592000 }),
    item({ orderedAt: '2026-06-03', totalPrice: 39800, shippingFee: 3000 }),
    item({ orderedAt: '2026-06-30', totalPrice: 13500 }),
    item({ orderedAt: '2026-07-02', totalPrice: 10320 }),
  ];

  it('월별로 묶어 지출(상품+배송비)을 합산', () => {
    const r = summarizeByMonth(items);
    expect(r.map((m) => m.month)).toEqual(['2026-05', '2026-06', '2026-07']);
    expect(r[1].total).toBe(56300); // 39800 + 3000 + 13500
    expect(r[1].itemCount).toBe(2);
  });

  it('과거 → 최근 순으로 정렬(차트용)', () => {
    expect(summarizeByMonth(items).map((m) => m.label)).toEqual(['26.05', '26.06', '26.07']);
  });

  it('취소 건은 지출에서 제외', () => {
    const withCanceled = [
      ...items,
      item({ orderedAt: '2026-05-22', totalPrice: 792000, canceled: true, status: '주문취소' }),
    ];
    const r = summarizeByMonth(withCanceled);
    expect(r[0].total).toBe(592000); // 792,000 취소분 미포함
  });

  it('옛 데이터(canceled 필드 없음)도 상태로 취소 판별', () => {
    const legacy = { ...item({ totalPrice: 5000, status: '주문취소' }) } as OrderItem;
    delete (legacy as Partial<OrderItem>).canceled;
    expect(isCanceled(legacy)).toBe(true);
    expect(summarizeByMonth([legacy])).toHaveLength(0);
  });
});

describe('지출 합계 (취소 제외)', () => {
  const items = [
    item({ totalPrice: 10000 }),
    item({ totalPrice: 792000, canceled: true, status: '주문취소' }),
  ];

  it('totalSpent는 취소를 빼고, totalAmount는 원자료 전체', () => {
    expect(totalSpent(items)).toBe(10000);
    expect(totalAmount(items)).toBe(802000);
  });
});

describe('monthlyAverage', () => {
  it('집계된 달 기준 평균', () => {
    const r = summarizeByMonth([
      item({ orderedAt: '2026-05-01', totalPrice: 10000 }),
      item({ orderedAt: '2026-06-01', totalPrice: 20000 }),
    ]);
    expect(monthlyAverage(r)).toBe(15000);
  });

  it('데이터 없으면 0', () => {
    expect(monthlyAverage([])).toBe(0);
  });
});
