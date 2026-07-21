// 쿠팡 계정을 여러 개 쓰는 사용자를 위한 "프로필" 분리.
// 쿠팡 페이지는 계정 식별자를 노출하지 않고(헤더 이름은 마스킹·동명이인 가능),
// 한 사람이 같은 이름의 계정을 여러 개 쓰기도 하므로 사용자가 직접 지정한다.

const KEY = 'activeProfile';
export const DEFAULT_PROFILE = '기본';

export async function getActiveProfile(): Promise<string> {
  const r = await chrome.storage.local.get(KEY);
  const v = r[KEY];
  return typeof v === 'string' && v.trim() ? v : DEFAULT_PROFILE;
}

export async function setActiveProfile(name: string): Promise<string> {
  const value = name.trim() || DEFAULT_PROFILE;
  await chrome.storage.local.set({ [KEY]: value });
  return value;
}
