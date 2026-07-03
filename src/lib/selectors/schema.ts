// DESIGN 4.4: 추출 설정 외부화. 코드에 경로/상태값 하드코딩 금지 — 전부 이 config에서 온다.
//
// Phase 0 정찰 결과: 쿠팡은 Next.js 앱이라 렌더된 DOM은 styled-components 해시 클래스
// (배포마다 랜덤 변경)라 취약하다. 대신 <script id="__NEXT_DATA__">의 구조화 JSON을 파싱한다.
// → CSS 셀렉터가 아니라 "JSON dot-path"를 외부화한다. 원격 갱신·순수 함수 원칙은 그대로.

export interface OrderPaths {
  orderId: string;
  /** epoch ms */
  orderedAt: string;
  allCanceled: string;
  deliveryGroupList: string;
  /** 주문 배송비 (원). 로켓배송은 보통 0, 3rd파티 배송에 부과 */
  baseDeliveryPrice: string;
}

export interface DeliveryGroupPaths {
  /** 배송 그룹 상태 코드까지의 dot-path (예: "groupStatus.status") */
  status: string;
  productList: string;
}

export interface ProductPaths {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  /** 실제 결제 단가 (없으면 unitPrice 사용) */
  discountedUnitPrice: string;
  allCanceled: string;
}

export interface PaginationPaths {
  /** 다음 페이지 존재 여부 (JSON 루트 기준 절대 dot-path) */
  hasNext: string;
  /** 다음 페이지 인덱스 (JSON 루트 기준 절대 dot-path) */
  nextPageIndex: string;
}

export interface ExtractConfig {
  version: number;
  updatedAt: string;
  /** 실제 쿠팡 HTML로 검증되었는지 (Phase 0 완료 전까지 false) */
  verified: boolean;
  /** 데이터가 담긴 script 엘리먼트 id */
  scriptId: string;
  /** 파싱된 JSON에서 주문 배열까지의 dot-path */
  orderListPath: string;
  order: OrderPaths;
  deliveryGroup: DeliveryGroupPaths;
  product: ProductPaths;
  pagination: PaginationPaths;
  /** 상태 코드 → 한국어 라벨 (원격 보정 가능) */
  statusLabels: Record<string, string>;
  /** 취소 상태 라벨 */
  canceledLabel: string;
}
