import { getExtractConfig } from '../lib/selectors/loadSelectors';
import { parseOrders, type ParseResult } from '../lib/parser/parseOrders';

// 현재 쿠팡 페이지의 __NEXT_DATA__를 파싱한다. (DESIGN 4.4: 설정은 원격/번들에서 로드)
export async function collectCurrentPage(): Promise<ParseResult> {
  const config = await getExtractConfig();
  const html = document.documentElement.outerHTML;
  return parseOrders(html, config);
}

/** 주문 페이지 여부 (버튼 주입 조건). */
export function isOrderListPage(): boolean {
  return location.hostname === 'mc.coupang.com' && /order/i.test(location.pathname);
}
