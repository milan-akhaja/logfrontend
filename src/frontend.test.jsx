// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { priceNumber, formatPrice, getPriceDisplay } from './lib/pricing';
import ProductPrice from './components/ProductPrice';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import FAQs from './pages/FAQs';
import Footer from './components/Footer';
import ProductDetail from './pages/ProductDetail';
import * as productsModule from './lib/products';
import { ProductGridCard } from './pages/Shop';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';

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
  }, 20000);
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

describe('Admin Coupons tab', () => {
  let originalFetch;

  beforeEach(() => {
    sessionStorage.setItem('admin_token', 'test_admin_token');
    localStorage.setItem('log_admin_active_tab', 'coupons');
    originalFetch = global.fetch;
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    global.fetch = originalFetch;
  });

  it('lists coupons and sends a new coupon with the admin token', async () => {
    const calls = [];
    global.fetch = vi.fn().mockImplementation((url, opts = {}) => {
      const u = String(url);
      calls.push({ u, method: opts.method || 'GET', headers: opts.headers, body: opts.body });
      if (u.includes('/api/admin/coupons')) {
        if ((opts.method || 'GET') === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              code: 'FIRST10', label: '', discountType: 'percent', discountValue: 10,
              allowCod: true, allowPrepaid: true, firstOrderOnly: true, productIds: [],
              minOrderValue: 0, maxUses: null, startsAt: null, endsAt: null,
              isActive: true, isVisible: true, usedCount: 2
            }]
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter>
        <Admin onToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText('FIRST10')).toBeDefined();
    expect(screen.getByText('10% off')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('e.g. ROHAN10'), { target: { value: 'rohan10' } });
    fireEvent.change(document.querySelector('input[step="any"][required]'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Coupon' }));

    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true));
    const post = calls.find((c) => c.method === 'POST');
    expect(post.headers.Authorization).toBe('Bearer test_admin_token');
    const body = JSON.parse(post.body);
    expect(body.code).toBe('ROHAN10');
    expect(body.discountType).toBe('percent');
    expect(body.discountValue).toBe(12);
    expect(body.productIds).toEqual([]);
    unmount();
  });
});

describe('Admin Abandoned tab', () => {
  let originalFetch;

  beforeEach(() => {
    sessionStorage.setItem('admin_token', 'test_admin_token');
    localStorage.setItem('log_admin_active_tab', 'abandoned');
    originalFetch = global.fetch;
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    global.fetch = originalFetch;
  });

  it('lists saved checkouts with email and phone, and deletes one with the admin token', async () => {
    const calls = [];
    global.fetch = vi.fn().mockImplementation((url, opts = {}) => {
      const u = String(url);
      calls.push({ u, method: opts.method || 'GET', headers: opts.headers });
      if (u.includes('/api/admin/abandoned-checkouts')) {
        if ((opts.method || 'GET') === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 7, email: 'buyer@example.com', phone: '919876543210',
              items: [{ name: 'Tee', size: 'L', quantity: 2, price: 1299 }],
              bagTotal: 2598, recovered: false, marketingConsent: false,
              createdAt: '2026-10-21T10:00:00.000Z', updatedAt: '2026-10-21T10:05:00.000Z'
            }]
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter>
        <Admin onToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText('buyer@example.com')).toBeDefined();
    expect(screen.getByText('+919876543210')).toBeDefined();
    expect(screen.getByText('1 left, 0 recovered')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE')).toBe(true));
    const del = calls.find((c) => c.method === 'DELETE');
    expect(del.u).toContain('/api/admin/abandoned-checkouts/7');
    expect(del.headers.Authorization).toBe('Bearer test_admin_token');
    unmount();
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

describe('ConsentBanner and Consent Management', () => {
  beforeEach(() => {
    cleanup();
    document.cookie = 'cookieyes-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    delete window.__LOG_GA4_CONSENT_GRANTED__;
    delete window.__LOG_META_CONSENT_GRANTED__;
    window.__LOG_ANALYTICS_HOST__ = true;
    window.__LOG_STATIC_GA4_ID = 'G-CQ744XW1WD';
    window.__LOG_STATIC_META_PIXEL_ID = '1398026158457517';
    window.gtag = vi.fn();
    window.fbq = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('banner shows when no saved choice exists', async () => {
    const ConsentBanner = (await import('./components/ConsentBanner')).default;
    const { getSavedConsent } = await import('./lib/analytics');
    expect(getSavedConsent()).toBeNull();

    const { unmount } = render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: /cookie consent banner/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /accept all/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /reject non-essential/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /customize/i })).toBeDefined();
    unmount();
  });

  it('Accept all saves analytics+marketing and grants consent', async () => {
    const ConsentBanner = (await import('./components/ConsentBanner')).default;
    const { getSavedConsent, hasGA4Consent, hasMetaConsent, canTrackGA4, canTrackMeta } = await import('./lib/analytics');

    const { unmount } = render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    const acceptBtn = screen.getByRole('button', { name: /accept all/i });
    fireEvent.click(acceptBtn);

    const saved = getSavedConsent();
    expect(saved).toEqual({ analytics: true, marketing: true });
    expect(hasGA4Consent()).toBe(true);
    expect(hasMetaConsent()).toBe(true);
    expect(canTrackGA4()).toBe(true);
    expect(canTrackMeta()).toBe(true);
    expect(window.fbq).toHaveBeenCalledWith('consent', 'grant');
    expect(window.gtag).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({
      analytics_storage: 'granted',
      ad_storage: 'granted'
    }));
    unmount();
  });

  it('Reject non-essential saves nothing granted and trackMetaEvent/GA4 stay off', async () => {
    const ConsentBanner = (await import('./components/ConsentBanner')).default;
    const { getSavedConsent, hasGA4Consent, hasMetaConsent, canTrackGA4, canTrackMeta, trackMetaEvent, trackGA4Event } = await import('./lib/analytics');

    const { unmount } = render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    const rejectBtn = screen.getByRole('button', { name: /reject non-essential/i });
    fireEvent.click(rejectBtn);

    const saved = getSavedConsent();
    expect(saved).toEqual({ analytics: false, marketing: false });
    expect(hasGA4Consent()).toBe(false);
    expect(hasMetaConsent()).toBe(false);
    expect(canTrackGA4()).toBe(false);
    expect(canTrackMeta()).toBe(false);
    expect(window.fbq).toHaveBeenCalledWith('consent', 'revoke');

    trackMetaEvent('AddToCart', { content_ids: ['prod-1'] });
    trackGA4Event('view_item', { items: [] });
    expect(window.fbq).not.toHaveBeenCalledWith('track', expect.anything(), expect.anything());
    expect(window.gtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything());
    unmount();
  });

  it('Customize with only analytics on keeps Meta off', async () => {
    const ConsentBanner = (await import('./components/ConsentBanner')).default;
    const { getSavedConsent, hasGA4Consent, hasMetaConsent, canTrackGA4, canTrackMeta, trackMetaEvent, trackGA4Event } = await import('./lib/analytics');

    const { unmount } = render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    const customizeBtn = screen.getByRole('button', { name: /customize/i });
    fireEvent.click(customizeBtn);

    const analyticsCheckbox = await screen.findByLabelText(/analytics/i);
    const marketingCheckbox = await screen.findByLabelText(/marketing/i);
    expect(analyticsCheckbox.checked).toBe(false);
    expect(marketingCheckbox.checked).toBe(false);

    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox.checked).toBe(true);

    const saveBtn = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(saveBtn);

    const saved = getSavedConsent();
    expect(saved).toEqual({ analytics: true, marketing: false });
    expect(hasGA4Consent()).toBe(true);
    expect(hasMetaConsent()).toBe(false);
    expect(canTrackGA4()).toBe(true);
    expect(canTrackMeta()).toBe(false);

    trackMetaEvent('AddToCart', { content_ids: ['prod-1'] });
    expect(window.fbq).not.toHaveBeenCalledWith('track', expect.anything(), expect.anything());
    expect(window.fbq).toHaveBeenCalledWith('consent', 'revoke');

    trackGA4Event('view_item', { currency: 'INR' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({ currency: 'INR' }));
    unmount();
  });

  it('Cookie settings link reopens the banner', async () => {
    const ConsentBanner = (await import('./components/ConsentBanner')).default;
    document.cookie = 'cookieyes-consent=consentid:1,consent:yes,action:yes,necessary:yes,functional:yes,analytics:yes,performance:yes,advertisement:yes; path=/;';

    const onOpenCookieSettings = vi.fn();
    const { unmount: unmountFooter } = render(
      <MemoryRouter>
        <Footer onToast={vi.fn()} onOpenCookieSettings={onOpenCookieSettings} />
      </MemoryRouter>
    );

    const cookieSettingsBtn = screen.getByRole('button', { name: /cookie settings/i });
    expect(cookieSettingsBtn).toBeDefined();
    fireEvent.click(cookieSettingsBtn);
    expect(onOpenCookieSettings).toHaveBeenCalledTimes(1);
    unmountFooter();
    cleanup();

    const { unmount: unmountBanner } = render(
      <MemoryRouter>
        <ConsentBanner forceOpen={true} />
      </MemoryRouter>
    );
    expect(screen.getByRole('region', { name: /cookie consent banner/i })).toBeDefined();
    unmountBanner();
  });

  it('ViewContent fires once when size changes', async () => {
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    window.__LOG_META_CONSENT_GRANTED__ = true;

    const mockProduct = { id: 'prod-vc-test', name: 'Vintage Tee', price: 1499, stock: 10, sizes: { S: 5, M: 5 } };
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue([mockProduct]);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/product/prod-vc-test']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={vi.fn()} onBuyNow={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Vintage Tee');
    const initialViewContentCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(initialViewContentCalls.length).toBe(1);

    const sizeButtons = await screen.findAllByRole('button');
    const sizeBtn = sizeButtons.find(b => b.textContent && b.textContent.includes('M'));
    if (sizeBtn) {
      fireEvent.click(sizeBtn);
    }

    const postChangeViewContentCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(postChangeViewContentCalls.length).toBe(1);

    unmount();
  });

  it('ViewContent fires when consent is granted AFTER the product page is already mounted', async () => {
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    delete window.__LOG_META_CONSENT_GRANTED__;

    const mockProduct = { id: 'prod-late-consent', name: 'Late Consent Tee', price: 1999, stock: 10, sizes: { M: 10 } };
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue([mockProduct]);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/product/prod-late-consent']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={vi.fn()} onBuyNow={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Late Consent Tee');
    // Before consent, ViewContent must not have fired
    const beforeCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(beforeCalls.length).toBe(0);

    // Now grant consent via saveConsent (which updates flags and dispatches cookieyes_consent_update)
    const { saveConsent } = await import('./lib/analytics');
    saveConsent({ analytics: true, marketing: true });

    // After consent update, ViewContent must fire exactly once
    const afterCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(afterCalls.length).toBe(1);
    expect(afterCalls[0][2]).toEqual(expect.objectContaining({
      content_ids: ['prod-late-consent'],
      content_type: 'product',
      value: 1999,
      currency: 'INR'
    }));

    // Triggering another consent update must NOT re-fire ViewContent
    saveConsent({ analytics: true, marketing: true });
    const duplicateCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(duplicateCalls.length).toBe(1);

    unmount();
  });

  it('one Add to bag click fires AddToCart exactly once with expected parameters and deduplicates rapid clicks', async () => {
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    window.__LOG_META_CONSENT_GRANTED__ = true;

    const mockProduct = { id: 'prod-atc-test', name: 'Drop Tee', price: 1299, stock: 5, sizes: { L: 5 } };
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue([mockProduct]);

    // Test clicking Add to bag on ProductDetail
    const onAddToCart = vi.fn();
    const { unmount: unmountPD } = render(
      <MemoryRouter initialEntries={['/product/prod-atc-test']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={onAddToCart} onBuyNow={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Drop Tee');
    const sizeBtn = (await screen.findAllByRole('button')).find(b => b.textContent && b.textContent.includes('L'));
    expect(sizeBtn).toBeDefined();
    fireEvent.click(sizeBtn);

    const addBtn = screen.getByRole('button', { name: /add to bag/i });
    expect(addBtn).toBeDefined();

    // Click Add to bag once
    fireEvent.click(addBtn);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-atc-test' }), 'L');

    // Test trackMetaEvent AddToCart parameters with eventID
    const { trackMetaEvent } = await import('./lib/analytics');
    const testEventId = 'atc_prod-atc-test-L_1700000000000';
    trackMetaEvent('AddToCart', {
      content_ids: ['prod-atc-test'],
      content_type: 'product',
      value: 1299,
      currency: 'INR',
      contents: [{ id: 'prod-atc-test', quantity: 1 }]
    }, testEventId);

    const atcCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'AddToCart');
    expect(atcCalls.length).toBe(1);
    expect(atcCalls[0][2]).toEqual(expect.objectContaining({
      content_ids: ['prod-atc-test'],
      content_type: 'product',
      value: 1299,
      currency: 'INR'
    }));
    expect(atcCalls[0][3]).toEqual({ eventID: testEventId });

    unmountPD();
  });

  it('Order (a): ViewContent fires immediately on mount when consent is already granted in cookie before opening product page', async () => {
    const mockFbq = vi.fn();
    window.fbq = mockFbq;
    delete window.__LOG_META_CONSENT_GRANTED__;
    document.cookie = 'cookieyes-consent=consentid:999,consent:yes,action:yes,necessary:yes,functional:yes,analytics:yes,performance:yes,advertisement:yes; path=/;';

    const mockProduct = { id: 'prod-pre-consent', name: 'Pre Consent Tee', price: 1899, stock: 10, sizes: { M: 10 } };
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue([mockProduct]);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/product/prod-pre-consent']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={vi.fn()} onBuyNow={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Pre Consent Tee');
    // Pre-granted consent must allow ViewContent to fire exactly once on mount
    const vcCalls = mockFbq.mock.calls.filter(c => c[0] === 'track' && c[1] === 'ViewContent');
    expect(vcCalls.length).toBe(1);
    expect(vcCalls[0][2]).toEqual(expect.objectContaining({
      content_ids: ['prod-pre-consent'],
      content_type: 'product',
      value: 1899,
      currency: 'INR'
    }));

    unmount();
  });

  it('renders scarcity stat 40 Pieces Per Design and clean Shop Now CTA without starting price', async () => {
    const Shop = (await import('./pages/Shop')).default;
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const { unmount } = render(
      <MemoryRouter>
        <Shop onAddToCart={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('40')).toBeDefined();
    expect(screen.getByText('Pieces Per Design')).toBeDefined();
    expect(screen.queryByText(/Starting Price/i)).toBeNull();
    expect(screen.getByRole('link', { name: 'Shop Now' })).toBeDefined();
    expect(screen.queryByText(/From ₹/i)).toBeNull();

    unmount();
  });

  it('renders 15% OFF on prepaid orders in payment options and Prepaid: 15% off label in CartDrawer', async () => {
    const CartDrawer = (await import('./components/CartDrawer')).default;
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const mockCart = [
      { id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }
    ];

    // Mock fetch for /api/orders/quote
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url, opts) => {
      if (typeof url === 'string' && url.includes('/api/orders/quote')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            subtotal: 2400,
            discount: 240,
            discountLabel: 'Prepaid: 15% off',
            shipping: 0,
            founderDeliveryFee: 0,
            total: 2160,
            paymentMethod: 'payu',
            hasPreorder: false,
            lines: [{ id: 'tee-1', price: 2400, quantity: 1, isPreorder: false, preorderDiscount: 0 }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const { unmount } = render(
      <MemoryRouter>
        <CartDrawer
          isOpen={true}
          onClose={() => {}}
          cart={mockCart}
          onQtyChange={() => {}}
          onRemove={() => {}}
          onClearCart={() => {}}
          onPurchase={() => {}}
          onToast={() => {}}
        />
      </MemoryRouter>
    );

    // Initial cart drawer view: wait for quote to load and check label
    await waitFor(() => {
      expect(screen.getByText('Prepaid: 15% off')).toBeDefined();
    });

    // Proceed to checkout step
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(proceedBtn);

    // Verify payment card text in checkout
    await waitFor(() => {
      expect(screen.getByText('UPI, Cards, Net Banking')).toBeDefined();
    });

    // Verify discount label in checkout order summary
    expect(screen.getAllByText('Prepaid: 15% off').length).toBeGreaterThan(0);

    window.fetch = originalFetch;
    unmount();
  });

  it('renders Option A: 2 offer cards (PREPAID15 and FIRST10) on ProductDetail without drop-facts card', async () => {
    const ProductDetail = (await import('./pages/ProductDetail')).default;
    const mockProduct = {
      id: 'tee-regular',
      name: 'Regular Black Tee',
      price: 1800,
      stock: 10,
      isPreorder: false,
      piecesTotal: 40,
      sizes: { S: 5, M: 5 }
    };

    productsModule.invalidateProducts();
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue([mockProduct]);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/product/tee-regular']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail onAddToCart={() => {}} onBuyNow={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Card 1: PREPAID OFFER
      expect(screen.getByText('PREPAID OFFER')).toBeDefined();
      expect(screen.getByText('15% OFF')).toBeDefined();
      expect(screen.getByText('PREPAID15')).toBeDefined();

      // Card 2: FIRST ORDER
      expect(screen.getByText('FIRST ORDER')).toBeDefined();
      expect(screen.getByText('10% OFF')).toBeDefined();
      expect(screen.getByText('FIRST10')).toBeDefined();

      // Drop facts card must NOT be present
      expect(screen.queryByText(/NUMBERED DROP/i)).toBeNull();
      expect(screen.queryByText(/ONLY 40 PIECES PER DESIGN/i)).toBeNull();
    });

    unmount();
  });
});

describe('GalleryVideoCard Component', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders poster img immediately and configures video element with preload=none, muted, playsInline, loop', async () => {
    const GalleryVideoCard = (await import('./components/GalleryVideoCard')).default;
    const mockItem = {
      id: 'gallery-test-1',
      title: 'Summer Reel 2026',
      media_type: 'video',
      video_url: '/uploads/gallery-test.mp4',
      poster_url: '/uploads/gallery-test-poster.webp'
    };

    const { container, unmount } = render(
      <GalleryVideoCard item={mockItem} isActive={false} />
    );

    const img = container.querySelector('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toContain('/uploads/gallery-test-poster.webp');
    expect(img.style.opacity).toBe('1'); // Poster visible initially

    const video = container.querySelector('video');
    expect(video).toBeDefined();
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.hasAttribute('loop')).toBe(true);

    unmount();
  });

  it('attempts video play only when slide isActive is true', async () => {
    const GalleryVideoCard = (await import('./components/GalleryVideoCard')).default;
    const mockItem = {
      id: 'gallery-test-2',
      title: 'Active Reel',
      media_type: 'video',
      videoUrl: '/uploads/reel-2.mp4',
      posterUrl: '/uploads/reel-2-poster.jpg'
    };

    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    const { rerender, unmount } = render(
      <GalleryVideoCard item={mockItem} isActive={false} />
    );

    expect(playSpy).not.toHaveBeenCalled();

    rerender(<GalleryVideoCard item={mockItem} isActive={true} />);
    expect(playSpy).toHaveBeenCalled();

    rerender(<GalleryVideoCard item={mockItem} isActive={false} />);
    expect(pauseSpy).toHaveBeenCalled();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
    unmount();
  });

  it('respects prefers-reduced-motion: does not autoplay and shows Tap to play badge', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    const GalleryVideoCard = (await import('./components/GalleryVideoCard')).default;
    const mockItem = {
      id: 'gallery-test-3',
      title: 'Reduced Motion Reel',
      media_type: 'video',
      video_url: '/uploads/reel-3.mp4',
      poster_url: '/uploads/reel-3-poster.webp'
    };

    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());

    const { container, unmount } = render(
      <GalleryVideoCard item={mockItem} isActive={true} />
    );

    // Should not autoplay even when active because reduced-motion is preferred
    expect(playSpy).not.toHaveBeenCalled();

    const badge = container.querySelector('.gallery-video-reduced-motion-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('Tap to play');

    playSpy.mockRestore();
    unmount();
  });

  it('Admin gallery video reels limit: enforces 10 videos cap', () => {
    const MAX_GALLERY_VIDEOS = 10;
    const items = Array.from({ length: 10 }, (_, i) => ({ id: `v-${i}`, media_type: 'video' }));
    const videoCount = items.filter(item => (item.media_type || item.mediaType) === 'video').length;
    expect(videoCount).toBe(10);
    expect(videoCount >= MAX_GALLERY_VIDEOS).toBe(true);
    const isAtLimit = videoCount >= MAX_GALLERY_VIDEOS;
    const label = isAtLimit ? `Gallery Video Limit Reached (${MAX_GALLERY_VIDEOS}/${MAX_GALLERY_VIDEOS})` : 'Upload Video Reel to Gallery';
    expect(label).toBe('Gallery Video Limit Reached (10/10)');
    const counterText = `Videos used: ${videoCount} / ${MAX_GALLERY_VIDEOS}`;
    expect(counterText).toBe('Videos used: 10 / 10');
  });
});

describe('Coupon System Frontend Tests (KAAM 4)', () => {
  it('R11: ProductDetail renders 2 offer cards and removes .detail-prepaid-chip', async () => {
    const ProductDetail = (await import('./pages/ProductDetail')).default;
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const mockProduct = {
      id: 'p-1',
      name: 'NO PERMISSION TEE',
      price: 2400,
      stock: 10,
      sizes: JSON.stringify({ S: 5, M: 5 }),
      images: ['/img1.webp'],
      piecesTotal: 40
    };

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/products/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProduct) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const { container, unmount } = render(
      <MemoryRouter>
        <ProductDetail />
      </MemoryRouter>
    );

    // Old chip must NOT exist
    expect(container.querySelector('.detail-prepaid-chip')).toBeNull();

    window.fetch = originalFetch;
    unmount();
  });

  it('R3, R4, R12: CartDrawer renders coupon picker with No coupon, PREPAID15, and FIRST10', async () => {
    const CartDrawer = (await import('./components/CartDrawer')).default;
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const mockCart = [
      { id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }
    ];

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/orders/quote')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            subtotal: 2400,
            discount: 0,
            discountLabel: '',
            shipping: 0,
            founderDeliveryFee: 0,
            total: 2400,
            paymentMethod: 'payu',
            couponCode: null,
            lines: [{ id: 'tee-1', price: 2400, quantity: 1, isPreorder: false, preorderDiscount: 0 }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const { container, unmount } = render(
      <MemoryRouter>
        <CartDrawer
          isOpen={true}
          onClose={() => {}}
          cart={mockCart}
          onQtyChange={() => {}}
          onRemove={() => {}}
          onClearCart={() => {}}
          onPurchase={() => {}}
          onToast={() => {}}
        />
      </MemoryRouter>
    );

    // Go to checkout
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText('Offers & Coupons')).toBeDefined();
      expect(screen.queryByText('No coupon')).toBeNull();
      expect(screen.getByText('PREPAID15')).toBeDefined();
      expect(screen.getByText('FIRST10')).toBeDefined();
      expect(screen.getByText('10% OFF on first order')).toBeDefined();
      expect(screen.queryByText('Pehle phone number bharo')).toBeNull();
    });

    // Select COD: PREPAID15 becomes disabled with a note, FIRST10 stays available
    const codCard = screen.getByText('Cash on Delivery');
    fireEvent.click(codCard);

    await waitFor(() => {
      expect(screen.getByText('PREPAID15 is valid on prepaid orders only.')).toBeDefined();
      const applyButtons = screen.getAllByRole('button', { name: /^APPLY$/i });
      expect(applyButtons.length).toBe(2);
      expect(applyButtons[0].disabled).toBe(true);
      expect(applyButtons[1].disabled).toBe(false);
    });

    window.fetch = originalFetch;
    unmount();
  });

  it('selecting FIRST10 with invalid phone sends couponCode: null and keeps standard total until valid 10-digit phone is entered', async () => {
    const CartDrawer = (await import('./components/CartDrawer')).default;
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const mockCart = [
      { id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }
    ];

    const quoteRequests = [];
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/api/orders/quote')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        quoteRequests.push(body);
        const hasCoupon = body.couponCode === 'FIRST10';
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            subtotal: 2400,
            discount: hasCoupon ? 120 : 0,
            discountLabel: hasCoupon ? 'First order: 10% off' : '',
            shipping: 0,
            founderDeliveryFee: 0,
            total: hasCoupon ? 2280 : 2400,
            paymentMethod: body.paymentMethod || 'payu',
            couponCode: hasCoupon ? 'FIRST10' : null,
            lines: [{ id: 'tee-1', price: 2400, quantity: 1, isPreorder: false, preorderDiscount: 0 }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const onToast = vi.fn();
    const { container, unmount } = render(
      <MemoryRouter>
        <CartDrawer
          isOpen={true}
          onClose={() => {}}
          cart={mockCart}
          onQtyChange={() => {}}
          onRemove={() => {}}
          onClearCart={() => {}}
          onPurchase={() => {}}
          onToast={onToast}
        />
      </MemoryRouter>
    );

    // Proceed to checkout form
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText('Offers & Coupons')).toBeDefined();
    });

    // Initial quote had couponCode: null
    await waitFor(() => {
      expect(quoteRequests.length).toBeGreaterThan(0);
      expect(quoteRequests[0].couponCode).toBeNull();
    });

    // Select FIRST10 while phone is empty
    const first5Card = container.querySelector('.checkout-coupon-card[data-coupon="FIRST10"]');
    const first5ApplyBtn = first5Card.querySelector('.checkout-coupon-action-btn');
    fireEvent.click(first5ApplyBtn);

    // Toast in English shown, hint displayed, button remains APPLY (does not claim APPLIED until valid phone)
    expect(onToast).toHaveBeenCalledWith('Enter your phone number to apply FIRST10.');
    expect(first5Card.classList.contains('selected')).toBe(true);
    expect(first5Card.querySelector('.checkout-coupon-action-btn.applied')).toBeNull();
    expect(first5Card.querySelector('.checkout-coupon-action-btn').textContent).toBe('APPLY');
    expect(screen.getByText('Enter phone number to activate')).toBeDefined();
    expect(screen.getByText('10% OFF on first order')).toBeDefined();
    expect(screen.queryByText('Pehle phone number bharo')).toBeNull();

    // While phone is empty, quote request sends couponCode: null (not FIRST10)
    await waitFor(() => {
      const lastReq = quoteRequests[quoteRequests.length - 1];
      expect(lastReq.couponCode).toBeNull();
    });

    // Now fill a valid 10-digit phone number
    const phoneInput = container.querySelector('input[name="phone"]');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Quote re-runs with couponCode: 'FIRST10' and updates totals to discounted amount; button flips to APPLIED; hint disappears
    await waitFor(() => {
      const lastReq = quoteRequests[quoteRequests.length - 1];
      expect(lastReq.couponCode).toBe('FIRST10');
      expect(lastReq.customerInfo.phone).toBe('9876543210');
      expect(screen.getByText('-₹120')).toBeDefined();
      expect(first5Card.querySelector('.checkout-coupon-action-btn.applied')).toBeDefined();
      expect(first5Card.querySelector('.checkout-coupon-action-btn').textContent).toBe('APPLIED');
      expect(screen.queryByText('Enter phone number to activate')).toBeNull();
    });

    window.fetch = originalFetch;
    unmount();
  });

  describe('bag offers', () => {
    const bagCart = [{ id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }];
    let quoteRequests;
    let originalFetch;

    const mountDrawer = async () => {
      const CartDrawer = (await import('./components/CartDrawer')).default;
      const { render } = await import('@testing-library/react');
      const { MemoryRouter } = await import('react-router-dom');
      return render(
        <MemoryRouter>
          <CartDrawer
            isOpen={true}
            onClose={() => {}}
            cart={bagCart}
            onQtyChange={() => {}}
            onRemove={() => {}}
            onClearCart={() => {}}
            onPurchase={() => {}}
            onToast={() => {}}
          />
        </MemoryRouter>
      );
    };

    beforeEach(() => {
      quoteRequests = [];
      originalFetch = window.fetch;
      window.fetch = vi.fn().mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/orders/quote')) {
          const body = options?.body ? JSON.parse(options.body) : {};
          quoteRequests.push(body);
          const discount = body.couponCode === 'PREPAID15' ? 360 : (body.couponCode === 'FIRST10' ? 240 : 0);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              subtotal: 2400,
              discount,
              discountLabel: discount ? 'Offer' : '',
              shipping: 0,
              founderDeliveryFee: 0,
              total: 2400 - discount,
              paymentMethod: body.paymentMethod || 'payu',
              couponCode: body.couponCode ?? null,
              lines: [{ id: 'tee-1', price: 2400, quantity: 1, isPreorder: false, preorderDiscount: 0 }]
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });
    });

    afterEach(() => {
      window.fetch = originalFetch;
    });

    it('bag shows both offers as compact tiles, unapplied, and APPLY updates the total on the checkout button', async () => {
      const { screen, waitFor, fireEvent } = await import('@testing-library/react');
      const { container, unmount } = await mountDrawer();
      const tile = (code) => container.querySelector(`.bag-offer-tile[data-coupon="${code}"]`);
      const card = (code) => container.querySelector(`.checkout-coupon-card[data-coupon="${code}"]`);

      await waitFor(() => {
        expect(tile('PREPAID15')).not.toBeNull();
        expect(tile('FIRST10')).not.toBeNull();
        expect(screen.getByRole('button', { name: /Proceed to Checkout · ₹2,400/ })).toBeDefined();
      });
      expect(container.querySelector('.bag-offer-tile.selected')).toBeNull();
      expect(quoteRequests[quoteRequests.length - 1].couponCode).toBeNull();

      fireEvent.click(tile('PREPAID15').querySelector('.bag-offer-btn'));
      await waitFor(() => {
        expect(tile('PREPAID15').classList.contains('selected')).toBe(true);
        expect(tile('PREPAID15').querySelector('.bag-offer-btn').textContent).toBe('REMOVE');
        expect(screen.getByText('-₹360')).toBeDefined();
        expect(screen.getByRole('button', { name: /Proceed to Checkout · ₹2,040/ })).toBeDefined();
      });
      expect(quoteRequests[quoteRequests.length - 1].couponCode).toBe('PREPAID15');

      fireEvent.click(screen.getByRole('button', { name: /Proceed to Checkout/ }));
      await waitFor(() => {
        expect(card('PREPAID15').classList.contains('selected')).toBe(true);
      });
      unmount();
    });

    it('a coupon rejected by the server is removed with a message and the total never sticks on pending', async () => {
      const { screen, waitFor, fireEvent } = await import('@testing-library/react');
      const CartDrawer = (await import('./components/CartDrawer')).default;
      const { render } = await import('@testing-library/react');
      const { MemoryRouter } = await import('react-router-dom');
      const baseFetch = window.fetch;
      window.fetch = vi.fn().mockImplementation((url, options) => {
        const body = options?.body ? JSON.parse(options.body) : {};
        if (typeof url === 'string' && url.includes('/api/orders/quote') && body.couponCode === 'PREPAID15') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'This offer is for online payment only.', code: 'COUPON_PREPAID_ONLY' })
          });
        }
        return baseFetch(url, options);
      });
      const onToast = vi.fn();
      const { container, unmount } = render(
        <MemoryRouter>
          <CartDrawer
            isOpen={true}
            onClose={() => {}}
            cart={bagCart}
            onQtyChange={() => {}}
            onRemove={() => {}}
            onClearCart={() => {}}
            onPurchase={() => {}}
            onToast={onToast}
          />
        </MemoryRouter>
      );
      const tile = (code) => container.querySelector(`.bag-offer-tile[data-coupon="${code}"]`);

      await waitFor(() => expect(tile('PREPAID15')).not.toBeNull());
      fireEvent.click(tile('PREPAID15').querySelector('.bag-offer-btn'));
      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith('This offer is for online payment only.');
        expect(container.querySelector('.bag-offer-tile.selected')).toBeNull();
        expect(screen.getByRole('button', { name: /Proceed to Checkout · ₹2,400/ })).toBeDefined();
      });
      unmount();
    });

    it('REMOVE on a bag tile clears the offer and the total goes back', async () => {
      const { screen, waitFor, fireEvent } = await import('@testing-library/react');
      const { container, unmount } = await mountDrawer();
      const tile = (code) => container.querySelector(`.bag-offer-tile[data-coupon="${code}"]`);

      await waitFor(() => expect(tile('FIRST10')).not.toBeNull());
      fireEvent.click(tile('PREPAID15').querySelector('.bag-offer-btn'));
      await waitFor(() => expect(tile('PREPAID15').classList.contains('selected')).toBe(true));
      fireEvent.click(tile('PREPAID15').querySelector('.bag-offer-btn'));
      await waitFor(() => {
        expect(container.querySelector('.bag-offer-tile.selected')).toBeNull();
        expect(screen.getByRole('button', { name: /Proceed to Checkout · ₹2,400/ })).toBeDefined();
      });
      expect(quoteRequests[quoteRequests.length - 1].couponCode).toBeNull();
      unmount();
    });

    it('bag footer is one short note with no subtotal row until an offer is applied', async () => {
      const { screen, waitFor, fireEvent } = await import('@testing-library/react');
      const { container, unmount } = await mountDrawer();
      const footer = () => container.querySelector('.cart-footer');

      await waitFor(() => expect(screen.getByText('Grand Total')).toBeDefined());
      expect(footer().textContent).toContain('Free shipping · ₹23 goes to the LOG Fund');
      expect(footer().textContent).not.toContain('Subtotal');

      fireEvent.click(container.querySelector('.bag-offer-tile[data-coupon="PREPAID15"] .bag-offer-btn'));
      await waitFor(() => {
        expect(footer().textContent).toContain('Subtotal');
        expect(footer().textContent).toContain('₹2,400');
        expect(footer().textContent).toContain('-₹360');
      });
      unmount();
    });

    it('no offer is applied on its own when the payment method changes', async () => {
      const { waitFor, fireEvent } = await import('@testing-library/react');
      const { container, unmount } = await mountDrawer();

      fireEvent.click(container.querySelector('.checkout-btn'));
      await waitFor(() => expect(container.querySelector('input[type="radio"][value="cod"]')).not.toBeNull());

      fireEvent.click(container.querySelector('input[type="radio"][value="cod"]'));
      await waitFor(() => {
        expect(quoteRequests[quoteRequests.length - 1].paymentMethod).toBe('cod');
      });
      expect(container.querySelector('.checkout-coupon-card.selected')).toBeNull();
      expect(quoteRequests.every((q) => q.couponCode === null)).toBe(true);

      fireEvent.click(container.querySelector('input[type="radio"][value="payu"]'));
      await waitFor(() => {
        expect(quoteRequests[quoteRequests.length - 1].paymentMethod).toBe('payu');
      });
      expect(container.querySelector('.checkout-coupon-card.selected')).toBeNull();
      expect(quoteRequests.every((q) => q.couponCode === null)).toBe(true);
      unmount();
    });

    it('payment cards show no hard-coded discount badges', async () => {
      const { waitFor, fireEvent } = await import('@testing-library/react');
      const { container, unmount } = await mountDrawer();

      fireEvent.click(container.querySelector('.checkout-btn'));
      await waitFor(() => {
        expect(container.querySelectorAll('.checkout-payment-card').length).toBe(2);
      });
      expect(container.querySelectorAll('.checkout-payment-offer-badge').length).toBe(0);
      unmount();
    });
  });
});

