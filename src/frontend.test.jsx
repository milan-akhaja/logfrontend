// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { priceNumber, formatPrice, getPriceDisplay } from './lib/pricing';
import ProductPrice from './components/ProductPrice';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import Footer from './components/Footer';
import NewIn from './pages/NewIn';
import ProductDetail from './pages/ProductDetail';
import * as productsModule from './lib/products';
import { ProductGridCard } from './pages/Shop';
import Admin from './pages/Admin';

describe('Pricing Helper Functions', () => {
  it('priceNumber parses string values correctly', () => {
    expect(priceNumber('499')).toBe(499);
    expect(priceNumber('invalid')).toBe(0);
    expect(priceNumber(-10)).toBe(0);
  });

  it('formatPrice formats correctly with currency prefix', () => {
    expect(formatPrice(499)).toBe('₹499');
    expect(formatPrice(1250, '$')).toBe('$1,250');
  });

  it('getPriceDisplay calculates discounts correctly', () => {
    const product = {
      price: 800,
      originalPrice: 1000,
      discountPercentage: 0
    };
    const display = getPriceDisplay(product);
    expect(display.sellingPrice).toBe(800);
    expect(display.originalPrice).toBe(1000);
    expect(display.discountPercent).toBe(20);
    expect(display.showSellingPrice).toBe(true);
    expect(display.showOriginalPrice).toBe(true);
    expect(display.showDiscountPercent).toBe(true);
  });
});

describe('ProductPrice React Component', () => {
  it('renders correct current and original prices', () => {
    const product = {
      price: 800,
      originalPrice: 1000
    };
    render(<ProductPrice product={product} />);
    
    expect(screen.getByText('₹800')).toBeDefined();
    expect(screen.getByText('₹1,000')).toBeDefined();
    expect(screen.getByText('20% OFF')).toBeDefined();
  });
});

describe('Static Policy React Components', () => {
  it('renders the Terms component correctly', () => {
    render(<Terms />);
    expect(screen.getByRole('heading', { name: /OFFER TERMS/i })).toBeDefined();
    expect(screen.getByText(/Buy 1 Get 1 Free/i)).toBeDefined();
  });

  it('renders PrivacyPolicy component correctly', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { name: /PRIVACY POLICY/i })).toBeDefined();
  });

  it('renders RefundPolicy component correctly', () => {
    render(
      <BrowserRouter>
        <RefundPolicy />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/Return, Refund & Cancellation Policy/i).length).toBeGreaterThan(0);
  });

  it('renders ShippingPolicy component correctly', () => {
    render(<ShippingPolicy />);
    expect(screen.getByRole('heading', { name: /SHIPPING POLICY/i })).toBeDefined();
  });
});

describe('Footer Component', () => {
  it('renders footer brand and links', () => {
    const { container } = render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { level: 2, name: /^LOG$/i })).toBeDefined();
    expect(container.querySelector('.footer-bottom').textContent).toContain('logcloth');
  });
});

