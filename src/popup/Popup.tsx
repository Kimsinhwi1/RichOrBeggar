// DESIGN 4.2: popup — 수집 상태 + 프로필(계정) 선택 + 대시보드 열기.

import { useEffect, useState } from 'react';
import { countOrders } from '../lib/db/db';
import { getActiveProfile, setActiveProfile } from '../lib/profile';

const ORDER_URL = 'https://mc.coupang.com/ssr/desktop/order/list';

export function Popup() {
  const [count, setCount] = useState<number | null>(null);
  const [profile, setProfile] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    countOrders().then(setCount);
    getActiveProfile().then(setProfile);
  }, []);

  const apply = async () => {
    const v = await setActiveProfile(profile);
    setProfile(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  const openOrders = () => chrome.tabs.create({ url: ORDER_URL });

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 15, margin: '0 0 4px' }}>쿠팡 가계부</h1>
      <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>누적 {count ?? '…'}건</p>

      <label style={{ fontSize: 12, color: '#444', fontWeight: 700 }}>프로필 (쿠팡 계정 구분)</label>
      <div style={{ display: 'flex', gap: 6, margin: '4px 0 6px' }}>
        <input
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder="예: A업장"
          style={{ flex: 1, padding: 7, border: '1px solid #ccc', borderRadius: 6, fontSize: 13 }}
        />
        <button onClick={apply} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          {saved ? '✓' : '저장'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#999', margin: '0 0 12px' }}>
        계정을 바꿔 로그인했다면 수집 전에 프로필 이름을 바꾸세요. 대시보드에서 프로필별로 나눠 볼 수 있어요.
      </p>

      <button onClick={openOrders} style={btn('#ff5000')}>주문목록 페이지 열기</button>
      <div style={{ height: 8 }} />
      <button onClick={openDashboard} style={btn('#333')}>대시보드 열기</button>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return { width: '100%', padding: 10, background: bg, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
}
