





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

  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else if (BASE.endsWith('/api') && path.startsWith('/api/')) {
    url = `${BASE.slice(0, -4)}${path}`;
  } else if (BASE && path.startsWith('/')) {
    url = `${BASE}${path}`;
  } else if (BASE) {
    url = `${BASE}/${path}`;
  } else {
    url = path;
  }

  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
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

  
  if (data?.requiresTwoFactor) {
    return {
      requiresTwoFactor: true,
      message:
        data.message ||
        'Verification link sent to your registered email.',
    };
  }

  
  persistSession(data);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      'current_officer_pwd',
      password
    );
  }

  return {
    requiresTwoFactor: false,
    user: data.user,
  };
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
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('current_officer_pwd', password);
  }

  return data.user;
}

export function getSessionPassword(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('current_officer_pwd') || '';
}

export function setSessionPassword(pwd: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('current_officer_pwd', pwd);
}

export async function getMe(): Promise<any> {
  const data = await request('/auth/me');
  return data.user;
}

export async function updateProfile(profileData: Record<string, any>): Promise<any> {
  const data = await request('/auth/me', {
    method: 'PATCH',
    body: profileData,
  });
  return data.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<any> {
  const res = await request('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('current_officer_pwd', newPassword);
  }
  return res;
}

export async function getSessions(): Promise<{ sessions: any[]; currentSessionId?: string }> {
  return request('/auth/sessions');
}

export async function revokeSession(sessionId: string): Promise<any> {
  return request(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

export async function revokeAllOtherSessions(): Promise<any> {
  return request('/auth/sessions', {
    method: 'DELETE',
  });
}

export async function getTwoFactorStatus(): Promise<any> {
  return request('/auth/2fa');
}

export async function toggleTwoFactor(
  enabled: boolean,
  method: string = 'email-link'
): Promise<any> {
  return request('/auth/2fa', {
    method: 'POST',
    body: { enabled, method },
  });
}


export async function sendTwoFactorVerificationLink(): Promise<any> {
  return request('/auth/2fa/send-link', {
    method: 'POST',
  });
}

export async function getPreferences(): Promise<any> {
  const data = await request('/auth/preferences');
  return data.preferences;
}

export async function updatePreferences(preferences: {
  language?: string;
  textSize?: 'Small' | 'Medium' | 'Large';
  highContrast?: boolean;
}): Promise<any> {
  const data = await request('/auth/preferences', {
    method: 'PATCH',
    body: preferences,
  });
  return data.preferences;
}

export async function downloadUserData(): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/auth/export-data`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const contentDisposition = res.headers.get('content-disposition');
  let filename = 'janmitra-user-data.json';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
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
  localStorage.removeItem('user');
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

  const username =
    data &&
    data.user &&
    (data.user.username || data.user.userName);

  if (username) {
    localStorage.setItem(
      NAME_KEY,
      username
    );
  } else if (data && data.user && data.user.fullName && !localStorage.getItem(NAME_KEY)) {
    localStorage.setItem(
      NAME_KEY,
      data.user.fullName
    );
  }

  if (data && data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}


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


export function runDocumentOCR(
  id: string
): Promise<any> {
  return request(
    `/documents/${encodeURIComponent(id)}/ocr`,
    {
      method: 'POST',
    }
  );
}

export function getDocumentOCR(
  id: string
): Promise<any> {
  return request(
    `/documents/${encodeURIComponent(id)}/ocr`,
    {
      method: 'GET',
    }
  );
}

export function runCaseDocumentOCR(
  caseId: string,
  docId: string
): Promise<any> {
  return request(
    `/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/ocr`,
    {
      method: 'POST',
    }
  );
}

export function getCaseDocumentOCR(
  caseId: string,
  docId: string
): Promise<any> {
  return request(
    `/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/ocr`,
    {
      method: 'GET',
    }
  );
}


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


export function getAuditLogs(params?: {
  type?: string;
  category?: string;
  caseId?: string;
  limit?: number;
  since?: string;
  status?: string;
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.category) query.set('category', params.category);
  if (params?.caseId) query.set('caseId', params.caseId);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.since) query.set('since', params.since);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request(`/audit${qs ? `?${qs}` : ''}`);
}

export function getSecurityAlerts(limit: number = 5): Promise<any[]> {
  return getAuditLogs({ type: 'login', limit });
}

export function getCaseActivities(limit: number = 10, caseId?: string): Promise<any[]> {
  return getAuditLogs({ category: 'case', limit, ...(caseId ? { caseId } : {}) });
}

