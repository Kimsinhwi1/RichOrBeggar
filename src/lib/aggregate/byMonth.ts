import type { OrderItem } from '../types';
import { spentItems } from './byOrder';

// DESIGN 3.1: 기본 대시보드 — 월별 지출 막대그래프. 순수 함수(집계 로직은 테스트 필수).

export interface MonthSummary {
  /** YYYY-MM */
  month: string;
  /** 차트 축 표기용 (예: 26.06) */
  label: string;
  /** 지출 합계 (상품 + 배송비, 취소 제외) */
  total: number;
  itemCount: number;
}

function toLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${y.slice(2)}.${m}`;
}

/**
 * 월별 지출 집계. 취소 건은 지출이 아니므로 제외한다.
 * 결과는 월 오름차순(과거 → 최근)이라 차트에 그대로 넣을 수 있다.
 */
export function summarizeByMonth(items: OrderItem[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();

  for (const item of spentItems(items)) {
    const month = item.orderedAt.slice(0, 7); // YYYY-MM
    if (!month) continue;
    const cur = map.get(month);
    const amount = item.totalPrice + item.shippingFee;
    if (!cur) {
      map.set(month, { month, label: toLabel(month), total: amount, itemCount: 1 });
    } else {
      cur.total += amount;
      cur.itemCount += 1;
    }
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** 월평균 지출 (집계된 달 기준). 달이 없으면 0. */
export function monthlyAverage(summaries: MonthSummary[]): number {
  if (summaries.length === 0) return 0;
  return Math.round(summaries.reduce((s, m) => s + m.total, 0) / summaries.length);
}
