import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, Mail, Clock, Instagram } from 'lucide-react';
import ContentBlockLines from './ContentBlockLines';
import useContentBlocks from '../hooks/useContentBlocks';

export default function Footer({ onToast }) {
  const [openSection, setOpenSection] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [activeTab, setActiveTab] = useState('category'); // category, color, popular
  const contentBlocks = useContentBlocks();
  const footerLuxury = contentBlocks.footer_luxury;

  const [newArrivalSubcategories, setNewArrivalSubcategories] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(products => {
        const subs = new Set();
        const cols = new Set();
        products.forEach(p => {
          if (p.subCategories) p.subCategories.forEach(sub => subs.add(sub));
          if (p.colors) p.colors.forEach(col => cols.add(col));
        });
        setSubCategories(Array.from(subs));
        setColors(Array.from(cols));

        // Get unique subcategories of the latest 5 added products
        const latestSubs = new Set();
        [...products].reverse().forEach(p => {
          if (p.subCategories) {
            p.subCategories.forEach(sub => {
              if (latestSubs.size < 5) latestSubs.add(sub);
            });
          }
        });
        setNewArrivalSubcategories(Array.from(latestSubs));
      })
      .catch(e => console.error(e));
  }, []);

  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

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
      {/* Luxury categories and brand statement widget above the footer */}
      <div className="footer-luxury-widget-wrapper" style={{ background: footerLuxury.background || undefined }}>
        <div className="container">
          <div className="footer-luxury-widget">
            <div className="luxury-widget-left luxury-widget-heading">
              <h3>
                <ContentBlockLines block={footerLuxury} lineBreak={false} />
              </h3>
            </div>
            <div className="luxury-widget-right">
              <div className="widget-tabs">
                <button type="button" className={activeTab === 'popular' ? 'active' : ''} onClick={() => setActiveTab('popular')}>Popular searches</button>
                <button type="button" className={activeTab === 'category' ? 'active' : ''} onClick={() => setActiveTab('category')}>Shop by category</button>
                <button type="button" className={activeTab === 'color' ? 'active' : ''} onClick={() => setActiveTab('color')}>Shop by color</button>
              </div>
              <div className="widget-links">
                {activeTab === 'popular' && (
                  newArrivalSubcategories.length > 0 ? (
                    newArrivalSubcategories.map(sub => (
                      <Link key={sub} to={`/shop?subcategory=${sub}`}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</Link>
                    ))
                  ) : (
                    <span style={{ opacity: 0.5, cursor: 'default', color: 'var(--grey-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming Soon</span>
                  )
                )}
                {activeTab === 'category' && (
                  subCategories.length > 0 ? (
                    subCategories.map(sub => (
                      <Link key={sub} to={`/shop?subcategory=${sub}`}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</Link>
                    ))
                  ) : (
                    <span style={{ opacity: 0.5, cursor: 'default', color: 'var(--grey-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming Soon</span>
                  )
                )}
                {activeTab === 'color' && (
                  colors.length > 0 ? (
                    colors.map(col => (
                      <Link key={col} to={`/shop?color=${col.toLowerCase()}`}>{col.charAt(0).toUpperCase() + col.slice(1).toLowerCase()}</Link>
                    ))
                  ) : (
                    <span style={{ opacity: 0.5, cursor: 'default', color: 'var(--grey-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming Soon</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-watermark">LOG</div>
        <div className="container">
        
        {/* Main Footer Directory */}
        <div className="footer-grid bluorng-footer-grid">
          
          {/* Brand Info & Support Contact Panel */}
          <div className="footer-brand">
            <h2 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase', marginBottom: '15px', fontFamily: "'Montserrat', sans-serif" }}>LOG</h2>
            <p style={{ fontSize: '13px', color: 'var(--grey-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              Premium Streetwear,<br />
              Real Purpose. Real Impact.
            </p>
            
            {/* Outline Contact Icons Panel instead of Newsletter */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '10px' }}>
              <a 
                href="tel:+917878623123" 
                aria-label="Call LOG support"
                title="Call Support"
                onClick={handleContactClick}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <Phone size={16} color="#FFFFFF" />
              </a>
              <a 
                href="http://wa.me/917878623123" 
                target="_blank" 
                rel="noreferrer"
                aria-label="Message LOG support on WhatsApp"
                title="WhatsApp Support"
                onClick={handleContactClick}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <MessageSquare size={16} color="#FFFFFF" />
              </a>
              <a 
                href="mailto:contact@logcloth.com" 
                aria-label="Email LOG support"
                title="Email Support"
                onClick={handleContactClick}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <Mail size={16} color="#FFFFFF" />
              </a>
            </div>
            
            {/* Business Hours */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: '700' }}>
              <Clock size={12} color="rgba(255, 255, 255, 0.7)" />
              <span>Mon - Sat, 12PM - 6PM</span>
            </div>
          </div>

          {/* Col 1: Follow the log movements */}
          <div className="footer-accordion-col footer-socials-col">
            <h3 className="footer-title" style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Follow the log movments
            </h3>
            <ul className="footer-links pc-only">
              <li><a href="https://www.instagram.com/log.cloth" target="_blank" rel="noreferrer">Instagram</a></li>
            </ul>
            <div className="footer-social-icons-row" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <a href="https://www.instagram.com/log.cloth" target="_blank" rel="noreferrer" aria-label="Follow LOG on Instagram" style={{ color: 'white' }}><Instagram size={20} /></a>
            </div>
          </div>

          {/* Col 2: We are LOG */}
          <div className="footer-accordion-col footer-we-are-log-col">
            <h3 className="footer-title" onClick={() => toggleSection('we-are-log')} style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              We are LOG <span className="accordion-caret pc-only">▾</span>
            </h3>
            <ul className="footer-links always-visible">
              <li><Link to="/new-in">New in</Link></li>
              <li><Link to="/our-mission">Our Mission</Link></li>
              <li><Link to="/log-book">Log book</Link></li>
            </ul>
          </div>

          {/* Col 3: Order Support */}
          <div className="footer-accordion-col footer-order-support-col">
            <h3 className="footer-title" onClick={() => toggleSection('support')} style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Order Support <span className="accordion-caret pc-only">▾</span>
            </h3>
            <ul className="footer-links always-visible">
              <li><Link to="/make-return">Make a return/Exchange</Link></li>
              <li><Link to="/refund-policy">Return & Refund Policy</Link></li>
              <li><Link to="/shipping-policy">Shipping policy</Link></li>
              <li><Link to="/faqs">FAQ's</Link></li>
              <li><Link to="/terms">Terms & Conditions / Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom info */}
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
          <span>
            © 2026 <strong style={{ fontWeight: '900', color: '#FFFFFF' }}>logcloth</strong>. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
    </>
  );
}
