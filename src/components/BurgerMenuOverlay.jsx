import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, BookOpen } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock';

export default function BurgerMenuOverlay({ isOpen, onClose, onOpenStories }) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [uniqueColors, setUniqueColors] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [stories, setStories] = useState([]);

  // Fetch collections, products, and stories
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      
      Promise.all([
        fetch('/api/collections').then(res => res.json()),
        fetch('/api/products').then(res => res.json()),
        fetch('/api/stories').then(res => res.json())
      ])
        .then(([collectionsData, productsData, storiesData]) => {
          setCollections(collectionsData || []);
          setProducts(productsData || []);
          setStories(storiesData || []);
          
          // Get unique colors
          const colorsSet = new Set();
          productsData.forEach(p => {
            if (p.colors && Array.isArray(p.colors)) {
              p.colors.forEach(c => {
                if (c && c.trim()) {
                  colorsSet.add(c.trim().toUpperCase());
                }
              });
            }
          });
          setUniqueColors(Array.from(colorsSet));
        })
        .catch(err => console.error('Error fetching burger overlay data:', err));
    }

    return () => {
      if (isOpen) unlockBodyScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilterClick = (type, value) => {
    onClose();
    if (type === 'all') {
      navigate('/shop');
    } else if (type === 'collection') {
      navigate(`/shop?collection=${value}`);
    } else if (type === 'category') {
      navigate(`/shop?category=${value}`);
    } else if (type === 'subcategory') {
      navigate(`/shop?subcategory=${value}`);
    } else if (type === 'color') {
      navigate(`/shop?color=${value.toLowerCase()}`);
    }
  };

  const getSubcategories = (category) => {
    const subs = new Set();
    products.forEach(p => {
      if (p.category && p.category.toLowerCase() === category.toLowerCase() && p.subCategories) {
        let list = [];
        try {
          list = Array.isArray(p.subCategories) ? p.subCategories : JSON.parse(p.subCategories);
        } catch (e) {
          list = [];
        }
        if (Array.isArray(list)) {
          list.forEach(sub => {
            if (sub && sub.trim()) {
              subs.add(sub.trim());
            }
          });
        }
      }
    });
    if (subs.size === 0) {
      return ['Coming Soon'];
    }
    return Array.from(subs);
  };

  const toggleAccordion = (catName) => {
    setExpandedCategory(prev => prev === catName ? null : catName);
  };

  const getColorSwatches = (colorFamily) => {
    const key = colorFamily.toLowerCase().trim();
    if (key.includes('blue')) return ['#9FD4FF', '#70B5F5', '#4292E6', '#2672C4', '#114F94'];
    if (key.includes('brown')) return ['#E6D5C3', '#C8B195', '#9F8360', '#765C3B', '#4E371C'];
    if (key.includes('neutral') || key.includes('grey') || key.includes('black') || key.includes('white')) {
      return ['#FAF9F6', '#D1D5DB', '#6B7280', '#374151', '#111827'];
    }
    if (key.includes('green')) return ['#A3F5B8', '#70E08F', '#3DB860', '#1A943D', '#096323'];
    if (key.includes('red') || key.includes('pink')) return ['#FCA5A5', '#F87171', '#EF4444', '#B91C1C', '#7F1D1D'];
    
    return ['#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151'];
  };

  return (
    <div className="burger-overlay-container active" onClick={onClose}>
      <div className="burger-overlay-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Row */}
        <div className="burger-overlay-header">
          <div className="burger-header-left">
            <button className="burger-close-btn" onClick={onClose}>&times;</button>
            <span className="burger-logo">LOG</span>
          </div>
          
          <div className="burger-header-right">
            {stories.length > 0 && (
              <div 
                className="bluorng-stories-wrap small-story-wrap"
                onClick={() => {
                  onClose();
                  onOpenStories();
                }}
                style={{ width: '36px', height: '36px' }}
              >
                <div className="stories-circle-inner" style={{ fontSize: '8px' }}>
                  <span>LOG</span>
                </div>
              </div>
            )}
            <button 
              className="burger-cart-btn"
              onClick={() => {
                onClose();
                const bagBtn = document.querySelector('.header-bag-btn');
                if (bagBtn) bagBtn.click();
              }}
            >
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>

        {/* ==================== PC MEGAMENU (PC ONLY) ==================== */}
        <div className="pc-only megamenu-grid-wrapper">
          <div className="megamenu-grid">
            {/* Col 1: Collections / New Arrivals */}
            <div className="megamenu-col">
              <h4>New Arrivals</h4>
              <ul className="megamenu-list">
                {collections.length > 0 ? (
                  collections.map(col => (
                    <li key={col.id} onClick={() => handleFilterClick('collection', col.id)}>
                      {col.title}
                    </li>
                  ))
                ) : (
                  <span style={{ opacity: 0.5, cursor: 'default', fontSize: '11px', color: 'var(--grey-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Coming Soon</span>
                )}
              </ul>
            </div>

            {/* Col 2: Top */}
            <div className="megamenu-col">
              <h4>Top</h4>
              <div className="megamenu-badge-grid">
                {getSubcategories('top').map(sub => (
                  <span 
                    key={sub} 
                    className="megamenu-badge" 
                    onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                    style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 3: Bottom */}
            <div className="megamenu-col">
              <h4>Bottom</h4>
              <div className="megamenu-badge-grid">
                {getSubcategories('bottom').map(sub => (
                  <span 
                    key={sub} 
                    className="megamenu-badge" 
                    onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                    style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 4: Accessories */}
            <div className="megamenu-col">
              <h4>Accessories</h4>
              <div className="megamenu-badge-grid">
                {getSubcategories('accessories').map(sub => (
                  <span 
                    key={sub} 
                    className="megamenu-badge" 
                    onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                    style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 5: Color Swatches */}
            <div className="megamenu-col">
              <h4>Shop by color</h4>
              <div className="color-swatches-grid">
                {uniqueColors.length > 0 ? (
                  uniqueColors.map(colorFamily => (
                    <div 
                      key={colorFamily} 
                      className="color-swatch-row"
                      onClick={() => handleFilterClick('color', colorFamily)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="color-label">{colorFamily}</span>
                      <div className="color-dots">
                        {getColorSwatches(colorFamily).map((hex, i) => (
                          <span 
                            key={i} 
                            className="color-dot" 
                            style={{ backgroundColor: hex, border: hex === '#FAF9F6' ? '1px solid #ddd' : 'none' }}
                          ></span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ opacity: 0.5, cursor: 'default', fontSize: '11px', color: 'var(--grey-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Coming Soon</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MOBILE MENU (MOBILE ONLY ACCORDION) ==================== */}
        <div className="mobile-only burger-menu-body">
          {/* Top Level Static & Custom Collections */}
          <div className="burger-menu-top-links">
            <div className="burger-link-item" onClick={() => handleFilterClick('all', 'all')}>
              New Arrivals
            </div>
            {collections.map(col => (
              <div key={col.id} className="burger-link-item" onClick={() => handleFilterClick('collection', col.id)}>
                {col.title}
              </div>
            ))}
          </div>

          {/* Accordion Categories */}
          <div className="burger-menu-accordions">
            {/* Top Accordion */}
            <div className={`accordion-panel ${expandedCategory === 'top' ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('top')}>
                <span>Top</span>
                <span className="plus-minus">{expandedCategory === 'top' ? '−' : '+'}</span>
              </div>
              {expandedCategory === 'top' && (
                <div className="accordion-body">
                  {getSubcategories('top').map(sub => (
                    <div 
                      key={sub} 
                      className="accordion-sub-item" 
                      onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                      style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Accordion */}
            <div className={`accordion-panel ${expandedCategory === 'bottom' ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('bottom')}>
                <span>Bottom</span>
                <span className="plus-minus">{expandedCategory === 'bottom' ? '−' : '+'}</span>
              </div>
              {expandedCategory === 'bottom' && (
                <div className="accordion-body">
                  {getSubcategories('bottom').map(sub => (
                    <div 
                      key={sub} 
                      className="accordion-sub-item" 
                      onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                      style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accessories Accordion */}
            <div className={`accordion-panel ${expandedCategory === 'accessories' ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('accessories')}>
                <span>Accessories</span>
                <span className="plus-minus">{expandedCategory === 'accessories' ? '−' : '+'}</span>
              </div>
              {expandedCategory === 'accessories' && (
                <div className="accordion-body">
                  {getSubcategories('accessories').map(sub => (
                    <div 
                      key={sub} 
                      className="accordion-sub-item" 
                      onClick={() => sub !== 'Coming Soon' && handleFilterClick('subcategory', sub)}
                      style={sub === 'Coming Soon' ? { opacity: 0.5, cursor: 'default' } : {}}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shop by Color Accordion */}
            <div className={`accordion-panel ${expandedCategory === 'color' ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('color')}>
                <span>Shop by color</span>
                <span className="plus-minus">{expandedCategory === 'color' ? '−' : '+'}</span>
              </div>
              {expandedCategory === 'color' && (
                <div className="accordion-body color-swatches-body">
                  {uniqueColors.length > 0 ? (
                    uniqueColors.map(colorFamily => (
                      <div 
                        key={colorFamily} 
                        className="color-swatch-accordion-row"
                        onClick={() => handleFilterClick('color', colorFamily)}
                      >
                        <span className="color-swatch-label">{colorFamily}</span>
                        <div className="color-swatch-dots">
                          {getColorSwatches(colorFamily).map((hex, i) => (
                            <span 
                              key={i} 
                              className="color-swatch-dot" 
                              style={{ backgroundColor: hex, border: hex === '#FAF9F6' ? '1px solid #ddd' : 'none' }}
                            ></span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="accordion-sub-item" style={{ opacity: 0.5, cursor: 'default' }}>
                      Coming Soon
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Close Button */}
        <div className="burger-menu-bottom-close" onClick={onClose}>
          <div className="close-line"></div>
          <span>Close</span>
        </div>

      </div>
    </div>
  );
}
