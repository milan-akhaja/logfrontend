import { useEffect, useState } from 'react';

// Matches the `.mobile-only` / `.pc-only` breakpoint in index.css. Keep the two
// in sync - this hook exists so we can mount one hero instead of rendering both
// and hiding one with CSS, which still downloads both images (F25).
export const MOBILE_BREAKPOINT = 767;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function readMatch() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(QUERY);
    const onChange = (event) => setIsMobile(event.matches);

    // Re-read on mount in case the viewport changed before the listener attached.
    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    }

    // Safari < 14
    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return isMobile;
}