describe('Shop Hero Section Loading', () => {
  it('before the fetch resolves, no <img> with src containing "hero_streetwear" is in the DOM; after it resolves, the configured slide images render', async () => {
    const { default: Shop, resetCachedHeroConfig } = await import('./pages/Shop');
    const { render, screen, waitFor } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    resetCachedHeroConfig();

    let resolveHeroConfig;
    const heroPromise = new Promise((resolve) => {
      resolveHeroConfig = resolve;
    });

    const mockHeroData = {
      tagline: 'Autumn Streetwear',
      title: 'Real Minimal Design',
      desc: 'Exclusive drop.',
      desktopMediaType: 'slideshow',
      desktopSlides: ['assets/configured_slide_1.webp', 'assets/configured_slide_2.webp'],
      desktopSlideIntervalMs: 5000,
      mobileMediaType: 'slideshow',
      mobileSlides: ['assets/configured_mobile_1.webp', 'assets/configured_mobile_2.webp'],
      mobileSlideIntervalMs: 5000,
      button1Text: 'Shop Now',
      button1Link: '#shop-catalog'
    };

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/hero-config')) {
        return heroPromise.then((data) => ({
          ok: true,
          json: () => Promise.resolve(data)
        }));
      }
      if (typeof url === 'string' && url.includes('/api/collections')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (typeof url === 'string' && url.includes('/api/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const { container, unmount } = render(
      <MemoryRouter>
        <Shop onAddToCart={() => {}} />
      </MemoryRouter>
    );

    // 1. Before the fetch resolves:
    // No <img> with src containing "hero_streetwear" is in the DOM
    const allImages = container.querySelectorAll('img');
    const streetwearImages = Array.from(allImages).filter((img) =>
      img.src && img.src.includes('hero_streetwear')
    );
    expect(streetwearImages.length).toBe(0);

    // Hero section renders plain neutral background with no images or marketing text
    const heroSection = container.querySelector('.hero-section, .mobile-hero-video');
    expect(heroSection).not.toBeNull();
    expect(heroSection.querySelectorAll('img').length).toBe(0);
    expect(heroSection.textContent.trim()).toBe('');

    // 2. Resolve the hero-config fetch
    resolveHeroConfig(mockHeroData);

    // 3. After resolution, configured slide images render
    await waitFor(() => {
      const heroImgs = container.querySelectorAll('.hero-slideshow-image, .mobile-hero-slide');
      expect(heroImgs.length).toBeGreaterThan(0);
      const sources = Array.from(heroImgs).map((img) => img.getAttribute('src'));
      expect(sources.some((src) => src && src.includes('configured_slide_1.webp'))).toBe(true);
    });

    window.fetch = originalFetch;
    unmount();
  });
});

describe('Direct COD and Founder Delivery checkout', () => {
  const mockCart = [
    { id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }
  ];

  beforeEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    localStorage.clear();
    localStorage.setItem('log_checkout_customer_draft', JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: 'customer@example.com',
      phoneCountryCode: '+91',
      phone: '9876543210',
      country: 'India',
      address: '123 Main Street',
      apartment: 'Apt 4B',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380001',
      saveInfo: false
    }));
  });

  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('COD places the order directly with no payment gateway and shows plain Cash on Delivery labels', async () => {
    const CartDrawer = (await import('./components/CartDrawer')).default;
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const orderCalls = [];
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/api/orders/quote')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            subtotal: 2400,
            discount: 0,
            shipping: 0,
            founderDeliveryFee: 0,
            total: 2400,
            paymentMethod: body.paymentMethod || 'payu',
            couponCode: body.couponCode ?? null,
            lines: [{ id: 'tee-1', price: 2400, quantity: 1, isPreorder: false, preorderDiscount: 0 }]
          })
        });
      }
      if (typeof url === 'string' && url.includes('/api/orders')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        orderCalls.push(body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            order: { id: 'order-direct-cod', total: 2400, subtotal: 2400, shipping: 0, paymentId: 'COD', items: [] }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const { container, unmount } = render(
      <MemoryRouter>
        <CartDrawer
          isOpen={true}
          onClose={() => {}}
          cart={mockCart}
          onQtyChange={() => {}}
          onRemove={() => {}}
          onClearCart={() => {}}
          onPurchase={() => {}}
          onToast={() => {}}
        />
      </MemoryRouter>
    );

    fireEvent.click(container.querySelector('.checkout-btn'));

    await waitFor(() => {
      expect(screen.getByText('Cash on Delivery')).toBeDefined();
    });
    fireEvent.click(container.querySelector('input[type="radio"][value="cod"]'));

    await waitFor(() => {
      expect(screen.getByText('Cash on Delivery')).toBeDefined();
      expect(screen.queryByText(/pay ₹.* now/i)).toBeNull();
      expect(screen.getByText('Grand Total')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Place Order' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));

    await waitFor(() => {
      expect(orderCalls.length).toBe(1);
      expect(orderCalls[0].paymentId).toBe('COD');
    });

    window.fetch = originalFetch;
    unmount();
  });

  it('the donation label reads "Donation by LOG" and the grand total is unchanged', async () => {
    const { OrderReceiptModal } = await import('./App');
    const { render, screen } = await import('@testing-library/react');

    const mockOrder = {
      id: 'ord-donation-check',
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
      subtotal: 2400,
      shipping: 0,
      donation: 23,
      total: 2400,
      customerInfo: { name: 'Sahaj', phone: '9876543210', address: '123 Main St' },
      items: [{ id: 'tee-1', name: 'LOG Oversized Tee', price: 2400, quantity: 1, selectedSize: 'M' }]
    };

    const { container, unmount } = render(
      <OrderReceiptModal order={mockOrder} onClose={() => {}} />
    );

    // 1. Label is "Donation by LOG"
    expect(screen.getByText('Donation by LOG')).toBeDefined();

    // 2. The old standalone "Donation" label is NOT rendered
    const lineLabels = Array.from(container.querySelectorAll('.order-success-line span')).map(el => el.textContent.trim());
    expect(lineLabels).toContain('Donation by LOG');
    expect(lineLabels).not.toContain('Donation');

    // 3. Amount is ₹23
    expect(screen.getByText('₹23')).toBeDefined();

    // 4. Grand total is unchanged at ₹2,400 (donation is not added to total)
    const grandTotalRow = container.querySelector('.order-success-grand');
    expect(grandTotalRow).not.toBeNull();
    expect(grandTotalRow.textContent).toContain('Grand Total');
    expect(grandTotalRow.textContent).toContain('₹2,400');
    expect(mockOrder.total).toBe(2400);

    unmount();
  }, 30000);
});

describe('Navbar copy and policy pages', () => {
  beforeEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('Navbar top strip displays "COD AVAILABLE • NO EXTRA FEES, TAXES INCLUDED • FREE SHIPPING" in both marquee groups', async () => {
    const Navbar = (await import('./components/Navbar')).default;
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    const { container, unmount } = render(
      <MemoryRouter>
        <Navbar onCartOpen={() => {}} cartCount={0} />
      </MemoryRouter>
    );

    // Verify all 3 items render in the strip
    expect(screen.getAllByText('COD AVAILABLE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NO EXTRA FEES, TAXES INCLUDED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FREE SHIPPING').length).toBeGreaterThan(0);

    // Verify both marquee tracks render the 3 items in exact order separated by •
    const groups = container.querySelectorAll('.announcement-group');
    expect(groups.length).toBe(2);
    groups.forEach((group) => {
      expect(group.textContent).toMatch(/COD AVAILABLE\s*•\s*NO EXTRA FEES, TAXES INCLUDED\s*•\s*FREE SHIPPING/);
    });
    expect(screen.queryByText(/COD AVAILABLE ON ALL ORDERS/i)).toBeNull();
    expect(screen.queryByText(/FREE SHIPPING · COD AVAILABLE/i)).toBeNull();

    unmount();
  });

  it('FAQs, Shipping and Refund pages make no mention of a COD advance', async () => {
    const FAQs = (await import('./pages/FAQs')).default;
    const ShippingPolicy = (await import('./pages/ShippingPolicy')).default;
    const RefundPolicy = (await import('./pages/RefundPolicy')).default;
    const { render, cleanup } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');

    [FAQs, ShippingPolicy, RefundPolicy].forEach((Page) => {
      const { container } = render(<MemoryRouter><Page /></MemoryRouter>);
      expect(container.textContent).not.toMatch(/advance/i);
      cleanup();
    });
  });

});

describe('Homepage product grid and Home collection', () => {
  const mk = (id, name) => ({
    id, name, category: 'top', price: 1199, images: ['a.webp'], desc: '',
    stock: { M: 5 }, sizes: ['M'], subCategories: []
  });
  const products = [mk('p1', 'Alpha Tee'), mk('p2', 'Bravo Tee'), mk('p3', 'Charlie Tee')];

  const renderHome = async (collections) => {
    const { default: Shop, resetCachedHeroConfig } = await import('./pages/Shop');
    const { invalidateProducts } = await import('./lib/products');
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    resetCachedHeroConfig();
    invalidateProducts();
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(products) });
      }
      if (typeof url === 'string' && url.includes('/api/collections')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(collections) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    const utils = render(<MemoryRouter><Shop onAddToCart={() => {}} /></MemoryRouter>);
    await screen.findByText('Alpha Tee');
    return utils;
  };

  it('shows only the products in the "Home" collection on the homepage', async () => {
    const { container, unmount } = await renderHome([{ id: 'c1', name: 'Home', productIds: ['p1', 'p3'] }]);
    expect(container.textContent).toContain('Alpha Tee');
    expect(container.textContent).toContain('Charlie Tee');
    expect(container.textContent).not.toContain('Bravo Tee');
    unmount();
  });

  it('falls back to every product when no "Home" collection exists', async () => {
    const { container, unmount } = await renderHome([{ id: 'c2', name: 'Other', productIds: ['p2'] }]);
    expect(container.textContent).toContain('Alpha Tee');
    expect(container.textContent).toContain('Bravo Tee');
    expect(container.textContent).toContain('Charlie Tee');
    unmount();
  });

  it('shows a Shop all designs link to /shop under the grid', async () => {
    const { container, unmount } = await renderHome([]);
    const link = container.querySelector('.home-shop-all a');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toContain('/shop');
    unmount();
  });
});

