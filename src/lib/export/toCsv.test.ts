import { describe, it, expect } from 'vitest';
import { toCsv } from './toCsv';
import type { OrderItem } from '../types';

function item(over: Partial<OrderItem>): OrderItem {
  return {
    id: 'o-1',
    orderId: '111',
    orderedAt: '2026-06-30',
    productName: '바나나',
    quantity: 2,
    unitPrice: 4500,
    totalPrice: 9000,
    shippingFee: 0,
    status: '배송완료',
    category: null,
    categorySource: null,
    collectedAt: '2026-07-02T00:00:00.000Z',
    ...over,
  };
}

describe('toCsv', () => {
  it('BOM + 헤더 + CRLF 행 구성 (배송비 컬럼 포함)', () => {
    const csv = toCsv([item({ shippingFee: 3000 })]);
    expect(csv.startsWith('﻿')).toBe(true);
    const [header, row] = csv.slice(1).split('\r\n');
    expect(header).toBe('날짜,주문번호,상품명,수량,금액,배송비,상태');
    expect(row).toBe('2026-06-30,111,바나나,2,9000,3000,배송완료');
  });

  it('쉼표·따옴표·개행 포함 상품명 이스케이프', () => {
    const csv = toCsv([item({ productName: '사과, "특가"\n한정' })]);
    const row = csv.slice(1).split('\r\n')[1];
    expect(row).toContain('"사과, ""특가""\n한정"');
  });

  it('빈 목록도 헤더만 반환', () => {
    const csv = toCsv([]);
    expect(csv).toBe('﻿날짜,주문번호,상품명,수량,금액,배송비,상태');
  });
});
