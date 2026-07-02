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

export function setButtonEnabled(enabled: boolean, label?: string): void {
  const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? '1' : '0.6';
  if (label) btn.textContent = label;
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
