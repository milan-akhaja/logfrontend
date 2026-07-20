import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Clock, ShoppingCart } from 'lucide-react';
import ProductPrice from '../components/ProductPrice';
import { appPath, mediaUrl } from '../lib/urls';

export default function NewIn({ onAddToCart, onToast }) {
  const [products, setProducts] = useState([]);
  const [newInConfig, setNewInConfig] = useState({
    tagline: 'Summer Drop 2026',
    title: 'The Racing &\nRebirth Drop.',
    desc: 'Introducing the Porsche 911 graphic print alongside our Born Again signature. Custom heavyweight-combed fabric blends designed to sit perfectly and hold shape.',
    buttonText: 'Explore Drops',
    buttonLink: '#new-drops-catalog',
    imageUrl: 'assets/lookbook_polaroid_1.png'
  });
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch latest products from API
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        // Show only the 12 newest products (added last in the list)
        const latestProducts = [...data].reverse().slice(0, 12);
        setProducts(latestProducts);
      })
      .catch(err => console.error('Error fetching products:', err));

    // Fetch new-in config
    fetch('/api/new-in-config')
      .then(res => res.json())
      .then(data => {
        if (data) setNewInConfig(data);
      })
      .catch(err => console.error('Error fetching new-in config:', err));

    // 2. Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '/new-in',
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => {});
  }, []);

  const handleContactClick = () => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click_contact',
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => {});
  };

  return (
    <>
      {/* EDITORIAL HERO */}
      <section className="lookbook-banner" style={{ background: '#111113', borderBottom: '1px solid var(--border)', paddingTop: '160px', height: 'auto', minHeight: '600px', paddingBottom: '60px' }}>
        <div className="lookbook-banner-left reveal">
          <div className="hero-tagline" style={{ color: 'white' }}>{newInConfig.tagline}</div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '900', lineHeight: '1.1', textTransform: 'uppercase', marginBottom: '20px', whiteSpace: 'pre-line' }}>
            {newInConfig.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', maxWidth: '450px', lineHeight: '1.7', marginBottom: '30px' }}>
            {newInConfig.desc}
          </p>
          <div className="hero-buttons">
            <a href={appPath(newInConfig.buttonLink)} className="btn btn-accent" style={{ padding: '14px 28px' }}>{newInConfig.buttonText}</a>
          </div>
        </div>
        <div className="lookbook-banner-right reveal">
          <img src={mediaUrl(newInConfig.imageUrl)} alt="LOG streetwear editorial model" loading="eager" decoding="async" />
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="container" id="new-drops-catalog" style={{ paddingTop: '20px' }}>
        <div className="section-header reveal" style={{ padding: '20px 0 20px' }}>
          <div>
            <h2 className="section-title">New Arrivals</h2>
          </div>
        </div>

        <div className="product-grid">
          {products.map(product => {
            return (
              <div
                className="product-card reveal"
                key={product.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="product-img-wrapper">
                  <span className="product-tag tag-new" style={{ background: 'var(--ink)' }}>New In</span>
                  {product.bogoOffer?.enabled && (
                    <span className="product-offer-badge card-offer-badge">
                      {product.bogoOffer.label || 'BOGO OFFER'}
                    </span>
                  )}
                  {product.imageUrl ? (
                    <img src={mediaUrl(product.imageUrl)} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <div className="product-placeholder-text">{product.graphicText}</div>
                      <div className={`product-graphic ${product.graphicClass}`}>
                        <div className={product.printClass}>{product.printText}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.desc}</p>
                  <div className="product-price-row">
                    <ProductPrice product={product} compact />
                    {product.stock > 0 ? (
                      <button
                        className="add-to-bag-btn"
                        aria-label={`Add ${product.name} to bag`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                        <span className="add-to-bag-text">Add to Bag</span>
                        <span className="add-to-bag-icon"><ShoppingCart size={16} /></span>
                      </button>
                    ) : (
                      <button
                        className="add-to-bag-btn sold-out-btn"
                        aria-label={`${product.name} is sold out`}
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        onClick={(e) => e.stopPropagation()}
                        disabled
                      >
                        <span className="add-to-bag-text">Sold Out</span>
                        <span className="add-to-bag-icon" style={{ fontSize: '10px', fontWeight: '800' }}>SO</span>
                      </button>
                    )}
                  </div>
                </div>
                        onClick={(e) => e.stopPropagation()}
                        disabled
                      >
                        <span className="add-to-bag-text">Sold Out</span>
                        <span className="add-to-bag-icon" style={{ fontSize: '10px', fontWeight: '800' }}>SO</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT & SUPPORT INSTEAD OF SUBSCRIPTION */}
      <section style={{ background: 'var(--grey-light)', padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <div className="reveal">
            <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '15px' }}>Need Support?</h2>
            <p style={{ fontSize: '13px', color: 'var(--grey-muted)', lineHeight: '1.7', marginBottom: '35px' }}>
              Have questions about your order, sizing, or returns? Get in touch with the LOG support team directly. We are here to help.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '30px' }}>
              <a
                href="mailto:contact@logcloth.com"
                onClick={handleContactClick}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--ink)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} />
                </div>
                <span>Email Us</span>
              </a>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 20px', borderRadius: '30px', border: '1px solid var(--border)' }}>
              <Clock size={14} style={{ color: 'var(--grey-muted)' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--grey-dark)' }}>Mon - Sat, 12PM - 6PM</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
