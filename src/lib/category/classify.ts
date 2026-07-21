import type { BaseCategory, CategoryRule, OrderItem } from '../types';
import { CATEGORY_KEYWORDS } from './keywords';

// DESIGN 3.1 / 4.5: 규칙 기반 분류. 순수 함수(상품명 in → 카테고리 out).
// 사용자가 고친 규칙(CategoryRule)이 있으면 최우선 적용한다.

export interface Classification {
  category: BaseCategory | string;
  source: 'rule' | 'user';
}

/** 사전을 (키워드, 카테고리) 목록으로 펼쳐 길이 내림차순 정렬 — 구체적인 키워드가 이긴다. */
const FLAT_KEYWORDS: Array<{ keyword: string; category: string }> = Object.entries(CATEGORY_KEYWORDS)
  .flatMap(([category, words]) => words.map((keyword) => ({ keyword, category })))
  .sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * 상품명을 카테고리로 분류한다.
 * 사용자 규칙 → 키워드 사전(긴 키워드 우선) → 매칭 없으면 '기타'.
 */
export function classifyProduct(productName: string, userRules: CategoryRule[] = []): Classification {
  const name = productName.toLowerCase();

  // 사용자 규칙 최우선 (priority 높은 순)
  const rule = [...userRules]
    .sort((a, b) => b.priority - a.priority)
    .find((r) => r.keyword && name.includes(r.keyword.toLowerCase()));
  if (rule) return { category: rule.category, source: 'user' };

  const hit = FLAT_KEYWORDS.find((k) => name.includes(k.keyword.toLowerCase()));
  return hit ? { category: hit.category, source: 'rule' } : { category: '기타', source: 'rule' };
}

/** 아직 분류되지 않았거나 규칙 분류인 항목을 (재)분류한다. 사용자 지정(user)은 건드리지 않는다. */
export function classifyItems(items: OrderItem[], userRules: CategoryRule[] = []): OrderItem[] {
  return items.map((item) => {
    if (item.categorySource === 'user') return item;
    const { category, source } = classifyProduct(item.productName, userRules);
    return { ...item, category, categorySource: source };
  });
}
