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
  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const shouldRetry = (method, response, error) => {
    const safeMethod = method === 'GET' || method === 'HEAD';
    if (!safeMethod) return false;
    if (error) return true;
    return response && [408, 425, 429, 500, 502, 503, 504].includes(response.status);
  };

  window.fetch = async (input, init = {}) => {
    let requestInput = input;
    if (typeof input === 'string') {
      requestInput = apiUrl(input);
    } else if (input instanceof Request) {
      requestInput = new Request(apiUrl(input.url), input);
    }

    const method = String(init.method || (requestInput instanceof Request ? requestInput.method : 'GET') || 'GET').toUpperCase();
    const retries = init.retries ?? (method === 'GET' || method === 'HEAD' ? 2 : 0);
    const timeoutMs = init.timeoutMs ?? (method === 'GET' || method === 'HEAD' ? 12000 : 30000);
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await originalFetch(requestInput, {
          ...init,
          signal: init.signal || controller.signal
        });
        window.clearTimeout(timeoutId);
        if (attempt < retries && shouldRetry(method, response, null)) {
          await sleep(350 * (attempt + 1));
          continue;
        }
        return response;
      } catch (error) {
        window.clearTimeout(timeoutId);
        lastError = error;
        if (init.signal?.aborted || attempt >= retries || !shouldRetry(method, null, error)) {
          throw error;
        }
        await sleep(350 * (attempt + 1));
      }
    }
    throw lastError;
  };

  window.__logApiClientConfigured = true;
}
