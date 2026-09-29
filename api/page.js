/**
 * Server-rendered <head> and fallback content for every page.
 *
 * The site is a browser-only React app, so the HTML file on its own is an empty
 * shell: search engines see no product and WhatsApp / Instagram link previews
 * show the homepage for every link. vercel.json sends page requests here. This
 * takes the built index.html, fills in the real title, description, canonical,
 * Open Graph / Twitter tags and Product structured data, and puts readable
 * content inside #root. React replaces that content as soon as it loads.
 *
 * Every figure comes from the same /api/products response the site itself uses.
 * If anything goes wrong - template missing, API slow or down - the visitor gets
 * exactly the page they got before this existed.
 */

import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://logcloth.com';
const API_URL = 'https://api.logcloth.com/api/products';
const DROP_NAME = 'No Permission 3.0';
const DROP_PIECES = 40;
const HOME_TITLE = 'LOG Clothing — Numbered Streetwear Drops | No Permission 3.0';
const DESCRIPTION_MAX = 155;
const PRODUCTS_TTL_MS = 60 * 1000;
const API_TIMEOUT_MS = 2500;

// Same titles and descriptions the React routes set in App.jsx, so the HTML a
// crawler reads matches what the page says once JavaScript runs.
const STATIC_PAGES = {
  '/shop': ['Shop Oversized T-Shirts, Graphic Tees & Streetwear | LOG', 'Shop LOG premium Indian streetwear: oversized T-shirts, graphic tees, relaxed fits, and heavyweight cotton essentials delivered across India.'],
  '/new-in': ['New In - Latest LOG Streetwear Drops', 'Explore the newest LOG streetwear drops, oversized graphic T-shirts, fresh fits, and limited collection releases.'],
  '/our-mission': ['Our Mission - Streetwear With a Conscience | LOG', 'Learn how LOG combines premium Indian streetwear with a fixed Rs. 23 charity contribution from every product.'],
  '/log-book': ['LOG Book - Streetwear Stories, Lookbook & Impact', 'Read LOG Book for streetwear styling, collection stories, lookbook editorials, and social impact updates from LOG.'],
  '/refund-policy': ['Refund & Exchange Policy | LOG', "Read LOG's return, refund, exchange, and charity donation policy for orders across India."],
  '/make-return': ['Make a Return or Exchange | LOG', 'Request a LOG return, refund, or size exchange for eligible orders within the return window.'],
  '/shipping-policy': ['Shipping Policy | LOG', 'Read LOG shipping timelines, delivery details, and support information for Indian streetwear orders.'],
  '/faqs': ['FAQs - LOG Clothing', 'Answers to common LOG questions about orders, sizing, shipping, returns, exchanges, and charity donations.'],
  '/terms': ['Terms & Conditions | LOG', 'Read the LOG website terms and conditions for shopping, payments, returns, and use of logcloth.com.'],
  '/privacy-policy': ['Privacy Policy | LOG', 'Read how LOG Clothing collects, uses, protects, shares, and retains customer information for orders and support.']
};

let template = null;
let productsCache = null; // { at, data }

function loadTemplate() {
  if (template) return template;
  const candidates = [
    path.join(process.cwd(), 'dist', 'index.html'),
    new URL('../dist/index.html', import.meta.url)
  ];
  for (const candidate of candidates) {
    try {
      template = fs.readFileSync(candidate, 'utf8');
      return template;
    } catch { /* try the next location */ }
  }
  return null;
}