describe('Gallery video slides wait for the video to finish', () => {
  const videoItem = { id: 'g1', title: 'Reel', media_type: 'video', video_url: '/uploads/r.mp4', poster_url: '/uploads/r.webp' };

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('card reports the end of the video only while it is the active slide, and can drop loop', async () => {
    const GalleryVideoCard = (await import('./components/GalleryVideoCard')).default;
    const { fireEvent } = await import('@testing-library/react');
    const onEnded = vi.fn();

    const active = render(<GalleryVideoCard item={videoItem} isActive={true} loop={false} onEnded={onEnded} />);
    const video = active.container.querySelector('video');
    expect(video.hasAttribute('loop')).toBe(false);
    fireEvent.ended(video);
    expect(onEnded).toHaveBeenCalledTimes(1);
    active.unmount();

    const inactive = render(<GalleryVideoCard item={videoItem} isActive={false} loop={false} onEnded={onEnded} />);
    fireEvent.ended(inactive.container.querySelector('video'));
    expect(onEnded).toHaveBeenCalledTimes(1);
    inactive.unmount();
  });

  it('carousel stays on the video past 5s and moves on once the video ends', async () => {
    const { default: Shop, resetCachedHeroConfig } = await import('./pages/Shop');
    const { invalidateProducts } = await import('./lib/products');
    const { render: r, fireEvent, waitFor, act } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    resetCachedHeroConfig();
    invalidateProducts();
    const items = [videoItem, { id: 'g2', title: 'Photo', imageUrl: '/uploads/p.webp' }];
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/gallery')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(items) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    const { container, unmount } = r(<MemoryRouter><Shop onAddToCart={() => {}} /></MemoryRouter>);
    await waitFor(() => expect(container.querySelectorAll('.gallery-slide').length).toBe(2));
    const activeIsVideo = () => Boolean(container.querySelector('.gallery-slide.active video'));
    // the video card is lazy-loaded, so wait for it instead of assuming it is there
    await waitFor(() => expect(activeIsVideo()).toBe(true));

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      await act(async () => { vi.advanceTimersByTime(8000); });
      expect(activeIsVideo()).toBe(true);
      fireEvent.ended(container.querySelector('.gallery-slide.active video'));
      expect(activeIsVideo()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
    unmount();
  });
});
