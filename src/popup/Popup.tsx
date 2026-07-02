// DESIGN 4.2: popup — 수집 상태 + 대시보드 열기 버튼만(최소 UI).

export function Popup() {
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  };

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>쿠팡 가계부</h1>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
        쿠팡 주문목록 페이지에서 내역을 가져오세요.
      </p>
      <button onClick={openDashboard} style={{ width: '100%', padding: 8 }}>
        대시보드 열기
      </button>
    </div>
  );
}
