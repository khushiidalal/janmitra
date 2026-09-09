// Central API client for the KORA / Janmitra backend.
//
// It intentionally mirrors the old localStorage helpers in ./data (same function
// names and payload/response shapes) so components only need to switch the import
// from `../lib/data` to `../lib/api` and `await` the calls.

const BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api'
).replace(/\/$/, '');

const TOKEN_KEY = 'kora_token';
const NAME_KEY = 'userName';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  );
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

interface ReqOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

async function request(
  path: string,
  options: ReqOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers: extraHeaders = {},
  } = options;

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  // Only send JSON content type when the body is NOT FormData.
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;

  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    console.error('API connection error:', error);

    throw new Error(
      `Cannot reach the backend at ${BASE}. Make sure the backend is running.`
    );
  }

  const contentType =
    res.headers.get('content-type') || '';

  const isJson = contentType.includes('application/json');

  const data = isJson
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;

    const err = new Error(message) as Error & {
      status?: number;
    };

    err.status = res.status;

    throw err;
  }

  return data;
}

// ---------- Auth ----------

export async function login(
  email: string,
  password: string
): Promise<any> {
  const data = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: {
      email,
      password,
    },
  });

  persistSession(data);

  return data.user;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  extraData: Record<string, any> = {}
): Promise<any> {
  const data = await request('/auth/register', {
    method: 'POST',
    auth: false,
    body: {
      fullName,
      email,
      password,
      ...extraData,
    },
  });

  persistSession(data);

  return data.user;
}

export async function sendPhoneOTP(phone: string): Promise<any> {
  return request('/phone-otp/send', {
    method: 'POST',
    auth: false,
    body: { phone },
  });
}

export async function verifyPhoneOTP(phone: string, otp: string): Promise<any> {
  return request('/phone-otp/verify', {
    method: 'POST',
    auth: false,
    body: { phone, otp },
  });
}

export async function sendEmailOTP(email: string): Promise<any> {
  return request('/otp/send', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export async function verifyEmailOTP(email: string, otp: string): Promise<any> {
  return request('/otp/verify', {
    method: 'POST',
    auth: false,
    body: { email, otp },
  });
}

// Register-or-login
export async function authenticate(
  fullName: string,
  email: string,
  password: string
): Promise<any> {
  try {
    return await register(
      fullName,
      email,
      password
    );
  } catch (e) {
    const status = (e as { status?: number }).status;

    if (status === 409) {
      return await login(email, password);
    }

    throw e;
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem(NAME_KEY);
  sessionStorage.removeItem('token');
}

function persistSession(data: any): void {
  if (typeof window === 'undefined') return;
  if (data && data.token) {
    localStorage.setItem(
      TOKEN_KEY,
      data.token
    );
  }

  const name =
    data &&
    data.user &&
    data.user.fullName;

  if (name) {
    localStorage.setItem(
      NAME_KEY,
      name
    );
  }
}

// ---------- Cases ----------

export function getCases(): Promise<any[]> {
  return request('/cases');
}

export function getCase(
  id: string
): Promise<any> {
  return request(
    `/cases/${encodeURIComponent(id)}`
  );
}


export function addCase(
  payload: any
): Promise<any> {
  return request('/cases', {
    method: 'POST',
    body: payload,
  });
}

export function updateCase(
  id: string,
  payload: any
): Promise<any> {
  return request(
    `/cases/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
}

// ---------- Documents ----------

export async function getDocuments(
  caseId?: string,
  search?: string,
  documentType?: string
): Promise<any> {
  const params = new URLSearchParams();

  if (caseId) {
    params.append('caseId', caseId);
  }

  if (search) {
    params.append('search', search);
  }

  if (documentType) {
    params.append(
      'documentType',
      documentType
    );
  }

  const query =
    params.toString();

  return request(
    `/documents${query ? `?${query}` : ''}`
  );
}

export async function uploadDocument(
  caseId: string,
  name: string,
  documentType: string,
  description: string,
  file: File
): Promise<any> {
  const formData = new FormData();

  formData.append(
    'caseId',
    caseId
  );

  formData.append(
    'name',
    name
  );

  formData.append(
    'documentType',
    documentType
  );

  formData.append(
    'description',
    description
  );

  formData.append(
    'file',
    file
  );

  const token = getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(
      `${BASE}/documents`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );
  } catch (error) {
    console.error(
      'Document upload connection error:',
      error
    );

    throw new Error(
      `Cannot reach the backend at ${BASE}. Make sure the backend is running.`
    );
  }

  const contentType =
    res.headers.get(
      'content-type'
    ) || '';

  const data =
    contentType.includes(
      'application/json'
    )
      ? await res.json().catch(
          () => null
        )
      : null;

  if (!res.ok) {
    const message =
      (data &&
        (data.error ||
          data.message)) ||
      `Upload failed (${res.status})`;

    const err =
      new Error(message) as Error & {
        status?: number;
      };

    err.status = res.status;

    throw err;
  }

  return data;
}

export async function getDocumentById(
  id: string
): Promise<any> {
  return request(
    `/documents/${encodeURIComponent(id)}`
  );
}

export async function downloadDocument(
  id: string
): Promise<Blob> {
  const token = getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(
      `${BASE}/documents/${encodeURIComponent(
        id
      )}/download`,
      {
        method: 'GET',
        headers,
      }
    );
  } catch (error) {
    console.error(
      'Document download connection error:',
      error
    );

    throw new Error(
      `Cannot reach the backend at ${BASE}.`
    );
  }

  if (!res.ok) {
    const data =
      await res.json().catch(
        () => null
      );

    throw new Error(
      (data &&
        (data.error ||
          data.message)) ||
        `Failed to download document (${res.status})`
    );
  }

  return res.blob();
}

export function updateDocument(
  id: string,
  payload: {
    name?: string;
    documentType?: string;
    description?: string;
  }
): Promise<any> {
  return request(
    `/documents/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );
}

export function deleteDocument(
  id: string
): Promise<any> {
  return request(
    `/documents/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

// ---------- Draft ----------

export function getDraft(): Promise<any> {
  return request('/draft');
}

export function saveDraft(
  draft: any
): Promise<any> {
  return request('/draft', {
    method: 'PUT',
    body: draft,
  });
}

export function clearDraft(): Promise<any> {
  return request('/draft', {
    method: 'DELETE',
  });
}
// ---------- Audit Trail ----------

export function getAuditLogs(): Promise<any[]> {
  return request('/audit');
}
