// DESIGN 4.3 데이터 모델

/** 기본 대분류 8종 (DESIGN 4.3) */
export const BASE_CATEGORIES = [
  '식품',
  '생활용품',
  '뷰티·건강',
  '패션',
  '육아',
  '가전·디지털',
  '문구·취미',
  '기타',
] as const;
export type BaseCategory = (typeof BASE_CATEGORIES)[number];

export type CategorySource = 'rule' | 'ai' | 'user' | null;

export interface OrderItem {
  /** orderId + productId(또는 index) 조합 */
  id: string;
  orderId: string;
  /** ISO 8601 */
  orderedAt: string;
  productName: string;
  quantity: number;
  /** 원 */
  unitPrice: number;
  /** 원 (상품 금액 = unitPrice × quantity, 배송비 제외) */
  totalPrice: number;
  /** 주문 배송비(원). 주문당 1회만 계상하기 위해 각 주문의 첫 상품에만 실림(나머지 0). */
  shippingFee: number;
  /** 배송완료/취소 등 원문 그대로 */
  status: string;
  /** 분류 결과 (미분류 시 null) */
  category: string | null;
  categorySource: CategorySource;
  /** ISO 8601 */
  collectedAt: string;
  /** 파싱 원본 (디버그용, 30일 후 삭제) */
  raw?: string;
}

export interface CategoryRule {
  /** 상품명 포함 키워드 */
  keyword: string;
  category: string;
  /** 사용자 수정 = 최우선 */
  priority: number;
}
