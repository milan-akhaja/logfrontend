import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { routerBasename } from './lib/urls';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SizePopup from './components/SizePopup';
import SEO from './components/SEO';

// Pages
import Shop from './pages/Shop';
import NewIn from './pages/NewIn';
import OurMission from './pages/OurMission';
import LogBook from './pages/LogBook';
import BlogDetail from './pages/BlogDetail';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import ShopPage from './pages/ShopPage';
import RefundPolicy from './pages/RefundPolicy';
import MakeReturn from './pages/MakeReturn';
import ShippingPolicy from './pages/ShippingPolicy';
import FAQs from './pages/FAQs';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Page Tracker Wrapper to track sessions & page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return undefined;

    let sessionId = localStorage.getItem('log_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('log_session_id', sessionId);
    }

    const track = () => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: location.pathname + location.hash,
          sessionId
        })
      }).catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(track, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(track, 1200);
    return () => window.clearTimeout(timer);
  }, [location]);

  return null;
}

function sendGoogleEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
  if (window.gtag) {
    window.gtag('event', eventName, payload);
  }
}

function AnalyticsTags() {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/analytics-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setConfig(data || {});
        }
      })
      .catch(() => {
        if (!cancelled) setConfig({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config || isAdmin) return undefined;

    const removeElement = (id) => {
      document.getElementById(id)?.remove();
    };
    const hasScriptWithSrc = (needle) => {
      return Array.from(document.scripts).some((script) => script.src.includes(needle));
    };
    const hasSearchConsoleMeta = (code) => {
      return Array.from(document.querySelectorAll('meta[name="google-site-verification"]'))
        .some((meta) => meta.content === code);
    };

    removeElement('log-ga4-script');
    removeElement('log-gtm-script');
    removeElement('log-search-console-verification');

    const searchCode = String(config.googleSearchConsoleVerification || '').trim();
    if (searchCode && !hasSearchConsoleMeta(searchCode)) {
      const meta = document.createElement('meta');
      meta.id = 'log-search-console-verification';
      meta.name = 'google-site-verification';
      meta.content = searchCode;
      document.head.appendChild(meta);
    }

    const ga4Id = String(config.googleAnalyticsId || '').trim();
    if (ga4Id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
      };
      if (!hasScriptWithSrc(`googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`)) {
        window.gtag('js', new Date());
        window.gtag('config', ga4Id, { send_page_view: false });

        const ga4Script = document.createElement('script');
        ga4Script.id = 'log-ga4-script';
        ga4Script.async = true;
        ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
        document.head.appendChild(ga4Script);
      }
    }

    const gtmId = String(config.googleTagManagerId || '').trim();
    if (gtmId) {
      window.dataLayer = window.dataLayer || [];
      if (!hasScriptWithSrc(`googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`)) {
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        const gtmScript = document.createElement('script');
        gtmScript.id = 'log-gtm-script';
        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
        document.head.appendChild(gtmScript);
      }
    }

    return undefined;
  }, [config, isAdmin]);

  useEffect(() => {
    if (!config || isAdmin) return;
    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    const ga4Id = String(config.googleAnalyticsId || '').trim();
    if (ga4Id && window.gtag) {
      window.gtag('config', ga4Id, {
        page_path: pagePath,
        page_location: window.location.href
      });
    }
    if (String(config.googleTagManagerId || '').trim() && window.dataLayer) {
      window.dataLayer.push({
        event: 'log_page_view',
        page_path: pagePath,
        page_location: window.location.href
      });
    }
  }, [config, isAdmin, location]);

  return null;
}

