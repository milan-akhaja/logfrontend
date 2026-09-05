/**
 * Shared product list.
 *
 * The homepage used to request /api/products twice on a single load - once for
 * the catalog grid and once for the footer's category and colour lists. The
 * search overlay adds a third. This hands every caller the same in-flight
 * request, and reuses the result for a short window afterwards.
 *
 * Deliberately short-lived: stock and prices change, and a stale list would
 * show sold-out sizes as available.
 */

const TTL_MS = 60 * 1000;

let cached = null;      // { at: number, data: object[] }
let inFlight = null;    // Promise<object[]>

export function getProducts({ force = false } = {}) {
  const now = Date.now();

  if (!force && cached && now - cached.at < TTL_MS) {
    return Promise.resolve(cached.data);
  }

  // A second caller while a request is open joins that request rather than
  // starting another one.
  if (!force && inFlight) {
    return inFlight;
  }

  inFlight = fetch('/api/products')
    .then((res) => {
      if (!res.ok) throw new Error(`Products request failed with status ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      cached = { at: Date.now(), data: list };
      return list;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

// Call after anything that changes the catalog (admin save) so the next read
// goes back to the network.
export function invalidateProducts() {
  cached = null;
}
