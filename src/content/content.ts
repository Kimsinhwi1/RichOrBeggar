// DESIGN 4.2: content script — 쿠팡 주문목록 페이지에 주입.
// Phase 0에서는 뼈대만. 수집 버튼 UI 삽입 + DOM 파싱은 Phase 1에서 selectors 확정 후 구현.

console.info('[쿠팡 가계부] content script 로드됨:', location.href);

// TODO(Phase 1):
//  1) 수집 버튼 UI 삽입
//  2) getExtractConfig()로 설정 로드 → parseOrders(document.documentElement.outerHTML, config)
//     (쿠팡 __NEXT_DATA__ JSON 파싱 — Phase 0 정찰 결과)
//  3) 페이지네이션 자동 순회 (1.5~2.5s 랜덤 대기, 최대 100페이지, 병렬 금지 — DESIGN 4.4.4)
//  4) 파싱 결과를 service worker로 메시지 전송 → saveOrders()
export {};
