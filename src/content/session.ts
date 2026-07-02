// 멀티페이지 수집은 페이지 이동마다 content script가 다시 로드되므로,
// 진행 상태를 chrome.storage.local에 저장해 페이지 간 이어간다.

const KEY = 'collectSession';

export interface CollectSession {
  active: boolean;
  pagesDone: number;
  itemsSaved: number;
  startedAt: string;
}

export async function getSession(): Promise<CollectSession | null> {
  const r = await chrome.storage.local.get(KEY);
  return (r[KEY] as CollectSession | undefined) ?? null;
}

export async function setSession(session: CollectSession): Promise<void> {
  await chrome.storage.local.set({ [KEY]: session });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}
