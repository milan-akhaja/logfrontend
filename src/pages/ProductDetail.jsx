import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SizeChartModal from '../components/SizeChartModal';
import SEO, { SITE_URL } from '../components/SEO';
import ProductPrice from '../components/ProductPrice';
import { ProductGridCard } from './Shop';
import { mediaUrl } from '../lib/urls';

export default function ProductDetail({ onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, washcare, shipping
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const [slideIdx, setSlideIdx] = useState(0);
  const mobileGalleryRef = useRef(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const found = data.find(p => p.id === id || String(p.id) === String(id));
        setProduct(found || null);
        if (found) {
          if (found.sizes) {
            // If sizes is array
            if (Array.isArray(found.sizes) && found.sizes.length > 0) {
              const available = found.sizes.filter(s => ['S', 'M', 'L', 'XL'].includes(s));
              if (available.length > 0) setSelectedSize(available[0]);
            } else {
              // If sizes is object (e.g. { S: 30, M: 40 })
              const keys = Object.keys(found.sizes).filter(k => ['S', 'M', 'L', 'XL'].includes(k));
              const inStockSize = keys.find(k => found.sizes[k] > 0);
              if (inStockSize) {
                setSelectedSize(inStockSize);
              } else if (keys.length > 0) {
                setSelectedSize(keys[0]);
              }
            }
          }
          const related = data.filter(p => String(p.id) !== String(found.id));
          setRelatedProducts(related);
        }
      })
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    setSlideIdx(0);
    if (mobileGalleryRef.current) {
      mobileGalleryRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [id]);

  const handleMobileGalleryScroll = () => {
    const node = mobileGalleryRef.current;
    if (!node || !node.clientWidth) return;
    setSlideIdx(Math.round(node.scrollLeft / node.clientWidth));
  };

  if (!product) {
    return (
      <div style={{ padding: '160px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>Product Not Found</h2>
        <button className="btn btn-accent" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
          Back to Shop
        </button>
      </div>
    );
  }

  const displayImages = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);
  const primaryImage = displayImages[0] || product.imageUrl || `${SITE_URL}/assets/hero_streetwear.png`;
  const productDescription = product.desc || product.description || `${product.name} from LOG premium Indian streetwear. Oversized fit, heavyweight cotton feel, and Rs. 23 donated from every product.`;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: displayImages.length ? displayImages : [primaryImage],
    description: productDescription,
    brand: {
      '@type': 'Brand',
      name: 'LOG'
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  const handleAddToBag = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    onAddToCart(product, selectedSize);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    onBuyNow(product, selectedSize);
  };

  // Helper check if size is available in stock
  const isSizeAvailable = (size) => {
    if (!product.sizes) return false;
    if (Array.isArray(product.sizes)) {
      return product.sizes.includes(size);
    }
    return product.sizes[size] !== undefined && product.sizes[size] > 0;
  };

  return (
    <div className="product-detail-page-container">
      <SEO
        title={`${product.name} - LOG Streetwear`}
        description={productDescription}
        image={primaryImage}
        type="product"
        canonicalPath={`/product/${product.id}`}
        jsonLd={productJsonLd}
      />
      <div className="container">
        <div className="product-detail-layout">
          
          {/* Left Side: Product Gallery (Shows all images stacked vertically in log/long line form) */}
          <div className="product-detail-gallery product-detail-gallery-desktop">
            {displayImages.length > 0 ? (
              displayImages.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className="main-display-image-frame"
                  style={{ display: 'flex', height: 'auto', aspectRatio: 'auto' }}
                >
                  <img 
                    src={mediaUrl(imgUrl)} 
                    alt={`${product.name} detail view ${idx + 1}`} 
                    className="main-detail-img" 
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
                  />
                </div>
              ))
            ) : (
              <div className="main-display-image-frame">
                <div className={`product-graphic ${product.graphicClass}`} style={{ width: '100%', height: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className={product.printClass} style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>{product.printText}</div>
                </div>
              </div>
            )}
          </div>

          <div className="product-detail-gallery-mobile">
            {displayImages.length > 0 ? (
              <div className="main-display-image-frame mobile-swipe-frame">
                <div
                  ref={mobileGalleryRef}
                  className="mobile-gallery-scroll"
                  onScroll={handleMobileGalleryScroll}
                >
                  {displayImages.map((imgUrl, idx) => (
                    <div className="mobile-gallery-slide" key={`${imgUrl}-${idx}`}>
                      <img
                        src={mediaUrl(imgUrl)}
                        alt={`${product.name} detail view ${idx + 1}`}
                        className="main-detail-img"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
                <div className="mobile-gallery-count">
                  {slideIdx + 1} / {displayImages.length}
                </div>
              </div>
            ) : (
              <div className="main-display-image-frame mobile-swipe-frame">
                <div className={`product-graphic ${product.graphicClass}`} style={{ width: '100%', height: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className={product.printClass} style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>{product.printText}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Product Configuration Info */}
          <div className="product-detail-config">
            <div className="detail-header-meta">
              <h1 className="detail-product-title">{product.name}</h1>
              {product.bogoOffer?.enabled && (
                <div className="product-offer-badge detail-offer-badge">
                  {product.bogoOffer.label || 'BOGO OFFER'}
                </div>
              )}
              <ProductPrice
                product={product}
                className="detail-product-prices"
                currentClassName="detail-product-price"
                originalClassName="price-original detail-price-original"
              />
            </div>

            {/* Size Selector (S, M, L, XL only) */}
            <div className="detail-size-selector-section">
              <div className="size-selector-header-row">
                <span className="size-section-label">Select Size</span>
                <button 
                  className="size-guide-trigger-btn"
                  onClick={() => setShowSizeChart(true)}
                >
                  Size Guide
                </button>
              </div>

              <div className="detail-size-options-grid">
                {['S', 'M', 'L', 'XL'].map(size => {
                  const isAvailable = isSizeAvailable(size);
                  return (
                    <button
                      key={size}
                      className={`detail-size-option-btn ${selectedSize === size ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Buy Buttons */}
            <div className="detail-actions-row">
              <button className="detail-action-btn btn-add-bag" onClick={handleAddToBag}>
                ADD TO BAG
              </button>
              <button className="detail-action-btn btn-buy-now" onClick={handleBuyNow}>
                BUY NOW
              </button>
            </div>

            {/* Tabbed Info Description */}
            <div className="detail-info-tabs-card">
              <div className="detail-tabs-header">
                <button 
                  className={`detail-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details & Description
                </button>
                <button 
                  className={`detail-tab-btn ${activeTab === 'washcare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('washcare')}
                >
                  Washcare
                </button>
                <button 
                  className={`detail-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shipping')}
                >
                  Shipping
                </button>
              </div>

              <div className="detail-tabs-content">
                {activeTab === 'details' && (
                  <div className="tab-details-view" style={{ whiteSpace: 'pre-line' }}>
                    {product.details ? (
                      <div>
                        <p>{product.details}</p>
                        {product.desc && (
                          <div className="description-text-block" style={{ marginTop: '15px' }}>
                            <strong>Description</strong>
                            <p>{product.desc}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="details-list-block">
                          <strong>Details</strong>
                          <ul>
                            <li>100% premium French Terry Cotton.</li>
                            <li>Double Bio Washed.</li>
                            <li>High Density DTF printing.</li>
                            <li>Oversized Fit / Half Sleeve design.</li>
                          </ul>
                        </div>
                        <div className="description-text-block" style={{ marginTop: '15px' }}>
                          <strong>Description</strong>
                          <p>{product.desc || 'Premium streetwear statement piece designed for ultimate fit and daily wear durability.'}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'washcare' && (
                  <div className="tab-washcare-view" style={{ whiteSpace: 'pre-line' }}>
                    {product.washcare ? (
                      <p>{product.washcare}</p>
                    ) : (
                      <ul>
                        <li>Cold machine wash inside out.</li>
                        <li>Do not bleach or dry clean.</li>
                        <li>Iron inside out on low heat settings.</li>
                        <li>Do not tumble dry.</li>
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="tab-shipping-view" style={{ whiteSpace: 'pre-line' }}>
                    <p>{product.shipping || 'Free standard shipping across India. Standard orders are dispatched within 24-48 business hours and delivered within 3-5 business days. Easy exchanges and hassle-free returns within 7 days of delivery.'}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* You may also like Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section" style={{ marginTop: '80px', borderTop: '1px solid var(--grey-light)', paddingTop: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center', letterSpacing: '0.05em' }}>You May Also Like</h2>
            <div className="related-products-row">
              {relatedProducts.map(p => (
                <ProductGridCard 
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      <SizeChartModal 
        isOpen={showSizeChart} 
        onClose={() => setShowSizeChart(false)} 
        sizeChart={product?.sizeChart}
      />
    </div>
  );
}
