export function getSavedConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = decodeURIComponent(document?.cookie || '');
    const match = raw.match(/cookieyes-consent=([^;]+)/);
    if (!match) return null;
    const val = match[1];
    return {
      analytics: /analytics:yes/.test(val),
      marketing: /advertisement:yes/.test(val)
    };
  } catch {
    return null;
  }
}

export function saveConsent({ analytics, marketing }) {
  if (typeof window === 'undefined') return;
  const isAnalytics = Boolean(analytics);
  const isMarketing = Boolean(marketing);
  const cookieVal = `consentid:${Date.now()},consent:yes,action:yes,necessary:yes,functional:yes,analytics:${isAnalytics ? 'yes' : 'no'},performance:yes,advertisement:${isMarketing ? 'yes' : 'no'}`;
  const maxAge = 365 * 24 * 60 * 60; // 12 months
  document.cookie = `cookieyes-consent=${cookieVal}; path=/; max-age=${maxAge}; SameSite=Lax`;

  window.__LOG_GA4_CONSENT_GRANTED__ = isAnalytics;
  window.__LOG_META_CONSENT_GRANTED__ = isMarketing;

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: isAnalytics ? 'granted' : 'denied',
      ad_storage: isMarketing ? 'granted' : 'denied',
      ad_user_data: isMarketing ? 'granted' : 'denied',
      ad_personalization: isMarketing ? 'granted' : 'denied'
    });
  }

  if (typeof window.fbq === 'function') {
    if (isMarketing) {
      window.fbq('consent', 'grant');
    } else {
      window.fbq('consent', 'revoke');
    }
  }

  try {
    document.dispatchEvent(new CustomEvent('cookieyes_consent_update', {
      detail: {
        accepted: [
          'necessary',
          ...(isAnalytics ? ['analytics'] : []),
          ...(isMarketing ? ['advertisement'] : [])
        ],
        rejected: [
          ...(!isAnalytics ? ['analytics'] : []),
          ...(!isMarketing ? ['advertisement'] : [])
        ],
        analytics: isAnalytics ? 'yes' : 'no',
        advertisement: isMarketing ? 'yes' : 'no'
      }
    }));
  } catch {}
}

export function hasGA4Consent() {
  if (typeof window === 'undefined') return false;
  if (window.__LOG_GA4_CONSENT_GRANTED__ === true) return true;
  if (window.__LOG_GA4_CONSENT_GRANTED__ === false) return false;
  try {
    const raw = decodeURIComponent(document?.cookie || '');
    return /cookieyes-consent[^;]*analytics:yes/.test(raw);
  } catch {
    return false;
  }
}

export function isAdminUser() {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname.startsWith('/admin')) return true;
  try {
    return Boolean(
      sessionStorage.getItem('admin_token') ||
      localStorage.getItem('admin_token')
    );
  } catch {
    return false;
  }
}

export function canTrackGA4() {
  if (typeof window === 'undefined') return false;
  const isAnalyticsHost = Boolean(
    window.__LOG_ANALYTICS_HOST__ || /(^|\.)logcloth\.com$/i.test(window.location.hostname)
  );
  const isAdmin = isAdminUser();
  return !isAdmin && isAnalyticsHost && Boolean(window.gtag) && Boolean(window.__LOG_STATIC_GA4_ID) && hasGA4Consent();
}

export function hasMetaConsent() {
  if (typeof window === 'undefined') return false;
  if (window.__LOG_META_CONSENT_GRANTED__ === true) return true;
  if (window.__LOG_META_CONSENT_GRANTED__ === false) return false;
  try {
    const raw = decodeURIComponent(document?.cookie || '');
    return /cookieyes-consent[^;]*advertisement:yes/.test(raw);
  } catch {
    return false;
  }
}

export function canTrackMeta() {
  if (typeof window === 'undefined') return false;
  const isAnalyticsHost = Boolean(
    window.__LOG_ANALYTICS_HOST__ || /(^|\.)logcloth\.com$/i.test(window.location.hostname)
  );
  const isAdmin = isAdminUser();
  const hasPixelId = Boolean(window.__LOG_STATIC_META_PIXEL_ID || '1398026158457517');
  const hasFbq = typeof window.fbq === 'function';
  return !isAdmin && isAnalyticsHost && hasFbq && hasPixelId && hasMetaConsent();
}

export function trackGA4Event(name, payload = {}) {
  if (!canTrackGA4()) return;
  window.gtag('event', name, {
    send_to: window.__LOG_STATIC_GA4_ID,
    ...payload
  });
}

export function trackMetaEvent(name, params = {}, eventId = null) {
  try {
    if (!canTrackMeta()) return;
    if (eventId) {
      window.fbq('track', name, params, { eventID: String(eventId) });
    } else {
      window.fbq('track', name, params);
    }
  } catch {}
}

export function trackPurchase(order) {
  if (!order) return;
  const orderId = String(order.id || order.transaction_id || '');
  if (!orderId) return;

  // 1. GA4 Purchase: uses analytics consent, dedupes with log_ga4_order_<id>, set only after sending
  if (canTrackGA4()) {
    const ga4Key = `log_ga4_order_${orderId}`;
    let ga4Sent = false;
    try {
      ga4Sent = Boolean(sessionStorage.getItem(ga4Key));
    } catch {}

    if (!ga4Sent) {
      const items = Array.isArray(order.items)
        ? order.items.map((item) => ({
            item_id: String(item.id || item.item_id || ''),
            item_name: String(item.name || item.item_name || ''),
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            item_variant: String(item.selectedSize || item.selectedSize1 || item.item_variant || '')
          }))
        : [];

      const payload = {
        transaction_id: orderId,
        value: Number(order.total ?? order.value ?? 0),
        currency: 'INR',
        items
      };

      if (window.dataLayer) {
        window.dataLayer.push({ event: 'purchase', ...payload });
      }

      trackGA4Event('purchase', payload);

      try {
        sessionStorage.setItem(ga4Key, '1');
      } catch {}
    }
  }

  // 2. Meta Purchase: uses marketing consent, dedupes with log_meta_order_<id>, set only after sending
  if (canTrackMeta()) {
    const metaKey = `log_meta_order_${orderId}`;
    let metaSent = false;
    try {
      metaSent = Boolean(sessionStorage.getItem(metaKey));
    } catch {}

    if (!metaSent) {
      const contentIds = Array.isArray(order.items)
        ? order.items.map((item) => String(item.id || item.item_id || '')).filter(Boolean)
        : [];
      const numItems = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
        : 0;

      trackMetaEvent('Purchase', {
        value: Number(order.total ?? order.value ?? 0),
        currency: 'INR',
        content_ids: contentIds,
        content_type: 'product',
        num_items: numItems
      }, orderId);

      try {
        sessionStorage.setItem(metaKey, '1');
      } catch {}
    }
  }
}
