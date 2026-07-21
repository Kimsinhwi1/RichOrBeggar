// DESIGN 4.2 / 3.1: dashboard — 주문번호 합산 뷰 + CSV 내보내기.
// Phase 1 무료 기능. 차트(Recharts)·규칙 분류는 Phase 2에서.

import { useEffect, useState } from 'react';
import type { OrderItem } from '../lib/types';
import { getAllOrders } from '../lib/db/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { summarizeByOrder, totalSpent, spentItems, isCanceled, type OrderSummary } from '../lib/aggregate/byOrder';
import { summarizeByMonth, monthlyAverage } from '../lib/aggregate/byMonth';
import { toCsv } from '../lib/export/toCsv';
import { downloadText } from '../lib/export/download';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

const ALL = '전체';

export function App() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState(ALL);

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

  const profiles = [ALL, ...new Set(items.map((i) => i.profile || '기본'))];
  const shown = profile === ALL ? items : items.filter((i) => (i.profile || '기본') === profile);
  const summaries: OrderSummary[] = summarizeByOrder(shown);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 22, flex: 1 }}>쿠팡 가계부 대시보드</h1>
        {profiles.length > 2 && (
          <select value={profile} onChange={(e) => setProfile(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
            {profiles.map((p) => (
              <option key={p} value={p}>{p === ALL ? '전체 프로필' : p}</option>
            ))}
          </select>
        )}
        <button onClick={load} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          새로고침
        </button>
      </div>

      {error ? (
        <p style={{ color: '#c0392b' }}>불러오기 오류: {error}</p>
      ) : loading ? (
        <p style={{ color: '#555' }}>불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: '#555' }}>
          아직 수집된 내역이 없습니다. 쿠팡 주문목록 페이지에서 "내역 가져오기" 버튼을 누른 뒤 새로고침하세요.
        </p>
      ) : (
        <>
          <Summary
            itemCount={shown.length}
            orderCount={summaries.length}
            total={totalSpent(shown)}
            canceledCount={shown.filter(isCanceled).length}
            onExport={() => downloadText(`coupang-orders${profile === ALL ? '' : `-${profile}`}.csv`, toCsv(shown))}
          />
          <MonthlyChart items={shown} />
          <CategoryBreakdown items={spentItems(shown)} />
          <OrderTable summaries={summaries} />
        </>
      )}
    </main>
  );
}

function Summary(props: { itemCount: number; orderCount: number; total: number; canceledCount: number; onExport: () => void }) {
  return (
    <section style={{ display: 'flex', gap: 24, alignItems: 'center', margin: '16px 0 24px' }}>
      <Stat label="주문 수" value={`${props.orderCount}건`} />
      <Stat label="상품 수" value={`${props.itemCount}건`} />
      <Stat
        label={props.canceledCount > 0 ? `총 지출 (취소 ${props.canceledCount}건 제외)` : '총 지출'}
        value={won(props.total)}
      />
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

/** DESIGN 3.1: 월별 지출 막대그래프 (취소 제외). */
function MonthlyChart({ items }: { items: OrderItem[] }) {
  const months = summarizeByMonth(items);
  if (months.length === 0) return null;

  return (
    <section style={{ margin: '0 0 30px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>월별 지출</h2>
        <span style={{ fontSize: 13, color: '#888' }}>월평균 {won(monthlyAverage(months))}</span>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 10000)}만` : String(v))}
              tick={{ fontSize: 12, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip formatter={(v: number) => [won(v), '지출']} cursor={{ fill: '#fff4ee' }} />
            <Bar dataKey="total" fill="#ff5000" radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** DESIGN 3.1: 카테고리별 지출 (규칙 기반 자동 분류 결과). */
function CategoryBreakdown({ items }: { items: OrderItem[] }) {
  const byCategory = new Map<string, number>();
  for (const i of items) {
    const key = i.category ?? '기타';
    byCategory.set(key, (byCategory.get(key) ?? 0) + i.totalPrice + i.shippingFee);
  }
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 1;

  return (
    <section style={{ margin: '0 0 28px' }}>
      <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>카테고리별 지출</h2>
      {rows.map(([name, amount]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
          <div style={{ width: 92, fontSize: 14, color: '#444' }}>{name}</div>
          <div style={{ flex: 1, background: '#f2f2f2', borderRadius: 4, height: 18 }}>
            <div style={{ width: `${(amount / max) * 100}%`, background: '#ff5000', height: '100%', borderRadius: 4 }} />
          </div>
          <div style={{ width: 110, textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{won(amount)}</div>
        </div>
      ))}
    </section>
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
