# 쿠팡 가계부 (CoupangLedger)

쿠팡 주문내역을 클릭 한 번으로 추출해 자동 분류된 지출 리포트로 보여주는 크롬 확장(MV3).
전체 설계는 [DESIGN.md](DESIGN.md) 참조. 현재 **Phase 0 (정찰)**.

## 개발

```bash
npm install
npm run dev        # crxjs dev 서버 (chrome://extensions에서 dist를 "압축해제된 확장" 로드)
npm run build      # 프로덕션 빌드 → dist/
npm test           # 파싱/분류 유닛 테스트 (Vitest)
npm run typecheck  # 타입 체크
```

## 구조 (DESIGN 4.2)

```
src/
  content/        쿠팡 페이지 주입 (수집 버튼 + DOM 파싱)
  background/     service worker (저장, 원격 셀렉터 갱신)
  dashboard/      확장 내부 페이지 (리포트/차트/내보내기) — React
  popup/          최소 상태 표시 + 대시보드 열기
  lib/
    parser/       HTML(__NEXT_DATA__ JSON) → OrderItem[] 순수 함수 + 테스트
    selectors/    추출 설정 스키마(JSON dot-path) + 원격 로더
    db/           Dexie(IndexedDB) 계층
    types.ts      데이터 모델 (DESIGN 4.3)
public/
  selectors.json  외부화된 JSON 추출 경로 (원격 갱신 대상)
```

## Phase 0 결과 (완료 ✅)

정찰 결과 쿠팡은 Next.js 앱이라 렌더된 DOM은 styled-components 해시 클래스(배포마다
변경)라 취약. 대신 `<script id="__NEXT_DATA__">`의 구조화 JSON을 파싱하도록 전환했다.
DESIGN 4.4 원칙(설정 외부화·원격 갱신·순수 함수·실패율 처리)은 그대로 유지하되,
외부화 대상이 **CSS 셀렉터 → JSON dot-path**로 바뀌었다.

- [x] 실제 쿠팡 주문목록 HTML 확보 (`.gitignore` 처리 — 개인정보 보호)
- [x] `public/selectors.json`을 JSON-path 추출 설정으로 확정, `verified: true`
- [x] 실제 데이터로 **주문 5건 / 상품 13건 정확 파싱, 0 실패** (DoD 충족)
- [x] 커밋용 유닛 테스트는 구조 동일·값 가짜인 합성 픽스처 사용 (10 tests green)

## Phase 1 (MVP) 진행 중

- [x] 수집 버튼 삽입 + 현재 페이지 파싱 → service worker 저장(Dexie)
- [x] 주문번호 합산 뷰 + CSV 다운로드(엑셀 한글 BOM) — 대시보드
- [x] 팝업: 누적 건수/최근 수집일 + 주문목록/대시보드 열기
- [ ] **멀티페이지 자동 순회** — 다음 페이지 URL 파라미터를 실제 2페이지에서 확정 후 구현
      (`orderPagination.nextPageIndex` 추출은 완료, 순회 로직만 남음)
- [ ] 스토어 심사용 아이콘/스크린샷/설명 정비 후 제출

## 원칙 (DESIGN 4.6)

- 파일당 200줄·함수당 30줄 이하
- 파싱 로직은 순수 함수, 셀렉터 하드코딩 금지 (`public/selectors.json`에서만)
- 파싱/분류/합산 로직은 테스트 필수
- 에러는 삼키지 않는다 (사용자 알림 또는 로그)
