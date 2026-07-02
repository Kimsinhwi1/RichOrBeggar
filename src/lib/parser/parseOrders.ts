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

export interface ParseResult {
  items: OrderItem[];
  /** 시도한 상품 수 */
  totalAttempted: number;
  /** 필수 필드 실패로 버려진 수 */
  failedCount: number;
  failureRate: number;
  /** DESIGN 4.4.3: 실패율 임계 초과 또는 데이터 부재 → 중단(시나리오 C) */
  aborted: boolean;
  errors: ParseError[];
}

export interface ParseOptions {
  /** 결정론적 테스트용 주입 */
  collectedAt?: string;
  /** 기본 0.3 (DESIGN 4.4.3) */
  abortThreshold?: number;
}

function aborted(message: string): ParseResult {
  return { items: [], totalAttempted: 0, failedCount: 0, failureRate: 1, aborted: true, errors: [{ orderIndex: -1, message }] };
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
    id: `${ctx.orderId}-${productId}`,
    orderId: ctx.orderId,
    orderedAt: ctx.orderedAt,
    productName,
    quantity,
    unitPrice: unitPriceRaw,
    totalPrice: unitPriceRaw * quantity,
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
  let totalAttempted = 0;
  let failedCount = 0;

  orders.forEach((order, orderIndex) => {
    const ctx: OrderCtx = {
      orderId: toText(getByPath(order, cfg.order.orderId)),
      orderedAt: epochToISODate(getByPath(order, cfg.order.orderedAt)) ?? '',
      orderCanceled: getByPath(order, cfg.order.allCanceled) === true,
    };
    const groups = getByPath(order, cfg.order.deliveryGroupList);
    if (!Array.isArray(groups)) return;

    for (const group of groups) {
      const statusCode = toText(getByPath(group, cfg.deliveryGroup.status));
      const products = getByPath(group, cfg.deliveryGroup.productList);
      if (!Array.isArray(products)) continue;

      products.forEach((product, itemIndex) => {
        totalAttempted += 1;
        const item = buildItem(product, ctx, statusCode, cfg, collectedAt);
        if (item) {
          items.push(item);
        } else {
          failedCount += 1;
          errors.push({ orderIndex, itemIndex, message: '필수 필드(상품명/단가) 추출 실패' });
        }
      });
    }
  });

  const failureRate = totalAttempted === 0 ? 1 : failedCount / totalAttempted;
  return { items, totalAttempted, failedCount, failureRate, aborted: totalAttempted === 0 || failureRate > threshold, errors };
}