// Scroll to Top on Page navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent({
  cart,
  onAddToCart,
  onQtyChange,
  onRemove,
  onClearCart,
  toast,
  showToast,
  cartOpen,
  setCartOpen,
  sizePopupProduct,
  setSizePopupProduct,
  onBuyNow
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith('/admin');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    if (payment === 'payu-success') {
      if (params.get('orderId')) {
        sendGoogleEvent('purchase', {
          transaction_id: params.get('orderId'),
          currency: 'INR',
          payment_type: 'PayU'
        });
      }
      onClearCart();
      localStorage.removeItem('log_checkout_client_order_id');
      localStorage.removeItem('log_checkout_customer_draft');
      showToast(`PayU payment successful${params.get('orderId') ? `: ${params.get('orderId')}` : ''}`);
      navigate(location.pathname || '/', { replace: true });
    } else if (payment === 'payu-failed') {
      showToast('PayU payment failed or was cancelled. Your cart is still saved.');
      navigate(location.pathname || '/', { replace: true });
    }
  }, [location.search]);

  // Helper for quick actions
  const handleShopNowTrigger = async (productId) => {
    try {
      const normalizedProductId = (() => {
        const raw = String(productId || '').trim();
        const match = raw.match(/\/product\/([^/?#]+)/i);
        if (match) return decodeURIComponent(match[1]);
        if (/^https?:\/\//i.test(raw)) {
          try {
            const url = new URL(raw);
            return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || raw);
          } catch {
            return raw;
          }
        }
        return raw;
      })();
      const res = await fetch('/api/products');
      const products = await res.json();
      const found = products.find(p => p.id === normalizedProductId);
      if (found) {
        setSizePopupProduct(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const routeContent = (
    <Routes>
      <Route path="/" element={<><SEO canonicalPath="/" /><Shop onAddToCart={onAddToCart} /></>} />
      <Route path="/shop" element={<><SEO title="Shop Oversized T-Shirts, Graphic Tees & Streetwear" description="Shop LOG premium Indian streetwear: oversized T-shirts, graphic tees, relaxed fits, and heavyweight cotton essentials delivered across India." canonicalPath="/shop" /><ShopPage onAddToCart={onAddToCart} /></>} />
      <Route path="/new-in" element={<><SEO title="New In - Latest LOG Streetwear Drops" description="Explore the newest LOG streetwear drops, oversized graphic T-shirts, fresh fits, and limited collection releases." canonicalPath="/new-in" /><NewIn onAddToCart={onAddToCart} onToast={showToast} /></>} />
      <Route path="/our-mission" element={<><SEO title="Our Mission - Streetwear With a Conscience" description="Learn how LOG combines premium Indian streetwear with a fixed Rs. 23 charity contribution from every product." canonicalPath="/our-mission" /><OurMission /></>} />
      <Route path="/log-book" element={<><SEO title="LOG Book - Streetwear Stories, Lookbook & Impact" description="Read LOG Book for streetwear styling, collection stories, lookbook editorials, and social impact updates from LOG." canonicalPath="/log-book" type="blog" /><LogBook /></>} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="/product/:id" element={<ProductDetail onAddToCart={onAddToCart} onBuyNow={onBuyNow} />} />
      <Route path="/admin" element={<><SEO title="Admin" description="LOG admin panel." noindex canonicalPath="/admin" /><Admin onToast={showToast} /></>} />
      <Route path="/refund-policy" element={<><SEO title="Refund & Exchange Policy" description="Read LOG's return, refund, exchange, and charity donation policy for orders across India." canonicalPath="/refund-policy" /><RefundPolicy /></>} />
      <Route path="/make-return" element={<><SEO title="Make a Return or Exchange" description="Request a LOG return, refund, or size exchange for eligible orders within the return window." canonicalPath="/make-return" /><MakeReturn /></>} />
      <Route path="/shipping-policy" element={<><SEO title="Shipping Policy" description="Read LOG shipping timelines, delivery details, and support information for Indian streetwear orders." canonicalPath="/shipping-policy" /><ShippingPolicy /></>} />
      <Route path="/faqs" element={<><SEO title="FAQs - LOG Clothing" description="Answers to common LOG questions about orders, sizing, shipping, returns, exchanges, and charity donations." canonicalPath="/faqs" /><FAQs /></>} />
      <Route path="/terms" element={<><SEO title="Terms & Conditions" description="Read the LOG website terms and conditions for shopping, payments, returns, and use of logcloth.com." canonicalPath="/terms" /><Terms /></>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <>
      <PageTracker />
      <AnalyticsTags />
      
      {!isAdmin && (
        <Navbar 
          onCartOpen={() => setCartOpen(true)} 
          cartCount={cartCount} 
          onShopNow={handleShopNowTrigger}
        />
      )}
      
      {isAdmin ? routeContent : <main id="main-content">{routeContent}</main>}

      {!isAdmin && (
        <Footer onToast={showToast} />
      )}

      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onQtyChange={onQtyChange}
        onRemove={onRemove}
        onClearCart={onClearCart}
        onPurchase={(order) => sendGoogleEvent('purchase', order)}
        onToast={showToast}
      />

      <SizePopup 
        isOpen={!!sizePopupProduct}
        onClose={() => setSizePopupProduct(null)}
        product={sizePopupProduct}
        onAddToBag={onAddToCart}
        onBuyNow={onBuyNow}
      />

      {/* Global Toast */}
      <div id="toastNotification" className={`toast-notification ${toast ? 'show' : ''}`}>
        <span className="toast-dot"></span>
        <span>{toast}</span>
      </div>

      <SpeedInsights />
    </>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [sizePopupProduct, setSizePopupProduct] = useState(null);

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('log_react_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  const saveCartState = (newCart) => {
    setCart(newCart);
    localStorage.setItem('log_react_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product, size) => {
    if (!size) {
      setSizePopupProduct(product);
      return;
    }
    const cartItemId = `${product.id}-${size}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    let updated;
    if (existing) {
      updated = cart.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { ...product, cartItemId, selectedSize: size, quantity: 1 }];
    }
    saveCartState(updated);
    sendGoogleEvent('add_to_cart', {
      currency: 'INR',
      value: Number(product.price || 0),
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_variant: size,
        price: Number(product.price || 0),
        quantity: 1
      }]
    });
    showToast(`${product.name} (${size}) added to Bag`);
  };

  const handleBuyNow = (product, size) => {
    if (!size) return;
    const cartItemId = `${product.id}-${size}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    let updated;
    if (existing) {
      updated = cart.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { ...product, cartItemId, selectedSize: size, quantity: 1 }];
    }
    saveCartState(updated);
    setCartOpen(true);
  };

  const handleQtyChange = (cartItemId, delta) => {
    const updated = cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const qty = item.quantity + delta;
        return qty > 0 ? { ...item, quantity: qty } : null;
      }
      return item;
    }).filter(Boolean);
    saveCartState(updated);
  };

  const handleRemove = (cartItemId) => {
    const updated = cart.filter(item => item.cartItemId !== cartItemId);
    saveCartState(updated);
    showToast('Item removed from Bag');
  };

  const handleClearCart = () => {
    saveCartState([]);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast('');
    }, 3000);
  };

  return (
    <BrowserRouter basename={routerBasename()}>
      <ScrollToTop />
      <AppContent 
        cart={cart}
        onAddToCart={handleAddToCart}
        onQtyChange={handleQtyChange}
        onRemove={handleRemove}
        onClearCart={handleClearCart}
        toast={toast}
        showToast={showToast}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        sizePopupProduct={sizePopupProduct}
        setSizePopupProduct={setSizePopupProduct}
        onBuyNow={handleBuyNow}
      />
    </BrowserRouter>
  );
}
