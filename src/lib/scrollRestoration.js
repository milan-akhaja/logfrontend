// Scroll Restoration Management for SPA Navigation

const scrollPositions = new Map();

// Load any previously persisted scroll positions from sessionStorage
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem('log_scroll_positions');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => scrollPositions.set(k, v));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

function persistPositions() {
  if (typeof window === 'undefined') return;
  try {
    const obj = {};
    // Store latest 50 entries to keep sessionStorage lean
    const entries = Array.from(scrollPositions.entries()).slice(-50);
    entries.forEach(([k, v]) => { obj[k] = v; });
    sessionStorage.setItem('log_scroll_positions', JSON.stringify(obj));
  } catch (e) {
    // Ignore quota errors
  }
}

export function initScrollRestoration() {
  if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    try {
      window.history.scrollRestoration = 'manual';
    } catch (e) {
      // Ignore
    }
  }
}

export function saveScrollPosition(key, path) {
  if (typeof window === 'undefined') return;
  const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  if (key) scrollPositions.set(key, y);
  if (path) scrollPositions.set(path, y);
  persistPositions();
}

export function getSavedScrollPosition(key, path) {
  if (typeof window === 'undefined') return 0;
  if (key && scrollPositions.has(key)) return scrollPositions.get(key);
  if (path && scrollPositions.has(path)) return scrollPositions.get(path);
  return 0;
}

export function scrollToTopInstant() {
  if (typeof window === 'undefined') return;
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch (e) {
    window.scrollTo(0, 0);
  }
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

export function restoreScrollPosition(y) {
  if (typeof window === 'undefined') return;
  const targetY = Math.max(0, Number(y) || 0);
  try {
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
  } catch (e) {
    window.scrollTo(0, targetY);
  }
  if (document.documentElement) document.documentElement.scrollTop = targetY;
  if (document.body) document.body.scrollTop = targetY;
}
