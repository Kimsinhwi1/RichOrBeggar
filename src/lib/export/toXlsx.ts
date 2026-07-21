import * as XLSX from 'xlsx';
import type { OrderItem } from '../types';
import { detailRows, monthRows, categoryRows, type Cell } from './xlsxRows';

// DESIGN 3.1: XLSX 다운로드 (SheetJS). 이 모듈은 대시보드에서 동적 import 되어
// 별도 청크로 분리된다 — XLSX를 실제로 내려받을 때만 로드된다.
//
// 참고: 커뮤니티 배포판은 셀 스타일(굵게/배경)을 지원하지 않는다.
// 대신 열 너비·숫자 서식·자동필터·시트 분리로 실사용 가독성을 확보한다.

const MONEY_FORMAT = '#,##0';

function sheetFrom(rows: Cell[][], widths: number[], moneyCols: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = widths.map((wch) => ({ wch }));
  if (rows.length > 1) {
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: rows[0].length - 1 } }) };
  }
  for (const c of moneyCols) {
    for (let r = 1; r < rows.length; r += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
      if (cell && typeof cell.v === 'number') cell.z = MONEY_FORMAT;
    }
  }
  return ws;
}

/** 주문내역·월별·카테고리별 3개 시트를 담은 워크북을 만든다. */
export function buildWorkbook(items: OrderItem[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFrom(detailRows(items), [12, 16, 52, 6, 12, 10, 12, 12], [4, 5]), '주문내역');
  XLSX.utils.book_append_sheet(wb, sheetFrom(monthRows(items), [12, 14, 10], [1]), '월별 지출');
  XLSX.utils.book_append_sheet(wb, sheetFrom(categoryRows(items), [14, 14, 10], [1]), '카테고리별');
  return wb;
}

/** 브라우저에서 XLSX 파일로 저장. */
export function downloadXlsx(filename: string, items: OrderItem[]): void {
  XLSX.writeFile(buildWorkbook(items), filename, { compression: true });
}
