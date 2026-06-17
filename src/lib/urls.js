const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');
const appBaseUrl = import.meta.env.BASE_URL || '/';

function isBackendPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/uploads' || pathname.startsWith('/uploads/');
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(value) || /^(?:mailto|tel):/i.test(value);
}

export function apiUrl(input) {
  if (!apiBaseUrl || typeof input !== 'string') {
    return input;
  }

  if (isExternalUrl(input)) {
    try {
      const url = new URL(input, window.location.origin);
      if (url.origin === window.location.origin && isBackendPath(url.pathname)) {
        return `${apiBaseUrl}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return input;
    }
    return input;
  }

  if (isBackendPath(input)) {
    return `${apiBaseUrl}${input}`;
  }

  return input;
}

export function mediaUrl(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  return apiUrl(input);
}

export function appPath(path = '/') {
  if (!path || typeof path !== 'string') {
    return path;
  }
  if (path.startsWith('#') || isExternalUrl(path)) {
    return path;
  }

  const normalizedBase = appBaseUrl.endsWith('/') ? appBaseUrl : `${appBaseUrl}/`;
  if (path.startsWith('/')) {
    return `${normalizedBase.replace(/\/$/, '')}${path}`;
  }
  return `${normalizedBase}${path}`;
}

export function routerBasename() {
  return appBaseUrl === '/' ? undefined : appBaseUrl.replace(/\/$/, '');
}

export function configureApiClient() {
  if (typeof window === 'undefined' || window.__logApiClientConfigured) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(apiUrl(input), init);
    }
    if (input instanceof Request) {
      return originalFetch(new Request(apiUrl(input.url), input), init);
    }
    return originalFetch(input, init);
  };

  window.__logApiClientConfigured = true;
}
