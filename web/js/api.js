import { CONFIG } from './config.js';

let tokenGetter = async () => null;
export function setTokenGetter(fn) { tokenGetter = fn; }

async function req(method, path, body) {
  const token = await tokenGetter();
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload = body;
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(CONFIG.API_BASE + '/api' + path, { method, headers, body: payload });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.blob();
  if (!res.ok) throw new Error((isJson && data && data.error) || ('Request failed (' + res.status + ')'));
  return data;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),
  del: (p) => req('DELETE', p),
  raw: async (p) => {
    const token = await tokenGetter();
    return fetch(CONFIG.API_BASE + '/api' + p, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  },
};
