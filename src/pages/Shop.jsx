import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Package, Gift, ArrowRight } from 'lucide-react';
import { appPath, mediaUrl } from '../lib/urls';

const VIDEO_URLS = [
  "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ba276ebdc230c7ec44da58ad9029&profile_id=139&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/435674703.sd.mp4?s=6f4af4f691684c9fb647146522c0e86b240ff11c&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/517643534.sd.mp4?s=7b9260d2b638977a4128f1b6264d1f2e1a3d0f01&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/403848737.sd.mp4?s=d0092ad81b53e8fb85567b453e028b18f8e0251c&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ba276ebdc230c7ec44da58ad9029&profile_id=139&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/435674703.sd.mp4?s=6f4af4f691684c9fb647146522c0e86b240ff11c&profile_id=165&oauth2_token_id=57447761"
];

// Sub-component for product card carousels with auto-scroll and manual arrows
export function ProductGridCard({ product, onAddToCart }) {
  const displayImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : []);

  const totalSlides = displayImages.length > 0 ? displayImages.length : 2;

  const [slideIdx, setSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      e.stopPropagation();
      setSlideIdx(prev => (prev + 1) % totalSlides);
    }
    if (isRightSwipe) {
      e.stopPropagation();
      setSlideIdx(prev => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  useEffect(() => {
    if (!isHovered) return;
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % totalSlides);
    }, 2500);
    return () => clearInterval(timer);
  }, [isHovered, totalSlides]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setSlideIdx(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setSlideIdx(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const navigate = useNavigate();

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="product-card reveal"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSlideIdx(0);
      }}
    >
      <div
        className="product-img-wrapper"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sizing badges & out-of-stock tags */}
        {product.stock <= 5 && product.stock > 0 && <span className="product-tag tag-limited">Low Stock</span>}
        {product.stock === 0 && <span className="product-tag tag-best" style={{ background: '#7E7E82' }}>Sold Out</span>}

        {/* Scroll Buttons */}
        <button className="card-slide-arrow arrow-left" onClick={prevSlide}>&#10094;</button>
        <button className="card-slide-arrow arrow-right" onClick={nextSlide}>&#10095;</button>

        {/* Carousel Slides */}
        {displayImages.map((imgUrl, idx) => (
          slideIdx === idx && (
            <img key={idx} src={mediaUrl(imgUrl)} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ))}

        {displayImages.length === 0 && (
          <>
            {slideIdx === 0 && (
              <div className={`product-graphic ${product.graphicClass}`}>
                <div className={product.printClass} dangerouslySetInnerHTML={{ __html: product.printText }}></div>
              </div>
            )}
            {slideIdx === 1 && (
              <div className={`product-graphic ${product.graphicClass}`} style={{ transform: 'scale(1.18)' }}>
                <div className={product.printClass} style={{ fontSize: '13px' }} dangerouslySetInnerHTML={{ __html: product.printText }}></div>
              </div>
            )}
          </>
        )}

        {/* Dot Indicators */}
        <div className="card-slide-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <span key={i} className={`slide-dot ${slideIdx === i ? 'active' : ''}`}></span>
          ))}
        </div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-row">
          <div className="product-prices" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="price-current">RS. {product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="price-original" style={{ textDecoration: 'line-through', fontSize: '12px', color: 'var(--grey-muted)' }}>RS. {product.originalPrice}</span>
              )}
            </div>
            {discountPercent > 0 && (
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {discountPercent}% OFF
              </span>
            )}
          </div>
          {product.stock > 0 ? (
            <button
              className="add-to-bag-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <span className="add-to-bag-text">Add to Cart</span>
              <span className="add-to-bag-icon" aria-hidden="true">+</span>
            </button>
          ) : (
            <button
              className="add-to-bag-btn sold-out-btn"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
              onClick={(e) => e.stopPropagation()}
              disabled
            >
              <span className="add-to-bag-text">Sold Out</span>
              <span className="add-to-bag-icon" style={{ fontSize: '10px', fontWeight: '800' }}>x</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Premium 3D Stacked Cover-Flow Lookbook Gallery Scroller
function GalleryScroller() {
  const [items, setItems] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items]);

  if (items.length === 0) return null;

  const getSlideClass = (idx) => {
    if (idx === activeIdx) return 'gallery-slide active';

    // Calculate relative index positions for loop wraparound
    const total = items.length;
    const prevIdx = (activeIdx - 1 + total) % total;
    const nextIdx = (activeIdx + 1) % total;

    if (idx === prevIdx) return 'gallery-slide prev';
    if (idx === nextIdx) return 'gallery-slide next';

    return 'gallery-slide hidden';
  };

  return (
    <section className="homepage-gallery-section">
      <div className="container">
        {/* Cover flow stack wrapper */}
        <div className="gallery-coverflow-wrapper">
          <div className="gallery-slides-container">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={getSlideClass(idx)}
              >
                <a href={appPath(item.link || '#')} className="gallery-item-link-card">
                  <img src={mediaUrl(item.imageUrl)} alt={item.title || 'Gallery Image'} loading="lazy" decoding="async" />
                  {item.title && (
                    <div className="gallery-slide-text-overlay">
                      <span className="gallery-slide-title-text">{item.title}</span>
                    </div>
                  )}
                </a>
              </div>
            ))}
          </div>

          {/* Dot Pagination Controls */}
          <div className="gallery-dots-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
            {items.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`gallery-pagination-dot ${idx === activeIdx ? 'active' : ''}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: idx === activeIdx ? 'var(--ink)' : 'rgba(15, 15, 17, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent'
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default function Shop({ onAddToCart }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [mobileVideoSrc, setMobileVideoSrc] = useState('');
  const mobileHeroVideoRef = useRef(null);
  const [heroConfig, setHeroConfig] = useState({
    tagline: 'New Season Drop',
    title: 'Wear\nSome\nthing\nReal.',
    desc: 'Streetwear built for India. Minimal by choice, meaningful by design. Every product you buy puts ₹23 into the hands of someone who needs it more.',
    bgImage: 'assets/hero_streetwear.png',
    button1Text: 'Shop the Drop',
    button1Link: '#shop-catalog',
    button2Text: 'Our Mission',
    button2Link: '/our-mission',
    mobileVideoUrl: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ba276ebdc230c7ec44da58ad9029&profile_id=139&oauth2_token_id=57447761'
  });

  // Filtering states from URL query
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/collections').then(res => res.json()),
      fetch('/api/hero-config', { cache: 'no-store' }).then(res => res.json())
    ])
      .then(([productsData, collectionsData, heroConfigData]) => {
        setProducts(productsData || []);
        setCollections(collectionsData || []);
        if (heroConfigData) setHeroConfig(heroConfigData);
      })
      .catch(err => console.error('Error fetching catalog data:', err));

    // 2. Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '/',
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => { });
  }, []);

  useEffect(() => {
    setMobileVideoSrc(heroConfig.mobileVideoUrl || VIDEO_URLS[0]);
  }, [heroConfig.mobileVideoUrl]);

  useEffect(() => {
    const video = mobileHeroVideoRef.current;
    if (!video || !mobileVideoSrc) return;

    const playVideo = () => {
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    };

    video.load();
    playVideo();
    video.addEventListener('loadedmetadata', playVideo);
    video.addEventListener('canplay', playVideo);
    window.addEventListener('touchstart', playVideo, { once: true, passive: true });

    return () => {
      video.removeEventListener('loadedmetadata', playVideo);
      video.removeEventListener('canplay', playVideo);
      window.removeEventListener('touchstart', playVideo);
    };
  }, [mobileVideoSrc]);

  // Sync route query parameters for search/filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    const searchParam = params.get('search');
    const collectionParam = params.get('collection');
    const categoryParam = params.get('category');
    const subcategoryParam = params.get('subcategory');
    const colorParam = params.get('color');

    if (filterParam) setFilter(filterParam);
    else setFilter('all');

    if (searchParam) setSearchQuery(searchParam);
    else setSearchQuery('');

    if (collectionParam) setCollectionFilter(collectionParam);
    else setCollectionFilter('');

    if (categoryParam) setCategoryFilter(categoryParam);
    else setCategoryFilter('');

    if (subcategoryParam) setSubCategoryFilter(subcategoryParam);
    else setSubCategoryFilter('');

    if (colorParam) setColorFilter(colorParam);
    else setColorFilter('');
  }, [window.location.search]);

  // Compute products matching all active query filters
  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.desc && p.desc.toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }

    if (collectionFilter) {
      const col = collections.find(c => c.id === collectionFilter);
      if (col && col.productIds) {
        if (!col.productIds.includes(p.id)) return false;
      } else {
        return false;
      }
    }

    if (categoryFilter && p.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;

    if (subCategoryFilter) {
      if (!p.subCategories) return false;
      const match = p.subCategories.some(sub => sub.toLowerCase() === subCategoryFilter.toLowerCase());
      if (!match) return false;
    }

    if (colorFilter && (!p.colors || !p.colors.map(c => c.toLowerCase()).includes(colorFilter.toLowerCase()))) return false;

    if (filter !== 'all' && p.category !== filter) return false;

    return true;
  });

  const isDefaultView = !searchQuery && !collectionFilter && !categoryFilter && !subCategoryFilter && !colorFilter && filter === 'all';
  const displayedProducts = isDefaultView && !showAllProducts
    ? filteredProducts.slice(0, 5)
    : filteredProducts;

  const heroShopLink = heroConfig.button1Link || '#shop-catalog';
  const trackHeroShopNow = (placement) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click_button',
        buttonId: `SHOP_NOW_${placement}_Hero`,
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => {});
  };

  return (
    <>
      {/* PC HERO SECTION */}
      <section className="hero-section pc-only">
        <img src={mediaUrl(heroConfig.bgImage)} alt="LOG streetwear background" className="hero-bg-image" loading="eager" decoding="async" fetchpriority="high" />
        <div className="hero-overlay"></div>
        <a
          href={appPath(heroShopLink)}
          className="hero-shop-now"
          onClick={() => trackHeroShopNow('Desktop')}
        >
          Shop now
        </a>
      </section>

      {/* MOBILE HERO SECTION (Single Autoplay Video) */}
      <section className="mobile-hero-video mobile-only">
        {mobileVideoSrc && (
          <video
            ref={mobileHeroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            controls={false}
            poster={mediaUrl(heroConfig.bgImage)}
            onError={() => {
              if (mobileVideoSrc !== VIDEO_URLS[0]) {
                setMobileVideoSrc(VIDEO_URLS[0]);
              }
            }}
          >
            <source src={mediaUrl(mobileVideoSrc)} type="video/mp4" />
          </video>
        )}
        <div className="mobile-hero-shop-now">
          <a
            href={appPath(heroShopLink)}
            onClick={() => trackHeroShopNow('Mobile')}
          >
            Shop now
          </a>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item reveal">
              <div className="stat-val">₹623</div>
              <div className="stat-label">Starting Price</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-val">₹23</div>
              <div className="stat-label">Donated Per Item</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-val">100%</div>
              <div className="stat-label">No Fine Print</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section className="container" id="shop-catalog" >
        <div className="section-header reveal">
          <div>
            <h2 className="section-title">
              {searchQuery ? `Search: "${searchQuery}"` : collectionFilter ? 'Collection Items' : 'New Drop'}
            </h2>
          </div>
        </div>



        <div className="product-grid">
          {displayedProducts.map(product => (
            <ProductGridCard
              product={product}
              onAddToCart={onAddToCart}
              key={product.id}
            />
          ))}
        </div>

        {/* Discover More Button */}
        {isDefaultView && !showAllProducts && filteredProducts.length > 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '20px' }}>
            <button className="btn btn-accent" onClick={() => navigate('/shop')}>
              Show More Products
            </button>
          </div>
        )}
      </section>

      {/* MANIFESTO SECTION */}
      <section className="manifesto-section">
        <div className="container">
          <div className="manifesto-layout">
            <div className="manifesto-label reveal">What We Believe</div>
            <div className="manifesto-quote reveal">
              Good clothes <br />
              <span className="italic-muted">don't need a</span> <br />
              corporate story. <br />
              <span className="accent-text">They need a</span> <br />
              conscience.
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY LOOKBOOK SCROLLER */}
      <GalleryScroller />

      {/* PROCESS SECTION WITH OUTLINE ICONS */}
      <section className="process-section">
        <div className="container">
          <div className="process-grid">
            <div className="process-card reveal">
              <div className="process-num" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '15px', color: 'var(--accent)' }}>
                <Heart size={36} strokeWidth={1.5} color="var(--accent)" fill="var(--accent)" />
              </div>
              <h3 className="process-card-title">Pick your tee</h3>
              <p className="process-card-text">Browse the drop. Find the one that speaks to you. No clutter, no confusion.</p>
            </div>
            <div className="process-card reveal">
              <div className="process-num" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '15px', color: 'var(--ink)' }}>
                <ShoppingCart size={36} strokeWidth={1.5} />
              </div>
              <h3 className="process-card-title">Checkout</h3>
              <p className="process-card-text">Pay securely. ₹23 per item is automatically earmarked for donation. Nothing extra to click.</p>
            </div>
            <div className="process-card reveal">
              <div className="process-num" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '15px', color: 'var(--ink)' }}>
                <Package size={36} strokeWidth={1.5} />
              </div>
              <h3 className="process-card-title">We ship it</h3>
              <p className="process-card-text">Straight to your door. Minimal packaging. Your tee, delivered.</p>
            </div>
            <div className="process-card reveal">
              <div className="process-num" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '15px', color: 'var(--ink)' }}>
                <Gift size={36} strokeWidth={1.5} />
              </div>
              <h3 className="process-card-title">We donate it</h3>
              <p className="process-card-text">₹23 per product goes where it's needed. Every order. No exceptions. You just wore something that mattered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT SECTION */}
      <section className="statement-section">
        <div className="container">
          <h2 className="statement-title reveal">Your Tee.<br /><span className="outline">Their Future.</span></h2>
          <p className="statement-sub reveal">Every product funds something real. Start shopping.</p>
          <a href="#shop-catalog" className="btn btn-white reveal">Shop Now - From ₹623</a>
        </div>
      </section>
    </>
  );
}
