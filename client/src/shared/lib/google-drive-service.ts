// Google Drive API 서비스 — 리다이렉트 OAuth + fetch로 AppData 폴더에 JSON 파일 CRUD
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'budget_data.json';
const TOKEN_KEY = 'budget_app_access_token';

let accessToken = sessionStorage.getItem(TOKEN_KEY) ?? '';

function storeToken(token: string) {
  accessToken = token;
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken() {
  accessToken = '';
  sessionStorage.removeItem(TOKEN_KEY);
}

function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getAuthUrl(prompt: string = 'select_account'): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    prompt,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function extractTokenFromHash(): string | null {
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (token) {
      storeToken(token);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return token;
    }
  }
  return accessToken || null;
}

async function findFileId(): Promise<string | null> {
  const response = await authedFetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILE_NAME}'&fields=files(id,name,modifiedTime)`,
  );
  if (!response.ok) {
    const err = new Error(`Drive files.list 실패: ${response.status}`);
    (err as any).status = response.status;
    throw err;
  }
  const data = await response.json();
  const files: Array<{ id: string }> = data.files;
  return files?.[0]?.id ?? null;
}

export async function loadFile(): Promise<{ content: string; fileId: string | null } | null> {
  try {
    const fileId = await findFileId();
    if (!fileId) return null;

    const response = await authedFetch(`${DRIVE_API}/files/${fileId}?alt=media`);
    if (!response.ok) {
      const err = new Error(`Drive files.get 실패: ${response.status}`);
      (err as any).status = response.status;
      throw err;
    }

    return {
      content: await response.text(),
      fileId,
    };
  } catch (error: any) {
    console.error('Google Drive 파일 로드 실패:', error);
    return null;
  }
}

export async function saveFile(content: string): Promise<void> {
  if (!accessToken) throw new Error('인증되지 않았습니다.');

  const fileId = await findFileId();

  if (!fileId) {
    const metadata = JSON.stringify({
      name: FILE_NAME,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    });
    const boundary = 'budget_boundary';
    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n`,
      `--${boundary}--`,
    ].join('');

    const response = await authedFetch(
      `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
      { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body },
    );
    if (!response.ok) {
      const err = new Error(`Drive files.create 실패: ${response.status}`);
      (err as any).status = response.status;
      throw err;
    }
    return;
  }

  const response = await authedFetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media&fields=id`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content },
  );
  if (!response.ok) {
    const err = new Error(`Drive files.update 실패: ${response.status}`);
    (err as any).status = response.status;
    throw err;
  }
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

export function logout(): void {
  clearStoredToken();
}
