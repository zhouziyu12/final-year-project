import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const WRITE_API_KEY = (import.meta.env.VITE_WRITE_API_KEY || '').trim();

const client = axios.create({
  baseURL: API_URL || undefined,
  timeout: 15000
});

function createNonce() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildWriteHeaders() {
  if (!WRITE_API_KEY) {
    const error = new Error('Frontend write access is disabled. Configure VITE_WRITE_API_KEY for local demo writes.');
    error.code = 'WRITE_DISABLED';
    throw error;
  }

  return {
    'x-api-key': WRITE_API_KEY,
    'x-auth-timestamp': String(Date.now()),
    'x-auth-nonce': createNonce()
  };
}

function unwrapError(error, fallback) {
  if (error?.code === 'ERR_NETWORK') {
    return 'Network Error: backend unreachable, blocked by CORS, or the frontend is pointing at the wrong API origin.';
  }
  return error?.response?.data?.error || error?.message || fallback;
}

export function getWriteAccessState() {
  if (WRITE_API_KEY) {
    return {
      enabled: true,
      mode: 'direct-demo',
      summary: 'Frontend write key detected. Demo registration is enabled for local use.'
    };
  }

  return {
    enabled: false,
    mode: 'read-only',
    summary: 'No frontend write key configured. The UI stays read-only and the Python SDK remains the write path.'
  };
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

export async function registerModel(payload) {
  try {
    const { data } = await client.post('/api/register', payload, {
      headers: buildWriteHeaders()
    });
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, 'Model registration failed.'));
  }
}

export async function fetchLifecycleBySecret(secret) {
  try {
    const { data } = await client.get('/api/v2/lifecycle', {
      params: { secret }
    });
    return data;
  } catch (error) {
    throw new Error(unwrapError(error, 'Unable to load lifecycle by secret.'));
  }
}

function getDownloadFilename(headers, fallback = 'model.bin') {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
  if (!disposition) return fallback;

  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export async function downloadLifecycleVersion({ secret, modelHash, fallbackName }) {
  try {
    const response = await client.get('/api/v2/lifecycle/download', {
      params: { secret, modelHash },
      responseType: 'blob'
    });

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
