import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const SESSION_STORAGE_KEY = 'ai-provenance-auth-session';

let authSession = null;

const client = axios.create({
  baseURL: API_URL || undefined,
  timeout: 15000
});

client.interceptors.request.use((config) => {
  if (authSession?.token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${authSession.token}`
    };
  }
  return config;
});

function readStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session) {
  authSession = session;
  if (typeof window === 'undefined') return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

authSession = readStoredSession();

function unwrapError(error, fallback) {
  if (error?.code === 'ERR_NETWORK') {
    return 'Network Error: backend unreachable, blocked by CORS, or the frontend is pointing at the wrong API origin.';
  }
  return error?.response?.data?.error || error?.message || fallback;
}

function getDownloadFilename(headers, fallback = 'model.bin') {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
  if (!disposition) return fallback;

  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export function getStoredAuthSession() {
  return authSession;
}

export function clearStoredAuthSession() {
  persistSession(null);
}

export function getFrontendRoleState() {
  return {
    mode: 'presentation-and-download',
    summary: 'The frontend is read-oriented. Training writes belong to the authenticated Python SDK, while the UI focuses on inspection and lifecycle downloads.'
  };
}

export async function loginUser(credentials) {
  try {
    const { data } = await client.post('/api/auth/login', credentials);
    const session = {
      token: data.token,
      user: data.user,
      expiresAt: data.expiresAt || null
    };
    persistSession(session);
    return session;
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to sign in.'));
  }
}

export async function fetchCurrentUser() {
  if (!authSession?.token) return null;

  try {
    const { data } = await client.get('/api/auth/me');
    const nextSession = {
      ...authSession,
      user: data.user
    };
    persistSession(nextSession);
    return nextSession;
  } catch (error) {
    clearStoredAuthSession();
    throw new Error(unwrapError(error, 'Unable to validate the current session.'));
  }
}

export function logoutUser() {
  clearStoredAuthSession();
}

export async function fetchHealth() {
  try {
    const { data } = await client.get('/api/health');
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to load backend health.'));
  }
}

export async function fetchStatus() {
  try {
    const { data } = await client.get('/api/v2/status');
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to load platform status.'));
  }
}

export async function fetchModels(chain) {
  try {
    const { data } = await client.get('/api/v2/models', {
      params: chain ? { chain } : undefined
    });
    return data.models || [];
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to load model inventory.'));
  }
}

export async function fetchModelDetail({ id, chain }) {
  try {
    const { data } = await client.get(`/api/v2/models/${encodeURIComponent(id)}`, {
      params: { chain }
    });
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, `Unable to load model #${id}.`));
  }
}

export async function fetchAuditVerification({ modelId, chain }) {
  try {
    const { data } = await client.get(`/api/v2/audit/verify/${encodeURIComponent(modelId)}`, {
      params: { chain }
    });
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, `Unable to verify model #${modelId}.`));
  }
}

export async function fetchRecentAuditEvents(chain, limit = 8) {
  try {
    const { data } = await client.get('/api/v2/audit/recent', {
      params: { chain, limit }
    });
    return data.events || [];
  } catch (error) {
    throw new Error(unwrapError(error, `Unable to load recent audit events for ${chain}.`));
  }
}

export async function fetchLifecycleBySecret(secret) {
  try {
    const { data } = await client.post('/api/v2/lifecycle/query', { secret });
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to load lifecycle by secret.'));
  }
}

export async function downloadLifecycleVersion({ secret, modelHash, fallbackName }) {
  try {
    const response = await client.post(
      '/api/v2/lifecycle/download',
      { secret, modelHash },
      { responseType: 'blob' }
    );

    const blobUrl = window.URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = getDownloadFilename(response.headers, fallbackName || 'model.bin');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to download the requested model version.'));
  }
}
