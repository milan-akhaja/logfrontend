import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { routerBasename } from './lib/urls';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SizePopup from './components/SizePopup';

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

// Page Tracker Wrapper to track sessions & page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    let sessionId = localStorage.getItem('log_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('log_session_id', sessionId);
    }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: location.pathname + location.hash,
        sessionId
      })
    }).catch(() => {});
  }, [location]);

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

  const isAdmin = location.pathname.startsWith('/admin');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  return (
    <>
      <PageTracker />
      
      {!isAdmin && (
        <Navbar 
          onCartOpen={() => setCartOpen(true)} 
          cartCount={cartCount} 
          onShopNow={handleShopNowTrigger}
        />
      )}
      
      <Routes>
        <Route path="/" element={<Shop onAddToCart={onAddToCart} />} />
        <Route path="/shop" element={<ShopPage onAddToCart={onAddToCart} />} />
        <Route path="/new-in" element={<NewIn onAddToCart={onAddToCart} onToast={showToast} />} />
        <Route path="/our-mission" element={<OurMission />} />
        <Route path="/log-book" element={<LogBook />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/product/:id" element={<ProductDetail onAddToCart={onAddToCart} onBuyNow={onBuyNow} />} />
        <Route path="/admin" element={<Admin onToast={showToast} />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/make-return" element={<MakeReturn />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>

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
