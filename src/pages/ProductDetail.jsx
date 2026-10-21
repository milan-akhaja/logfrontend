import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SizeChartModal from '../components/SizeChartModal';
import SEO, { SITE_URL } from '../components/SEO';
import ProductPrice from '../components/ProductPrice';
import { ProductGridCard } from './Shop';
import { mediaSrcSet, mediaUrl, srcSetFallback } from '../lib/urls';
import { getProducts, getCachedProducts } from '../lib/products';
import { FALLBACK_COUPONS, getCoupons, couponBadge, couponPill, couponOfferWhere, couponAppliesToProduct } from '../lib/coupons';
import { productSizes } from '../lib/sizes';
import { scrollToTopInstant } from '../lib/scrollRestoration';
import { trackGA4Event, trackMetaEvent, canTrackGA4, canTrackMeta } from '../lib/analytics';

export default function ProductDetail({ onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(() => {
    const list = getCachedProducts();
    if (list) {
      return list.find(p => p.id === id || String(p.id) === String(id)) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(!product);
  const [activeTab, setActiveTab] = useState('details'); // details, washcare, shipping
  const [selectedSize, setSelectedSize] = useState(() => {
    if (!product) return '';
    const available = productSizes(product);
    return available[0] || '';
  });
  const [selectedSecondSize, setSelectedSecondSize] = useState(() => {
    if (!product) return '';
    const available = productSizes(product);
    return available[0] || '';
  });
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState(() => {
    const list = getCachedProducts();
    if (list && product) {
      return list.filter(p => String(p.id) !== String(product.id));
    }
    return [];
  });
  
  const [slideIdx, setSlideIdx] = useState(0);
  const [offerCoupons, setOfferCoupons] = useState(FALLBACK_COUPONS);

  useEffect(() => {
    let active = true;
    getCoupons().then((list) => {
      if (active) setOfferCoupons(list);
    });
    return () => { active = false; };
  }, []);
  const mobileGalleryRef = useRef(null);

  // Guarantee scroll starts at top instantly on route change & when product is ready
  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [id]);

  useEffect(() => {
    if (product) {
      scrollToTopInstant();
    }
  }, [product?.id]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then(data => {
        if (!active) return;
        const found = data.find(p => p.id === id || String(p.id) === String(id));
        setProduct(found || null);
        setLoading(false);
        if (found) {
          if (found.sizes) {
            // If sizes is array
            if (Array.isArray(found.sizes) && found.sizes.length > 0) {
              const available = productSizes(found);
              if (available.length > 0) {
                setSelectedSize(prev => prev || available[0]);
                setSelectedSecondSize(prev => prev || available[0]);
              }
            } else {
              // If sizes is object (e.g. { S: 30, M: 40 })
              const keys = productSizes(found);
              const inStockSize = keys.find(k => found.sizes[k] > 0);
              if (inStockSize) {
                setSelectedSize(prev => prev || inStockSize);
                setSelectedSecondSize(prev => prev || inStockSize);
              } else if (keys.length > 0) {
                setSelectedSize(prev => prev || keys[0]);
                setSelectedSecondSize(prev => prev || keys[0]);
              }
            }
          }
          const related = data.filter(p => String(p.id) !== String(found.id));
          setRelatedProducts(related);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const viewedMetaProductIdRef = useRef(null);
  const viewedGA4ProductIdRef = useRef(null);

  const sendViewContentEvents = useCallback((currentProduct) => {
    if (!currentProduct || !currentProduct.id) return;
    const prodId = String(currentProduct.id);
    const variant = selectedSize || (productSizes(currentProduct)[0] || '');
    const price = Number(
      currentProduct.preorderPrice !== null && currentProduct.preorderPrice !== undefined
        ? currentProduct.preorderPrice
        : (currentProduct.price || 0)
    );

    if (viewedGA4ProductIdRef.current !== prodId && canTrackGA4()) {
      trackGA4Event('view_item', {
        currency: 'INR',
        value: price,
        items: [{
          item_id: prodId,
          item_name: currentProduct.name,
          price: price,
          quantity: 1,
          item_variant: variant
        }]
      });
      viewedGA4ProductIdRef.current = prodId;
    }

    if (viewedMetaProductIdRef.current !== prodId && canTrackMeta()) {
      try {
        const sent = trackMetaEvent('ViewContent', {
          content_ids: [prodId],
          content_type: 'product',
          content_name: currentProduct.name,
          value: price,
          currency: 'INR'
        });
        if (sent) {
          viewedMetaProductIdRef.current = prodId;
        }
      } catch {}
    }
  }, [selectedSize]);

  useEffect(() => {
    if (product?.id) {
      sendViewContentEvents(product);
    }
  }, [product?.id, sendViewContentEvents]);

  useEffect(() => {
    const handleConsentUpdate = () => {
      if (product?.id) {
        sendViewContentEvents(product);
      }
    };
    document.addEventListener('cookieyes_consent_update', handleConsentUpdate);
    return () => {
      document.removeEventListener('cookieyes_consent_update', handleConsentUpdate);
    };
  }, [product, sendViewContentEvents]);

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

  // Rendered size buttons follow the product, not a fixed list.
  const sizeOptions = productSizes(product);

  if (loading && !product) {
    return (
      <div className="product-detail-page-container" style={{ padding: '160px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page-container" style={{ padding: '160px 20px', textAlign: 'center', minHeight: '100vh' }}>
        <SEO title="Product Not Found | logcloth" description="The requested logcloth product could not be found." noindex canonicalPath={id ? `/product/${id}` : '/shop'} />
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
  const primaryImage = displayImages[0] || product.imageUrl || `${SITE_URL}/assets/hero_streetwear.webp`;

  // Title, description and structured data follow the same rules as the
  // server-rendered page in api/page.js - keep the two in step, or the page
  // changes its own title once JavaScript loads.
  const productColour = Array.isArray(product.colors) && product.colors.find(Boolean)
    ? String(product.colors.find(Boolean)).trim().toLowerCase()
    : '';
  const isDropDesign = Number(product?.piecesTotal || 0) > 0;
  const dropTotal = Number(product?.piecesTotal || 40);
  const seoTitle = isDropDesign
    ? `${product.name} — Oversized 240 GSM Tee | logcloth`
    : `${product.name} — Oversized Tee | logcloth`;
  const seoDescriptionFull = isDropDesign
    ? `${product.name} — unisex oversized ${productColour ? `${productColour} ` : ''}tee, 240 GSM cotton, for men and women. One of ${dropTotal} numbered pieces from the No Permission 3.0 drop.`
    : `${product.name}${productColour ? ` in ${productColour}` : ''} — unisex oversized tee from logcloth. Heavyweight 240 GSM cotton streetwear for men and women. ${product.description || product.desc || ''}`.replace(/\s+/g, ' ').trim();
  const productDescription = seoDescriptionFull.length <= 155
    ? seoDescriptionFull
    : `${seoDescriptionFull.slice(0, 154).replace(/\s+\S*$/, '')}…`;
  const imageAlt = productColour ? `${product.name} – ${productColour}` : product.name;
  let seoAvailability = Number(product.stock || 0) > 0 ? 'InStock' : 'OutOfStock';
  if (product.isPreorder === true) {
    if (product.soldOut === true) seoAvailability = 'SoldOut';
    else seoAvailability = product.preorderPhase === 'after' ? 'InStock' : 'PreOrder';
  }
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: displayImages.length ? displayImages : [primaryImage],
    description: productDescription,
    sku: String(product.id),
    audience: {
      '@type': 'PeopleAudience',
      suggestedGender: 'unisex'
    },
    ...(productColour ? { color: productColour } : {}),
    brand: {
      '@type': 'Brand',
      name: 'logcloth'
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.preorderPrice !== null && product.preorderPrice !== undefined ? product.preorderPrice : product.price,
      availability: `https://schema.org/${seoAvailability}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' }
      },
      hasMerchantReturnPolicy: product.isPreorder === true
        ? {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
          merchantReturnLink: `${SITE_URL}/refund-policy`
        }
        : {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          restockingFee: { '@type': 'MonetaryAmount', value: 23, currency: 'INR' },
          itemDefectReturnFees: 'https://schema.org/FreeReturn',
          merchantReturnLink: `${SITE_URL}/refund-policy`
        }
    }
  };

  const handleAddToBag = () => {
    if (isChosenSoldOut) return;
    if (product.bogoOffer?.enabled) {
      if (!selectedSize || !selectedSecondSize) {
        alert('Please select both sizes for the BOGO offer');
        return;
      }
      onAddToCart(product, selectedSize, selectedSecondSize);
    } else {
      if (!selectedSize) {
        alert('Please select a size');
        return;
      }
      onAddToCart(product, selectedSize);
    }
  };

  const handleBuyNow = () => {
    if (isChosenSoldOut) return;
    if (product.bogoOffer?.enabled) {
      if (!selectedSize || !selectedSecondSize) {
        alert('Please select both sizes for the BOGO offer');
        return;
      }
      onBuyNow(product, selectedSize, selectedSecondSize);
    } else {
      if (!selectedSize) {
        alert('Please select a size');
        return;
      }
      onBuyNow(product, selectedSize);
    }
  };

  // Numbered drop: every field below is decided by the server.
  const isDrop = product.isPreorder === true;
  const isDropAllSizesZero = Boolean(
    isDrop &&
    product.sizes &&
    typeof product.sizes === 'object' &&
    !Array.isArray(product.sizes) &&
    Object.keys(product.sizes).length > 0 &&
    Object.values(product.sizes).every(count => Number(count) <= 0)
  );
  const dropNotOpen = isDrop && product.preorderPhase === 'before';
  const dropSoldOut = isDrop && (product.soldOut === true || isDropAllSizesZero);
  const dropBlocked = dropNotOpen || dropSoldOut;
  const dropOpensLabel = dropNotOpen && product.preorderOpensAt
    ? new Date(product.preorderOpensAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', hour: 'numeric', minute: '2-digit'
    }).replace('/', '.')
    : '';
  let dropButtonLabel = '';
  if (dropSoldOut) dropButtonLabel = 'SOLD OUT';
  else if (dropNotOpen) dropButtonLabel = dropOpensLabel ? `OPENS ${dropOpensLabel.toUpperCase()}` : 'OPENING SOON';

  // Helper check if size is available in stock
  const isSizeAvailable = (size) => {
    if (!product.sizes || product.soldOut) return false;
    if (Array.isArray(product.sizes)) {
      return product.sizes.includes(size);
    }
    return product.sizes[size] !== undefined && Number(product.sizes[size]) > 0;
  };

  const hasActivePreorderDiscount = Boolean(
    isDrop &&
    product.preorderPrice !== null &&
    product.preorderPrice !== undefined &&
    Number(product.preorderDiscount) > 0
  );
  const isRegularSoldOut = Boolean(
    product.soldOut === true ||
    (
      product.sizes &&
      typeof product.sizes === 'object' &&
      !Array.isArray(product.sizes) &&
      Object.keys(product.sizes).length > 0
        ? Object.values(product.sizes).every(count => Number(count) <= 0)
        : Number(product.stock || 0) <= 0
    )
  );
  const isProductSoldOut = isDrop ? dropSoldOut : isRegularSoldOut;
  const showOfferCard = !hasActivePreorderDiscount && !isProductSoldOut;

  const isChosenSoldOut = product.bogoOffer?.enabled
    ? Boolean((selectedSize && !isSizeAvailable(selectedSize)) || (selectedSecondSize && !isSizeAvailable(selectedSecondSize)))
    : Boolean(selectedSize && !isSizeAvailable(selectedSize));

  return (
    <div className="product-detail-page-container">
      <SEO
        title={seoTitle}
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
                    srcSet={mediaSrcSet(imgUrl)}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={srcSetFallback}
                    alt={idx === 0 ? imageAlt : `${imageAlt} (view ${idx + 1})`} 
                    className="main-detail-img" 
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchpriority={idx === 0 ? 'high' : 'auto'}
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
                        srcSet={mediaSrcSet(imgUrl)}
                        sizes="100vw"
                        onError={srcSetFallback}
                        alt={idx === 0 ? imageAlt : `${imageAlt} (view ${idx + 1})`}
                        className="main-detail-img"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        fetchpriority={idx === 0 ? 'high' : 'auto'}
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
              {(isDrop || isDropDesign) && product.preorderPhase === 'after' && (
                <span
                  className="product-tag tag-best"
                  style={{
                    position: 'static',
                    display: 'inline-block',
                    margin: '6px 0 10px',
                    background: '#7E7E82',
                    color: '#fff',
                    letterSpacing: '0.05em'
                  }}
                >
                  NEW DROP
                </span>
              )}
              {product.bogoOffer?.enabled && (
                <div className="product-offer-badge detail-offer-badge">
                  {product.bogoOffer.label || 'BOGO OFFER'}
                </div>
              )}
              {isDrop && product.preorderPrice !== null && product.preorderPrice !== undefined ? (
                <div className="detail-product-prices">
                  <div className="product-price-line">
                    <span className="detail-product-price">₹{Number(product.preorderPrice).toLocaleString('en-IN')}</span>
                    <span className="price-original detail-price-original">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="preorder-note">pre-order · ₹{product.preorderDiscount} off per piece</span>
                </div>
              ) : (
                <ProductPrice
                  product={product}
                  className="detail-product-prices"
                  currentClassName="detail-product-price"
                  originalClassName="price-original detail-price-original"
                />
              )}
              {isDrop && Number(product.piecesTotal) > 0 && (
                <div className="drop-claimed-count">
                  {Math.max(0, Number(product.piecesTotal) - Number(product.piecesClaimed || 0))} of {product.piecesTotal} left
                </div>
              )}
            </div>

            {product.bogoOffer?.enabled ? (
              <>
                {/* Size Selector 1 */}
                <div className="detail-size-selector-section">
                  <div className="size-selector-header-row">
                    <span className="size-section-label">Select First Size</span>
                    <button 
                      className="size-guide-trigger-btn"
                      onClick={() => setShowSizeChart(true)}
                    >
                      Size Guide
                    </button>
                  </div>

                  <div className="detail-size-options-grid">
                    {sizeOptions.map(size => {
                      const isAvailable = isSizeAvailable(size);
                      return (
                        <button
                          key={size}
                          className={`detail-size-option-btn ${selectedSize === size ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                          style={!isAvailable ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } : undefined}
                        >
                          <span className="size-name">{size}</span>
                          {!isAvailable && <span className="size-stock-status">Sold Out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector 2 */}
                <div className="detail-size-selector-section" style={{ marginTop: '20px' }}>
                  <div className="size-selector-header-row">
                    <span className="size-section-label">Select Second Size (BOGO Free Piece)</span>
                  </div>

                  <div className="detail-size-options-grid">
                    {sizeOptions.map(size => {
                      const isAvailable = isSizeAvailable(size);
                      return (
                        <button
                          key={size}
                          className={`detail-size-option-btn ${selectedSecondSize === size ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => isAvailable && setSelectedSecondSize(size)}
                          disabled={!isAvailable}
                          style={!isAvailable ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } : undefined}
                        >
                          <span className="size-name">{size}</span>
                          {!isAvailable && <span className="size-stock-status">Sold Out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Original Size Selector */
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
                  {sizeOptions.map(size => {
                    const isAvailable = isSizeAvailable(size);
                    return (
                      <button
                        key={size}
                        className={`detail-size-option-btn ${selectedSize === size ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        style={!isAvailable ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } : undefined}
                      >
                        <span className="size-name">{size}</span>
                        {!isAvailable && <span className="size-stock-status">Sold Out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Buy Buttons */}
            {dropBlocked ? (
              <div className="detail-actions-row">
                <button className="detail-action-btn btn-add-bag" disabled>
                  {dropButtonLabel}
                </button>
              </div>
            ) : (
              <div className="detail-actions-row">
                <button 
                  className="detail-action-btn btn-add-bag" 
                  disabled={isChosenSoldOut} 
                  onClick={handleAddToBag}
                >
                  {isChosenSoldOut ? 'SOLD OUT' : 'ADD TO BAG'}
                </button>
                <button 
                  className="detail-action-btn btn-buy-now" 
                  disabled={isChosenSoldOut} 
                  onClick={handleBuyNow}
                >
                  {isChosenSoldOut ? 'SOLD OUT' : 'BUY NOW'}
                </button>
              </div>
            )}

            <p className="product-policy-line">
              {isDrop
                ? `${product.preorderPhase === 'after' ? 'numbered drop' : 'pre-order'}: size exchange only within 7 days.`
                : 'free shipping · free pan-india exchange · 7-day returns (refunds minus ₹23 for LOG Fund; full refund if defective).'}
            </p>

            {/* PRODUCT OFFER CARDS - the coupons managed in Admin > Coupons, no drop facts */}
            {showOfferCard && offerCoupons.some((def) => couponAppliesToProduct(def, product.id)) && (
              <div className="product-offer-cards-container">
                {offerCoupons.filter((def) => couponAppliesToProduct(def, product.id)).map((def) => (
                  <div className="product-offer-card product-offer-card-promo" key={def.code}>
                    <div className="product-offer-pill">{couponPill(def)}</div>
                    <h3 className="product-offer-headline">{couponBadge(def)}</h3>
                    <p className="product-offer-text">
                      Use code <span className="product-offer-highlight">{def.code}</span> at checkout{couponOfferWhere(def)}.
                    </p>
                  </div>
                ))}
              </div>
            )}

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
                    {/* Admin-defined specification rows, if this product has any. */}
                    {Array.isArray(product.specifications) && product.specifications.length > 0 && (
                      <div className="details-list-block" style={{ marginBottom: '15px' }}>
                        <strong>Specifications</strong>
                        <ul>
                          {product.specifications.map((spec, index) => (
                            <li key={`${spec.label}-${index}`}>{spec.label}: {spec.value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                            <li>Heavyweight 240 GSM cotton.</li>
                            <li>Double Bio Washed.</li>
                            <li>High Density DTF printing.</li>
                            <li>Oversized Fit / Half Sleeve design.</li>
                          </ul>
                        </div>
                        <div className="description-text-block" style={{ marginTop: '15px' }}>
                          <strong>Description</strong>
                          <p>{product.desc || 'Unisex oversized graphic t-shirt in heavyweight 240 GSM cotton for men and women.'}</p>
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
