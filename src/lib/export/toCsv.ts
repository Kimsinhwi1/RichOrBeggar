import type { OrderItem } from '../types';

// DESIGN 3.1: CSV 다운로드 — 날짜, 주문번호, 상품명, 수량, 금액, 상태.
// 순수 함수(OrderItem[] → CSV 문자열). 엑셀 한글 깨짐 방지를 위해 UTF-8 BOM + CRLF.

const HEADERS = ['날짜', '주문번호', '상품명', '수량', '금액', '상태'] as const;

/** 엑셀이 UTF-8로 인식하도록 붙이는 Byte Order Mark. */
const BOM = '﻿';

/** CSV 셀 이스케이프: 쉼표·따옴표·개행 포함 시 큰따옴표로 감싸고 내부 따옴표는 중복. */
function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toRow(item: OrderItem): string {
  return [
    item.orderedAt,
    item.orderId,
    item.productName,
    String(item.quantity),
    String(item.totalPrice),
    item.status,
  ]
    .map(escapeCell)
    .join(',');
}

export function toCsv(items: OrderItem[]): string {
  const lines = [HEADERS.join(','), ...items.map(toRow)];
  return BOM + lines.join('\r\n');
}
