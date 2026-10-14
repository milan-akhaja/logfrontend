export function canTrackGA4() {
  if (typeof window === 'undefined') return false;
  const isAnalyticsHost = Boolean(
    window.__LOG_ANALYTICS_HOST__ || /(^|\.)logcloth\.com$/i.test(window.location.hostname)
  );
  const isAdmin = window.location.pathname.startsWith('/admin');
  return !isAdmin && isAnalyticsHost && Boolean(window.gtag) && Boolean(window.__LOG_STATIC_GA4_ID);
}

export function trackGA4Event(name, payload = {}) {
  if (!canTrackGA4()) return;
  window.gtag('event', name, {
    send_to: window.__LOG_STATIC_GA4_ID,
    ...payload
  });
}

export function trackPurchase(order) {
  if (!order || !canTrackGA4()) return;
  const orderId = String(order.id || order.transaction_id || '');
  if (!orderId) return;

  const storageKey = `log_ga4_order_${orderId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
  } catch {}

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

  try {
    sessionStorage.setItem(storageKey, '1');
  } catch {}

  if (window.dataLayer) {
    window.dataLayer.push({ event: 'purchase', ...payload });
  }

  trackGA4Event('purchase', payload);
}