describe('NewIn Component', () => {
  it('renders products without crashing when isDrop and isSoldOut are evaluated', async () => {
    const mockProducts = [
      {
        id: 'tee-1',
        name: 'Porsche 911 Tee',
        price: 999,
        stock: 10,
        isPreorder: false,
        soldOut: false
      },
      {
        id: 'tee-2',
        name: 'Preorder Drop Tee',
        price: 1199,
        stock: 0,
        isPreorder: true,
        soldOut: false
      },
      {
        id: 'tee-3',
        name: 'Sold Out Drop Tee',
        price: 1199,
        stock: 0,
        isPreorder: true,
        soldOut: true
      }
    ];

    vi.spyOn(productsModule, 'getProducts').mockResolvedValue(mockProducts);
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes('new-in-config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            tagline: 'Summer Drop 2026',
            title: 'The Racing Drop',
            desc: 'Test description',
            buttonText: 'Explore Drops',
            buttonLink: '#new-drops-catalog',
            imageUrl: 'assets/lookbook_polaroid_1.webp'
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <NewIn onAddToCart={() => {}} onToast={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByText(/New Arrivals/i)).toBeDefined();
    // Await async product loading
    const porscheTitle = await screen.findByText('Porsche 911 Tee');
    expect(porscheTitle).toBeDefined();

    const preorderTitle = await screen.findByText('Preorder Drop Tee');
    expect(preorderTitle).toBeDefined();
  });
});

describe('Scroll Restoration and Products Cache', () => {
  it('getCachedProducts returns null when nothing is cached or invalidated', () => {
    productsModule.invalidateProducts();
    expect(productsModule.getCachedProducts()).toBeNull();
  });

  it('saveScrollPosition and getSavedScrollPosition work as expected', async () => {
    const { saveScrollPosition, getSavedScrollPosition, scrollToTopInstant } = await import('./lib/scrollRestoration');
    
    // Simulate scrolling on a page
    window.scrollY = 1250;
    saveScrollPosition('key-123', '/');

    expect(getSavedScrollPosition('key-123', '/')).toBe(1250);
    expect(getSavedScrollPosition('non-existent', '/')).toBe(1250);

    // Guard: saving 0 must NOT overwrite existing positive scroll position
    window.scrollY = 0;
    saveScrollPosition('key-123', '/');
    expect(getSavedScrollPosition('key-123', '/')).toBe(1250);

    // Fallback: sessionStorage route-level recovery
    sessionStorage.setItem('log_shop_scroll', '620');
    expect(getSavedScrollPosition(null, '/shop')).toBe(620);

    sessionStorage.setItem('log_last_scroll_y', '780');
    expect(getSavedScrollPosition(null, '/other-page')).toBe(780);

    scrollToTopInstant();
    expect(document.documentElement.scrollTop).toBe(0);
  });
});

describe('ProductDetail Component', () => {
  it('product page with no size selected shows enabled ADD TO BAG and BUY NOW; with a selected size whose stock is 0 it shows disabled SOLD OUT', async () => {
    const mockProducts = [
      {
        id: 'tee-no-size',
        name: 'No Size Tee',
        price: 999,
        stock: 10,
        sizes: null,
        isPreorder: false,
        soldOut: false
      },
      {
        id: 'tee-sold-out-size',
        name: 'Sold Out Size Tee',
        price: 999,
        stock: 0,
        sizes: { S: 0 },
        isPreorder: false,
        soldOut: false
      }
    ];

    productsModule.invalidateProducts();
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue(mockProducts);

    // 1. With no size selected
    const { unmount } = render(
      <MemoryRouter initialEntries={['/product/tee-no-size']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={() => {}} onBuyNow={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );

    const addBtn = await screen.findByRole('button', { name: /ADD TO BAG/i });
    const buyBtn = screen.getByRole('button', { name: /BUY NOW/i });
    expect(addBtn.disabled).toBe(false);
    expect(buyBtn.disabled).toBe(false);

    unmount();

    // 2. With a selected size whose stock is 0
    render(
      <MemoryRouter initialEntries={['/product/tee-sold-out-size']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={() => {}} onBuyNow={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );

    const soldOutBtns = await screen.findAllByRole('button', { name: /^SOLD OUT$/i });
    expect(soldOutBtns.length).toBe(2);
    soldOutBtns.forEach(btn => expect(btn.disabled).toBe(true));
    expect(screen.queryByRole('button', { name: /ADD TO BAG/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /BUY NOW/i })).toBeNull();
  });
});

describe('GA4 Ecommerce Analytics', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    document.cookie = 'cookieyes-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('canTrackGA4 respects admin, host, and static ID guards, and analytics consent', async () => {
    const { canTrackGA4, hasGA4Consent } = await import('./lib/analytics');

    window.__LOG_ANALYTICS_HOST__ = false;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.gtag = vi.fn();
    window.__LOG_GA4_CONSENT_GRANTED__ = true;

    // False on non-analytics host
    expect(canTrackGA4()).toBe(false);

    // True on analytics host when not admin
    window.__LOG_ANALYTICS_HOST__ = true;
    expect(canTrackGA4()).toBe(true);

    // False when static GA4 ID is missing
    window.__LOG_STATIC_GA4_ID = '';
    expect(canTrackGA4()).toBe(false);
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';

    // False when gtag is missing
    delete window.gtag;
    expect(canTrackGA4()).toBe(false);
    window.gtag = vi.fn();

    // False when analytics consent is denied via window flag
    window.__LOG_GA4_CONSENT_GRANTED__ = false;
    expect(hasGA4Consent()).toBe(false);
    expect(canTrackGA4()).toBe(false);

    // False when analytics consent is denied via cookie
    delete window.__LOG_GA4_CONSENT_GRANTED__;
    document.cookie = 'cookieyes-consent=analytics:no,advertisement:yes; path=/;';
    expect(hasGA4Consent()).toBe(false);
    expect(canTrackGA4()).toBe(false);

    // True when analytics consent is granted via cookie
    document.cookie = 'cookieyes-consent=analytics:yes,advertisement:no; path=/;';
    expect(hasGA4Consent()).toBe(true);
    expect(canTrackGA4()).toBe(true);
  });

  it('trackGA4Event sends with send_to: window.__LOG_STATIC_GA4_ID', async () => {
    const { trackGA4Event } = await import('./lib/analytics');
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    const mockGtag = vi.fn();
    window.gtag = mockGtag;

    trackGA4Event('view_item', {
      currency: 'INR',
      value: 999,
      items: [{ item_id: 'item-1', item_name: 'item-1', price: 999, quantity: 1, item_variant: 'M' }]
    });

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
      send_to: 'G-CQ744XW1WD',
      currency: 'INR',
      value: 999,
      items: [{ item_id: 'item-1', item_name: 'item-1', price: 999, quantity: 1, item_variant: 'M' }]
    });
  });

  it('trackPurchase dedupes with sessionStorage and excludes personal info', async () => {
    const { trackPurchase } = await import('./lib/analytics');
    sessionStorage.clear();
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    const mockGtag = vi.fn();
    window.gtag = mockGtag;

    const mockOrder = {
      id: 'LOG-TEST-001',
      total: 1999,
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      },
      items: [
        { id: 'item-1', name: 'item-1', price: 1999, quantity: 1, selectedSize: 'L' }
      ]
    };

    // First call: should fire
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
      send_to: 'G-CQ744XW1WD',
      transaction_id: 'LOG-TEST-001',
      value: 1999,
      currency: 'INR',
      items: [
        { item_id: 'item-1', item_name: 'item-1', price: 1999, quantity: 1, item_variant: 'L' }
      ]
    });

    const payload = mockGtag.mock.calls[0][2];
    expect(Object.keys(payload)).toEqual(['send_to', 'transaction_id', 'value', 'currency', 'items']);

    // Second call with same order id: deduplicated, should NOT fire again
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
  });
});

