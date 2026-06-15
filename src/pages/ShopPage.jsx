import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ProductGridCard } from './Shop';

export default function ShopPage({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Active filters from query params
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [activeCollection, setActiveCollection] = useState('');
  const [activeColor, setActiveColor] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dynamically populated filter option lists
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    // Fetch products & collections
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/collections').then(res => res.json())
    ])
      .then(([productsData, collectionsData]) => {
        setProducts(productsData || []);
        setCollections(collectionsData || []);

        // Dynamic subcategories list
        const subs = new Set();
        const cols = new Set();
        productsData.forEach(p => {
          if (p.subCategories) p.subCategories.forEach(sub => subs.add(sub));
          if (p.colors) p.colors.forEach(c => cols.add(c.toUpperCase()));
        });
        setAvailableSubcategories(Array.from(subs));
        setAvailableColors(Array.from(cols));
      })
      .catch(err => console.error(err));
  }, []);

  // Update filters when query params change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveCategory(params.get('category') || '');
    setActiveSubcategory(params.get('subcategory') || '');
    setActiveCollection(params.get('collection') || '');
    setActiveColor(params.get('color') || '');
    setSearchQuery(params.get('search') || '');
    setIsMobileFilterOpen(false);
  }, [location.search]);

  // Handle setting/clearing query params
  const setQueryParam = (key, value) => {
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // If setting category, clear subcategory since it might not apply
    if (key === 'category') {
      params.delete('subcategory');
    }
    navigate(`/shop?${params.toString()}`);
  };

  const clearAllFilters = () => {
    navigate('/shop');
  };

  // Case-insensitive subcategory matching and case-insensitive color matching
  const filteredProducts = products.filter(p => {
    if (activeCategory && p.category !== activeCategory.toLowerCase()) return false;
    
    if (activeSubcategory) {
      if (!p.subCategories) return false;
      const match = p.subCategories.some(s => s.toLowerCase() === activeSubcategory.toLowerCase());
      if (!match) return false;
    }

    if (activeCollection) {
      const col = collections.find(c => c.id === activeCollection);
      if (!col || !col.productIds || !col.productIds.includes(p.id)) return false;
    }

    if (activeColor) {
      if (!p.colors) return false;
      const match = p.colors.some(c => c.toLowerCase() === activeColor.toLowerCase());
      if (!match) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.desc && p.desc.toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });

  return (
    <div className="shoppage-container" style={{ paddingTop: '120px', minHeight: '80vh', background: '#ffffff' }}>
      <div className="container">
        
        {/* Breadcrumb / Title */}
        <div className="shoppage-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--grey-light)', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeSubcategory 
              ? activeSubcategory 
              : activeCategory 
                ? activeCategory 
                : activeCollection 
                  ? collections.find(c => c.id === activeCollection)?.name 
                  : searchQuery 
                    ? `Search: "${searchQuery}"` 
                    : 'Shop All'}
          </h1>
          <p style={{ color: 'var(--grey-muted)', fontSize: '13px', marginTop: '5px' }}>
            Showing {filteredProducts.length} items
          </p>
        </div>

        <div className="shoppage-layout">
          
          {/* Mobile Filter Toggle Button */}
          <div className="mobile-filter-bar mobile-only">
            <button 
              className="btn btn-outline" 
              onClick={() => setIsMobileFilterOpen(true)}
              style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em' }}
            >
              FILTERS
            </button>
          </div>

          {/* Backdrop overlay */}
          {isMobileFilterOpen && (
            <div 
              className="filter-drawer-backdrop mobile-only" 
              onClick={() => setIsMobileFilterOpen(false)}
            />
          )}

          {/* Left Side: Filter Sidebar */}
          <aside className={`shoppage-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
            
            {/* Close button inside sidebar on mobile */}
            <div className="sidebar-mobile-header mobile-only">
              <span style={{ fontWeight: '800', fontSize: '16px' }}>FILTERS</span>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '0 5px' }}
              >
                &times;
              </button>
            </div>

            {/* Clear Filters Button */}
            {(activeCategory || activeSubcategory || activeCollection || activeColor || searchQuery) && (
              <button 
                className="btn btn-outline" 
                onClick={clearAllFilters}
                style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: '700' }}
              >
                CLEAR FILTERS &times;
              </button>
            )}

            {/* Category Filter */}
            <div className="filter-group">
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Category</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['top', 'bottom', 'accessories'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setQueryParam('category', activeCategory === cat ? '' : cat)}
                    style={{
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeCategory === cat ? '800' : '500',
                      textTransform: 'uppercase',
                      color: activeCategory === cat ? 'var(--ink)' : 'var(--grey-muted)',
                      padding: '2px 0'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Filter */}
            <div className="filter-group">
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Style</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setQueryParam('subcategory', activeSubcategory === sub ? '' : sub)}
                    style={{
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeSubcategory === sub ? '800' : '500',
                      color: activeSubcategory === sub ? 'var(--ink)' : 'var(--grey-muted)',
                      padding: '2px 0'
                    }}
                  >
                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Collection Filter */}
            <div className="filter-group">
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Collections</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {collections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => setQueryParam('collection', activeCollection === col.id ? '' : col.id)}
                    style={{
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeCollection === col.id ? '800' : '500',
                      color: activeCollection === col.id ? 'var(--ink)' : 'var(--grey-muted)',
                      padding: '2px 0'
                    }}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div className="filter-group">
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Color</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setQueryParam('color', activeColor === color ? '' : color)}
                    style={{
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeColor === color ? '800' : '500',
                      color: activeColor === color ? 'var(--ink)' : 'var(--grey-muted)',
                      padding: '2px 0'
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Right Side: Product Catalog Grid */}
          <main className="shoppage-main">
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <ProductGridCard 
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '80px 20px', textAlign: 'center', border: '1px dashed var(--grey-light)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>No products match these filters</h3>
                <button className="btn btn-accent" onClick={clearAllFilters} style={{ marginTop: '20px' }}>
                  Clear Filters
                </button>
              </div>
            )}
          </main>

        </div>

      </div>
    </div>
  );
}
