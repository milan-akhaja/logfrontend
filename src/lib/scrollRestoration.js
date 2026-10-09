// Scroll Restoration Management for SPA Navigation

const scrollPositions = new Map();

// Load any previously persisted scroll positions from sessionStorage
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem('log_scroll_positions');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => {
        if (Number(v) > 0) scrollPositions.set(k, Number(v));
      });
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

export function saveScrollPosition(key, path, forcedY) {
  if (typeof window === 'undefined') return;
  const currentY = window.scrollY || window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  const y = forcedY !== undefined ? Math.max(0, Number(forcedY) || 0) : currentY;

  // CRITICAL: If y is 0, never wipe out a known positive scroll position for that path/key
  // (e.g. when unmounting or transitioning when another component already called scrollToTop)
  if (y === 0) {
    const existing = (key && scrollPositions.get(key)) || (path && scrollPositions.get(path)) || 0;
    if (existing > 0) {
      return;
    }
  }

  if (key) scrollPositions.set(key, y);
  if (path) scrollPositions.set(path, y);
  persistPositions();

  // Route-specific quick fallbacks for home and shop
  const basePath = (path || '').split('?')[0];
  if (basePath === '/') {
    sessionStorage.setItem('log_home_scroll', String(y));
  } else if (basePath === '/shop') {
    sessionStorage.setItem('log_shop_scroll', String(y));
  }
  if (y > 0) {
    sessionStorage.setItem('log_last_scroll_y', String(y));
  }
}

export function getSavedScrollPosition(key, path) {
  if (typeof window === 'undefined') return 0;
  let val = 0;
  if (key && scrollPositions.has(key)) val = scrollPositions.get(key);
  else if (path && scrollPositions.has(path)) val = scrollPositions.get(path);

  // Fallback to route-specific storage if 0 or missing
  const basePath = (path || '').split('?')[0];
  if (!val || val === 0) {
    if (basePath === '/') {
      val = Number(sessionStorage.getItem('log_home_scroll') || 0);
    } else if (basePath === '/shop') {
      val = Number(sessionStorage.getItem('log_shop_scroll') || 0);
    }
  }
  if (!val || val === 0) {
    val = Number(sessionStorage.getItem('log_last_scroll_y') || 0);
  }
  return Math.max(0, Number(val) || 0);
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