describe('Meta Pixel Analytics', () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete window.fbq;
    delete window.__LOG_META_CONSENT_GRANTED__;
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_META_PIXEL_ID = '1398026158457517';
    document.cookie = 'cookieyes-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('with consent denied or fbq missing nothing throws and nothing is sent', async () => {
    const { canTrackMeta, hasMetaConsent, trackMetaEvent, trackPurchase } = await import('./lib/analytics');

    // Case 1: fbq missing
    window.__LOG_META_CONSENT_GRANTED__ = true;
    expect(canTrackMeta()).toBe(false);
    expect(() => trackMetaEvent('ViewContent', { content_ids: ['prod-1'] })).not.toThrow();

    // Case 2: fbq present but consent denied via window flag
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    window.__LOG_META_CONSENT_GRANTED__ = false;
    expect(canTrackMeta()).toBe(false);
    expect(() => trackMetaEvent('ViewContent', { content_ids: ['prod-1'] })).not.toThrow();
    expect(mockFbq).not.toHaveBeenCalled();

    // Case 3: fbq present but consent denied via cookie
    delete window.__LOG_META_CONSENT_GRANTED__;
    document.cookie = 'cookieyes-consent=consentid:123,action:yes,necessary:yes,advertisement:no; path=/;';
    expect(hasMetaConsent()).toBe(false);
    expect(canTrackMeta()).toBe(false);
    expect(() => trackMetaEvent('AddToCart', { content_ids: ['prod-1'] })).not.toThrow();
    expect(mockFbq).not.toHaveBeenCalled();

    // Case 4: trackPurchase when Meta consent denied and GA4 missing does not throw and sends nothing
    delete window.gtag;
    expect(() => trackPurchase({ id: 'ORD-DENIED', total: 1000, items: [] })).not.toThrow();
    expect(mockFbq).not.toHaveBeenCalled();

    // Case 5: fbq internal failure never throws
    window.__LOG_META_CONSENT_GRANTED__ = true;
    window.fbq = vi.fn(() => {
      throw new Error('Meta Pixel script failure');
    });
    expect(() => trackMetaEvent('InitiateCheckout', { content_ids: ['prod-1'] })).not.toThrow();
    expect(() => trackPurchase({ id: 'ORD-ERR', total: 1000, items: [] })).not.toThrow();
  });

  it('with consent granted each event is sent once with the exact key set', async () => {
    const { trackMetaEvent } = await import('./lib/analytics');
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    window.__LOG_META_CONSENT_GRANTED__ = true;

    // 1. ViewContent
    const viewContentParams = {
      content_ids: ['prod-1'],
      content_type: 'product',
      content_name: 'prod-1',
      value: 1499,
      currency: 'INR'
    };
    trackMetaEvent('ViewContent', viewContentParams);
    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', viewContentParams);
    expect(Object.keys(mockFbq.mock.calls[0][2]).sort()).toEqual(
      ['content_ids', 'content_type', 'content_name', 'value', 'currency'].sort()
    );

    // 2. AddToCart
    const addToCartParams = {
      content_ids: ['prod-1'],
      content_type: 'product',
      value: 1499,
      currency: 'INR',
      contents: [{ id: 'prod-1', quantity: 1 }]
    };
    trackMetaEvent('AddToCart', addToCartParams);
    expect(mockFbq).toHaveBeenCalledTimes(2);
    expect(mockFbq).toHaveBeenCalledWith('track', 'AddToCart', addToCartParams);
    expect(Object.keys(mockFbq.mock.calls[1][2]).sort()).toEqual(
      ['content_ids', 'content_type', 'value', 'currency', 'contents'].sort()
    );

    // 3. InitiateCheckout
    const initiateCheckoutParams = {
      content_ids: ['prod-1', 'prod-2'],
      num_items: 2,
      value: 2998,
      currency: 'INR'
    };
    trackMetaEvent('InitiateCheckout', initiateCheckoutParams);
    expect(mockFbq).toHaveBeenCalledTimes(3);
    expect(mockFbq).toHaveBeenCalledWith('track', 'InitiateCheckout', initiateCheckoutParams);
    expect(Object.keys(mockFbq.mock.calls[2][2]).sort()).toEqual(
      ['content_ids', 'num_items', 'value', 'currency'].sort()
    );
  });
});