async function loadProducts() {
  if (productsCache && Date.now() - productsCache.at < PRODUCTS_TTL_MS) return productsCache.data;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`products ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('products not a list');
    productsCache = { at: Date.now(), data };
    return data;
  } catch {
    // A stale list beats no list; null means "unknown", never "empty shop".
    return productsCache ? productsCache.data : null;
  } finally {
    clearTimeout(timer);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonLdScript(data) {
  // "<" escaped so product text can never close the script tag.
  return `<script type="application/ld+json" data-seo="page-jsonld">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function truncate(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function colourOf(product) {
  const colour = Array.isArray(product.colors) ? product.colors.find(Boolean) : '';
  return colour ? String(colour).trim().toLowerCase() : '';
}

function isDropProduct(product) {
  return Number(product.is_preorder || 0) === 1;
}

function productImages(product) {
  const list = Array.isArray(product.imageUrls) && product.imageUrls.length ? product.imageUrls : [product.imageUrl];
  return [...new Set(list.filter((url) => typeof url === 'string' && /^https?:\/\//.test(url)))];
}

// What the customer pays right now: the pre-order price inside the window.
function currentPrice(product) {
  return product.preorderPrice !== null && product.preorderPrice !== undefined
    ? Number(product.preorderPrice)
    : Number(product.price || 0);
}

// PreOrder for the whole drop until the window closes, InStock after it,
// SoldOut once every numbered piece is claimed. Keep in step with
// ProductDetail.jsx, which sets the same data once JavaScript runs.
function availabilityOf(product) {
  if (product.isPreorder === true) {
    if (product.soldOut === true) return 'SoldOut';
    return product.preorderPhase === 'after' ? 'InStock' : 'PreOrder';
  }
  return Number(product.stock || 0) > 0 ? 'InStock' : 'OutOfStock';
}

const AVAILABILITY_LABEL = { PreOrder: 'Pre-order', InStock: 'In stock', SoldOut: 'Sold out', OutOfStock: 'Out of stock' };

function productTitle(product) {
  return isDropProduct(product)
    ? `${product.name} — Oversized 240 GSM Tee | LOG Clothing`
    : `${product.name} | LOG Clothing`;
}

function productDescription(product) {
  const colour = colourOf(product);
  if (isDropProduct(product)) {
    return truncate(
      `${product.name} — oversized ${colour ? `${colour} ` : ''}tee, 240 GSM. One of ${DROP_PIECES} numbered pieces from the ${DROP_NAME} drop by LOG Clothing.`,
      DESCRIPTION_MAX
    );
  }
  return truncate(
    `${product.name}${colour ? ` in ${colour}` : ''} from LOG Clothing. ${product.description || product.desc || ''}`,
    DESCRIPTION_MAX
  );
}

function imageAlt(product) {
  const colour = colourOf(product);
  return colour ? `${product.name} – ${colour}` : product.name;
}

// Shipping and returns, exactly as the policy states and nothing more.
// Drop pieces are exchange-only: schema.org has no "exchange only" category,
// and a 7-day window with an exchange refund type can be shown by Google as
// "7-day returns", which would be false. NotPermitted is the honest choice;
// the size exchange is explained on the page itself.
// Normal products: 7-day window; the ₹23 kept from a customer-initiated
// refund is the closest thing schema.org has to it, a restocking fee; a
// defective item comes back free (full refund when the fault is ours).
// Delivery time and return method are left out - the policy does not state them.
function offerPolicies(product) {
  const returnPolicy = product.isPreorder === true
    ? {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${SITE_URL}/refund-policy`
    }
    : {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      restockingFee: { '@type': 'MonetaryAmount', value: 23, currency: 'INR' },
      itemDefectReturnFees: 'https://schema.org/FreeReturn',
      merchantReturnLink: `${SITE_URL}/refund-policy`
    };
  return {
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' }
    },
    hasMerchantReturnPolicy: returnPolicy
  };
}

function productJsonLd(product, url) {
  const images = productImages(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images.length ? images : [`${SITE_URL}/logo-512.png`],
    description: productDescription(product),
    sku: String(product.id),
    ...(colourOf(product) ? { color: colourOf(product) } : {}),
    brand: { '@type': 'Brand', name: 'LOG Clothing' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: currentPrice(product),
      availability: `https://schema.org/${availabilityOf(product)}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
      ...offerPolicies(product)
    }
  };
}

// Same phone-sized copies the app asks for (src/lib/urls.js), so the browser
// downloads one image here and reuses it when React takes over the page.
function srcSetAttr(url) {
  if (!/\/uploads\/[^?#]+\.webp$/i.test(url) || /-\d+w\.webp$/i.test(url)) return '';
  const set = [400, 800]
    .map((width) => `${url.replace(/\.webp$/i, `-${width}w.webp`)} ${width}w`)
    .concat(`${url} 1600w`)
    .join(', ');
  return ` srcset="${escapeHtml(set)}" sizes="(max-width: 768px) 100vw, 50vw"`;
}

function productBody(product) {
  const price = currentPrice(product);
  const original = Number(product.price || 0);
  const availability = availabilityOf(product);
  const alt = imageAlt(product);
  const details = String(product.details || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const claimed = Number.isFinite(Number(product.piecesClaimed)) && Number(product.piecesTotal) > 0
    ? `<p>${Number(product.piecesClaimed)} / ${Number(product.piecesTotal)} claimed</p>`
    : '';
  return `<main>
  <p><a href="/">LOG Clothing</a></p>
  <article>
    <h1>${escapeHtml(product.name)}</h1>
    <p>${escapeHtml(formatInr(price))}${price !== original ? ` <s>${escapeHtml(formatInr(original))}</s>` : ''} · ${AVAILABILITY_LABEL[availability]}</p>
    ${isDropProduct(product) ? `<p>Oversized tee · 240 GSM · ${DROP_PIECES} numbered pieces · ${escapeHtml(DROP_NAME)}</p>${claimed}` : ''}
    ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}
    ${details.length ? `<ul>${details.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}
    ${productImages(product).map((url, index) => `<img src="${escapeHtml(url)}"${srcSetAttr(url)} alt="${escapeHtml(alt)}"${index ? ' loading="lazy"' : ' fetchpriority="high"'}>`).join('\n    ')}
  </article>
</main>`;
}

function homeBody(products, description) {
  const items = (products || []).map((product) => {
    const price = currentPrice(product);
    return `<li><a href="/product/${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a> — ${escapeHtml(formatInr(price))} · ${AVAILABILITY_LABEL[availabilityOf(product)]}</li>`;
  });
  return `<main>
  <h1>LOG Clothing</h1>
  <p>${escapeHtml(description)}</p>
  ${items.length ? `<ul>${items.join('')}</ul>` : ''}
</main>`;
}

function setTitle(html, title) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="title" content="[^"]*">/, `<meta name="title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
}

function setDescription(html, description) {
  return html
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
}

function setUrl(html, url) {
  return html
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeHtml(url)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeHtml(url)}">`)
    .replace(/<meta name="twitter:url" content="[^"]*">/, `<meta name="twitter:url" content="${escapeHtml(url)}">`);
}

function setImage(html, image, alt) {
  return html
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeHtml(image)}">\n  <meta property="og:image:alt" content="${escapeHtml(alt)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${escapeHtml(image)}">`);
}

function setRobots(html, content) {
  return html.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${content}">`);
}

function addToHead(html, extra) {
  return html.replace('</head>', `${extra}\n</head>`);
}

function setBody(html, content) {
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

function templateDescription(html) {
  const match = html.match(/<meta name="description" content="([^"]*)">/);
  return match ? match[1].replace(/&amp;/g, '&') : '';
}

function normalisePath(raw) {
  let value = String(raw || '/');
  try { value = decodeURIComponent(value); } catch { /* keep as sent */ }
  value = `/${value.replace(/^\/+/, '')}`.split('?')[0];
  return value.length > 1 ? value.replace(/\/+$/, '') : '/';
}

async function renderPage(pagePath) {
  const base = loadTemplate();
  if (!base) return null;

  if (pagePath === '/') {
    const products = await loadProducts();
    let html = setTitle(base, HOME_TITLE);
    html = setUrl(html, `${SITE_URL}/`);
    html = setBody(html, homeBody(products, templateDescription(base)));
    return { status: 200, html };
  }

  const productMatch = pagePath.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const products = await loadProducts();
    // Product list unavailable: serve the plain shell rather than a false 404.
    if (!products) return { status: 200, html: setUrl(base, `${SITE_URL}${pagePath}`) };
    const product = products.find((p) => String(p.id) === productMatch[1]);
    if (!product) return notFound(base);
    const url = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
    const images = productImages(product);
    let html = setTitle(base, productTitle(product));
    html = setDescription(html, productDescription(product));
    html = setUrl(html, url);
    if (images[0]) html = setImage(html, images[0], imageAlt(product));
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="product">');
    html = addToHead(html, [
      `  <meta property="product:price:amount" content="${currentPrice(product)}">`,
      '  <meta property="product:price:currency" content="INR">',
      `  ${jsonLdScript(productJsonLd(product, url))}`
    ].join('\n'));
    html = setBody(html, productBody(product));
    return { status: 200, html };
  }

  if (STATIC_PAGES[pagePath]) {
    const [title, description] = STATIC_PAGES[pagePath];
    let html = setTitle(base, title);
    html = setDescription(html, description);
    html = setUrl(html, `${SITE_URL}${pagePath}`);
    return { status: 200, html };
  }

  if (pagePath === '/admin') {
    return { status: 200, html: setRobots(setUrl(base, `${SITE_URL}/admin`), 'noindex, nofollow') };
  }

  if (/^\/blog\/[^/]+$/.test(pagePath)) {
    return { status: 200, html: setUrl(base, `${SITE_URL}${pagePath}`) };
  }

  return notFound(base);
}

// Real 404 status. The body is still the app, which shows its own Not Found page.
function notFound(base) {
  let html = setTitle(base, 'Page not found | LOG Clothing');
  html = setRobots(html, 'noindex, follow');
  html = html.replace(/\s*<link rel="canonical" href="[^"]*">/, '');
  return { status: 404, html };
}

async function renderSitemap() {
  const products = await loadProducts();
  const staticPaths = ['/', ...Object.keys(STATIC_PAGES)];
  const urls = staticPaths.map((pagePath) => `  <url><loc>${SITE_URL}${pagePath}</loc></url>`);
  for (const product of products || []) {
    const lastmod = product.updated_at ? String(product.updated_at).slice(0, 10) : '';
    urls.push(`  <url><loc>${SITE_URL}/product/${encodeURIComponent(product.id)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export default async function handler(req, res) {
  const query = req.query || {};
  try {
    if (query.sitemap) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
      res.status(200).send(await renderSitemap());
      return;
    }

    const page = await renderPage(normalisePath(query.p));
    const html = page ? page.html : loadTemplate();
    if (!html) {
      res.status(500).send('Page unavailable');
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.status(page ? page.status : 200).send(html);
  } catch {
    const fallback = loadTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (fallback) {
      res.status(200).send(fallback);
    } else {
      res.status(500).send('Page unavailable');
    }
  }
}
