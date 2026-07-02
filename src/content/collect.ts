import { getExtractConfig } from '../lib/selectors/loadSelectors';
import { parseOrders, type ParseResult } from '../lib/parser/parseOrders';

// DESIGN 4.4.4: 최대 100페이지, 병렬 금지, 페이지 이동 간 1.5~2.5초 랜덤 대기(서버 부담 최소화).
export const MAX_PAGES = 100;

/** 현재 쿠팡 페이지의 __NEXT_DATA__를 파싱한다. (설정은 원격/번들에서 로드) */
export async function collectCurrentPage(): Promise<ParseResult> {
  const config = await getExtractConfig();
  const html = document.documentElement.outerHTML;
  return parseOrders(html, config);
}

/** 주문 페이지 여부 (버튼 주입/이어받기 조건). */
export function isOrderListPage(): boolean {
  return location.hostname === 'mc.coupang.com' && /order/i.test(location.pathname);
}

/** 다음 페이지 URL (현재 URL의 pageIndex만 교체, 나머지 파라미터 보존). */
export function nextPageUrl(nextPageIndex: number): string {
  const url = new URL(location.href);
  url.searchParams.set('pageIndex', String(nextPageIndex));
  return url.toString();
}

/** 예의 있는 순회를 위한 랜덤 대기(1.5~2.5초). */
export function politeWait(): Promise<void> {
  const ms = 1500 + Math.floor(Math.random() * 1000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