describe('Independent Purchase Tracking and Consent (GA4 and Meta)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete window.gtag;
    delete window.fbq;
    delete window.__LOG_GA4_CONSENT_GRANTED__;
    delete window.__LOG_META_CONSENT_GRANTED__;
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.__LOG_STATIC_META_PIXEL_ID = '1398026158457517';
    document.cookie = 'cookieyes-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  const mockOrder = {
    id: 'LOG-ORDER-777',
    total: 2499,
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    },
    items: [
      { id: 'prod-1', name: 'prod-1', price: 1499, quantity: 1, selectedSize: 'L' },
      { id: 'prod-2', name: 'prod-2', price: 1000, quantity: 1, selectedSize: 'M' }
    ]
  };

  it('both granted -> each fires once, second call deduped', async () => {
    const { trackPurchase } = await import('./lib/analytics');
    const mockGtag = vi.fn();
    const mockFbq = vi.fn();
    window.gtag = mockGtag;
    window.fbq = mockFbq;
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    window.__LOG_META_CONSENT_GRANTED__ = true;

    // First purchase call: both fire once
    trackPurchase(mockOrder);

    // GA4 assertion
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
      send_to: 'G-CQ744XW1WD',
      transaction_id: 'LOG-ORDER-777',
      value: 2499,
      currency: 'INR',
      items: [
        { item_id: 'prod-1', item_name: 'prod-1', price: 1499, quantity: 1, item_variant: 'L' },
        { item_id: 'prod-2', item_name: 'prod-2', price: 1000, quantity: 1, item_variant: 'M' }
      ]
    });
    expect(Object.keys(mockGtag.mock.calls[0][2])).toEqual([
      'send_to', 'transaction_id', 'value', 'currency', 'items'
    ]);

    // Meta assertion
    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockFbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      {
        value: 2499,
        currency: 'INR',
        content_ids: ['prod-1', 'prod-2'],
        content_type: 'product',
        num_items: 2
      },
      { eventID: 'LOG-ORDER-777' }
    );
    expect(Object.keys(mockFbq.mock.calls[0][2]).sort()).toEqual(
      ['content_ids', 'content_type', 'currency', 'num_items', 'value']
    );

    // Separate dedupe keys exist in sessionStorage
    expect(sessionStorage.getItem('log_ga4_order_LOG-ORDER-777')).toBe('1');
    expect(sessionStorage.getItem('log_meta_order_LOG-ORDER-777')).toBe('1');

    // Second call with same order id: both deduped, neither fires again
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockFbq).toHaveBeenCalledTimes(1);
  });

  it('analytics only -> GA4 fires once and dedupes, Meta stays silent without key set', async () => {
    const { trackPurchase } = await import('./lib/analytics');
    const mockGtag = vi.fn();
    const mockFbq = vi.fn();
    window.gtag = mockGtag;
    window.fbq = mockFbq;
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    window.__LOG_META_CONSENT_GRANTED__ = false;

    // First call
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockFbq).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('log_ga4_order_LOG-ORDER-777')).toBe('1');
    expect(sessionStorage.getItem('log_meta_order_LOG-ORDER-777')).toBeNull();

    // Second call: GA4 deduped, Meta still silent
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockFbq).not.toHaveBeenCalled();

    // If marketing consent is later granted, Meta can fire its Purchase event
    window.__LOG_META_CONSENT_GRANTED__ = true;
    trackPurchase(mockOrder);
    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('log_meta_order_LOG-ORDER-777')).toBe('1');
    expect(mockGtag).toHaveBeenCalledTimes(1);
  });

  it('marketing only -> Meta fires once and dedupes, GA4 stays silent without key set', async () => {
    const { trackPurchase } = await import('./lib/analytics');
    const mockGtag = vi.fn();
    const mockFbq = vi.fn();
    window.gtag = mockGtag;
    window.fbq = mockFbq;
    window.__LOG_GA4_CONSENT_GRANTED__ = false;
    window.__LOG_META_CONSENT_GRANTED__ = true;

    // First call
    trackPurchase(mockOrder);
    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockGtag).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('log_meta_order_LOG-ORDER-777')).toBe('1');
    expect(sessionStorage.getItem('log_ga4_order_LOG-ORDER-777')).toBeNull();

    // Second call: Meta deduped, GA4 still silent
    trackPurchase(mockOrder);
    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockGtag).not.toHaveBeenCalled();

    // If analytics consent is later granted, GA4 can fire its purchase event
    window.__LOG_GA4_CONSENT_GRANTED__ = true;
    trackPurchase(mockOrder);
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('log_ga4_order_LOG-ORDER-777')).toBe('1');
    expect(mockFbq).toHaveBeenCalledTimes(1);
  });

  it('neither granted -> neither fires, nothing throws, neither dedupe key set', async () => {
    const { trackPurchase } = await import('./lib/analytics');
    const mockGtag = vi.fn();
    const mockFbq = vi.fn();
    window.gtag = mockGtag;
    window.fbq = mockFbq;
    window.__LOG_GA4_CONSENT_GRANTED__ = false;
    window.__LOG_META_CONSENT_GRANTED__ = false;

    expect(() => trackPurchase(mockOrder)).not.toThrow();
    expect(mockGtag).not.toHaveBeenCalled();
    expect(mockFbq).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('log_ga4_order_LOG-ORDER-777')).toBeNull();
    expect(sessionStorage.getItem('log_meta_order_LOG-ORDER-777')).toBeNull();
  });
});

