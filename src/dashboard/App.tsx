// DESIGN 4.2 / 3.1: dashboard — 주문번호 합산 뷰 + CSV 내보내기.
// Phase 1 무료 기능. 차트(Recharts)·규칙 분류는 Phase 2에서.

import { useEffect, useState } from 'react';
import type { OrderItem } from '../lib/types';
import { getAllOrders } from '../lib/db/db';
import { summarizeByOrder, totalAmount, type OrderSummary } from '../lib/aggregate/byOrder';
import { toCsv } from '../lib/export/toCsv';
import { downloadText } from '../lib/export/download';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export function App() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getAllOrders()
      .then((rows) => {
        console.debug('[대시보드] 로드된 주문상품:', rows.length);
        setItems(rows);
      })
      .catch((err) => {
        console.error('[대시보드] 불러오기 실패:', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const summaries: OrderSummary[] = summarizeByOrder(items);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 22, flex: 1 }}>쿠팡 가계부 대시보드</h1>
        <button onClick={load} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          새로고침
        </button>
      </div>

      {error ? (
        <p style={{ color: '#c0392b' }}>불러오기 오류: {error}</p>
      ) : loading ? (
        <p style={{ color: '#555' }}>불러오는 중…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#555' }}>
          아직 수집된 내역이 없습니다. 쿠팡 주문목록 페이지에서 "내역 가져오기" 버튼을 누른 뒤 새로고침하세요.
        </p>
      ) : (
        <>
          <Summary itemCount={items.length} orderCount={summaries.length} total={totalAmount(items)} onExport={() => downloadText('coupang-orders.csv', toCsv(items))} />
          <OrderTable summaries={summaries} />
        </>
      )}
    </main>
  );
}

function Summary(props: { itemCount: number; orderCount: number; total: number; onExport: () => void }) {
  return (
    <section style={{ display: 'flex', gap: 24, alignItems: 'center', margin: '16px 0 24px' }}>
      <Stat label="주문 수" value={`${props.orderCount}건`} />
      <Stat label="상품 수" value={`${props.itemCount}건`} />
      <Stat label="총 지출" value={won(props.total)} />
      <button onClick={props.onExport} style={{ marginLeft: 'auto', padding: '10px 16px', background: '#ff5000', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        CSV 다운로드
      </button>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function OrderTable({ summaries }: { summaries: OrderSummary[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
          <th style={{ padding: 8 }}>주문일</th>
          <th style={{ padding: 8 }}>주문번호</th>
          <th style={{ padding: 8 }}>상품 수</th>
          <th style={{ padding: 8, textAlign: 'right' }}>합산 금액</th>
          <th style={{ padding: 8 }}>상태</th>
        </tr>
      </thead>
      <tbody>
        {summaries.map((s) => (
          <tr key={s.orderId} style={{ borderBottom: '1px solid #f2f2f2' }}>
            <td style={{ padding: 8 }}>{s.orderedAt}</td>
            <td style={{ padding: 8, fontFamily: 'monospace' }}>{s.orderId}</td>
            <td style={{ padding: 8 }}>{s.itemCount}</td>
            <td style={{ padding: 8, textAlign: 'right' }}>{won(s.totalAmount)}</td>
            <td style={{ padding: 8 }}>{s.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
