// Coupons shown in the bag and on product pages. The server owns the rules
// (Admin > Coupons); these helpers only describe them. If the list cannot be
// loaded, the two original offers are shown so the bag never looks empty by accident.

const RUPEE = '₹';
const TTL_MS = 60 * 1000;

export const FALLBACK_COUPONS = [
  {
    code: 'PREPAID15',
    label: 'Prepaid: 15% off',
    discountType: 'percent',
    discountValue: 15,
    allowCod: false,
    allowPrepaid: true,
    firstOrderOnly: false,
    productIds: [],
    minOrderValue: 0
  },
  {
    code: 'FIRST10',
    label: 'First order: 10% off',
    discountType: 'percent',
    discountValue: 10,
    allowCod: true,
    allowPrepaid: true,
    firstOrderOnly: true,
    productIds: [],
    minOrderValue: 0
  }
];

let cached = null;

export async function getCoupons() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.list;
  try {
    const res = await fetch('/api/coupons');
    if (!res || !res.ok) return FALLBACK_COUPONS;
    const data = await res.json();
    if (!data || !Array.isArray(data.coupons)) return FALLBACK_COUPONS;
    cached = { at: Date.now(), list: data.coupons };
    return cached.list;
  } catch {
    return FALLBACK_COUPONS;
  }
}

export function invalidateCoupons() {
  cached = null;
}

// A code typed by the shopper. Returns { coupon } or { error }.
export async function lookupCoupon(code) {
  try {
    const res = await fetch(`/api/coupons/${encodeURIComponent(code)}`);
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (res.ok && data && data.coupon) return { coupon: data.coupon };
    return { error: (data && data.error) || 'This coupon code is not valid.' };
  } catch {
    return { error: 'Could not check this code. Please try again.' };
  }
}

const num = (value) => String(Number(value || 0));
const isPrepaidOnly = (def) => def.allowCod === false;
const isCodOnly = (def) => def.allowPrepaid === false;

export function couponBadge(def) {
  return def.discountType === 'flat' ? `${RUPEE}${num(def.discountValue)} OFF` : `${num(def.discountValue)}% OFF`;
}

export function couponBlockedForPayment(def, isCod) {
  if (!def) return false;
  return isCod ? isPrepaidOnly(def) : isCodOnly(def);
}

export function couponAppliesToProduct(def, productId) {
  return !Array.isArray(def.productIds) || def.productIds.length === 0 || def.productIds.includes(String(productId));
}

export function couponAppliesToCart(def, cart) {
  if (!Array.isArray(def.productIds) || def.productIds.length === 0) return true;
  return cart.some((item) => def.productIds.includes(String(item.id)));
}

// Short note under the code on a bag tile.
export function couponTileNote(def) {
  const parts = [];
  if (def.firstOrderOnly) parts.push('First order');
  if (isPrepaidOnly(def)) parts.push('When you pay online');
  else if (isCodOnly(def)) parts.push('Cash on Delivery only');
  else parts.push('COD or online');
  if (Array.isArray(def.productIds) && def.productIds.length) parts.push('Selected designs');
  if (Number(def.minOrderValue) > 0) parts.push(`Min order ${RUPEE}${num(def.minOrderValue)}`);
  return parts.join(', ');
}

// Subtitle on a checkout offer card: "15% OFF on prepaid orders".
export function couponSubtitle(def) {
  const on = [];
  if (def.firstOrderOnly) on.push('first order');
  if (isPrepaidOnly(def)) on.push('prepaid orders');
  else if (isCodOnly(def)) on.push('Cash on Delivery orders');
  if (Array.isArray(def.productIds) && def.productIds.length) on.push('selected designs');
  if (Number(def.minOrderValue) > 0) on.push(`orders above ${RUPEE}${num(def.minOrderValue)}`);
  return on.length ? `${couponBadge(def)} on ${on.join(' + ')}` : couponBadge(def);
}

// Pill and sentence used on the product page offer cards.
export function couponPill(def) {
  if (def.firstOrderOnly) return 'FIRST ORDER';
  if (isPrepaidOnly(def)) return 'PREPAID OFFER';
  if (isCodOnly(def)) return 'COD OFFER';
  return 'OFFER';
}

export function couponOfferWhere(def) {
  let where = '';
  if (def.firstOrderOnly) {
    where = ' on your first order';
    if (isPrepaidOnly(def)) where += ' (prepaid)';
    else if (isCodOnly(def)) where += ' (COD)';
    else where += ' (COD or prepaid)';
  } else if (isPrepaidOnly(def)) {
    where = ' on prepaid orders';
  } else if (isCodOnly(def)) {
    where = ' on Cash on Delivery orders';
  }
  if (Array.isArray(def.productIds) && def.productIds.length) where += ' on selected designs';
  if (Number(def.minOrderValue) > 0) where += ` above ${RUPEE}${num(def.minOrderValue)}`;
  return where;
}
