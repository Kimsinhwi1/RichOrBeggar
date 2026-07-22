// content script가 쿠팡 페이지에 삽입하는 최소 UI (수집 버튼 + 토스트).
// 쿠팡 CSS와 충돌하지 않도록 인라인 스타일 + 높은 z-index 사용.

const BTN_ID = 'coupang-ledger-collect-btn';

export function injectButton(onClick: () => void): void {
  if (document.getElementById(BTN_ID)) return;
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.textContent = '쿠팡 가계부: 내역 가져오기';
  Object.assign(btn.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: '2147483647',
    padding: '12px 18px',
    background: '#ff5000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  } satisfies Partial<CSSStyleDeclaration>);
  btn.addEventListener('click', onClick);
  document.body.appendChild(btn);
}

/**
 * 버튼 표시 갱신. 수집 중에는 비활성화하지 않고 "중지" 버튼으로 바꾼다.
 * (사용자가 언제든 멈출 수 있어야 함 — 실사용 제보 반영)
 */
export function setButtonState(label: string, mode: 'idle' | 'stop' = 'idle'): void {
  const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.background = mode === 'stop' ? '#c0392b' : '#ff5000';
  btn.textContent = label;
}

/**
 * 리뷰 요청 카드 (DESIGN 6.1). 수집 성공 직후 딱 1번만 노출하고,
 * 닫기 쉬운 형태로 만든다 — 강요하면 오히려 역효과.
 */
export function showReviewPrompt(onReview: () => void, onClose: () => void): void {
  const card = document.createElement('div');
  Object.assign(card.style, {
    position: 'fixed',
    right: '20px',
    bottom: '76px',
    zIndex: '2147483647',
    width: '320px',
    padding: '18px',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
    fontFamily: 'system-ui, sans-serif',
  } satisfies Partial<CSSStyleDeclaration>);

  const title = document.createElement('div');
  title.textContent = '도움이 되셨나요?';
  Object.assign(title.style, { fontSize: '15px', fontWeight: '800', marginBottom: '6px', color: '#1a1a1a' });

  const body = document.createElement('div');
  body.textContent = '리뷰 한 줄이 다음 사용자에게 큰 도움이 됩니다. 불편한 점이 있어도 알려주시면 고치겠습니다.';
  Object.assign(body.style, { fontSize: '13px', lineHeight: '1.55', color: '#666', marginBottom: '14px' });

  const row = document.createElement('div');
  Object.assign(row.style, { display: 'flex', gap: '8px' });

  const review = document.createElement('button');
  review.textContent = '리뷰 남기기';
  Object.assign(review.style, {
    flex: '1', padding: '9px', background: '#ff5000', color: '#fff', border: 'none',
    borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
  } satisfies Partial<CSSStyleDeclaration>);
  review.addEventListener('click', () => { onReview(); card.remove(); });

  const close = document.createElement('button');
  close.textContent = '다시 보지 않기';
  Object.assign(close.style, {
    flex: '1', padding: '9px', background: '#fff', color: '#777', border: '1px solid #ddd',
    borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  } satisfies Partial<CSSStyleDeclaration>);
  close.addEventListener('click', () => { onClose(); card.remove(); });

  row.append(review, close);
  card.append(title, body, row);
  document.body.appendChild(card);
}

export function showToast(message: string, kind: 'ok' | 'error' = 'ok'): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    right: '20px',
    bottom: '76px',
    zIndex: '2147483647',
    maxWidth: '320px',
    padding: '12px 16px',
    background: kind === 'ok' ? '#1f8a3b' : '#c0392b',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
