import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://logcloth.com';
const DEFAULT_TITLE = 'LOG - Premium Indian Streetwear & Oversized T-Shirts';
const DEFAULT_DESCRIPTION = 'Shop LOG premium Indian streetwear: oversized graphic T-shirts, heavyweight cotton fits, and socially responsible fashion with Rs. 23 donated from every product.';
const DEFAULT_IMAGE = `${SITE_URL}/assets/hero_streetwear.png`;

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let element = document.head.querySelector(`script[data-seo="${id}"]`);
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.setAttribute('data-seo', id);
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  canonicalPath,
  jsonLd
}) {
  const location = useLocation();
  const path = canonicalPath || `${location.pathname}${location.search}`;
  const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path}`;
  const fullTitle = title.includes('LOG') ? title : `${title} | LOG`;

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('meta[name="title"]', { name: 'title', content: fullTitle });
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="keywords"]', {
      name: 'keywords',
      content: Array.isArray(keywords) ? keywords.filter(Boolean).join(', ') : String(keywords || '')
    });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });

    upsertLink('canonical', canonicalUrl);

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });

    upsertMeta('meta[property="twitter:card"]', { property: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[property="twitter:url"]', { property: 'twitter:url', content: canonicalUrl });
    upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title', content: fullTitle });
    upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description', content: description });
    upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image', content: image });

    if (jsonLd) {
      upsertJsonLd('page-jsonld', jsonLd);
    }
  }, [canonicalUrl, description, fullTitle, image, jsonLd, keywords, noindex, type]);

  return null;
}

export { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, DEFAULT_TITLE, SITE_URL };
