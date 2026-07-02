import type { OrderItem } from '../types';

// content script(쿠팡 페이지 origin)는 확장 IndexedDB에 접근할 수 없으므로,
// 파싱 결과를 service worker로 보내 저장한다. 팝업/대시보드는 확장 origin이라 직접 접근.

export interface SaveOrdersMsg {
  type: 'SAVE_ORDERS';
  items: OrderItem[];
}

export type RequestMsg = SaveOrdersMsg;

export interface SaveOrdersResult {
  saved: number;
  /** 저장 후 전체 주문상품 수 */
  total: number;
}
