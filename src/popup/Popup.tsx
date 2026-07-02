// DESIGN 4.2: popup — 수집 상태 + 대시보드 열기(최소 UI).

import { useEffect, useState } from 'react';
import { countOrders } from '../lib/db/db';

const ORDER_URL = 'https://mc.coupang.com/ssr/desktop/order/list';

export function Popup() {
  const [count, setCount] = useState<number | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);

  useEffect(() => {
    countOrders().then(setCount);
    chrome.storage.local.get('lastCollectedAt').then((r) => setLastAt(r.lastCollectedAt ?? null));
  }, []);

  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  const openOrders = () => chrome.tabs.create({ url: ORDER_URL });

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 15, margin: '0 0 4px' }}>쿠팡 가계부</h1>
      <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
        누적 {count ?? '…'}건{lastAt ? ` · 최근 ${lastAt.slice(0, 10)}` : ''}
      </p>
      <button onClick={openOrders} style={btn('#ff5000')}>주문목록 페이지 열기</button>
      <div style={{ height: 8 }} />
      <button onClick={openDashboard} style={btn('#333')}>대시보드 열기</button>
      <p style={{ fontSize: 11, color: '#999', margin: '12px 0 0' }}>
        주문목록 페이지의 "내역 가져오기" 버튼으로 수집하세요.
      </p>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return { width: '100%', padding: 10, background: bg, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
}
