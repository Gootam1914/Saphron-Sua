const KEY = 'sua_theme';
export function initTheme() {
  // Default to light mode; only honor a previously saved explicit choice.
  const saved = localStorage.getItem(KEY);
  const theme = saved === 'dark' || saved === 'light' ? saved : 'light';
  document.documentElement.setAttribute('data-theme', theme);
}
export function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(KEY, next);
  return next;
}
export const currentTheme = () => document.documentElement.getAttribute('data-theme');
