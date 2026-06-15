const normalizedBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  if (!normalizedBaseUrl || typeof path !== 'string') {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith('/api') || path.startsWith('/uploads')) {
    return `${normalizedBaseUrl}${path}`;
  }
  return path;
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