describe('ONE OF ONE badge', () => {
  it('a product with total stock 1 and no no-permission-3 shows ONE OF ONE and not LOW STOCK; a drop product with total stock 1 still shows LOW STOCK', () => {
    const singlePieceProduct = {
      id: 'prod-single',
      name: 'item-1',
      price: 1999,
      stock: 1,
      subCategories: ['oversize'],
      sizes: { S: 0, M: 0, L: 1, XL: 0 }
    };

    const { unmount } = render(
      <MemoryRouter>
        <ProductGridCard product={singlePieceProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('ONE OF ONE')).toBeDefined();
    expect(screen.queryByText(/LOW STOCK/i)).toBeNull();
    unmount();

    const dropSinglePieceProduct = {
      id: 'drop-single',
      name: 'item-2',
      price: 1899,
      stock: 1,
      subCategories: ['no-permission-3'],
      sizes: { S: 1, M: 0, L: 0, XL: 0 }
    };

    render(
      <MemoryRouter>
        <ProductGridCard product={dropSinglePieceProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/LOW STOCK/i)).toBeDefined();
    expect(screen.queryByText('ONE OF ONE')).toBeNull();
  });
});

describe('Admin Analytics Dashboard', () => {
  let originalFetch;

  beforeEach(() => {
    sessionStorage.setItem('admin_token', 'test_admin_token');
    localStorage.setItem('log_admin_active_tab', 'dashboard');
    originalFetch = global.fetch;
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    global.fetch = originalFetch;
  });

  it('renders safely with missing new fields (campaigns, metricsMeasured, sources) without crashing', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/api/analytics-config')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (u.includes('/api/analytics')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            siteSessions: 100,
            totalSales: 45000,
            totalOrders: 20,
            pageViews: 300,
            formSubmissions: 5,
            clicksToContact: 8,
            successfulPayments: 20,
            amountPaid: 45000,
            customers: 18,
            conversionRate: 20.0
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter>
        <Admin onToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Live Shop Analytics')).toBeDefined();
    expect(await screen.findByText('Not measured yet')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    unmount();
  });

  it('renders full new analytics shape (campaigns, metricsMeasured, real bounce and visitors)', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/api/analytics-config')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (u.includes('/api/analytics')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            siteSessions: 250,
            totalSales: 95000,
            totalOrders: 35,
            pageViews: 750,
            formSubmissions: 12,
            clicksToContact: 15,
            successfulPayments: 35,
            amountPaid: 92000,
            customers: 30,
            conversionRate: 14.0,
            uniqueVisitors: 210,
            bounceRate: '42.5%',
            metricsMeasured: {
              bounceRate: true,
              uniqueVisitors: true,
              avgSessionDuration: false
            },
            sources: { Direct: 150, Instagram: 100 },
            campaigns: [
              { source: 'Instagram', campaign: 'Spring2026', content: 'StoryAd', sessions: 85 }
            ]
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter>
        <Admin onToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Live Shop Analytics')).toBeDefined();
    expect(await screen.findByText('210')).toBeDefined();
    unmount();
  });

  it('shows a visible error box with HTTP status when the analytics request fails', async () => {
    const onToast = vi.fn();
    global.fetch = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/api/analytics')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter>
        <Admin onToast={onToast} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Live Shop Analytics')).toBeDefined();
    expect(await screen.findByText(/Analytics could not load\. Press Refresh\. \(HTTP 500\)/i)).toBeDefined();
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('HTTP 500'));
    unmount();
  });
});



