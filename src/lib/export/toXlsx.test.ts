import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildWorkbook } from './toXlsx';
import type { OrderItem } from '../types';

function item(over: Partial<OrderItem>): OrderItem {
  return {
    id: 'x', profile: '기본', orderId: '111', orderedAt: '2026-06-30', productName: '상품',
    quantity: 1, unitPrice: 1000, totalPrice: 1000, shippingFee: 0, status: '배송완료',
    canceled: false, category: '생활용품', categorySource: 'rule', collectedAt: '2026-07-03T00:00:00.000Z',
    ...over,
  };
}

const ITEMS = [
  item({ orderedAt: '2026-05-22', productName: '에어컨', totalPrice: 592000, category: '가전·디지털' }),
  item({ orderedAt: '2026-05-22', productName: '취소된 에어컨', totalPrice: 792000, canceled: true, status: '주문취소', category: '가전·디지털' }),
  item({ orderedAt: '2026-06-30', productName: '행주', totalPrice: 10320, shippingFee: 3000 }),
];

/** 실제 xlsx 바이너리로 쓴 뒤 다시 읽어 검증 (파일이 유효한지까지 확인). */
function roundTrip(items: OrderItem[]): XLSX.WorkBook {
  const buf = XLSX.write(buildWorkbook(items), { type: 'buffer', bookType: 'xlsx' });
  return XLSX.read(buf, { type: 'buffer' });
}

describe('buildWorkbook', () => {
  it('시트 3개(주문내역/월별 지출/카테고리별)를 만든다', () => {
    expect(roundTrip(ITEMS).SheetNames).toEqual(['주문내역', '월별 지출', '카테고리별']);
  });

  it('주문내역 시트에 취소 건까지 모두 기록', () => {
    const wb = roundTrip(ITEMS);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['주문내역']);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r['상품명'])).toContain('취소된 에어컨');
  });

  it('월별 시트는 취소를 제외한 지출로 집계', () => {
    const wb = roundTrip(ITEMS);
    const rows = XLSX.utils.sheet_to_json<Record<string, number | string>>(wb.Sheets['월별 지출']);
    const may = rows.find((r) => r['월'] === '2026-05')!;
    expect(may['지출']).toBe(592000); // 792,000 취소분 제외
    const jun = rows.find((r) => r['월'] === '2026-06')!;
    expect(jun['지출']).toBe(13320); // 10,320 + 배송비 3,000
  });

  it('금액 열에 천단위 숫자 서식이 적용된다', () => {
    const ws = buildWorkbook(ITEMS).Sheets['주문내역'];
    const cell = ws[XLSX.utils.encode_cell({ r: 1, c: 4 })] as XLSX.CellObject;
    expect(cell.z).toBe('#,##0');
  });

  it('빈 목록도 유효한 파일을 만든다', () => {
    expect(roundTrip([]).SheetNames).toHaveLength(3);
  });
});
