import React, { useState, useEffect } from 'react';
import SizeChartModal from './SizeChartModal';
import ProductPrice from './ProductPrice';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock';

export default function SizePopup({ isOpen, onClose, product, onAddToBag, onBuyNow }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      setSelectedSize(''); // Reset size selection on open
    }
    return () => {
      if (isOpen) unlockBodyScroll();
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const sizesList = ['S', 'M', 'L', 'XL'];

  // Size stocks helper
  const getStockForSize = (size) => {
    if (product.sizes) {
      return product.sizes[size] !== undefined ? product.sizes[size] : 0;
    }
    // Fallback if older product schema
    return product.stock > 0 ? 10 : 0;
  };

  const handleAdd = () => {
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    onAddToBag(product, selectedSize);
    onClose();
  };

  const handleBuy = () => {
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    onBuyNow(product, selectedSize);
    onClose();
  };

  return (
    <>
      <div className="size-popup-overlay" onClick={onClose}>
        <div className="size-popup" onClick={(e) => e.stopPropagation()}>
          <button className="size-popup-close" onClick={onClose}>&times;</button>
          
          <div className="size-popup-content">
            <h2 className="size-popup-title">{product.name}</h2>
            {product.bogoOffer?.enabled && (
              <div className="product-offer-badge size-popup-offer-badge">
                {product.bogoOffer.label || 'BOGO OFFER'}
              </div>
            )}
            <ProductPrice
              product={product}
              className="size-popup-prices"
              currentClassName="size-popup-price"
            />
            <p className="size-popup-desc">{product.desc}</p>
            


            <div className="size-selection-area">
              <div className="size-selection-header">
                <span className="select-size-label">Select Size</span>
                <button 
                  className="size-guide-btn" 
                  onClick={() => setShowChart(true)}
                >
                  Size Guide
                </button>
              </div>

              <div className="size-buttons-grid">
                {sizesList.map(size => {
                  const stock = getStockForSize(size);
                  const isOutOfStock = stock <= 0;
                  
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(size)}
                      className={`size-select-btn ${selectedSize === size ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                    >
                      <span className="size-name">{size}</span>
                      <span className="size-stock-status">
                        {isOutOfStock ? 'Sold Out' : `${stock} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="size-popup-actions">
              <button className="btn btn-outline" onClick={handleAdd}>
                ADD TO BAG
              </button>
              <button className="btn btn-accent" onClick={handleBuy}>
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </div>

      <SizeChartModal 
        isOpen={showChart} 
        onClose={() => setShowChart(false)} 
        sizeChart={product?.sizeChart}
      />
    </>
  );
}
