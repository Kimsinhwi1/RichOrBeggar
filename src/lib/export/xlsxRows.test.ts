import { describe, it, expect } from 'vitest';
import { detailRows, monthRows, categoryRows, DETAIL_HEADERS } from './xlsxRows';
import type { OrderItem } from '../types';

function item(over: Partial<OrderItem>): OrderItem {
  return {
    id: 'x',
    profile: '기본',
    orderId: '111',
    orderedAt: '2026-06-30',
    productName: '상품',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    shippingFee: 0,
    status: '배송완료',
    canceled: false,
    category: '생활용품',
    categorySource: 'rule',
    collectedAt: '2026-07-03T00:00:00.000Z',
    ...over,
  };
}

describe('detailRows (주문내역 시트)', () => {
  it('헤더 + 항목 행, 분류 컬럼 포함', () => {
    const rows = detailRows([item({ productName: '행주', totalPrice: 10320, shippingFee: 3000 })]);
    expect(rows[0]).toEqual([...DETAIL_HEADERS]);
    expect(rows[1]).toEqual(['2026-06-30', '111', '행주', 1, 10320, 3000, '배송완료', '생활용품']);
  });

  it('취소 건도 기록으로 남긴다', () => {
    const rows = detailRows([item({ canceled: true, status: '주문취소' })]);
    expect(rows).toHaveLength(2);
    expect(rows[1][6]).toBe('주문취소');
  });

  it('분류가 없으면 기타', () => {
    expect(detailRows([item({ category: null })])[1][7]).toBe('기타');
  });
});

describe('monthRows (월별 지출 시트)', () => {
  it('월별 합계 — 취소 제외', () => {
    const rows = monthRows([
      item({ orderedAt: '2026-05-22', totalPrice: 592000 }),
      item({ orderedAt: '2026-05-22', totalPrice: 792000, canceled: true, status: '주문취소' }),
      item({ orderedAt: '2026-06-03', totalPrice: 39800, shippingFee: 3000 }),
    ]);
    expect(rows[0]).toEqual(['월', '지출', '상품 수']);
    expect(rows[1]).toEqual(['2026-05', 592000, 1]);
    expect(rows[2]).toEqual(['2026-06', 42800, 1]);
  });
});

describe('categoryRows (카테고리별 시트)', () => {
  it('금액 내림차순, 취소 제외', () => {
    const rows = categoryRows([
      item({ category: '식품', totalPrice: 5000 }),
      item({ category: '패션', totalPrice: 50000 }),
      item({ category: '패션', totalPrice: 10000, canceled: true, status: '주문취소' }),
    ]);
    expect(rows[0]).toEqual(['분류', '지출', '상품 수']);
    expect(rows[1]).toEqual(['패션', 50000, 1]); // 취소 10,000 미포함
    expect(rows[2]).toEqual(['식품', 5000, 1]);
  });
});
