import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { formatPrice, getPriceDisplay } from '../lib/pricing';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      Promise.all([
        fetch('/api/products').then(res => res.json()),
        fetch('/api/collections').then(res => res.json())
      ])
        .then(([productsData, collectionsData]) => {
          setProducts(productsData || []);
          setCollections(collectionsData || []);
        })
        .catch(err => console.error(err));
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleCollectionClick = (cat) => {
    onClose();
    navigate(`/?filter=${cat}`);
  };

  const handleProductClick = (productName) => {
    onClose();
    navigate(`/?search=${encodeURIComponent(productName)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onClose();
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="search-overlay-container" onClick={onClose}>
      <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
        <div className="search-overlay-header">
          <input 
            type="text" 
            placeholder="Search here..." 
            className="search-large-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="search-overlay-close" onClick={onClose}>&times;</button>
        </div>

        <div className="search-overlay-results">
          {query.trim().length > 0 ? (
            <div className="search-results-grid">
              <h4>Matching Items ({filtered.length})</h4>
              <ul className="search-results-list">
                {filtered.map(p => (
                  <li key={p.id} onClick={() => handleProductClick(p.name)}>
                    <span className="search-res-name">{p.name}</span>
                    <span className="search-res-price">
                      {formatPrice(getPriceDisplay(p).showDiscountedPrice ? p.discountedPrice : p.price)}
                    </span>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <p className="no-res-msg">No products match your search query.</p>
                )}
              </ul>
            </div>
          ) : (
            <div className="collections-suggestions">
              <h4>Collections</h4>
              <ul className="suggestions-list">
                {collections.slice(0, 4).map(col => (
                  <li key={col.id} onClick={() => { onClose(); navigate(`/shop?collection=${col.id}`); }}>
                    <span className="suggestion-bullet" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Folder size={14} style={{ marginRight: '6px' }} />
                    </span>
                    <span>{col.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
