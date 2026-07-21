import type { OrderItem } from '../types';
import { summarizeByMonth } from '../aggregate/byMonth';
import { spentItems } from '../aggregate/byOrder';

// XLSX 시트에 들어갈 2차원 배열을 만드는 순수 함수들 (테스트 대상).
// 실제 파일 생성(SheetJS)은 toXlsx.ts에서 담당한다.

export type Cell = string | number;

export const DETAIL_HEADERS = ['날짜', '주문번호', '상품명', '수량', '금액', '배송비', '상태', '분류'] as const;

/** 주문내역 시트 (취소 포함 — 기록은 그대로 남긴다). */
export function detailRows(items: OrderItem[]): Cell[][] {
  return [
    [...DETAIL_HEADERS],
    ...items.map((i) => [
      i.orderedAt,
      i.orderId,
      i.productName,
      i.quantity,
      i.totalPrice,
      i.shippingFee,
      i.status,
      i.category ?? '기타',
    ]),
  ];
}

/** 월별 지출 시트 (취소 제외). */
export function monthRows(items: OrderItem[]): Cell[][] {
  return [
    ['월', '지출', '상품 수'],
    ...summarizeByMonth(items).map((m) => [m.month, m.total, m.itemCount]),
  ];
}

/** 카테고리별 지출 시트 (취소 제외, 금액 내림차순). */
export function categoryRows(items: OrderItem[]): Cell[][] {
  const byCategory = new Map<string, { amount: number; count: number }>();
  for (const i of spentItems(items)) {
    const key = i.category ?? '기타';
    const cur = byCategory.get(key) ?? { amount: 0, count: 0 };
    cur.amount += i.totalPrice + i.shippingFee;
    cur.count += 1;
    byCategory.set(key, cur);
  }
  const rows = [...byCategory.entries()].sort((a, b) => b[1].amount - a[1].amount);
  return [['분류', '지출', '상품 수'], ...rows.map(([name, v]) => [name, v.amount, v.count])];
}
