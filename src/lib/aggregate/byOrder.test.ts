import { describe, it, expect } from 'vitest';
import { summarizeByOrder, totalAmount } from './byOrder';
import type { OrderItem } from '../types';

function item(over: Partial<OrderItem>): OrderItem {
  return {
    id: 'x',
    orderId: '111',
    orderedAt: '2026-06-30',
    productName: '상품',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    shippingFee: 0,
    status: '배송완료',
    category: null,
    categorySource: null,
    collectedAt: '2026-07-02T00:00:00.000Z',
    ...over,
  };
}

describe('summarizeByOrder', () => {
  const items = [
    item({ id: 'a', orderId: '111', quantity: 2, totalPrice: 9000, status: '배송중' }),
    item({ id: 'b', orderId: '111', quantity: 1, totalPrice: 7900, status: '상품준비중' }),
    item({ id: 'c', orderId: '222', quantity: 1, totalPrice: 5800, status: '주문취소' }),
  ];

  it('orderId로 묶어 건수·수량·총액 합산', () => {
    const [o1, o2] = summarizeByOrder(items);
    expect(o1).toMatchObject({ orderId: '111', itemCount: 2, totalQuantity: 3, totalAmount: 16900 });
    expect(o2).toMatchObject({ orderId: '222', itemCount: 1, totalAmount: 5800 });
  });

  it('상태가 여러 개면 "혼합", 하나면 그 값', () => {
    const [o1, o2] = summarizeByOrder(items);
    expect(o1.status).toBe('혼합');
    expect(o2.status).toBe('주문취소');
  });

  it('첫 등장 순서를 보존', () => {
    expect(summarizeByOrder(items).map((s) => s.orderId)).toEqual(['111', '222']);
  });
});

describe('배송비 반영', () => {
  const withShipping = [
    item({ id: 'a', orderId: '500', totalPrice: 13500, shippingFee: 3000 }),
    item({ id: 'b', orderId: '500', totalPrice: 12900, shippingFee: 0 }),
  ];

  it('주문 합산에 배송비 포함, 상품/배송비 분리 노출', () => {
    const [o] = summarizeByOrder(withShipping);
    expect(o.productAmount).toBe(26400);
    expect(o.shippingFee).toBe(3000);
    expect(o.totalAmount).toBe(29400);
  });

  it('전체 총액 = 상품 + 배송비', () => {
    expect(totalAmount(withShipping)).toBe(29400);
    expect(totalAmount([item({ totalPrice: 100, shippingFee: 50 })])).toBe(150);
  });
});
