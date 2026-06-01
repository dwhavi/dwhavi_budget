// Google Drive API 서비스 — gapi.js를 통해 AppData 폴더에 JSON 파일 CRUD
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const FILE_NAME = 'budget_data.json';

let gapiInitialized = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken = '';

async function withAuthRetry<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error?.status === 401 || error?.result?.error?.code === 401) {
      if (tokenClient) {
        const client = tokenClient;
        await new Promise<void>((resolve, reject) => {
          client.callback = (resp: google.accounts.oauth2.TokenResponse) => {
            if (resp.error) reject(resp.error);
            else resolve();
          };
          client.requestAccessToken();
        });
        return await apiCall();
      }
    }
    throw error;
  }
}

async function ensureGapiInitialized() {
  if (gapiInitialized) return;
  await gapi.client.init({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });
  await gapi.client.load(DISCOVERY_DOC);
  gapiInitialized = true;
}

export async function initTokenClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    callback: '',
  });
}

export async function ensureAuthenticated(): Promise<void> {
  if (accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) return;
    } catch {}
  }

  if (!tokenClient) {
    throw new Error('Token client가 초기화되지 않았습니다. initTokenClient()를 먼저 호출하세요.');
  }

  const client = tokenClient;
  return new Promise<void>((resolve, reject) => {
    client.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(response.error);
        return;
      }
      accessToken = response.access_token;
      resolve();
    };
    client.requestAccessToken();
  });
}

async function findFileId(): Promise<string | null> {
  const response = await withAuthRetry(() =>
    gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: `name='${FILE_NAME}'`,
      fields: 'files(id, name, modifiedTime)',
    })
  );
  const files = response.result.files;
  return files && files.length > 0 ? files[0].id : null;
}

export async function loadFile(): Promise<{ content: string; fileId: string | null } | null> {
  await ensureGapiInitialized();

  try {
    const fileId = await findFileId();
    if (!fileId) return null;

    const response = await withAuthRetry(() =>
      gapi.client.drive.files.get({ fileId, alt: 'media' })
    );

    return {
      content: response.body,
      fileId,
    };
  } catch (error: any) {
    console.error('Google Drive 파일 로드 실패:', error);
    return null;
  }
}

export async function saveFile(content: string): Promise<void> {
  await ensureGapiInitialized();

  if (!accessToken) throw new Error('인증되지 않았습니다.');

  const fileId = await findFileId();

  if (!fileId) {
    await withAuthRetry(() =>
      gapi.client.drive.files.create({
        resource: {
          name: FILE_NAME,
          mimeType: 'application/json',
          parents: ['appDataFolder'],
        },
        media: { mimeType: 'application/json', body: content },
        fields: 'id',
      })
    );
    return;
  }

  await withAuthRetry(() =>
    gapi.client.drive.files.update({
      fileId,
      media: { mimeType: 'application/json', body: content },
      fields: 'id',
    })
  );
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

export function logout(): void {
  accessToken = '';
  if (tokenClient) {
    google.accounts.id.disableAutoSelect(true);
  }
}
