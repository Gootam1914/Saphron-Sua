// Hash router. Routes register a render(ctx) function.
const routes = [];
export function route(pattern, render, opts = {}) { routes.push({ pattern, render, opts }); }

function match(path) {
  for (const r of routes) {
    const keys = [];
    const rx = new RegExp('^' + r.pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    const m = path.match(rx);
    if (m) { const params = {}; keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); return { ...r, params }; }
  }
  return null;
}

let onNavigate = () => {};
export function setNavigateHandler(fn) { onNavigate = fn; }
export function navigate(path) { if (location.hash.slice(1) === path) resolve(); else location.hash = path; }
export function currentPath() { return location.hash.slice(1) || '/'; }

export function resolve() {
  const path = currentPath();
  const found = match(path) || match('/404');
  onNavigate(found, path);
}
window.addEventListener('hashchange', resolve);
