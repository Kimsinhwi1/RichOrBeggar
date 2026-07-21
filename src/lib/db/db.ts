import Dexie, { type Table } from 'dexie';
import type { OrderItem, CategoryRule } from '../types';

// DESIGN 4.1: 주문 데이터는 IndexedDB(Dexie)에만 저장. 서버 전송 없음(로컬 우선).

export class LedgerDB extends Dexie {
  orders!: Table<OrderItem, string>;
  rules!: Table<CategoryRule, string>;

  constructor() {
    super('coupang-ledger');
    this.version(1).stores({
      orders: 'id, orderId, orderedAt, category',
      rules: 'keyword, category, priority',
    });
    // v2: id 체계 변경(분리배송 중복 제거 반영). 주문 데이터는 재수집 가능한
    // 로컬 캐시이므로, 옛 형식 잔재를 남기지 않도록 한 번 비운다.
    this.version(2)
      .stores({ orders: 'id, orderId, orderedAt, category', rules: 'keyword, category, priority' })
      .upgrade((tx) => tx.table('orders').clear());
    // v3: 프로필(계정 구분) 도입. 기존 데이터는 '기본' 프로필로 편입한다.
    this.version(3)
      .stores({ orders: 'id, profile, orderId, orderedAt, category', rules: 'keyword, category, priority' })
      .upgrade((tx) =>
        tx.table('orders').toCollection().modify((row: OrderItem) => {
          if (!row.profile) row.profile = '기본';
        }),
      );
  }
}

export const db = new LedgerDB();

/** 중복 id는 덮어쓰기(재수집 시 최신 유지). */
export async function saveOrders(items: OrderItem[]): Promise<number> {
  await db.orders.bulkPut(items);
  return items.length;
}

/** 저장된 전체 주문상품 (최신 주문일 우선). */
export async function getAllOrders(): Promise<OrderItem[]> {
  const items = await db.orders.toArray();
  return items.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
}

export async function countOrders(): Promise<number> {
  return db.orders.count();
}
