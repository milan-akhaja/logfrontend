export function canTrackGA4() {
  if (typeof window === 'undefined') return false;
  const isAnalyticsHost = Boolean(
    window.__LOG_ANALYTICS_HOST__ || /(^|\.)logcloth\.com$/i.test(window.location.hostname)
  );
  const isAdmin = window.location.pathname.startsWith('/admin');
  return !isAdmin && isAnalyticsHost && Boolean(window.gtag) && Boolean(window.__LOG_STATIC_GA4_ID);
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
  const isAdmin = window.location.pathname.startsWith('/admin');
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

  const canGA4 = canTrackGA4();
  const canMeta = canTrackMeta();
  if (!canGA4 && !canMeta) return;

  const storageKey = `log_ga4_order_${orderId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
  } catch {}

  try {
    sessionStorage.setItem(storageKey, '1');
  } catch {}

  if (canGA4) {
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
  }

  if (canMeta) {
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
  }
}
