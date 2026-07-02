import type { OrderItem } from '../types';

// DESIGN 3.1: 주문번호 합산 뷰 — 같은 주문을 묶어 총액 표시(카드명세서 대조용).
// 순수 함수. 카드 명세서는 주문 단위로 청구되므로 orderId로 묶어 합산한다.

export interface OrderSummary {
  orderId: string;
  orderedAt: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  /** 주문 내 상태가 하나면 그 값, 여러 개면 '혼합' */
  status: string;
}

/** orderId로 묶어 합산. 입력의 첫 등장 순서를 보존한다. */
export function summarizeByOrder(items: OrderItem[]): OrderSummary[] {
  const map = new Map<string, OrderSummary>();
  const statuses = new Map<string, Set<string>>();

  for (const item of items) {
    const cur = map.get(item.orderId);
    if (!cur) {
      map.set(item.orderId, {
        orderId: item.orderId,
        orderedAt: item.orderedAt,
        itemCount: 1,
        totalQuantity: item.quantity,
        totalAmount: item.totalPrice,
        status: item.status,
      });
      statuses.set(item.orderId, new Set([item.status]));
    } else {
      cur.itemCount += 1;
      cur.totalQuantity += item.quantity;
      cur.totalAmount += item.totalPrice;
      statuses.get(item.orderId)!.add(item.status);
    }
  }

  for (const summary of map.values()) {
    const set = statuses.get(summary.orderId)!;
    summary.status = set.size === 1 ? [...set][0] : '혼합';
  }
  return [...map.values()];
}

/** 전체 합계 (대시보드 상단 요약용). */
export function totalAmount(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.totalPrice, 0);
}
