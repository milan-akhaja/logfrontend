/**
 * Product sizes.
 *
 * Sizes used to be the literal list ['S','M','L','XL'] repeated in seven
 * places. They now come from the product itself, so a product can carry XXL,
 * XS, Free Size or anything else the admin defines — no code change needed.
 *
 * Mirrors the ordering in the backend's src/catalog.js. Keep the two in step.
 */

export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

const SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL',
  'FREE', 'ONE SIZE'
];

/** Sort size names small-to-large; unrecognised ones go last, alphabetically. */
export function orderSizes(names) {
  const known = [];
  const unknown = [];
  for (const name of names) {
    (SIZE_ORDER.includes(name) ? known : unknown).push(name);
  }
  known.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
  unknown.sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
}

/**
 * The sizes a product actually comes in, in display order.
 *
 * Handles both shapes seen in the wild: the usual { S: 3, M: 0 } map, and the
 * array form some older records use. Falls back to the classic four only when
 * a product carries no size data at all, so nothing renders empty.
 */
export function productSizes(product) {
  const raw = product?.sizes;

  if (Array.isArray(raw)) {
    const names = raw.map((s) => String(s || '').trim().toUpperCase()).filter(Boolean);
    return names.length ? orderSizes([...new Set(names)]) : DEFAULT_SIZES;
  }

  if (raw && typeof raw === 'object') {
    const names = Object.keys(raw).map((s) => String(s || '').trim().toUpperCase()).filter(Boolean);
    return names.length ? orderSizes([...new Set(names)]) : DEFAULT_SIZES;
  }

  return DEFAULT_SIZES;
}

/** Stock for one size. Arrays carry no counts, so treat a listed size as available. */
export function sizeStock(product, size) {
  const raw = product?.sizes;
  if (Array.isArray(raw)) return raw.includes(size) ? 1 : 0;
  if (raw && typeof raw === 'object') return Math.max(0, Number(raw[size]) || 0);
  return 0;
}
