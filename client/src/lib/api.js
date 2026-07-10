// Thin fetch wrapper. Injects the auth token (real Firebase ID token or a demo
// token) and normalizes errors.

const BASE = import.meta.env.VITE_API_BASE_URL || '';

let tokenProvider = async () => null;
export function setTokenProvider(fn) {
  tokenProvider = fn;
}

async function request(method, path, body, opts = {}) {
  const token = await tokenProvider();
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.blob();
  if (!res.ok) {
    const message = (isJson && data?.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (p, opts) => request('GET', p, null, opts),
  post: (p, b, opts) => request('POST', p, b, opts),
  patch: (p, b, opts) => request('PATCH', p, b, opts),
  del: (p, opts) => request('DELETE', p, null, opts),
  // Raw fetch for file downloads.
  raw: async (p) => {
    const token = await tokenProvider();
    return fetch(`${BASE}/api${p}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
};
