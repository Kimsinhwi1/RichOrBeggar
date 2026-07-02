import type { ExtractConfig } from './schema';

// DESIGN 4.4.2: service worker가 GitHub raw URL의 selectors.json을 24h마다 fetch → 로컬 캐시.
// 쿠팡 개편 시 repo에 JSON만 커밋하면 전 유저 복구. (MV3에서 원격 '데이터'는 허용)

const CACHE_KEY = 'selectorConfig';
const CACHE_TS_KEY = 'selectorConfigFetchedAt';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// 공개 repo의 raw URL. 쿠팡 구조 변경 시 이 파일만 커밋하면 전 유저 복구(DESIGN 4.4.2).
const REMOTE_URL =
  'https://raw.githubusercontent.com/Kimsinhwi1/RichOrBeggar/main/public/selectors.json';

/** 확장에 번들된 기본 셀렉터 (오프라인/최초 실행용 폴백) */
async function loadBundled(): Promise<ExtractConfig> {
  const url = chrome.runtime.getURL('selectors.json');
  const res = await fetch(url);
  return (await res.json()) as ExtractConfig;
}

interface CacheShape {
  [CACHE_KEY]?: ExtractConfig;
  [CACHE_TS_KEY]?: number;
}

/**
 * 셀렉터 설정을 반환한다. 캐시가 신선하면 캐시, 오래됐으면 원격 갱신 시도,
 * 원격 실패 시 캐시 → 번들 순으로 폴백한다. (에러를 삼키지 않고 콘솔 경고)
 */
export async function getExtractConfig(now: number = Date.now()): Promise<ExtractConfig> {
  const cache = (await chrome.storage.local.get([CACHE_KEY, CACHE_TS_KEY])) as CacheShape;
  const fresh = cache[CACHE_TS_KEY] != null && now - cache[CACHE_TS_KEY] < CACHE_TTL_MS;

  if (fresh && cache[CACHE_KEY]) return cache[CACHE_KEY];

  try {
    const res = await fetch(REMOTE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`remote selectors ${res.status}`);
    const remote = (await res.json()) as ExtractConfig;
    await chrome.storage.local.set({ [CACHE_KEY]: remote, [CACHE_TS_KEY]: now });
    return remote;
  } catch (err) {
    console.warn('[selectors] 원격 갱신 실패, 폴백 사용:', err);
    return cache[CACHE_KEY] ?? loadBundled();
  }
}
