import { describe, it, expect } from 'vitest';
import { classifyProduct, classifyItems } from './classify';
import type { CategoryRule, OrderItem } from '../types';

// 실제 쿠팡 주문 상품명으로 검증 (Phase 0/1에서 수집된 실데이터 기준)
const REAL_CASES: Array<[string, string]> = [
  ['석수 무라벨, 500ml, 100개', '식품'],
  ['탐사 샘물', '식품'],
  ['가농 오메가 반숙란 20구', '식품'],
  ['가농 구운맛 단백이', '식품'],
  ['삶은듯한 행주', '생활용품'],
  ['코멧 사선컷팅 테이프 클리너 3단 핸들 + 거치대 + 리필 4개', '생활용품'],
  ['코멧 뽑아쓰는 분리수거 배접 비닐봉투', '생활용품'],
  ['기본에 끼고 벗기 쉬운 고무장갑', '생활용품'],
  ['스카트 잘 닦이는 세정티슈', '생활용품'],
  ['키친아트 4구 에그팬', '생활용품'],
  ['홈스타 신발을 부탁해 탈취제 본품', '생활용품'],
  ['에너자이저 맥스 AA 건전지', '생활용품'],
  ['수면도감 다리베개', '생활용품'],
  ['홈플래닛 벅스 킬러 해충 퇴치기 4W', '생활용품'],
  ['순면 남자 오버핏 빅사이즈 워싱 피그먼트 빈티지 헬스 반팔티 (M~5XL)', '패션'],
  ['FITOJIM 남자 사이드 핀턱 옆트임 와이드 팬츠 밴딩 츄리닝 트레이닝 바지', '패션'],
  ['제이티엘 남성용 오버핏 프린팅 반팔 티셔츠', '패션'],
  ['파리생제르망 시그니쳐 기능성 남성 드로즈 팬티 10종 + 파우치 세트', '패션'],
  ['더베이직 남성용 스포츠 커버 중목 양말 12켤레', '패션'],
  ['루이본 열전도 앞머리 헤어롤', '뷰티·건강'],
  ['폴메디슨 옴므 데오드란트 스프레이 우디 페로몬향', '뷰티·건강'],
  ['폴메디슨 시그니처 노세범 드라이 샴푸 그린블라썸향', '뷰티·건강'],
  ['센카 퍼펙트 휩 프레시 클렌징 폼', '뷰티·건강'],
  ['피카소 눈썹칼', '뷰티·건강'],
  ['잠스트 카프 슬리브 종아리 보호대 2p 세트', '뷰티·건강'],
  ['매직브라이트 바디샤워티슈 물없이쓰는 샤워티슈 특대형', '뷰티·건강'],
  ['삼성전자 창문형 에어컨 BESPOKE 무풍에어컨 윈도우핏', '가전·디지털'],
  ['파세코 26년 신제품 창문형에어컨 듀얼인버터2', '가전·디지털'],
  ['에너자이저 과부하차단 고용량 3680W 납작 멀티탭 5구', '가전·디지털'],
  ['레토 메탈 듀얼쿨러 노트북 거치대 LCS-S01', '가전·디지털'],
  ['휴대용 무선 공기 주입기 풀세트 LED손전등/보조배터리', '가전·디지털'],
];

describe('classifyProduct — 실제 상품명', () => {
  it.each(REAL_CASES)('%s → %s', (name, expected) => {
    expect(classifyProduct(name).category).toBe(expected);
  });

  it('실제 데이터 전체 정확도가 DESIGN 목표(70%)를 넘는다', () => {
    const ok = REAL_CASES.filter(([n, e]) => classifyProduct(n).category === e).length;
    expect(ok / REAL_CASES.length).toBeGreaterThan(0.7);
  });
});

describe('classifyProduct — 규칙', () => {
  it('매칭 없으면 기타', () => {
    expect(classifyProduct('알 수 없는 신기한 물건').category).toBe('기타');
  });

  it('더 긴(구체적인) 키워드가 이긴다 — "헬스 반팔티"는 패션', () => {
    expect(classifyProduct('헬스 반팔티').category).toBe('패션');
  });

  it('사용자 규칙이 사전보다 우선', () => {
    const rules: CategoryRule[] = [{ keyword: '반팔티', category: '업무비품', priority: 100 }];
    const r = classifyProduct('순면 반팔티', rules);
    expect(r).toEqual({ category: '업무비품', source: 'user' });
  });
});

describe('classifyItems', () => {
  const base: OrderItem = {
    id: 'x', profile: '기본', orderId: '1', orderedAt: '2026-06-30', productName: '탐사 샘물',
    quantity: 1, unitPrice: 1000, totalPrice: 1000, shippingFee: 0, status: '배송완료', canceled: false,
    category: null, categorySource: null, collectedAt: '2026-07-03T00:00:00.000Z',
  };

  it('미분류 항목을 규칙으로 채운다', () => {
    const [out] = classifyItems([base]);
    expect(out.category).toBe('식품');
    expect(out.categorySource).toBe('rule');
  });

  it('사용자가 지정한 분류는 덮어쓰지 않는다', () => {
    const userSet = { ...base, category: '내가정한것', categorySource: 'user' as const };
    expect(classifyItems([userSet])[0].category).toBe('내가정한것');
  });
});
