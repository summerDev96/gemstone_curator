const SESSION_TOKEN_KEY = "ohgyeol.sessionToken";

/**
 * localStorage를 사용해 브라우저(탭 종료/재방문)와 무관하게 세션을 유지한다.
 * 로그인 없이도 "보관함"(같은 기기에서의 과거 결과 조회)이 동작하려면
 * sessionStorage(탭 종료 시 소멸)로는 불가능하기 때문이다.
 * 사용자가 언제든 `/privacy`에서 이 저장소에 대응하는 서버 데이터를 삭제할 수 있다.
 */
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // 프라이빗 브라우징 등으로 저장이 막힌 경우, 세션은 요청마다 새로 발급된다.
  }
}

export function clearStoredSessionToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // 접근 불가 시 무시한다.
  }
}

async function issueNewSessionToken(): Promise<string> {
  const res = await fetch("/api/v1/sessions", { method: "POST" });
  if (!res.ok) {
    throw new Error("세션을 발급받지 못했습니다.");
  }
  const body = await res.json();
  storeToken(body.sessionToken);
  return body.sessionToken as string;
}

export async function getOrCreateSessionToken(): Promise<string> {
  return readStoredToken() ?? (await issueNewSessionToken());
}

/**
 * 저장된 토큰이 서버에서 만료·삭제되어 401이 돌아오면(예: `/privacy`에서 삭제한 뒤
 * 다른 탭이 남아있던 경우) 한 번 새 세션으로 재발급받아 재시도한다.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getOrCreateSessionToken();
  const res = await fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` },
  });

  if (res.status !== 401) return res;

  clearStoredSessionToken();
  const freshToken = await issueNewSessionToken();
  return fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${freshToken}` },
  });
}
