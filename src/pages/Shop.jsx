import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ContentBlockLines from '../components/ContentBlockLines';
import ProductPrice from '../components/ProductPrice';
import useContentBlocks from '../hooks/useContentBlocks';
import useIsMobile from '../hooks/useIsMobile';
import { getProducts, getCachedProducts } from '../lib/products';
import { appPath, mediaSrcSet, mediaUrl, srcSetFallback } from '../lib/urls';
import ReviewsSection from '../components/ReviewsSection';
import { saveScrollPosition } from '../lib/scrollRestoration';

const slideIntervalMs = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5000;
  const milliseconds = parsed <= 60 ? parsed * 1000 : parsed;
  return Math.min(60000, Math.max(1000, Math.round(milliseconds)));
};

// Sub-component for product card carousels with manual arrows and touch swipes.
export function ProductGridCard({ product, onAddToCart }) {
  const displayImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : []);

  const totalSlides = displayImages.length > 0 ? displayImages.length : 2;

  const [slideIdx, setSlideIdx] = useState(0);

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

  const nextSlide = (e) => {
    e.stopPropagation();
    setSlideIdx(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setSlideIdx(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const navigate = useNavigate();
  const isDrop = product.isPreorder === true;
  const isDropAllSizesZero = Boolean(
    isDrop &&
    product.sizes &&
    typeof product.sizes === 'object' &&
    !Array.isArray(product.sizes) &&
    Object.keys(product.sizes).length > 0 &&
    Object.values(product.sizes).every(count => Number(count) <= 0)
  );
  const totalStock = (
    product.sizes &&
    typeof product.sizes === 'object' &&
    Object.keys(product.sizes).length > 0
  )
    ? Object.values(product.sizes).reduce((sum, qty) => sum + (parseInt(qty, 10) || 0), 0)
    : Number(product.stock || 0);

  const isSoldOut = isDrop
    ? (product.soldOut === true || isDropAllSizesZero)
    : totalStock === 0;
  const isOneOfOne = !isDrop && totalStock === 1 && (!Array.isArray(product.subCategories) || !product.subCategories.includes('no-permission-3'));
  const isLowStock = !isDrop && !isOneOfOne && totalStock <= 5 && totalStock > 0;

  return (
    <div
      className="product-card reveal"
      data-product-id={product.id}
      id={`product-card-${product.id}`}
      style={{ cursor: 'pointer' }}
      onClick={() => {
        const y = window.scrollY || window.pageYOffset || document.documentElement?.scrollTop || 0;
        if (y > 0) {
          saveScrollPosition(window.history.state?.key, window.location.pathname + window.location.search, y);
          try {
            sessionStorage.setItem('log_last_clicked_product', String(product.id));
            sessionStorage.setItem('log_last_scroll_y', String(y));
            if (window.location.pathname === '/') {
              sessionStorage.setItem('log_home_scroll', String(y));
            } else if (window.location.pathname === '/shop') {
              sessionStorage.setItem('log_shop_scroll', String(y));
            }
          } catch (e) {}
        }
        navigate(`/product/${product.id}`);
      }}
    >
      <div
        className="product-img-wrapper"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sizing badges & out-of-stock tags */}
        {product.bogoOffer?.enabled && (
          <span className="product-offer-badge card-offer-badge">
            {product.bogoOffer.label || 'BOGO OFFER'}
          </span>
        )}
        {isDrop && !isSoldOut && <span className="product-tag tag-best" style={{ background: '#7E7E82', color: '#fff', letterSpacing: '0.05em' }}>{product.preorderPhase === 'after' ? 'NEW DROP' : 'PRE ORDER'}</span>}
        {isSoldOut && <span className="product-tag tag-best" style={{ background: '#7E7E82' }}>Sold Out</span>}
        {isOneOfOne && <span className="product-tag tag-one-of-one">ONE OF ONE</span>}
        {isLowStock && <span className="product-tag tag-limited">LOW STOCK</span>}

        {/* Scroll Buttons */}
        <button className="card-slide-arrow arrow-left" onClick={prevSlide} aria-label={`Previous image for ${product.name}`}>&#10094;</button>
        <button className="card-slide-arrow arrow-right" onClick={nextSlide} aria-label={`Next image for ${product.name}`}>&#10095;</button>

        {/* Carousel Slides */}
        {displayImages.map((imgUrl, idx) => (
          slideIdx === idx && (
            <img key={idx} src={mediaUrl(imgUrl)} srcSet={mediaSrcSet(imgUrl)} sizes="(max-width: 768px) 50vw, 25vw" onError={srcSetFallback} alt={Array.isArray(product.colors) && product.colors.find(Boolean) ? `${product.name} – ${String(product.colors.find(Boolean)).trim().toLowerCase()}` : product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ))}

        {displayImages.length === 0 && (
          <>
            {slideIdx === 0 && (
              <div className={`product-graphic ${product.graphicClass}`}>
                <div className={product.printClass}>{product.printText}</div>
              </div>
            )}
            {slideIdx === 1 && (
              <div className={`product-graphic ${product.graphicClass}`} style={{ transform: 'scale(1.18)' }}>
                <div className={product.printClass} style={{ fontSize: '13px' }}>{product.printText}</div>
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
          <ProductPrice product={product} prefix="RS. " compact />
          {!isSoldOut ? (
            <button
              className="add-to-bag-btn"
              aria-label={`Add ${product.name} to bag`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <span className="add-to-bag-text">{isDrop && product.preorderPhase !== 'after' ? 'Pre-Order' : 'Add to Cart'}</span>
              <span className="add-to-bag-icon" aria-hidden="true">+</span>
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
              <span className="add-to-bag-icon" style={{ fontSize: '10px', fontWeight: '800' }}>x</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Premium 3D Stacked Cover-Flow Lookbook Gallery Scroller
const GalleryVideoCard = React.lazy(() => import('../components/GalleryVideoCard'));

function GalleryScroller() {
  const [items, setItems] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    didSwipe: false,
    isActive: false,
    source: null,
    pointerId: null,
    isHorizontal: false
  });

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, []);

  const activeItem = items[activeIdx];
  const activeIsVideo = Boolean(activeItem && ((activeItem.media_type || activeItem.mediaType) === 'video' || activeItem.video_url || activeItem.videoUrl));

  useEffect(() => {
    if (items.length <= 1 || isDragging) return;
    // Image slides: 5s. Video slides advance from the video's own ended event;
    // the long timeout is only a safety net if the video never plays.
    const delay = activeIsVideo ? 45000 : 5000;
    const timer = setTimeout(() => {
      setActiveIdx(prev => (prev + 1) % items.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [items, isDragging, activeIdx, activeIsVideo]);

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

  const goNext = () => setActiveIdx(prev => (prev + 1) % items.length);
  const goPrev = () => setActiveIdx(prev => (prev - 1 + items.length) % items.length);

  const startDrag = (clientX, clientY, source, pointerId = null) => {
    if (items.length <= 1) return;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      didSwipe: false,
      isActive: true,
      source,
      pointerId,
      isHorizontal: false
    };
    setIsDragging(true);
    setDragOffset(0);
  };

  const moveDrag = (clientX, clientY, event) => {
    if (!dragRef.current.isActive) return;
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    dragRef.current.currentX = clientX;
    dragRef.current.currentY = clientY;
    if (!dragRef.current.isHorizontal && Math.abs(deltaX) > 8) {
      dragRef.current.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
    }
    if (dragRef.current.isHorizontal) {
      event?.preventDefault?.();
      dragRef.current.didSwipe = Math.abs(deltaX) > 10;
      setDragOffset(Math.max(-118, Math.min(118, deltaX * 0.5)));
    }
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'touch') return;
    if (event.button !== undefined && event.button !== 0) return;
    startDrag(event.clientX, event.clientY, 'pointer', event.pointerId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    if (dragRef.current.source !== 'pointer') return;
    if (dragRef.current.pointerId !== null && dragRef.current.pointerId !== event.pointerId) return;
    moveDrag(event.clientX, event.clientY, event);
  };

  const finishSwipe = (event) => {
    if (!dragRef.current.isActive) return;
    if (
      event?.pointerId !== undefined &&
      dragRef.current.pointerId !== null &&
      dragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }
    const deltaX = dragRef.current.currentX - dragRef.current.startX;
    const deltaY = dragRef.current.currentY !== undefined
      ? dragRef.current.currentY - dragRef.current.startY
      : 0;
    if (Math.abs(deltaX) > 34 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    dragRef.current.isActive = false;
    dragRef.current.source = null;
    dragRef.current.pointerId = null;
    dragRef.current.isHorizontal = false;
    dragRef.current.currentY = 0;
    window.setTimeout(() => {
      dragRef.current.didSwipe = false;
    }, 80);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleTouchStart = (event) => {
    if (dragRef.current.source === 'pointer') return;
    const touch = event.touches?.[0];
    if (!touch) return;
    startDrag(touch.clientX, touch.clientY, 'touch');
  };

  const handleTouchMove = (event) => {
    if (dragRef.current.source !== 'touch') return;
    const touch = event.touches?.[0];
    if (!touch) return;
    dragRef.current.currentY = touch.clientY;
    moveDrag(touch.clientX, touch.clientY, event);
  };

  const handleTouchEnd = () => {
    if (dragRef.current.source !== 'touch') return;
    finishSwipe();
  };

  return (
    <section className="homepage-gallery-section">
      <div className="container">
        {/* Cover flow stack wrapper */}
        <div className="gallery-coverflow-wrapper">
          <div
            className={`gallery-slides-container ${isDragging ? 'is-dragging' : ''}`}
            style={{ '--gallery-drag-x': `${dragOffset}px` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishSwipe}
            onPointerCancel={finishSwipe}
            onPointerLeave={finishSwipe}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {items.map((item, idx) => {
              const isVideo = (item.media_type || item.mediaType) === 'video' || Boolean(item.video_url || item.videoUrl);
              const poster = mediaUrl(item.posterUrl || item.poster_url || item.imageUrl);
              return (
                <div
                  key={item.id || idx}
                  className={getSlideClass(idx)}
                >
                  <a
                    href={appPath(item.link || '#')}
                    className="gallery-item-link-card"
                    aria-label={item.title ? `Open ${item.title}` : 'Open gallery item'}
                    draggable="false"
                    onClick={(event) => {
                      if (dragRef.current.didSwipe) event.preventDefault();
                    }}
                  >
                    {isVideo ? (
                      <React.Suspense
                        fallback={
                          <img
                            src={poster}
                            alt={item.title || 'logcloth gallery reel'}
                            loading="lazy"
                            decoding="async"
                          />
                        }
                      >
                        <GalleryVideoCard
                          item={item}
                          isActive={idx === activeIdx}
                          loop={items.length <= 1}
                          onEnded={() => {
                            if (dragRef.current.isActive) return;
                            setActiveIdx(prev => (prev + 1) % items.length);
                          }}
                        />
                      </React.Suspense>
                    ) : (
                      <img src={mediaUrl(item.imageUrl)} alt={item.title || 'logcloth gallery image'} loading="lazy" decoding="async" />
                    )}
                    {item.title && (
                      <div className="gallery-slide-text-overlay">
                        <span className="gallery-slide-title-text">{item.title}</span>
                      </div>
                    )}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

let cachedHeroConfig = null;
let cachedCollections = null;

export function resetCachedHeroConfig() {
  cachedHeroConfig = null;
}

// Per-slide object-position tuning (Fix 3):
// Elevates model clothes/jeans/shoes above the bottom floating nav pill + "Shop now" button
// while strictly protecting model heads/faces from being cropped at the top.
const MOBILE_HERO_OBJECT_POSITIONS = {
  'OCC06631': 'center 70%',
  'OCC06684': 'center 62%',
  'OCC06541': 'center 22%',
  'OCC06606': 'center 65%',
  'OCC06778': 'center 60%',
  'DSC07904': 'center 65%'
};

export function getHeroObjectPosition(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return 'center 55%';
  for (const [key, pos] of Object.entries(MOBILE_HERO_OBJECT_POSITIONS)) {
    if (imageUrl.includes(key)) return pos;
  }
  return 'center 55%';
}

export default function Shop({ onAddToCart }) {
  // F25: mount one hero, not both. A hidden <img> still downloads its src.
  const isMobileViewport = useIsMobile();
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => getCachedProducts() || []);
  const [collections, setCollections] = useState(() => cachedCollections || []);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const contentBlocks = useContentBlocks();
  const homeManifesto = contentBlocks.home_manifesto;
  const [mobileVideoSrc, setMobileVideoSrc] = useState('');
  const [desktopHeroSlideIndex, setDesktopHeroSlideIndex] = useState(0);
  const [mobileHeroSlideIndex, setMobileHeroSlideIndex] = useState(0);
  const mobileHeroVideoRef = useRef(null);
  const heroSwipeRef = useRef({
    mode: null,
    count: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    pointerId: null,
    source: null,
    isActive: false,
    isHorizontal: false
  });
  const [heroConfig, setHeroConfig] = useState(() => cachedHeroConfig || ({
    tagline: '',
    title: '',
    desc: '',
    desktopMediaType: 'image',
    bgImage: '',
    desktopVideoUrl: '',
    desktopSlides: [],
    desktopSlideIntervalMs: 5000,
    mobileMediaType: 'image',
    mobileImageUrl: '',
    mobileSlides: [],
    mobileSlideIntervalMs: 5000,
    button1Text: '',
    button1Link: '#shop-catalog',
    button2Text: '',
    button2Link: '/our-mission',
    mobileVideoUrl: ''
  }));
  const [isHeroLoaded, setIsHeroLoaded] = useState(() => Boolean(cachedHeroConfig));

  // Filtering states from URL query
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');

  useEffect(() => {
    // The hero image URL comes from hero-config, and the hero is the LCP
    // element. Fetch it on its own so it is not waiting on the product list -
    // Promise.all made the hero wait for the slowest of the three.
    fetch('/api/hero-config')
      .then(res => res.json())
      .then(heroConfigData => {
        if (heroConfigData) {
          cachedHeroConfig = heroConfigData;
          setHeroConfig(heroConfigData);
          setIsHeroLoaded(true);
        }
      })
      .catch(err => {
        console.error('Error fetching hero config:', err);
        setIsHeroLoaded(true);
      });

    Promise.all([
      getProducts(),
      fetch('/api/collections').then(res => res.json())
    ])
      .then(([productsData, collectionsData]) => {
        setProducts(productsData || []);
        if (collectionsData) cachedCollections = collectionsData;
        setCollections(collectionsData || []);
      })
      .catch(err => console.error('Error fetching catalog data:', err));
  }, []);

  useEffect(() => {
    setMobileVideoSrc(heroConfig.mobileVideoUrl || '');
  }, [heroConfig.mobileVideoUrl]);

  const desktopHeroImages = Array.isArray(heroConfig.desktopSlides) && heroConfig.desktopSlides.length
    ? heroConfig.desktopSlides
    : [heroConfig.bgImage].filter(Boolean);
  const mobileHeroImages = Array.isArray(heroConfig.mobileSlides) && heroConfig.mobileSlides.length
    ? heroConfig.mobileSlides
    : [heroConfig.mobileImageUrl || heroConfig.bgImage].filter(Boolean);
  const desktopSingleImage = heroConfig.bgImage || desktopHeroImages[0] || '';
  const mobileSingleImage = heroConfig.mobileImageUrl || heroConfig.bgImage || mobileHeroImages[0] || '';

  useEffect(() => {
    setDesktopHeroSlideIndex(0);
  }, [desktopHeroImages.join('|')]);

  useEffect(() => {
    setMobileHeroSlideIndex(0);
  }, [mobileHeroImages.join('|')]);

  useEffect(() => {
    if (heroConfig.desktopMediaType !== 'slideshow' || desktopHeroImages.length < 2) return undefined;
    const delay = slideIntervalMs(heroConfig.desktopSlideIntervalMs);
    const timer = window.setInterval(() => {
      setDesktopHeroSlideIndex((index) => (index + 1) % desktopHeroImages.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [desktopHeroImages.length, desktopHeroImages.join('|'), heroConfig.desktopMediaType, heroConfig.desktopSlideIntervalMs]);

  useEffect(() => {
    if (heroConfig.mobileMediaType !== 'slideshow' || mobileHeroImages.length < 2) return undefined;
    const delay = slideIntervalMs(heroConfig.mobileSlideIntervalMs);
    const timer = window.setInterval(() => {
      setMobileHeroSlideIndex((index) => (index + 1) % mobileHeroImages.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [mobileHeroImages.length, mobileHeroImages.join('|'), heroConfig.mobileMediaType, heroConfig.mobileSlideIntervalMs]);

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
  const homeCollection = isDefaultView
    ? collections.find(c => (c.name || '').trim().toLowerCase() === 'home')
    : null;
  const homeCuratedProducts = homeCollection && Array.isArray(homeCollection.productIds)
    ? filteredProducts.filter(p => homeCollection.productIds.includes(p.id))
    : [];
  const displayedProducts = homeCuratedProducts.length > 0 ? homeCuratedProducts : filteredProducts;

  const heroShopLink = heroConfig.button1Link || '#shop-catalog';
  const desktopHeroMediaType = ['image', 'slideshow', 'video'].includes(heroConfig.desktopMediaType) ? heroConfig.desktopMediaType : 'image';
  const mobileHeroMediaType = ['image', 'slideshow', 'video'].includes(heroConfig.mobileMediaType) ? heroConfig.mobileMediaType : 'image';
  const desktopVideoUrl = heroConfig.desktopVideoUrl || heroConfig.mobileVideoUrl || '';
  const mobileImageUrl = mobileHeroImages[mobileHeroSlideIndex] || heroConfig.mobileImageUrl || heroConfig.bgImage;
  const moveHeroSlide = (mode, direction, count) => {
    if (count <= 1) return;
    const setIndex = mode === 'desktop' ? setDesktopHeroSlideIndex : setMobileHeroSlideIndex;
    setIndex((index) => (index + direction + count) % count);
  };

  const startHeroSwipe = (mode, count, clientX, clientY, source, pointerId = null) => {
    if (count <= 1) return;
    heroSwipeRef.current = {
      mode,
      count,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      pointerId,
      source,
      isActive: true,
      isHorizontal: false
    };
  };

  const moveHeroSwipe = (clientX, clientY, event) => {
    const swipe = heroSwipeRef.current;
    if (!swipe.isActive) return;
    const deltaX = clientX - swipe.startX;
    const deltaY = clientY - swipe.startY;
    swipe.currentX = clientX;
    if (!swipe.isHorizontal && Math.abs(deltaX) > 10) {
      swipe.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    if (swipe.isHorizontal) {
      event?.preventDefault?.();
    }
  };

  const finishHeroSwipe = (event) => {
    const swipe = heroSwipeRef.current;
    if (!swipe.isActive) return;
    if (
      event?.pointerId !== undefined &&
      swipe.pointerId !== null &&
      event.pointerId !== swipe.pointerId
    ) {
      return;
    }
    const deltaX = swipe.currentX - swipe.startX;
    const deltaY = Math.abs((event?.clientY || swipe.startY) - swipe.startY);
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > deltaY) {
      moveHeroSlide(swipe.mode, deltaX < 0 ? 1 : -1, swipe.count);
    }
    heroSwipeRef.current = {
      mode: null,
      count: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      pointerId: null,
      source: null,
      isActive: false,
      isHorizontal: false
    };
  };

  const heroSwipeHandlers = (mode, count) => ({
    onPointerDown: (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      startHeroSwipe(mode, count, event.clientX, event.clientY, 'pointer', event.pointerId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event) => {
      const swipe = heroSwipeRef.current;
      if (swipe.source !== 'pointer' || swipe.pointerId !== event.pointerId) return;
      moveHeroSwipe(event.clientX, event.clientY, event);
    },
    onPointerUp: finishHeroSwipe,
    onPointerCancel: finishHeroSwipe,
    onTouchStart: (event) => {
      if (heroSwipeRef.current.source === 'pointer') return;
      const touch = event.touches?.[0];
      if (!touch) return;
      startHeroSwipe(mode, count, touch.clientX, touch.clientY, 'touch');
    },
    onTouchMove: (event) => {
      if (heroSwipeRef.current.source !== 'touch') return;
      const touch = event.touches?.[0];
      if (!touch) return;
      moveHeroSwipe(touch.clientX, touch.clientY, event);
    },
    onTouchEnd: finishHeroSwipe,
    onTouchCancel: finishHeroSwipe
  });

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
      {!isMobileViewport && (
      <section className="hero-section pc-only" style={!isHeroLoaded ? { background: 'var(--paper)' } : undefined}>
        {isHeroLoaded && (
          <>
            {desktopHeroMediaType === 'video' && desktopVideoUrl ? (
              <video
                className="hero-bg-image hero-bg-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={mediaUrl(heroConfig.bgImage)}
              >
                <source src={mediaUrl(desktopVideoUrl)} type="video/mp4" />
              </video>
            ) : desktopHeroMediaType === 'slideshow' ? (
              <div
                className="hero-slideshow"
                aria-label="logcloth streetwear background slideshow"
                {...heroSwipeHandlers('desktop', desktopHeroImages.length)}
              >
                {desktopHeroImages.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={mediaUrl(image)}
                    srcSet={mediaSrcSet(image)}
                    sizes="100vw"
                    onError={srcSetFallback}
                    alt=""
                    className={`hero-bg-image hero-slideshow-image ${index === desktopHeroSlideIndex ? 'active' : ''}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchpriority={index === 0 ? 'high' : 'auto'}
                  />
                ))}
              </div>
            ) : desktopSingleImage ? (
              <img src={mediaUrl(desktopSingleImage)} srcSet={mediaSrcSet(desktopSingleImage)} sizes="100vw" onError={srcSetFallback} alt="logcloth streetwear background" className="hero-bg-image" loading="eager" decoding="async" fetchpriority="high" />
            ) : null}
            <div className="hero-overlay"></div>
            <a
              href={appPath(heroShopLink)}
              className="hero-shop-now"
              onClick={() => trackHeroShopNow('Desktop')}
            >
              Shop now
            </a>
          </>
        )}
      </section>
      )}

      {/* MOBILE HERO SECTION */}
      {isMobileViewport && (
      <section className="mobile-hero-video mobile-only" style={!isHeroLoaded ? { background: 'var(--paper)' } : undefined}>
        {isHeroLoaded && (
          <>
            {mobileHeroMediaType === 'slideshow' ? (
              <div
                className="mobile-hero-slideshow"
                aria-label="logcloth streetwear mobile hero slideshow"
                {...heroSwipeHandlers('mobile', mobileHeroImages.length)}
              >
                {mobileHeroImages.map((image, index) => {
                  const activeSrc = index === mobileHeroSlideIndex ? mobileImageUrl : image;
                  return (
                    <img
                      key={`${image}-${index}`}
                      src={mediaUrl(activeSrc)}
                      srcSet={mediaSrcSet(activeSrc)}
                      sizes="100vw"
                      onError={srcSetFallback}
                      alt=""
                      className={`mobile-hero-image mobile-hero-slide ${index === mobileHeroSlideIndex ? 'active' : ''}`}
                      style={{ objectPosition: getHeroObjectPosition(activeSrc) }}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchpriority={index === 0 ? 'high' : 'auto'}
                    />
                  );
                })}
              </div>
            ) : mobileHeroMediaType === 'image' ? (
              mobileSingleImage ? (
                <img
                  src={mediaUrl(mobileSingleImage)}
                  srcSet={mediaSrcSet(mobileSingleImage)}
                  sizes="100vw"
                  onError={srcSetFallback}
                  alt="logcloth streetwear mobile hero"
                  className="mobile-hero-image"
                  style={{ objectPosition: getHeroObjectPosition(mobileSingleImage) }}
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              ) : null
            ) : mobileVideoSrc && (
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
                  setMobileVideoSrc('');
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
          </>
        )}
      </section>
      )}

      {/* STATS STRIP */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item reveal">
              <div className="stat-val">40</div>
              <div className="stat-label">Pieces Per Design</div>
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

        {isDefaultView && (
          <div className="home-shop-all">
            <a href={appPath('/shop')} className="home-shop-all-link">Shop all designs</a>
          </div>
        )}
      </section>

      {/* MANIFESTO SECTION */}
      <section className="manifesto-section" style={{ background: homeManifesto.background || 'var(--paper)' }}>
        <div className="container">
          <div className="manifesto-layout" style={{ textAlign: homeManifesto.align || 'left' }}>
            <div className="manifesto-label reveal">{homeManifesto.label}</div>
            <div className="manifesto-quote reveal">
              <ContentBlockLines block={homeManifesto} />
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY LOOKBOOK SCROLLER */}
      <GalleryScroller />

      {/* CUSTOMER REVIEWS (hidden until a review is approved) */}
      <ReviewsSection />

      {/* STATEMENT SECTION */}
      <section className="statement-section">
        <div className="container">
          <h2 className="statement-title reveal">Your Tee.<br /><span className="outline">Their Future.</span></h2>
          <p className="statement-sub reveal">Every product funds something real. Start shopping.</p>
          <a href="#shop-catalog" className="btn btn-white reveal">Shop Now</a>
        </div>
      </section>
    </>
  );
}
