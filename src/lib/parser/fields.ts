// DESIGN 4.4.3: 각 필드 추출 후 유효성 검사. 모두 순수 함수.

/** dot-path로 중첩 객체 값 조회. "a.b.c" → obj.a.b.c. 없으면 undefined. */
export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur != null && typeof cur === 'object') return (cur as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/** 숫자로 안전 변환. 숫자/숫자문자열만 허용, 그 외 null. */
export function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** 문자열로 안전 변환(trim). null/undefined → ''. */
export function toText(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/** epoch ms → ISO date(YYYY-MM-DD). 유효하지 않으면 null. */
export function epochToISODate(ms: unknown): string | null {
  const n = toNumber(ms);
  if (n == null) return null;
  const d = new Date(n);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  return d.toISOString().slice(0, 10);
}
