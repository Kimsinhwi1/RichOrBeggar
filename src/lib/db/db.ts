import Dexie, { type Table } from 'dexie';
import type { OrderItem, CategoryRule } from '../types';

// DESIGN 4.1: 주문 데이터는 IndexedDB(Dexie)에만 저장. 서버 전송 없음(로컬 우선).

export class LedgerDB extends Dexie {
  orders!: Table<OrderItem, string>;
  rules!: Table<CategoryRule, string>;

  constructor() {
    super('coupang-ledger');
    this.version(1).stores({
      // id = orderId-index, orderId·orderedAt·category로 조회
      orders: 'id, orderId, orderedAt, category',
      rules: 'keyword, category, priority',
    });
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
