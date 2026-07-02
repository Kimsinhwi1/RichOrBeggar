// 커밋용 픽스처: 실제 쿠팡 __NEXT_DATA__ 구조를 그대로 따르되 값은 모두 가짜(개인정보 없음).
// 실제 페이지 HTML은 .gitignore로 제외되며, 로컬 DoD 검증에만 쓴다.

/** __NEXT_DATA__ JSON을 감싼 최소 HTML 페이지를 만든다. */
export function wrapNextData(data: unknown): string {
  return `<!doctype html><html><head></head><body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
  </body></html>`;
}

const ORDER0_MS = Date.UTC(2026, 5, 30); // 2026-06-30
const ORDER1_MS = Date.UTC(2026, 5, 24); // 2026-06-24

function product(over: Record<string, unknown>) {
  return {
    productId: 1,
    productName: '샘플 상품',
    quantity: 1,
    unitPrice: 10000,
    discountedUnitPrice: 10000,
    allCanceled: false,
    ...over,
  };
}

function nextData(orderList: unknown[], pagination?: { hasNext: boolean; nextPageIndex: number }) {
  const orderPagination = pagination ?? { hasNext: false, nextPageIndex: 0 };
  return { props: { pageProps: { domains: { desktopOrder: { orderList, orderPagination } } } } };
}

/** 정상 2주문/3상품: 할인가·취소주문·상태 라벨 검증용. */
export const SAMPLE_HTML = wrapNextData(
  nextData([
    {
      orderId: 111,
      orderedAt: ORDER0_MS,
      allCanceled: false,
      deliveryGroupList: [
        {
          groupStatus: { status: 'DELIVERING' },
          productList: [
            product({ productId: 10, productName: '유기농 바나나', quantity: 2, unitPrice: 5000, discountedUnitPrice: 4500 }),
            product({ productId: 11, productName: '종이컵 500개입', quantity: 1, unitPrice: 7900, discountedUnitPrice: 7900 }),
          ],
        },
      ],
    },
    {
      orderId: 222,
      orderedAt: ORDER1_MS,
      allCanceled: true,
      deliveryGroupList: [
        {
          groupStatus: { status: 'CANCELED' },
          productList: [product({ productId: 20, productName: '헤어롤', quantity: 1, unitPrice: 5800, discountedUnitPrice: 5800 })],
        },
      ],
    },
  ], { hasNext: true, nextPageIndex: 1 }),
);

/** 3상품 중 2개가 필수 필드 누락 → 실패율 66% (임계 30% 초과 → 중단). */
export const BROKEN_HTML = wrapNextData(
  nextData([
    {
      orderId: 333,
      orderedAt: ORDER0_MS,
      allCanceled: false,
      deliveryGroupList: [
        {
          groupStatus: { status: 'DELIVERING' },
          productList: [
            product({ productId: 30, productName: '정상 상품', unitPrice: 1000, discountedUnitPrice: 1000 }),
            product({ productId: 31, productName: '', unitPrice: 2000 }),
            product({ productId: 32, productName: '가격없음', unitPrice: null, discountedUnitPrice: null }),
          ],
        },
      ],
    },
  ]),
);

/** __NEXT_DATA__ 자체가 없는 페이지 (구조 변경 시나리오). */
export const NO_DATA_HTML = '<!doctype html><html><body><div>주문 없음</div></body></html>';
