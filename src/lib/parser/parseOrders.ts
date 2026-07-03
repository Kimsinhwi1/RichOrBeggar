import type { OrderItem } from '../types';
import type { ExtractConfig } from '../selectors/schema';
import { getByPath, toNumber, toText, epochToISODate } from './fields';

// DESIGN 4.4: HTML 문자열 in → OrderItem[] out. 경로는 config에서만 온다(하드코딩 금지).
// 쿠팡 __NEXT_DATA__ JSON을 파싱한다(Phase 0 정찰 결과).

export interface ParseError {
  orderIndex: number;
  itemIndex?: number;
  message: string;
}

export interface PageInfo {
  hasNext: boolean;
  /** 다음 페이지 인덱스 (없으면 null) */
  nextPageIndex: number | null;
}

export interface ParseResult {
  items: OrderItem[];
  /** 시도한 상품 수 */
  totalAttempted: number;
  /** 필수 필드 실패로 버려진 수 */
  failedCount: number;
  failureRate: number;
  /** 분리배송으로 복제된 항목을 걸러낸 수 */
  duplicatesSkipped: number;
  /** DESIGN 4.4.3: 실패율 임계 초과 또는 데이터 부재 → 중단(시나리오 C) */
  aborted: boolean;
  /** 페이지네이션 순회용 (DESIGN 3.1) */
  pageInfo: PageInfo;
  errors: ParseError[];
}

export interface ParseOptions {
  /** 결정론적 테스트용 주입 */
  collectedAt?: string;
  /** 기본 0.3 (DESIGN 4.4.3) */
  abortThreshold?: number;
}

const NO_PAGE: PageInfo = { hasNext: false, nextPageIndex: null };

function aborted(message: string): ParseResult {
  return { items: [], totalAttempted: 0, failedCount: 0, failureRate: 1, duplicatesSkipped: 0, aborted: true, pageInfo: NO_PAGE, errors: [{ orderIndex: -1, message }] };
}

function readPageInfo(json: unknown, cfg: ExtractConfig): PageInfo {
  return {
    hasNext: getByPath(json, cfg.pagination.hasNext) === true,
    nextPageIndex: toNumber(getByPath(json, cfg.pagination.nextPageIndex)),
  };
}

/** HTML에서 config.scriptId script의 JSON을 추출·파싱. 실패 시 null. */
function extractJson(html: string, scriptId: string): unknown | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const raw = doc.getElementById(scriptId)?.textContent;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface OrderCtx {
  orderId: string;
  orderedAt: string;
  orderCanceled: boolean;
}

/** 한 상품(product) → OrderItem. 필수 필드(상품명·단가) 실패 시 null. */
function buildItem(
  product: unknown,
  ctx: OrderCtx,
  statusCode: string,
  cfg: ExtractConfig,
  collectedAt: string,
): OrderItem | null {
  const p = cfg.product;
  const productName = toText(getByPath(product, p.productName));
  const unitPriceRaw = toNumber(getByPath(product, p.discountedUnitPrice)) ?? toNumber(getByPath(product, p.unitPrice));
  if (!productName || unitPriceRaw == null) return null;

  const quantity = toNumber(getByPath(product, p.quantity)) ?? 1;
  const productId = toText(getByPath(product, p.productId));
  const canceled = ctx.orderCanceled || getByPath(product, p.allCanceled) === true;
  const status = canceled ? cfg.canceledLabel : (cfg.statusLabels[statusCode] ?? statusCode);

  return {
    // 분리배송 시 쿠팡은 동일 항목을 그룹마다 복제한다. (productId+단가+수량)이 같으면
    // 같은 주문 라인이므로 id가 같아지고, 아래에서 중복으로 걸러진다.
    id: `${ctx.orderId}-${productId}-${unitPriceRaw}-${quantity}`,
    orderId: ctx.orderId,
    orderedAt: ctx.orderedAt,
    productName,
    quantity,
    unitPrice: unitPriceRaw,
    totalPrice: unitPriceRaw * quantity,
    shippingFee: 0, // 주문 첫 상품에만 아래에서 실림
    status,
    category: null,
    categorySource: null,
    collectedAt,
  };
}

export function parseOrders(html: string, cfg: ExtractConfig, options: ParseOptions = {}): ParseResult {
  if (!cfg.verified) {
    return aborted('selectors.json이 실제 쿠팡 HTML로 검증되지 않았습니다 (verified:false).');
  }
  const json = extractJson(html, cfg.scriptId);
  if (json == null) {
    return aborted(`#${cfg.scriptId} 데이터를 찾거나 파싱하지 못했습니다. 쿠팡 페이지 구조가 변경됐을 수 있습니다.`);
  }
  const orders = getByPath(json, cfg.orderListPath);
  if (!Array.isArray(orders)) {
    return aborted(`주문 목록 경로(${cfg.orderListPath})를 찾지 못했습니다.`);
  }

  const collectedAt = options.collectedAt ?? new Date().toISOString();
  const threshold = options.abortThreshold ?? 0.3;
  const items: OrderItem[] = [];
  const errors: ParseError[] = [];
  // 분리배송으로 복제된 동일 라인을 한 번만 집계 (DESIGN 4.4.3: 정확성).
  const seenIds = new Set<string>();
  let totalAttempted = 0;
  let failedCount = 0;
  let duplicatesSkipped = 0;

  orders.forEach((order, orderIndex) => {
    const ctx: OrderCtx = {
      orderId: toText(getByPath(order, cfg.order.orderId)),
      orderedAt: epochToISODate(getByPath(order, cfg.order.orderedAt)) ?? '',
      orderCanceled: getByPath(order, cfg.order.allCanceled) === true,
    };
    const groups = getByPath(order, cfg.order.deliveryGroupList);
    if (!Array.isArray(groups)) return;

    // 배송비는 주문당 1회. 첫 상품에만 실어 합산 시 중복되지 않게 한다.
    const orderShipping = toNumber(getByPath(order, cfg.order.baseDeliveryPrice)) ?? 0;
    let shippingApplied = false;

    for (const group of groups) {
      const statusCode = toText(getByPath(group, cfg.deliveryGroup.status));
      const products = getByPath(group, cfg.deliveryGroup.productList);
      if (!Array.isArray(products)) continue;

      products.forEach((product, itemIndex) => {
        const item = buildItem(product, ctx, statusCode, cfg, collectedAt);
        if (!item) {
          totalAttempted += 1;
          failedCount += 1;
          errors.push({ orderIndex, itemIndex, message: '필수 필드(상품명/단가) 추출 실패' });
          return;
        }
        // 분리배송 복제분은 조용히 건너뛴다 (실패 아님).
        if (seenIds.has(item.id)) {
          duplicatesSkipped += 1;
          return;
        }
        seenIds.add(item.id);
        totalAttempted += 1;
        if (!shippingApplied) {
          item.shippingFee = orderShipping;
          shippingApplied = true;
        }
        items.push(item);
      });
    }
  });

  const failureRate = totalAttempted === 0 ? 1 : failedCount / totalAttempted;
  return {
    items,
    totalAttempted,
    failedCount,
    failureRate,
    duplicatesSkipped,
    aborted: totalAttempted === 0 || failureRate > threshold,
    pageInfo: readPageInfo(json, cfg),
    errors,
  };
}
