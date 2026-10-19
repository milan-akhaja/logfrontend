import { useEffect, useState } from 'react';

const DEFAULT_CONFIG = { enabled: false, amountInr: 100 };
let currentConfig = { ...DEFAULT_CONFIG };
let listeners = new Set();
let fetchPromise = null;

export async function fetchCodAdvanceConfig() {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/cod-advance-config');
      if (res && res.ok) {
        const data = await res.json();
        currentConfig = {
          enabled: Boolean(data && data.enabled),
          amountInr: typeof data?.amountInr === 'number' && !isNaN(data.amountInr) ? data.amountInr : 100
        };
      } else {
        currentConfig = { ...DEFAULT_CONFIG };
      }
    } catch (err) {
      currentConfig = { ...DEFAULT_CONFIG };
    } finally {
      fetchPromise = null;
    }

    listeners.forEach((listener) => {
      try {
        listener(currentConfig);
      } catch (e) {}
    });

    return currentConfig;
  })();

  return fetchPromise;
}

export function resetCodAdvanceConfigForTesting() {
  currentConfig = { ...DEFAULT_CONFIG };
  fetchPromise = null;
  listeners.forEach((listener) => {
    try {
      listener(currentConfig);
    } catch (e) {}
  });
}

export function useCodAdvance() {
  const [config, setConfig] = useState(() => currentConfig);

  useEffect(() => {
    listeners.add(setConfig);
    fetchCodAdvanceConfig();
    return () => {
      listeners.delete(setConfig);
    };
  }, []);

  return config;
}

export { useCodAdvance as useCodAdvanceConfig };
export default useCodAdvance;
