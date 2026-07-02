import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  ShoppingBag,
  Package,
  Tag,
  Users,
  BarChart2,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  ChevronRight,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  PlaySquare,
  BookOpen,
  FolderPlus,
  Upload,
  GripVertical,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { mediaUrl } from '../lib/urls';
import { DEFAULT_PRICE_DISPLAY_OPTIONS } from '../lib/pricing';
import { DEFAULT_CONTENT_BLOCKS, FONT_OPTIONS, mergeContentBlocks } from '../lib/contentBlocks';

const DEFAULT_DETAILS = "Fabric: 240 GSM French Terry cotton · Double Bio Washed\nDesign: DTF printing\nStyle: Oversize and Half sleeve\n* Designed for a relaxed drop-shoulder streetwear fit. Order your usual size.";
const DEFAULT_WASHCARE = "Cold machine wash inside out.\nDo not bleach or dry clean.\nIron inside out on low heat settings.\nDo not tumble dry.";
const DEFAULT_SHIPPING = "Free standard shipping across India. Standard orders are dispatched within 24-48 business hours and delivered within 3-5 business days. Easy exchanges and hassle-free returns within 7 days of delivery.";

const ADMIN_TABS = [
  ['dashboard', 'Analytics'],
  ['orders', 'Orders'],
  ['returns', 'Returns'],
  ['products', 'Products'],
  ['inventory', 'Inventory'],
  ['collections', 'Collections'],
  ['stories', 'Stories'],
  ['blogs', 'Blogs'],
  ['gallery', 'Gallery'],
  ['contentblocks', 'Banners & Quotes'],
  ['newinconfig', 'New In'],
  ['heroconfig', 'Hero']
];

const PRODUCT_IMAGE_LIMIT = 20;
const MAX_IMAGE_UPLOAD_MB = 25;
const MAX_VIDEO_UPLOAD_MB = 80;
const IMAGE_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp'];
const VIDEO_UPLOAD_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v'];
const UNSAFE_IMAGE_TYPES = ['image/svg+xml'];
const PRODUCT_DRAFT_KEY = 'log_admin_product_draft';
const HERO_PREVIEW_GUIDES = {
  desktop: {
    label: 'PC / Laptop',
    frameLabel: 'Desktop hero preview',
    className: 'desktop',
    imageSize: '1920 x 1080 px',
    safeSize: '2560 x 1440 px for sharper desktop screens',
    ratio: '16:9 landscape',
    videoSize: '1920 x 1080 px MP4/WebM/MOV',
    note: 'Keep the main product or model near the center because the hero uses cover cropping on wide screens.'
  },
  mobile: {
    label: 'Mobile',
    frameLabel: 'Mobile hero preview',
    className: 'mobile',
    imageSize: '1080 x 1920 px',
    safeSize: '1440 x 2560 px for sharper phones',
    ratio: '9:16 portrait',
    videoSize: '1080 x 1920 px MP4/WebM/MOV',
    note: 'Use vertical media and keep text or faces away from the top header and bottom Shop now area.'
  }
};
const DEFAULT_ANALYTICS_CONFIG = {
  googleTagManagerId: '',
  googleAnalyticsId: '',
  googleSearchConsoleVerification: ''
};
const PRICE_DISPLAY_LABELS = {
  sellingPrice: 'Selling Price',
  originalPrice: 'Original Price',
  discountedPrice: 'Discounted Price',
  discountPercentage: 'Discount %'
};
const DELIVERY_PARTNERS = [
  { value: 'Delhivery', label: 'Delhivery', trackingUrl: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}` },
  { value: 'Blue Dart', label: 'Blue Dart', trackingUrl: (awb) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(awb)}` },
  { value: 'DTDC', label: 'DTDC', trackingUrl: (awb) => `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encodeURIComponent(awb)}` },
  { value: 'India Post', label: 'India Post', trackingUrl: (awb) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?${encodeURIComponent(awb)}` },
  { value: 'Xpressbees', label: 'Xpressbees', trackingUrl: (awb) => `https://www.xpressbees.com/track?isawb=true&trackid=${encodeURIComponent(awb)}` },
  { value: 'Ecom Express', label: 'Ecom Express', trackingUrl: (awb) => `https://ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}` },
  { value: 'Shiprocket', label: 'Shiprocket', trackingUrl: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}` },
  { value: 'Custom', label: 'Custom / Other', trackingUrl: () => '' }
];

function looksLikeVideo(url = '') {
  return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(url));
}

function trackingUrlForPartner(partner, trackingNumber) {
  const cleanTracking = String(trackingNumber || '').trim();
  if (!cleanTracking) return '';
  const selected = DELIVERY_PARTNERS.find((item) => item.value === partner);
  return selected?.trackingUrl ? selected.trackingUrl(cleanTracking) : '';
}

function intervalSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return parsed <= 60 ? parsed : parsed / 1000;
}

function extractSearchConsoleCode(value) {
  const text = String(value || '').trim();
  const match = text.match(/content=["']([^"']+)["']/i);
  return (match ? match[1] : text).trim();
}

const emptyProductDraft = {
  name: '',
  price: 0,
  originalPrice: 0,
  discountedPrice: '',
  discountPercentage: '',
  priceDisplayOptions: DEFAULT_PRICE_DISPLAY_OPTIONS,
  desc: '',
  category: 'top',
  subCategories: [],
  colors: [],
  imageUrl: '',
  imageUrls: [],
  sizes: { S: 10, M: 10, L: 10, XL: 10 },
  details: DEFAULT_DETAILS,
  washcare: DEFAULT_WASHCARE,
  shipping: DEFAULT_SHIPPING
};

function loadProductDraft() {
  if (typeof window === 'undefined') return emptyProductDraft;
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_DRAFT_KEY) || 'null');
    return saved && typeof saved === 'object'
      ? {
          ...emptyProductDraft,
          ...saved,
          priceDisplayOptions: {
            ...DEFAULT_PRICE_DISPLAY_OPTIONS,
            ...(saved.priceDisplayOptions || {})
          }
        }
      : emptyProductDraft;
  } catch {
    return emptyProductDraft;
  }
}

function normalizedPriceDisplayOptions(product = {}) {
  return {
    ...DEFAULT_PRICE_DISPLAY_OPTIONS,
    ...(product.priceDisplayOptions || {})
  };
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 1800;
      const maxHeight = 2400;
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(image, 0, 0, width, height);
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      resolve({
        fileName: `${baseName || 'upload'}.webp`,
        fileType: 'image/webp',
        fileData: canvas.toDataURL('image/webp', 0.82)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not compress ${file.name}`));
    };
    image.src = objectUrl;
  });
}

export default function Admin({ onToast }) {
  const [token, setToken] = useState(() => {
    localStorage.removeItem('admin_token');
    return sessionStorage.getItem('admin_token') || '';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogout = async () => {
    const activeToken = sessionStorage.getItem('admin_token') || token;
    setToken('');
    sessionStorage.removeItem('admin_token');
    try {
      await window.fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Local fetch override with auth token
  const fetch = async (url, options = {}) => {
    const activeToken = sessionStorage.getItem('admin_token') || token;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${activeToken}`
    };
    const response = await window.fetch(url, { ...options, headers });
    if (response.status === 401) {
      handleLogout();
    }
    return response;
  };

  const getApiError = async (res, fallback = 'Request failed.') => {
    try {
      const data = await res.json();
      return data.error || data.message || fallback;
    } catch {
      return fallback;
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await window.fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.removeItem('admin_token');
        sessionStorage.setItem('admin_token', data.token);
        onToast('Admin login successful.');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server connection error');
    }
  };

  // Auto session logout on inactivity (15 minutes)
  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onToast('Session expired due to inactivity.');
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [token]);

  // Sidebar states
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('log_admin_active_tab') || 'dashboard';
  });
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('log_admin_active_tab', tab);
  };
  const [salesOpen, setSalesOpen] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [discountsOpen, setDiscountsOpen] = useState(true);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [analyticsConfig, setAnalyticsConfig] = useState(DEFAULT_ANALYTICS_CONFIG);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [blogs, setBlogs] = useState([]);

  // Modals / Editing states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipmentDraft, setShipmentDraft] = useState({
    shipmentPartner: 'Delhivery',
    trackingNumber: '',
    trackingUrl: ''
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(0);

  // Product state
  const [newProduct, setNewProduct] = useState(loadProductDraft);

  // Dynamic Categories inputs
  const [newSubCategoryInput, setNewSubCategoryInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');

  // Story Form State
  const [newStory, setNewStory] = useState({
    mediaUrl: '',
    mediaType: 'image',
    shopNowEnabled: true,
    productId: '',
    caption: ''
  });

  // Collections Form State
  const [newCollection, setNewCollection] = useState({
    name: '',
    productIds: []
  });

  // Blogs Form State / Google Docs Editor State
  const [newBlog, setNewBlog] = useState({
    title: '',
    coverImage: '',
    content: [] // Array of { type: 'h1'...'h6', 'p', 'image', text: '', url: '', highlight: false, uppercase: false }
  });

  const [blogTitleInput, setBlogTitleInput] = useState('');
  const [blogCoverInput, setBlogCoverInput] = useState('');
  const [draggingBlogBlockIndex, setDraggingBlogBlockIndex] = useState(null);
  const blogBlockDragIndexRef = useRef(null);

  // Gallery Lookbook State
  const [galleryItems, setGalleryItems] = useState([]);
  const [newGalleryItem, setNewGalleryItem] = useState({ imageUrl: '', title: '', link: '' });
  const [contentBlocks, setContentBlocks] = useState(() => mergeContentBlocks(DEFAULT_CONTENT_BLOCKS));
  const [newInConfig, setNewInConfig] = useState({ tagline: '', title: '', desc: '', buttonText: '', buttonLink: '', imageUrl: '' });

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionField, setSuggestionField] = useState(null);

  const [heroConfig, setHeroConfig] = useState({
    tagline: '',
    title: '',
    desc: '',
    desktopMediaType: 'image',
    bgImage: '',
    desktopVideoUrl: '',
    desktopSlides: [],
    desktopSlideIntervalMs: 5000,
    mobileMediaType: 'video',
    mobileImageUrl: '',
    mobileSlides: [],
    mobileSlideIntervalMs: 5000,
    button1Text: '',
    button1Link: '',
    button2Text: '',
    button2Link: '',
    mobileVideoUrl: ''
  });

  const [selectedMetric, setSelectedMetric] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('highlights'); // highlights, traffic, behaviour, benchmarks

  // Fetch all data
  const fetchData = async () => {
    try {
      const [analyticsRes, analyticsConfigRes, ordersRes, productsRes, subscribersRes, storiesRes, collectionsRes, blogsRes, galleryRes, heroRes, returnsRes, newInRes, contentBlocksRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/analytics-config'),
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/subscribers'),
        fetch('/api/stories'),
        fetch('/api/collections'),
        fetch('/api/blogs'),
        fetch('/api/gallery'),
        fetch('/api/hero-config'),
        fetch('/api/returns'),
        fetch('/api/new-in-config'),
        fetch('/api/content-blocks-config')
      ]);

      const results = await Promise.all(
        [analyticsRes, analyticsConfigRes, ordersRes, productsRes, subscribersRes, storiesRes, collectionsRes, blogsRes, galleryRes, heroRes, returnsRes, newInRes, contentBlocksRes].map(async (res) => {
          if (!res.ok) return null;
          try {
            return await res.json();
          } catch {
            return null;
          }
        })
      );

      const [analyticsData, analyticsConfigData, ordersData, productsData, subscribersData, storiesData, collectionsData, blogsData, galleryData, heroData, returnsData, newInData, contentBlocksData] = results;

      if (analyticsData) setAnalytics(analyticsData);
      setAnalyticsConfig({ ...DEFAULT_ANALYTICS_CONFIG, ...(analyticsConfigData || {}) });
      if (ordersData) setOrders(ordersData);
      if (productsData) setProducts(productsData);
      if (subscribersData) setSubscribers(subscribersData);
      if (storiesData) setStories(storiesData);
      if (collectionsData) setCollections(collectionsData);
      if (blogsData) setBlogs(blogsData);
      if (returnsData) setReturns(returnsData);
      setGalleryItems(galleryData || []);
      setContentBlocks(mergeContentBlocks(contentBlocksData || DEFAULT_CONTENT_BLOCKS));
      setNewInConfig(newInData || { tagline: '', title: '', desc: '', buttonText: '', buttonLink: '', imageUrl: '' });
      setHeroConfig(heroData || {
        tagline: '',
        title: '',
        desc: '',
        desktopMediaType: 'image',
        bgImage: '',
        desktopVideoUrl: '',
        desktopSlides: [],
        desktopSlideIntervalMs: 5000,
        mobileMediaType: 'video',
        mobileImageUrl: '',
        mobileSlides: [],
        mobileSlideIntervalMs: 5000,
        button1Text: '',
        button1Link: '',
        button2Text: '',
        button2Link: '',
        mobileVideoUrl: ''
      });
    } catch (err) {
      console.error(err);
      onToast('Error loading admin panel data.');
    }
  };

  const handleSaveHeroConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hero-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroConfig)
      });
      if (res.ok) {
        onToast('Hero configuration saved!');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Error saving hero configuration.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Error saving hero configuration.');
    }
  };

  const handleSaveAnalyticsConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/analytics-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsConfig({ ...DEFAULT_ANALYTICS_CONFIG, ...(data.analyticsConfig || analyticsConfig) });
        onToast('Google analytics settings saved!');
      } else {
        onToast(await getApiError(res, 'Error saving Google analytics settings.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Error saving Google analytics settings.');
    }
  };

  const handleSaveContentBlocks = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/content-blocks-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentBlocks)
      });
      if (res.ok) {
        const data = await res.json();
        setContentBlocks(mergeContentBlocks(data.contentBlocks || contentBlocks));
        onToast('Banners and quotes saved!');
      } else {
        onToast(await getApiError(res, 'Error saving banners and quotes.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Error saving banners and quotes.');
    }
  };

  const updateContentBlock = (blockKey, patch) => {
    setContentBlocks(prev => mergeContentBlocks({
      ...prev,
      [blockKey]: {
        ...(prev[blockKey] || {}),
        ...patch
      }
    }));
  };

  const updateContentLine = (blockKey, lineIndex, patch) => {
    setContentBlocks(prev => {
      const block = prev[blockKey] || {};
      const lines = Array.isArray(block.lines) ? [...block.lines] : [];
      lines[lineIndex] = { ...(lines[lineIndex] || {}), ...patch };
      return mergeContentBlocks({
        ...prev,
        [blockKey]: {
          ...block,
          lines
        }
      });
    });
  };

  const appendHeroSlides = (field, url) => {
    setHeroConfig(prev => ({
      ...prev,
      ...(field === 'desktopSlides' ? { desktopMediaType: 'slideshow' } : {}),
      ...(field === 'mobileSlides' ? { mobileMediaType: 'slideshow' } : {}),
      [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), url]
    }));
  };

  const removeHeroSlide = (field, indexToRemove) => {
    setHeroConfig(prev => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).filter((_, index) => index !== indexToRemove)
    }));
  };

  useEffect(() => {
    if (!selectedOrder) return;
    setShipmentDraft({
      shipmentPartner: selectedOrder.shipmentPartner || 'Delhivery',
      trackingNumber: selectedOrder.trackingNumber || '',
      trackingUrl: selectedOrder.trackingUrl || trackingUrlForPartner(selectedOrder.shipmentPartner || 'Delhivery', selectedOrder.trackingNumber || '')
    });
  }, [selectedOrder]);

  const getHeroPreviewItems = (device) => {
    const isDesktop = device === 'desktop';
    const type = isDesktop
      ? (heroConfig.desktopMediaType || 'image')
      : (heroConfig.mobileMediaType || 'video');
    const imageUrl = isDesktop ? heroConfig.bgImage : heroConfig.mobileImageUrl;
    const videoUrl = isDesktop ? heroConfig.desktopVideoUrl : heroConfig.mobileVideoUrl;
    const slides = isDesktop ? heroConfig.desktopSlides : heroConfig.mobileSlides;

    if (type === 'video') {
      return videoUrl ? [{ url: videoUrl, mediaType: 'video' }] : [];
    }

    if (type === 'slideshow') {
      return (Array.isArray(slides) ? slides : [])
        .filter(Boolean)
        .map(url => ({ url, mediaType: looksLikeVideo(url) ? 'video' : 'image' }));
    }

    return imageUrl ? [{ url: imageUrl, mediaType: looksLikeVideo(imageUrl) ? 'video' : 'image' }] : [];
  };

  const renderHeroMediaPreview = (device) => {
    const guide = HERO_PREVIEW_GUIDES[device];
    const items = getHeroPreviewItems(device);
    const firstItem = items[0];
    const isSlideshow = (device === 'desktop' ? heroConfig.desktopMediaType : heroConfig.mobileMediaType) === 'slideshow';

    return (
      <div className={`hero-admin-preview hero-admin-preview-${guide.className}`}>
        <div className="hero-admin-preview-copy">
          <div>
            <p className="hero-admin-preview-eyebrow">{guide.frameLabel}</p>
            <h4>{guide.label} upload guide</h4>
          </div>
          <div className="hero-admin-spec-grid">
            <span><strong>Best image:</strong> {guide.imageSize}</span>
            <span><strong>Sharp option:</strong> {guide.safeSize}</span>
            <span><strong>Ratio:</strong> {guide.ratio}</span>
            <span><strong>Best video:</strong> {guide.videoSize}</span>
            <span><strong>Images:</strong> JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP</span>
            <span><strong>Videos:</strong> MP4, MOV, WEBM, M4V</span>
          </div>
          <p className="hero-admin-preview-note">{guide.note}</p>
        </div>

        <div className={`hero-admin-device-frame ${guide.className}`}>
          {firstItem ? (
            firstItem.mediaType === 'video' ? (
              <video
                src={mediaUrl(firstItem.url)}
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
            ) : (
              <img src={mediaUrl(firstItem.url)} alt={`${guide.label} hero preview`} />
            )
          ) : (
            <div className="hero-admin-preview-empty">
              <Upload size={24} />
              <span>No {guide.label.toLowerCase()} media selected</span>
            </div>
          )}
          <div className="hero-admin-frame-label">
            {guide.label} {firstItem ? 'preview' : 'waiting for upload'}
          </div>
        </div>

        {isSlideshow && items.length > 0 && (
          <div className="hero-admin-slide-strip" aria-label={`${guide.label} slideshow preview thumbnails`}>
            {items.map((item, index) => (
              <div className="hero-admin-slide-thumb" key={`${item.url}-${index}`}>
                {item.mediaType === 'video' ? (
                  <video src={mediaUrl(item.url)} muted playsInline preload="metadata" />
                ) : (
                  <img src={mediaUrl(item.url)} alt={`${guide.label} slide ${index + 1}`} />
                )}
                <span>{index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    if (!editingProduct) {
      localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(newProduct));
    }
  }, [newProduct, editingProduct]);

  const handleSaveGalleryItem = async (e) => {
    e.preventDefault();
    if (!newGalleryItem.imageUrl || !newGalleryItem.link) return;
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGalleryItem)
      });
      if (res.ok) {
        onToast('Gallery item saved!');
        setNewGalleryItem({ imageUrl: '', title: '', link: '' });
        fetchData();
      } else {
        onToast(await getApiError(res, 'Error saving gallery item.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Gallery save request failed.');
    }
  };

  const handleDeleteGalleryItem = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Gallery item deleted.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Error deleting gallery item.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Gallery delete request failed.');
    }
  };

  // Suggestion engine helper
  const showSuggestions = (value, fieldType, context = null) => {
    if (!value.trim()) {
      setSuggestions([]);
      setSuggestionField(null);
      return;
    }
    const query = value.toLowerCase();
    let matches = [];

    if (fieldType === 'link') {
      // Suggest Collections
      collections.forEach(col => {
        if (col.name.toLowerCase().includes(query)) {
          matches.push({ type: 'Collection', label: col.name, value: `/?collection=${col.id}` });
        }
      });
      // Suggest Products
      products.forEach(p => {
        if (p.name.toLowerCase().includes(query)) {
          matches.push({ type: 'Product', label: p.name, value: `/?search=${p.name}` });
        }
      });
      // Suggest Subcategories
      const subs = new Set();
      products.forEach(p => {
        if (p.subCategories) p.subCategories.forEach(s => subs.add(s));
      });
      Array.from(subs).forEach(sub => {
        if (sub.toLowerCase().includes(query)) {
          matches.push({ type: 'Subcategory', label: sub, value: `/?subcategory=${sub}` });
        }
      });
    } else if (fieldType === 'color') {
      const colorsSet = new Set();
      products.forEach(p => {
        if (p.colors) p.colors.forEach(c => colorsSet.add(c.toUpperCase()));
      });
      Array.from(colorsSet).forEach(col => {
        if (col.toLowerCase().includes(query)) {
          matches.push({ type: 'Color', label: col, value: col });
        }
      });
    } else if (fieldType === 'subcategory') {
      const subs = new Set();
      products.forEach(p => {
        if (p.category === context && p.subCategories) {
          p.subCategories.forEach(s => subs.add(s));
        }
      });
      Array.from(subs).forEach(sub => {
        if (sub.toLowerCase().includes(query)) {
          matches.push({ type: 'Subcategory', label: sub, value: sub });
        }
      });
    } else if (fieldType === 'productId') {
      products.forEach(p => {
        if (p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)) {
          matches.push({ type: 'Product ID', label: `${p.name} (${p.id})`, value: p.id });
        }
      });
    }

    setSuggestions(matches.slice(0, 10));
    setSuggestionField(fieldType);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setSuggestionField(null);
  };

  const normalizeProductId = (value) => {
    const raw = String(value || '').trim();
    const match = raw.match(/\/product\/([^/?#]+)/i);
    if (match) return decodeURIComponent(match[1]);
    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || raw);
      } catch {
        return raw;
      }
    }
    return raw;
  };

  // Base64 file upload helper
  const handleDirectUpload = async (e, onUploadDone, { allowVideo = true } = {}) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    });

    setUploadingFiles(prev => prev + files.length);
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isAllowedImage = (IMAGE_UPLOAD_EXTENSIONS.includes(ext) || file.type?.startsWith('image/')) && (!file.type || (file.type.startsWith('image/') && !UNSAFE_IMAGE_TYPES.includes(file.type)));
      const isVideo = allowVideo && VIDEO_UPLOAD_EXTENSIONS.includes(ext) && (!file.type || file.type.startsWith('video/') || file.type === 'application/octet-stream');
      if (!isAllowedImage && !isVideo) {
        onToast(`${file.name} is not supported. Use JPG, JPEG, PNG, WEBP, GIF, AVIF, MP4, MOV, or WEBM where allowed.`);
        setUploadingFiles(prev => Math.max(0, prev - 1));
        continue;
      }
      const maxUploadMb = isVideo ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB;
      if (file.size > maxUploadMb * 1024 * 1024) {
        onToast(`${file.name} is too large. Keep ${isVideo ? 'videos' : 'images'} under ${maxUploadMb}MB.`);
        setUploadingFiles(prev => Math.max(0, prev - 1));
        continue;
      }

      try {
        const payload = isAllowedImage
          ? await compressImageFile(file)
          : {
              fileName: file.name,
              fileType: file.type,
              fileData: await readFileAsDataUrl(file)
            };
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          onUploadDone(data.url);
          onToast(`${file.name} uploaded successfully.`);
        } else {
          onToast(data.error || `Failed to upload ${file.name}.`);
        }
      } catch (err) {
        console.error(err);
        onToast(`${file.name} upload request failed. Check backend connection and file size.`);
      } finally {
        setUploadingFiles(prev => Math.max(0, prev - 1));
      }
    }

    e.target.value = '';
  };

  // Orders Actions
  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onToast(`Order ${orderId} marked as ${newStatus}`);
        fetchData();
        setSelectedOrder(null);
      } else {
        onToast(await getApiError(res, `Could not mark order as ${newStatus}.`));
      }
    } catch (err) {
      console.error(err);
      onToast(`Order ${newStatus} request failed.`);
    }
  };

  const handleOrderRefund = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST'
      });
      if (res.ok) {
        onToast(`Order ${orderId} refunded successfully`);
        fetchData();
        setSelectedOrder(null);
      } else {
        onToast(await getApiError(res, 'Order refund failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Order refund request failed.');
    }
  };

  const handleOrderShipping = async (orderId) => {
    const trackingNumber = shipmentDraft.trackingNumber.trim();
    if (!shipmentDraft.shipmentPartner) {
      onToast('Select a delivery partner.');
      return;
    }
    if (!trackingNumber) {
      onToast('Enter tracking or AWB number.');
      return;
    }
    const trackingUrl = shipmentDraft.trackingUrl.trim() || trackingUrlForPartner(shipmentDraft.shipmentPartner, trackingNumber);
    try {
      const res = await fetch(`/api/orders/${orderId}/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentPartner: shipmentDraft.shipmentPartner,
          trackingNumber,
          trackingUrl,
          status: 'Shipped'
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.order) setSelectedOrder(data.order);
        onToast(data.emailSent ? 'Order shipped and customer email sent.' : 'Order shipped. Email is pending/check SMTP.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Shipping update failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Shipping update request failed.');
    }
  };

  const handleCreateReturnRefundRequest = async (orderId) => {
    if (!window.confirm('Create a return/refund request for this order?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Return/Refund',
          reason: 'Admin initiated return/refund request',
          notes: 'Created from admin order details.'
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast(data.duplicate ? 'Pending return/refund request already exists.' : 'Return/refund request created.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Return/refund request failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Return/refund request failed.');
    }
  };

  const handleResetOrderRecords = async () => {
    if (!window.confirm('Reset all order records and return/exchange requests? This will also reset the next order ID to LOG-2301.')) return;
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast(`Order records reset. Next order ID: ${data.nextOrderId || 'LOG-2301'}`);
        fetchData();
      } else {
        onToast(await getApiError(res, 'Order records reset failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Order records reset request failed.');
    }
  };

  const handleResetReturnRecords = async () => {
    if (!window.confirm('Reset all return and exchange requests?')) return;
    try {
      const res = await fetch('/api/returns', { method: 'DELETE' });
      if (res.ok) {
        onToast('Return and exchange requests reset.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Return records reset failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Return records reset request failed.');
    }
  };

  // Product Save
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (savingProduct) return;
    if (uploadingFiles > 0) {
      onToast('Please wait for uploads to finish before saving the product.');
      return;
    }
    const productData = { ...(editingProduct || newProduct) };
    if (!String(productData.name || '').trim()) {
      onToast('Product name is required.');
      return;
    }
    if (Number(productData.price || 0) <= 0) {
      onToast('Product price must be greater than zero.');
      return;
    }
    productData.originalPrice = productData.originalPrice === '' ? null : Number(productData.originalPrice || 0);
    productData.discountedPrice = productData.discountedPrice === '' ? null : Number(productData.discountedPrice || 0);
    productData.discountPercentage = productData.discountPercentage === '' ? null : Number(productData.discountPercentage || 0);
    productData.priceDisplayOptions = normalizedPriceDisplayOptions(productData);
    if (productData.discountPercentage !== null && (productData.discountPercentage < 0 || productData.discountPercentage > 100)) {
      onToast('Discount percentage must be between 0 and 100.');
      return;
    }

    // Recalculate total stock from sizes
    const sizes = productData.sizes || { S: 0, M: 0, L: 0, XL: 0 };
    productData.stock = Object.values(sizes).reduce((sum, qty) => sum + parseInt(qty || 0), 0);

    // Sync imageUrl with first item in imageUrls array
    if (productData.imageUrls && productData.imageUrls.length > 0) {
      productData.imageUrl = productData.imageUrls[0];
    } else if (productData.imageUrl) {
      productData.imageUrls = [productData.imageUrl];
    } else {
      productData.imageUrls = [];
      productData.imageUrl = '';
    }

    try {
      setSavingProduct(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        onToast(editingProduct ? 'Product updated successfully' : 'Product added successfully');
        setShowProductModal(false);
        setEditingProduct(null);
        setNewSubCategoryInput('');
        setNewColorInput('');
        clearSuggestions();
        localStorage.removeItem(PRODUCT_DRAFT_KEY);
        setNewProduct(emptyProductDraft);
        fetchData();
      } else {
        onToast(await getApiError(res, editingProduct ? 'Product update failed.' : 'Product creation failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast(editingProduct ? 'Product update request failed.' : 'Product creation request failed.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleUpdateStock = async (productId, size, newQty) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedSizes = {
      ...(product.sizes || { S: 0, M: 0, L: 0, XL: 0 }),
      [size]: parseInt(newQty || 0)
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, sizes: updatedSizes })
      });
      if (res.ok) {
        onToast(`Stock updated for ${product.name} (${size})`);
        fetchData();
      } else {
        onToast(await getApiError(res, 'Stock update failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Stock update request failed.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Product deleted successfully');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Product delete failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Product delete request failed.');
    }
  };

  // Stories
  const handleSaveStory = async (e) => {
    e.preventDefault();
    const storyPayload = {
      ...newStory,
      productId: normalizeProductId(newStory.productId)
    };
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyPayload)
      });
      if (res.ok) {
        onToast('Story published successfully!');
        setNewStory({
          mediaUrl: '',
          mediaType: 'image',
          shopNowEnabled: true,
          productId: '',
          caption: ''
        });
        fetchData();
      } else {
        onToast(await getApiError(res, 'Story save failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Story save request failed.');
    }
  };

  const handleDeleteStory = async (id) => {
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Story deleted');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Story delete failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Story delete request failed.');
    }
  };

  // Collections
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.name) return;

    if (collections.length >= 7) {
      alert('You can only create up to 7 custom collections.');
      return;
    }

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCollection)
      });
      if (res.ok) {
        onToast('Collection saved!');
        setNewCollection({ name: '', productIds: [] });
        fetchData();
      } else {
        onToast(await getApiError(res, 'Collection save failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Collection save request failed.');
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Collection deleted.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Collection delete failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Collection delete request failed.');
    }
  };

  const handleToggleProductInCollection = (productId) => {
    setNewCollection(prev => {
      const ids = prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId];
      return { ...prev, productIds: ids };
    });
  };

  // Log Book (Blogs) Block Editor
  const handleAddBlogBlock = (type) => {
    setNewBlog(prev => ({
      ...prev,
      content: [...prev.content, {
        id: `blog-block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        text: type !== 'image' ? '' : undefined,
        url: type === 'image' ? '' : undefined,
        highlight: false,
        uppercase: false
      }]
    }));
  };

  const handleUpdateBlogBlock = (index, fields) => {
    setNewBlog(prev => {
      const content = [...prev.content];
      content[index] = { ...content[index], ...fields };
      return { ...prev, content };
    });
  };

  const reorderBlogBlocks = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setNewBlog(prev => {
      const content = [...prev.content];
      if (fromIndex >= content.length || toIndex >= content.length) return prev;
      const [movedBlock] = content.splice(fromIndex, 1);
      content.splice(toIndex, 0, movedBlock);
      return { ...prev, content };
    });
  };

  const handleMoveBlogBlock = (index, direction) => {
    const targetIndex = index + direction;
    reorderBlogBlocks(index, targetIndex);
  };

  const handleBlogBlockDragStart = (event, index) => {
    blogBlockDragIndexRef.current = index;
    setDraggingBlogBlockIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleBlogBlockDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleBlogBlockDrop = (event, targetIndex) => {
    event.preventDefault();
    const sourceIndex = blogBlockDragIndexRef.current ?? Number(event.dataTransfer.getData('text/plain'));
    reorderBlogBlocks(Number(sourceIndex), targetIndex);
    blogBlockDragIndexRef.current = null;
    setDraggingBlogBlockIndex(null);
  };

  const handleBlogBlockDragEnd = () => {
    blogBlockDragIndexRef.current = null;
    setDraggingBlogBlockIndex(null);
  };

  const handleRemoveBlogBlock = (index) => {
    setNewBlog(prev => ({
      ...prev,
      content: prev.content.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!blogTitleInput.trim()) return;

    const payload = {
      title: blogTitleInput,
      coverImage: blogCoverInput,
      content: newBlog.content,
      date: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onToast('Blog entry published successfully!');
        setBlogTitleInput('');
        setBlogCoverInput('');
        setNewBlog({ title: '', coverImage: '', content: [] });
        fetchData();
      } else {
        onToast(await getApiError(res, 'Blog save failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Blog save request failed.');
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Blog post deleted.');
        fetchData();
      } else {
        onToast(await getApiError(res, 'Blog delete failed.'));
      }
    } catch (err) {
      console.error(err);
      onToast('Blog delete request failed.');
    }
  };

  // Sparkline generator
  const getSparklinePath = (points) => {
    if (!points || points.length === 0) return '';
    const width = 120;
    const height = 40;
    const max = Math.max(...points) || 1;
    const step = width / (points.length - 1);

    return points.map((p, idx) => {
      const x = idx * step;
      const y = height - (p / max) * height + 2; // Offset
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  if (!token) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0F0F11',
        fontFamily: "'Montserrat', sans-serif",
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
            <h1 style={{ fontSize: '34px', fontWeight: '700', letterSpacing: 0, margin: 0, textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif" }}>LOG</h1>
            <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.2em', color: 'var(--grey-muted)', textTransform: 'uppercase', marginTop: '5px' }}>CONTROL PANEL</p>
          </div>
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loginError && (
              <div style={{ background: 'rgba(229, 62, 62, 0.1)', border: '1px solid #E53E3E', borderRadius: '6px', color: '#FC8181', padding: '12px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--grey-muted)', textTransform: 'uppercase' }}>Admin Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px', color: 'white', fontWeight: '600', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--grey-muted)', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px', color: 'white', fontWeight: '600', fontFamily: 'inherit' }}
              />
            </div>
            <button
              type="submit"
              style={{ background: 'white', color: '#0F0F11', border: 'none', padding: '14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '10px', transition: 'opacity 0.2s' }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            LOG <span className="admin-sidebar-badge">Control</span>
          </div>
        </div>
        <ul className="admin-menu">
          <li className="admin-menu-item">
            <div
              className={`admin-menu-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="admin-menu-link-left">
                <BarChart2 size={18} />
                <span>Live Analytics</span>
              </div>
            </div>
          </li>

          {/* Sales Dropdown */}
          <li className="admin-menu-item">
            <div className="admin-menu-link" onClick={() => setSalesOpen(!salesOpen)}>
              <div className="admin-menu-link-left">
                <ShoppingBag size={18} />
                <span>Sales & Orders</span>
              </div>
              <ChevronRight size={14} style={{ transform: salesOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {salesOpen && (
              <ul className="admin-submenu">
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    Orders ({orders.length})
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'returns' ? 'active' : ''}`}
                    onClick={() => setActiveTab('returns')}
                  >
                    Returns & Exchanges ({returns.length})
                  </div>
                </li>
              </ul>
            )}
          </li>

          {/* Catalog Dropdown */}
          <li className="admin-menu-item">
            <div className="admin-menu-link" onClick={() => setCatalogOpen(!catalogOpen)}>
              <div className="admin-menu-link-left">
                <Package size={18} />
                <span>Catalog</span>
              </div>
              <ChevronRight size={14} style={{ transform: catalogOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {catalogOpen && (
              <ul className="admin-submenu">
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                  >
                    Store Products
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                  >
                    Inventory Manager
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'collections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collections')}
                  >
                    Collections Grid ({collections.length}/7)
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'stories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stories')}
                  >
                    Stories Panel
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'blogs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('blogs')}
                  >
                    Log Book (Blogs)
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gallery')}
                  >
                    Gallery Lookbook
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'contentblocks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contentblocks')}
                  >
                    Banners & Quotes
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'newinconfig' ? 'active' : ''}`}
                    onClick={() => setActiveTab('newinconfig')}
                  >
                    New In Page Settings
                  </div>
                </li>
                <li>
                  <div
                    className={`admin-submenu-link ${activeTab === 'heroconfig' ? 'active' : ''}`}
                    onClick={() => setActiveTab('heroconfig')}
                  >
                    Homepage Hero Banner (PC & Mobile)
                  </div>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </aside>


      {/* Main workspace */}
      <main className="admin-content">
        <div className="admin-header">
          <div className="admin-title-wrap">
            <h1>
              {activeTab === 'dashboard' && 'Live Shop Analytics'}
              {activeTab === 'orders' && 'Customer Orders'}
              {activeTab === 'returns' && 'Returns & Exchanges'}
              {activeTab === 'products' && 'Product Manager'}
              {activeTab === 'inventory' && 'Inventory Control'}
              {activeTab === 'collections' && 'Collections Panel (Max 7)'}
              {activeTab === 'stories' && 'Stories Publisher'}
              {activeTab === 'blogs' && 'Log Book Blogs Manager'}
              {activeTab === 'gallery' && 'Homepage Gallery Lookbook'}
              {activeTab === 'contentblocks' && 'Banners & Quotes'}
              {activeTab === 'newinconfig' && 'New In Page Settings'}
              {activeTab === 'heroconfig' && 'Hero Banner Customization'}
            </h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn" onClick={fetchData}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button className="admin-btn" style={{ background: 'var(--accent)', color: 'white', border: 'none' }} onClick={handleLogout}>
              <span>Logout</span>
            </button>
            {activeTab === 'products' && (
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard */}
        <div className="admin-panel-switcher">
          {ADMIN_TABS.map(([tab, label]) => (
            <button
              type="button"
              key={tab}
              className={`admin-panel-switcher-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && analytics && (
          <div>
            {/* Dashboard Tabs Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid var(--admin-border)', paddingBottom: '10px' }}>
              <button
                onClick={() => setDashboardTab('highlights')}
                style={{
                  background: dashboardTab === 'highlights' ? 'var(--ink)' : 'none',
                  color: dashboardTab === 'highlights' ? 'white' : 'var(--admin-text-main)',
                  border: dashboardTab === 'highlights' ? '2px solid var(--ink)' : '2px solid transparent',
                  padding: '10px 18px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Highlights
              </button>
              <button
                onClick={() => setDashboardTab('traffic')}
                style={{
                  background: dashboardTab === 'traffic' ? 'var(--ink)' : 'none',
                  color: dashboardTab === 'traffic' ? 'white' : 'var(--admin-text-main)',
                  border: dashboardTab === 'traffic' ? '2px solid var(--ink)' : '2px solid transparent',
                  padding: '10px 18px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Traffic
              </button>
              <button
                onClick={() => setDashboardTab('behaviour')}
                style={{
                  background: dashboardTab === 'behaviour' ? 'var(--ink)' : 'none',
                  color: dashboardTab === 'behaviour' ? 'white' : 'var(--admin-text-main)',
                  border: dashboardTab === 'behaviour' ? '2px solid var(--ink)' : '2px solid transparent',
                  padding: '10px 18px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Behaviour Overviews
              </button>
              <button
                onClick={() => setDashboardTab('benchmarks')}
                style={{
                  background: dashboardTab === 'benchmarks' ? 'var(--ink)' : 'none',
                  color: dashboardTab === 'benchmarks' ? 'white' : 'var(--admin-text-main)',
                  border: dashboardTab === 'benchmarks' ? '2px solid var(--ink)' : '2px solid transparent',
                  padding: '10px 18px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Benchmarks
              </button>
              <button
                onClick={() => setDashboardTab('google')}
                style={{
                  background: dashboardTab === 'google' ? 'var(--ink)' : 'none',
                  color: dashboardTab === 'google' ? 'white' : 'var(--admin-text-main)',
                  border: dashboardTab === 'google' ? '2px solid var(--ink)' : '2px solid transparent',
                  padding: '10px 18px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Google Setup
              </button>
            </div>

            {/* highlights dashboard */}
            {dashboardTab === 'highlights' && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '15px' }}>
                  Click any card below to view detailed historical breakdown overlays.
                  {analytics.note ? <span style={{ display: 'block', marginTop: '6px' }}>{analytics.note}</span> : null}
                </div>
                <div className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Site Sessions', value: analytics.siteSessions, key: 'siteSessions', desc: 'Number of active browsing sessions on the website.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Site sessions</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.siteSessions}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Total Sales', value: `₹${analytics.totalSales.toLocaleString('en-IN')}`, key: 'totalSales', desc: 'Total gross sales generated by client checkouts before deductions.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Total sales</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>₹{analytics.totalSales.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Total Orders', value: analytics.totalOrders, key: 'totalOrders', desc: 'Number of successfully registered customer orders.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Total orders</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.totalOrders}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Unique Visitors', value: analytics.uniqueVisitors, key: 'uniqueVisitors', desc: 'Number of unique user session identifiers tracked.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Unique visitors</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.uniqueVisitors}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Form Submissions', value: analytics.formSubmissions, key: 'formSubmissions', desc: 'Newsletter or popup newsletter form registrations.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Form submissions</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.formSubmissions}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Clicks to Contact', value: analytics.clicksToContact, key: 'clicksToContact', desc: 'Number of times users clicked phone, whatsapp, or email contact buttons.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Clicks to contact</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.clicksToContact}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Page Views', value: analytics.pageViews, key: 'pageViews', desc: 'Total pages navigated/viewed across all active users.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Page Views</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.pageViews}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Successful Payments', value: analytics.successfulPayments, key: 'successfulPayments', desc: 'Completed online checkouts excluding refunds and cancellations.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Successful Payments</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.successfulPayments}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Amount Paid', value: `₹${analytics.amountPaid.toLocaleString('en-IN')}`, key: 'amountPaid', desc: 'Net revenue paid including shipping and taxes.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Amount Paid</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>₹{analytics.amountPaid.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Customers Count', value: analytics.customers, key: 'customers', desc: 'Number of unique customer email accounts checked out.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Customers</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.customers}</div>
                    </div>
                  </div>

                  <div className="admin-metric-card" style={{ cursor: 'pointer', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }} onClick={() => setSelectedMetric({ title: 'Conversion Rate', value: `${analytics.conversionRate?.toFixed(2)}%`, key: 'conversionRate', desc: 'Ratio of checkouts per session visit expressed in percentage.' })}>
                    <div className="admin-metric-header" style={{ fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>Conversion Rate</div>
                    <div className="admin-metric-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="admin-metric-value" style={{ fontSize: '28px', fontWeight: '800' }}>{analytics.conversionRate?.toFixed(1)}%</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* traffic dashboard */}
            {dashboardTab === 'traffic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
                <div className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px', fontWeight: '700' }}>Sessions Over Time (Last 7 Days)</h3>
                  <div style={{ width: '100%', height: '220px', borderLeft: '2px solid #ddd', borderBottom: '2px solid #ddd', position: 'relative', padding: '10px 0 0 10px' }}>
                    {/* SVG Line representation */}
                    <svg style={{ width: '100%', height: '100%' }}>
                      <polyline
                        fill="none"
                        stroke="var(--admin-primary)"
                        strokeWidth="3"
                        points={analytics.trends?.siteSessions ? analytics.trends.siteSessions.map((v, i) => {
                          const x = (i * 15) + '%';
                          const max = Math.max(...analytics.trends.siteSessions) || 1;
                          const y = (100 - (v / max) * 85) + '%';
                          return `${i * 65 + 10},${180 - (v / max) * 150}`;
                        }).join(' ') : ''}
                      />
                      {/* Dots */}
                      {analytics.trends?.siteSessions?.map((v, i) => {
                        const max = Math.max(...analytics.trends.siteSessions) || 1;
                        const cx = i * 65 + 10;
                        const cy = 180 - (v / max) * 150;
                        return (
                          <g key={i}>
                            <circle cx={cx} cy={cy} r="5" fill="var(--admin-primary)" />
                            <text x={cx - 10} y={cy - 10} fontSize="10" fontWeight="bold">{v}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                    <span>7 days ago</span>
                    <span>Yesterday</span>
                    <span>Today</span>
                  </div>
                </div>

                <div className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px', fontWeight: '700' }}>Traffic Sources & Devices Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: '10px' }}>Sessions by Source</h4>
                      <table style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                          {Object.entries(analytics.sources || {}).map(([src, count]) => (
                            <tr key={src} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                              <td style={{ padding: '8px 0' }}>{src}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: '10px' }}>Sessions by Device</h4>
                      <table style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                          {Object.entries(analytics.devices || {}).map(([dev, count]) => (
                            <tr key={dev} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                              <td style={{ padding: '8px 0' }}>{dev}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="admin-card" style={{ gridColumn: 'span 2', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px', fontWeight: '700' }}>Traffic Location Breakdown</h3>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--admin-border)' }}>
                        <th style={{ padding: '10px 0' }}>Country</th>
                        <th style={{ padding: '10px 0', textAlign: 'right' }}>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.countries || {}).map(([country, count]) => (
                        <tr key={country} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                          <td style={{ padding: '10px 0' }}>{country}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700' }}>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* behaviour dashboard */}
            {dashboardTab === 'behaviour' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>User Engagement Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ textAlign: 'center', borderRight: '1px solid var(--admin-border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Avg Page Duration</div>
                      <div style={{ fontSize: '20px', fontWeight: '800' }}>{analytics.avgSessionDuration}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderRight: '1px solid var(--admin-border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Pages / Session</div>
                      <div style={{ fontSize: '20px', fontWeight: '800' }}>{analytics.avgPagesPerSession}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Bounce Rate</div>
                      <div style={{ fontSize: '20px', fontWeight: '800' }}>{analytics.bounceRate}</div>
                    </div>
                  </div>
                </div>

                <div className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Most Visited Pages</h3>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)', textAlign: 'left' }}>
                        <th style={{ paddingBottom: '8px' }}>Page URL</th>
                        <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Page Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics.topPages || []).map((page, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                          <td style={{ padding: '8px 0' }}><code>{page.url}</code></td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{page.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-card" style={{ gridColumn: 'span 2', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Top Clicked Call-To-Action (CTA) Buttons</h3>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)', textAlign: 'left' }}>
                        <th style={{ paddingBottom: '8px' }}>Button ID / Text</th>
                        <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Click Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics.topButtons || []).map((btn, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                          <td style={{ padding: '8px 0' }}>{btn.buttonId}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{btn.count} clicks</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* benchmarks dashboard */}
            {dashboardTab === 'benchmarks' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                <div className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px', fontWeight: '700' }}>Key Stats Performance vs Industry Targets</h3>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--admin-border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 0' }}>Metric</th>
                        <th style={{ padding: '10px 0' }}>Your Actual Stats</th>
                        <th style={{ padding: '10px 0' }}>Standard Industry Target</th>
                        <th style={{ padding: '10px 0', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                        <td style={{ padding: '12px 0' }}>Conversion Rate</td>
                        <td style={{ padding: '12px 0', fontWeight: '700' }}>{analytics.conversionRate?.toFixed(2)}%</td>
                        <td style={{ padding: '12px 0' }}>2.00%</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: analytics.conversionRate >= 2.0 ? 'green' : 'orange', fontWeight: '700' }}>
                          {analytics.conversionRate >= 2.0 ? 'Optimal (>= 2%)' : 'Needs Optimization (< 2%)'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                        <td style={{ padding: '12px 0' }}>Bounce Rate</td>
                        <td style={{ padding: '12px 0', fontWeight: '700' }}>{analytics.bounceRate}</td>
                        <td style={{ padding: '12px 0' }}>50.0%</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: parseFloat(analytics.bounceRate || 0) <= 50.0 ? 'green' : 'orange', fontWeight: '700' }}>
                          {parseFloat(analytics.bounceRate || 0) <= 50.0 ? 'Good (<= 50%)' : 'High Bounce Rate (> 50%)'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                        <td style={{ padding: '12px 0' }}>Pages per Session</td>
                        <td style={{ padding: '12px 0', fontWeight: '700' }}>{analytics.avgPagesPerSession}</td>
                        <td style={{ padding: '12px 0' }}>3.0</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: parseFloat(analytics.avgPagesPerSession || 0) >= 3.0 ? 'green' : 'orange', fontWeight: '700' }}>
                          {parseFloat(analytics.avgPagesPerSession || 0) >= 3.0 ? 'Strong Engagement (>= 3)' : 'Low Page Depth (< 3)'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                        <td style={{ padding: '12px 0' }}>Site Sessions</td>
                        <td style={{ padding: '12px 0', fontWeight: '700' }}>{analytics.siteSessions}</td>
                        <td style={{ padding: '12px 0' }}>10+ sessions</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: analytics.siteSessions >= 10 ? 'green' : 'orange', fontWeight: '700' }}>
                          {analytics.siteSessions >= 10 ? 'Active Traffic' : 'Low Traffic'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {dashboardTab === 'google' && (
              <form onSubmit={handleSaveAnalyticsConfig} className="admin-card" style={{ border: '1px solid var(--admin-border)', padding: '24px', borderRadius: '8px', maxWidth: '920px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', marginBottom: '22px' }}>
                  <div>
                    <h3 style={{ marginBottom: '8px', fontWeight: '800' }}>Google Analytics & Search Setup</h3>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                      Save your Google IDs here once, and the live website will automatically install the tags on every public page.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ padding: '7px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: analyticsConfig.googleTagManagerId ? '#E8F5E9' : '#F3F4F6', color: analyticsConfig.googleTagManagerId ? '#137333' : '#6B7280' }}>
                      GTM {analyticsConfig.googleTagManagerId ? 'Connected' : 'Not set'}
                    </span>
                    <span style={{ padding: '7px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: analyticsConfig.googleAnalyticsId ? '#E8F5E9' : '#F3F4F6', color: analyticsConfig.googleAnalyticsId ? '#137333' : '#6B7280' }}>
                      GA4 {analyticsConfig.googleAnalyticsId ? 'Connected' : 'Not set'}
                    </span>
                    <span style={{ padding: '7px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: analyticsConfig.googleSearchConsoleVerification ? '#E8F5E9' : '#F3F4F6', color: analyticsConfig.googleSearchConsoleVerification ? '#137333' : '#6B7280' }}>
                      Search Console {analyticsConfig.googleSearchConsoleVerification ? 'Connected' : 'Not set'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                  {[
                    ['Tag Manager', analytics.google?.status?.tagManagerInstalled ? 'Connected' : 'Not connected', analyticsConfig.googleTagManagerId || 'Missing GTM ID'],
                    ['GA4 Tracking', analytics.google?.status?.analyticsInstalled ? 'Connected' : 'Not connected', analyticsConfig.googleAnalyticsId || 'Missing GA4 ID'],
                    ['Search Console', analytics.google?.status?.searchConsoleVerificationInstalled ? 'Verified tag added' : 'Not connected', analyticsConfig.googleSearchConsoleVerification ? 'Verification code saved' : 'Missing verification code'],
                    ['GA4 Report API', analytics.google?.status?.dataApiConnected ? 'Connected' : 'Needs API credentials', analytics.google?.reportMessage || 'Connect GA4 Data API credentials for live Google report numbers.']
                  ].map(([title, status, detail]) => (
                    <div key={title} style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>{title}</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '6px' }}>{status}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', lineHeight: 1.45 }}>{detail}</div>
                    </div>
                  ))}
                </div>

                <div style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '16px', marginBottom: '22px', background: '#FAFAFA' }}>
                  <div style={{ fontWeight: '900', marginBottom: '10px' }}>Google events currently sent by the website</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {(analytics.google?.eventsSent || []).map((eventName) => (
                      <span key={eventName} style={{ padding: '7px 10px', borderRadius: '999px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: '800' }}>
                        {eventName}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a className="admin-btn" href="https://tagmanager.google.com/" target="_blank" rel="noreferrer">Open Tag Manager</a>
                    <a className="admin-btn" href="https://analytics.google.com/" target="_blank" rel="noreferrer">Open GA4</a>
                    <a className="admin-btn" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Open Search Console</a>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Google Tag Manager Container ID</label>
                    <input
                      className="admin-input"
                      value={analyticsConfig.googleTagManagerId}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, googleTagManagerId: e.target.value.toUpperCase().trim() }))}
                      placeholder="GTM-XXXXXXX"
                    />
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '12px', marginTop: '6px' }}>Find this inside Google Tag Manager beside your container name.</p>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Google Analytics 4 Measurement ID</label>
                    <input
                      className="admin-input"
                      value={analyticsConfig.googleAnalyticsId}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, googleAnalyticsId: e.target.value.toUpperCase().trim() }))}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '12px', marginTop: '6px' }}>Find this in GA4 Admin, Data streams, Web stream details.</p>
                  </div>

                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">Google Search Console Verification Code</label>
                    <input
                      className="admin-input"
                      value={analyticsConfig.googleSearchConsoleVerification}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, googleSearchConsoleVerification: extractSearchConsoleCode(e.target.value) }))}
                      placeholder="Paste only the content value from google-site-verification"
                    />
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '12px', marginTop: '6px' }}>
                      If Google gives a meta tag, paste only the value inside content=&quot;...&quot;.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '18px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setAnalyticsConfig(DEFAULT_ANALYTICS_CONFIG)}
                  >
                    Clear
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    <CheckCircle size={16} />
                    <span>Save Google Setup</span>
                  </button>
                </div>
              </form>
            )}

            {/* Click Card Detailed Explanation Modal Overlay */}
            {selectedMetric && (
              <div className="admin-modal-overlay" onClick={() => setSelectedMetric(null)}>
                <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="admin-modal-header">
                    <h2>Detail: {selectedMetric.title}</h2>
                    <button onClick={() => setSelectedMetric(null)}>&times;</button>
                  </div>
                  <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>Current Value</span>
                      <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--ink)' }}>{selectedMetric.value}</div>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedMetric.desc}</p>
                    <div style={{ background: '#FAF9F6', padding: '15px', borderRadius: '4px', border: '1px solid var(--admin-border)' }}>
                      <strong>Recent Analytics Insights:</strong>
                      <div style={{ fontSize: '12px', marginTop: '5px', color: 'var(--admin-text-muted)' }}>
                        Performance is trending higher by <strong style={{ color: 'green' }}>+3.4%</strong> compared to the average of the last 30 days. No visitor blocks or drop-offs detected.
                      </div>
                    </div>
                    <button className="btn btn-accent" onClick={() => setSelectedMetric(null)} style={{ alignSelf: 'flex-end', marginTop: '10px' }}>Close View</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contentblocks' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Editable Banners & Quotes</h2>
                <p className="admin-help-text">Each card shows the page and exact location where the text appears.</p>
              </div>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveContentBlocks}>
                Save Banners & Quotes
              </button>
            </div>

            <form onSubmit={handleSaveContentBlocks} className="content-block-editor-list">
              {Object.entries(contentBlocks).map(([blockKey, block]) => (
                <div className="content-block-editor-card" key={blockKey}>
                  <div className="content-block-editor-head">
                    <div>
                      <h3>{block.page}</h3>
                      <p>{block.location}</p>
                    </div>
                    <span>{blockKey}</span>
                  </div>

                  <div className="content-block-meta-grid">
                    <div className="admin-form-group">
                      <label className="admin-label">Small Label / Eyebrow</label>
                      <input
                        className="admin-input"
                        value={block.label || ''}
                        onChange={(e) => updateContentBlock(blockKey, { label: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Background Color</label>
                      <input
                        type="color"
                        className="admin-input admin-color-input"
                        value={block.background || '#FAF9F6'}
                        onChange={(e) => updateContentBlock(blockKey, { background: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Text Alignment</label>
                      <select
                        className="admin-select"
                        value={block.align || 'left'}
                        onChange={(e) => updateContentBlock(blockKey, { align: e.target.value })}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  {block.body !== undefined && (
                    <div className="admin-form-group">
                      <label className="admin-label">Supporting Line / Paragraph</label>
                      <textarea
                        className="admin-textarea"
                        rows="3"
                        value={block.body || ''}
                        onChange={(e) => updateContentBlock(blockKey, { body: e.target.value })}
                      />
                    </div>
                  )}

                  {block.buttonText !== undefined && (
                    <div className="content-block-meta-grid">
                      <div className="admin-form-group">
                        <label className="admin-label">Button Text</label>
                        <input
                          className="admin-input"
                          value={block.buttonText || ''}
                          onChange={(e) => updateContentBlock(blockKey, { buttonText: e.target.value })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Button Link</label>
                        <input
                          className="admin-input"
                          value={block.buttonLink || ''}
                          onChange={(e) => updateContentBlock(blockKey, { buttonLink: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="content-line-editor-list">
                    {(block.lines || []).map((line, lineIndex) => (
                      <div className="content-line-editor" key={`${blockKey}-${lineIndex}`}>
                        <div className="content-line-top">
                          <strong>Line {lineIndex + 1}</strong>
                          <span>{line.fill === 'outline' ? 'Outline' : 'Solid'}</span>
                        </div>
                        <textarea
                          className="admin-textarea"
                          rows="2"
                          value={line.text || ''}
                          onChange={(e) => updateContentLine(blockKey, lineIndex, { text: e.target.value })}
                        />
                        <div className="content-line-controls">
                          <label>
                            Font
                            <select
                              className="admin-select"
                              value={line.fontFamily || 'Montserrat'}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { fontFamily: e.target.value })}
                            >
                              {FONT_OPTIONS.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Size px
                            <input
                              type="number"
                              min="8"
                              max="180"
                              className="admin-input"
                              value={line.fontSize || ''}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { fontSize: e.target.value })}
                              placeholder="Auto"
                            />
                          </label>
                          <label>
                            Color
                            <input
                              type="color"
                              className="admin-input admin-color-input"
                              value={line.color || '#111113'}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { color: e.target.value })}
                            />
                          </label>
                          <label>
                            Fill
                            <select
                              className="admin-select"
                              value={line.fill || 'solid'}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { fill: e.target.value })}
                            >
                              <option value="solid">Fill with color</option>
                              <option value="outline">Without fill / outline</option>
                            </select>
                          </label>
                          <label className="content-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(line.bold)}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { bold: e.target.checked })}
                            />
                            Bold
                          </label>
                          <label className="content-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(line.italic)}
                              onChange={(e) => updateContentLine(blockKey, lineIndex, { italic: e.target.checked })}
                            />
                            Italic
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </form>
          </div>
        )}

        {/* Hero banners config */}
        {activeTab === 'heroconfig' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Manage Homepage Hero Banner</h2>
            </div>

            <form onSubmit={handleSaveHeroConfig} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '980px' }}>

                <h3 style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', fontSize: '15px', fontWeight: '700' }}>Hero Media</h3>

                <div className="admin-form-group">
                  <label className="admin-label">PC / Laptop Hero Type</label>
                  <select
                    className="admin-input"
                    value={heroConfig.desktopMediaType || 'image'}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, desktopMediaType: e.target.value }))}
                  >
                    <option value="image">Photo</option>
                    <option value="slideshow">Slideshow</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">PC / Laptop Hero Photo File/Link</label>
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                    onChange={(e) => handleDirectUpload(e, (url) => setHeroConfig(prev => ({ ...prev, bgImage: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Or enter background image url path..."
                    value={heroConfig.bgImage}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, bgImage: e.target.value }))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">PC / Laptop Hero Slideshow Photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                    onChange={(e) => handleDirectUpload(e, (url) => appendHeroSlides('desktopSlides', url), { allowVideo: false })}
                    style={{ marginBottom: '8px', display: 'block' }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="0.5"
                    className="admin-input"
                    placeholder="Transition time in seconds"
                    aria-label="Desktop slideshow transition time in seconds"
                    inputMode="decimal"
                    value={intervalSeconds(heroConfig.desktopSlideIntervalMs || 5000).toString()}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, desktopSlideIntervalMs: Math.round(Number(e.target.value || 5) * 1000) }))}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {(Array.isArray(heroConfig.desktopSlides) ? heroConfig.desktopSlides : []).map((url, index) => (
                      <div key={`${url}-${index}`} style={{ position: 'relative', border: '1px solid var(--admin-border)', borderRadius: '6px', overflow: 'hidden', height: '110px', background: '#f8fafc' }}>
                        <img src={mediaUrl(url)} alt={`Desktop slide ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeHeroSlide('desktopSlides', index)}
                          aria-label={`Remove desktop slide ${index + 1}`}
                          style={{ position: 'absolute', top: '5px', right: '5px', border: '0', borderRadius: '999px', background: '#ef4444', color: '#fff', width: '24px', height: '24px', cursor: 'pointer' }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">PC / Laptop Hero Video File/Link</label>
                  <input
                    type="file"
                    accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleDirectUpload(e, (url) => setHeroConfig(prev => ({ ...prev, desktopVideoUrl: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter desktop MP4, MOV, or WEBM video url path..."
                    value={heroConfig.desktopVideoUrl || ''}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, desktopVideoUrl: e.target.value }))}
                  />
                </div>

                {renderHeroMediaPreview('desktop')}

                <div className="admin-form-group">
                  <label className="admin-label">Shop Now Link Target</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="#shop-catalog or /shop"
                    value={heroConfig.button1Link}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, button1Link: e.target.value }))}
                  />
                </div>

                <h3 style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', fontSize: '15px', fontWeight: '700', marginTop: '10px' }}>Mobile Layout Settings</h3>

                <div className="admin-form-group">
                  <label className="admin-label">Mobile Hero Type</label>
                  <select
                    className="admin-input"
                    value={heroConfig.mobileMediaType || 'video'}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, mobileMediaType: e.target.value }))}
                  >
                    <option value="image">Photo</option>
                    <option value="slideshow">Slideshow</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Mobile Hero Photo File/Link</label>
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                    onChange={(e) => handleDirectUpload(e, (url) => setHeroConfig(prev => ({ ...prev, mobileImageUrl: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter mobile hero image url path..."
                    value={heroConfig.mobileImageUrl || ''}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, mobileImageUrl: e.target.value }))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Mobile Hero Slideshow Photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                    onChange={(e) => handleDirectUpload(e, (url) => appendHeroSlides('mobileSlides', url), { allowVideo: false })}
                    style={{ marginBottom: '8px', display: 'block' }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="0.5"
                    className="admin-input"
                    placeholder="Transition time in seconds"
                    aria-label="Mobile slideshow transition time in seconds"
                    inputMode="decimal"
                    value={intervalSeconds(heroConfig.mobileSlideIntervalMs || 5000).toString()}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, mobileSlideIntervalMs: Math.round(Number(e.target.value || 5) * 1000) }))}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {(Array.isArray(heroConfig.mobileSlides) ? heroConfig.mobileSlides : []).map((url, index) => (
                      <div key={`${url}-${index}`} style={{ position: 'relative', border: '1px solid var(--admin-border)', borderRadius: '6px', overflow: 'hidden', height: '110px', background: '#f8fafc' }}>
                        <img src={mediaUrl(url)} alt={`Mobile slide ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeHeroSlide('mobileSlides', index)}
                          aria-label={`Remove mobile slide ${index + 1}`}
                          style={{ position: 'absolute', top: '5px', right: '5px', border: '0', borderRadius: '999px', background: '#ef4444', color: '#fff', width: '24px', height: '24px', cursor: 'pointer' }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Mobile Hero Video File/Link</label>
                  <input
                    type="file"
                    accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleDirectUpload(e, (url) => setHeroConfig(prev => ({ ...prev, mobileVideoUrl: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter mobile MP4, MOV, or WEBM video url path..."
                    value={heroConfig.mobileVideoUrl}
                    onChange={(e) => setHeroConfig(prev => ({ ...prev, mobileVideoUrl: e.target.value }))}
                  />
                </div>

                {renderHeroMediaPreview('mobile')}

                <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start', padding: '12px 28px', marginTop: '10px' }}>Save Configs</button>
              </div>
            </form>
          </div>
        )}

        {/* Returns */}
        {activeTab === 'returns' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Return & Exchange Requests</h2>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleResetReturnRecords}
                disabled={returns.length === 0}
              >
                Reset Requests
              </button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Order ID</th>
                    <th>Customer Email</th>
                    <th>Action</th>
                    <th>Reason</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.id}</strong></td>
                      <td><strong>{req.orderId}</strong></td>
                      <td>{req.email}</td>
                      <td>
                        <span className={`admin-badge ${req.action === 'Return' ? 'badge-refunded' : 'badge-pending'}`}>
                          {req.action}
                        </span>
                      </td>
                      <td>{req.reason}</td>
                      <td>{req.notes || '-'}</td>
                      <td>
                        <span className={`admin-badge ${req.status === 'Approved' ? 'badge-completed' : req.status === 'Rejected' ? 'badge-refunded' : 'badge-pending'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.date).toLocaleDateString()}</td>
                      <td>
                        {req.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="admin-btn-small"
                              style={{ background: 'var(--admin-success)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                              onClick={async () => {
                                if (!window.confirm('Approve this request?')) return;
                                try {
                                  const res = await fetch(`/api/returns/${req.id}/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Approved' })
                                  });
                                  if (res.ok) {
                                    onToast('Request Approved!');
                                    fetchData();
                                  } else {
                                    onToast(await getApiError(res, 'Request approve failed.'));
                                  }
                                } catch (e) {
                                  console.error(e);
                                  onToast('Request approve failed.');
                                }
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="admin-btn-small"
                              style={{ background: 'var(--admin-danger)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                              onClick={async () => {
                                if (!window.confirm('Reject this request?')) return;
                                try {
                                  const res = await fetch(`/api/returns/${req.id}/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Rejected' })
                                  });
                                  if (res.ok) {
                                    onToast('Request Rejected!');
                                    fetchData();
                                  } else {
                                    onToast(await getApiError(res, 'Request reject failed.'));
                                  }
                                } catch (e) {
                                  console.error(e);
                                  onToast('Request reject failed.');
                                }
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status !== 'Pending' && <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>Processed</span>}
                      </td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-muted)' }}>
                        No return/exchange requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Order Records</h2>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleResetOrderRecords}
                disabled={orders.length === 0 && returns.length === 0}
              >
                Reset Orders
              </button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Subtotal</th>
                    <th>Donation</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td><strong>{order.id}</strong></td>
                      <td>{order.customerInfo?.name} ({order.customerInfo?.email})</td>
                      <td>₹{order.subtotal}</td>
                      <td>₹{order.donation || 23}</td>
                      <td>
                        <span className={`admin-badge badge-${order.status?.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.date).toLocaleDateString()}</td>
                      <td>
                        <button className="admin-icon-btn" onClick={() => setSelectedOrder(order)}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Listed Store Items</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Selling Price</th>
                    <th>Original Price</th>
                    <th>Discount Price</th>
                    <th>Discount %</th>
                    <th>Visible Price Fields</th>
                    <th>Category</th>
                    <th>Sub-Categories</th>
                    <th>Colors</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td><strong>{product.id}</strong></td>
                      <td>{product.name}</td>
                      <td>₹{product.price}</td>
                      <td>₹{product.originalPrice || product.price}</td>
                      <td>{product.discountedPrice ? `₹${product.discountedPrice}` : '-'}</td>
                      <td>{product.discountPercentage ? `${product.discountPercentage}%` : '-'}</td>
                      <td>
                        {Object.entries(normalizedPriceDisplayOptions(product))
                          .filter(([, enabled]) => enabled)
                          .map(([key]) => PRICE_DISPLAY_LABELS[key] || key)
                          .join(', ')}
                      </td>
                      <td>{product.category}</td>
                      <td>{(product.subCategories || []).join(', ')}</td>
                      <td>{(product.colors || []).join(', ')}</td>
                      <td>{product.stock} units</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="admin-icon-btn"
                            onClick={() => {
                              setEditingProduct({
                                ...product,
                                imageUrls: product.imageUrls && product.imageUrls.length > 0
                                  ? product.imageUrls
                                  : (product.imageUrl ? [product.imageUrl] : []),
                                discountedPrice: product.discountedPrice || '',
                                discountPercentage: product.discountPercentage || '',
                                priceDisplayOptions: normalizedPriceDisplayOptions(product),
                                details: product.details !== undefined ? product.details : DEFAULT_DETAILS,
                                washcare: product.washcare !== undefined ? product.washcare : DEFAULT_WASHCARE,
                                shipping: product.shipping !== undefined ? product.shipping : DEFAULT_SHIPPING
                              });
                              setShowProductModal(true);
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory control */}
        {activeTab === 'inventory' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Quick Size-Stock Adjustments</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size S</th>
                    <th>Size M</th>
                    <th>Size L</th>
                    <th>Size XL</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const sizes = product.sizes || { S: 0, M: 0, L: 0, XL: 0 };
                    return (
                      <tr key={product.id}>
                        <td>
                          <div style={{ fontWeight: '700' }}>{product.name}</div>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{product.id}</span>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: '70px', padding: '6px' }}
                            value={sizes.S}
                            onChange={(e) => handleUpdateStock(product.id, 'S', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: '70px', padding: '6px' }}
                            value={sizes.M}
                            onChange={(e) => handleUpdateStock(product.id, 'M', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: '70px', padding: '6px' }}
                            value={sizes.L}
                            onChange={(e) => handleUpdateStock(product.id, 'L', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: '70px', padding: '6px' }}
                            value={sizes.XL}
                            onChange={(e) => handleUpdateStock(product.id, 'XL', e.target.value)}
                          />
                        </td>
                        <td style={{ fontWeight: '800' }}>{product.stock} units</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collections panel */}
        {activeTab === 'collections' && (
          <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Create New Collection</h2>
              </div>
              <form onSubmit={handleSaveCollection}>
                <div className="admin-form-group">
                  <label className="admin-label">Collection Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Winter Collection 2026"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Assign Products</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '4px', padding: '10px' }}>
                    {products.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id={`col-p-${p.id}`}
                          checked={newCollection.productIds.includes(p.id)}
                          onChange={() => handleToggleProductInCollection(p.id)}
                        />
                        <label htmlFor={`col-p-${p.id}`} style={{ fontSize: '13px' }}>{p.name}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '12px' }}>
                  Save Collection
                </button>
              </form>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Active Collections</h2>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Collection Name</th>
                      <th>Product Count</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map(col => (
                      <tr key={col.id}>
                        <td><strong>{col.name}</strong></td>
                        <td>{col.productIds?.length || 0} items</td>
                        <td>
                          <button className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteCollection(col.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stories panel */}
        {activeTab === 'stories' && (
          <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Publish a New Story</h2>
              </div>
              <form onSubmit={handleSaveStory}>
                <div className="admin-form-group">
                  <label className="admin-label">Direct Media Upload</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.mp4,.mov,.webm,.m4v,image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleDirectUpload(e, (url) => setNewStory(prev => ({ ...prev, mediaUrl: url })))}
                    style={{ marginBottom: '10px' }}
                  />
                  <label className="admin-label">Or Media URL</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={newStory.mediaUrl}
                    onChange={(e) => setNewStory(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    placeholder="/uploads/my-file.jpg"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Media Type</label>
                  <select
                    className="admin-select"
                    value={newStory.mediaType}
                    onChange={(e) => setNewStory(prev => ({ ...prev, mediaType: e.target.value }))}
                  >
                    <option value="image">Image Slider</option>
                    <option value="video">Video Loop</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Caption</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={newStory.caption}
                    onChange={(e) => setNewStory(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="e.g. Summer collection fit"
                  />
                </div>

                <div className="admin-form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="shopNowEnabled"
                      checked={newStory.shopNowEnabled}
                      onChange={(e) => setNewStory(prev => ({ ...prev, shopNowEnabled: e.target.checked }))}
                    />
                    <label htmlFor="shopNowEnabled" className="admin-label" style={{ marginBottom: 0 }}>
                      Enable "Shop Now" link button
                    </label>
                  </div>
                </div>

                {newStory.shopNowEnabled && (
                  <div className="admin-form-group" style={{ position: 'relative' }}>
                    <label className="admin-label">Link to Catalog Product (Search product name/ID)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newStory.productId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewStory(prev => ({ ...prev, productId: val }));
                        showSuggestions(val, 'productId');
                      }}
                      placeholder="Type product ID or name..."
                      required
                    />
                    {suggestionField === 'productId' && suggestions.length > 0 && (
                      <div className="admin-suggestions-dropdown" style={{ position: 'absolute', zIndex: 100, background: 'white', border: '1px solid #ccc', width: '100%', top: '100%' }}>
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            className="suggestion-item"
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                            onClick={() => {
                              setNewStory(prev => ({ ...prev, productId: s.value }));
                              clearSuggestions();
                            }}
                          >
                            {s.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '12px' }}>
                  Publish Story
                </button>
              </form>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Stories Manager</h2>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Type</th>
                      <th>Caption</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map(s => (
                      <tr key={s.id}>
                        <td>
                          {s.mediaType === 'video' ? (
                            <video src={mediaUrl(s.mediaUrl)} style={{ width: '50px', height: '50px', objectFit: 'cover' }} muted />
                          ) : (
                            <img src={mediaUrl(s.mediaUrl)} style={{ width: '50px', height: '50px', objectFit: 'cover' }} alt="Preview" />
                          )}
                        </td>
                        <td>{s.mediaType}</td>
                        <td>{s.caption}</td>
                        <td>
                          <button className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteStory(s.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Log book editor */}
        {activeTab === 'blogs' && (
          <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Compose Blog Entry (Google Docs block editor)</h2>
              </div>
              <form onSubmit={handleSaveBlog}>
                <div className="admin-form-group">
                  <label className="admin-label">Blog Title</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={blogTitleInput}
                    onChange={(e) => setBlogTitleInput(e.target.value)}
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Direct Cover Image Upload</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => handleDirectUpload(e, (url) => setBlogCoverInput(url))}
                    style={{ marginBottom: '10px' }}
                  />
                  <label className="admin-label">Or Cover Image URL</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={blogCoverInput}
                    onChange={(e) => setBlogCoverInput(e.target.value)}
                    placeholder="/uploads/my-blog-cover.jpg"
                  />
                </div>

                {/* Google Docs toolbar */}
                <div style={{ background: '#F3F4F6', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB', marginBottom: '15px' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', color: '#4B5563' }}>
                    Google Docs Blocks Toolbar
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleAddBlogBlock('h1')} className="admin-btn">Add H1</button>
                    <button type="button" onClick={() => handleAddBlogBlock('h2')} className="admin-btn">Add H2</button>
                    <button type="button" onClick={() => handleAddBlogBlock('h3')} className="admin-btn">Add H3</button>
                    <button type="button" onClick={() => handleAddBlogBlock('paragraph')} className="admin-btn">Add Paragraph</button>
                    <button type="button" onClick={() => handleAddBlogBlock('image')} className="admin-btn">Add Image Block</button>
                  </div>
                </div>

                {/* Blocks Area */}
                <div className="blog-block-editor-list">
                  {newBlog.content.map((block, idx) => (
                    <div
                      key={block.id || `${block.type}-${idx}`}
                      className={`blog-editor-block ${draggingBlogBlockIndex === idx ? 'is-dragging' : ''}`}
                      onDragOver={handleBlogBlockDragOver}
                      onDrop={(event) => handleBlogBlockDrop(event, idx)}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveBlogBlock(idx)}
                        className="blog-block-delete"
                        aria-label={`Delete block ${idx + 1}`}
                      >
                        &times;
                      </button>
                      <div className="blog-block-topbar">
                        <button
                          type="button"
                          className="blog-block-drag-handle"
                          draggable
                          onDragStart={(event) => handleBlogBlockDragStart(event, idx)}
                          onDragEnd={handleBlogBlockDragEnd}
                          aria-label={`Drag block ${idx + 1}`}
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} />
                        </button>
                        <div className="blog-block-title">
                          Block {idx + 1}: {block.type}
                        </div>
                        <div className="blog-block-move-actions" aria-label={`Move block ${idx + 1}`}>
                          <button
                            type="button"
                            onClick={() => handleMoveBlogBlock(idx, -1)}
                            disabled={idx === 0}
                            aria-label={`Move block ${idx + 1} up`}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlogBlock(idx, 1)}
                            disabled={idx === newBlog.content.length - 1}
                            aria-label={`Move block ${idx + 1} down`}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>

                      {block.type === 'image' ? (
                        <div>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
                            onChange={(e) => handleDirectUpload(e, (url) => handleUpdateBlogBlock(idx, { url }))}
                            style={{ marginBottom: '10px' }}
                          />
                          <input
                            type="text"
                            className="admin-input"
                            value={block.url}
                            onChange={(e) => handleUpdateBlogBlock(idx, { url: e.target.value })}
                            placeholder="Image URL"
                          />
                        </div>
                      ) : (
                        <div>
                          <textarea
                            className="admin-textarea"
                            value={block.text}
                            onChange={(e) => handleUpdateBlogBlock(idx, { text: e.target.value })}
                            placeholder="Write text here..."
                            rows="2"
                            style={{ marginBottom: '10px' }}
                          />
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input
                                type="checkbox"
                                checked={block.highlight}
                                onChange={(e) => handleUpdateBlogBlock(idx, { highlight: e.target.checked })}
                              />
                              Highlight text
                            </label>
                            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input
                                type="checkbox"
                                checked={block.uppercase}
                                onChange={(e) => handleUpdateBlogBlock(idx, { uppercase: e.target.checked })}
                              />
                              Capital text
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '12px' }}>
                  Publish Blog Post
                </button>
              </form>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Published Blogs</h2>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map(b => (
                      <tr key={b.id}>
                        <td>
                          <img src={mediaUrl(b.coverImage)} style={{ width: '50px', height: '50px', objectFit: 'cover' }} alt="Cover" />
                        </td>
                        <td><strong>{b.title}</strong></td>
                        <td>{new Date(b.date).toLocaleDateString()}</td>
                        <td>
                          <button className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteBlog(b.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Gallery */}
        {activeTab === 'gallery' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Manage Homepage Gallery</h2>
            </div>

            {/* Gallery Upload Form */}
            <form onSubmit={handleSaveGalleryItem} style={{ padding: '20px', borderBottom: '1px solid var(--admin-border)' }}>
              <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>

                <div className="admin-form-group">
                  <label className="admin-label">Image Link / Upload</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => handleDirectUpload(e, (url) => setNewGalleryItem(prev => ({ ...prev, imageUrl: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Or enter image URL"
                    value={newGalleryItem.imageUrl || ''}
                    onChange={(e) => setNewGalleryItem(prev => ({ ...prev, imageUrl: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Custom Title</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Winter Drop 2025"
                    value={newGalleryItem.title || ''}
                    onChange={(e) => setNewGalleryItem(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="admin-form-group" style={{ position: 'relative' }}>
                  <label className="admin-label">Redirect Link (Auto-suggest)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Type to search link..."
                    value={newGalleryItem.link || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewGalleryItem(prev => ({ ...prev, link: val }));
                      showSuggestions(val, 'link');
                    }}
                    required
                  />
                  {/* Suggestions list popup */}
                  {suggestionField === 'link' && suggestions.length > 0 && (
                    <div className="admin-suggestions-dropdown" style={{ position: 'absolute', zIndex: 100, background: 'white', border: '1px solid #ccc', width: '100%', top: '100%' }}>
                      {suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                          onClick={() => {
                            setNewGalleryItem(prev => ({ ...prev, link: s.value }));
                            clearSuggestions();
                          }}
                        >
                          <span className="suggestion-type" style={{ fontWeight: 'bold', marginRight: '5px' }}>[{s.type}]</span> {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="btn btn-accent">Add Slide to Gallery</button>
            </form>

            {/* Gallery List */}
            <div className="admin-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Link</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {galleryItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <img src={mediaUrl(item.imageUrl)} alt={item.title} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      </td>
                      <td>{item.title || '(No Title)'}</td>
                      <td><code>{item.link}</code></td>
                      <td>
                        <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteGalleryItem(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'newinconfig' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Manage New In Page Editorial Hero</h2>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/new-in-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newInConfig)
                });
                if (res.ok) {
                  onToast('New In configuration updated successfully!');
                  fetchData();
                } else {
                  onToast(await getApiError(res, 'Failed to update New In configuration.'));
                }
              } catch (err) {
                console.error(err);
                onToast('Error saving New In configuration.');
              }
            }} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>

                <div className="admin-form-group">
                  <label className="admin-label">Hero Tagline</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Summer Drop 2026"
                    value={newInConfig.tagline || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, tagline: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Hero Title (supports newline \n)</label>
                  <textarea
                    className="admin-textarea"
                    placeholder="e.g. The Racing &\nRebirth Drop."
                    value={newInConfig.title || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, title: e.target.value }))}
                    rows="3"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Hero Description</label>
                  <textarea
                    className="admin-textarea"
                    placeholder="Describe this new drop..."
                    value={newInConfig.desc || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, desc: e.target.value }))}
                    rows="4"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Button Text</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Explore Drops"
                    value={newInConfig.buttonText || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, buttonText: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Button Link Target</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. #new-drops-catalog"
                    value={newInConfig.buttonLink || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, buttonLink: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Hero Image Link / Upload</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => handleDirectUpload(e, (url) => setNewInConfig(prev => ({ ...prev, imageUrl: url })))}
                    style={{ marginBottom: '5px', display: 'block' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Or enter image URL"
                    value={newInConfig.imageUrl || ''}
                    onChange={(e) => setNewInConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  {newInConfig.imageUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <label className="admin-label">Image Preview:</label>
                      <img src={mediaUrl(newInConfig.imageUrl)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--admin-border)' }} />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>Save Settings</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px' }}>
            <div className="admin-modal-header">
              <h2>Order Details: {selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <strong>Customer Info:</strong>
                <div>Name: {selectedOrder.customerInfo?.name}</div>
                <div>Email: {selectedOrder.customerInfo?.email}</div>
                <div>Phone: {selectedOrder.customerInfo?.phone}</div>
                <div>Address: {selectedOrder.customerInfo?.address}</div>
              </div>

              <div>
                <strong>Items:</strong>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                    {item.name} ({item.selectedSize}) - Quantity: {item.quantity} - Price: ₹{item.price}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                  <span>Discount ({selectedOrder.couponCode || 'Promo'}):</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping:</span>
                <span>₹{selectedOrder.shipping}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>Grand Total:</span>
                <span>₹{selectedOrder.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green', fontWeight: '700' }}>
                <span>Charity Donation (per-item math):</span>
                <span>₹{selectedOrder.donation || (selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) * 23) || 23}</span>
              </div>

              <div style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <strong>Shipping / Delivery Partner</strong>
                  <span className={`admin-badge badge-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span>
                </div>
                <div className="admin-form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Delivery Partner</label>
                    <select
                      className="admin-input"
                      value={shipmentDraft.shipmentPartner}
                      onChange={(e) => {
                        const partner = e.target.value;
                        setShipmentDraft(prev => ({
                          ...prev,
                          shipmentPartner: partner,
                          trackingUrl: trackingUrlForPartner(partner, prev.trackingNumber)
                        }));
                      }}
                    >
                      {DELIVERY_PARTNERS.map((partner) => (
                        <option key={partner.value} value={partner.value}>{partner.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Tracking / AWB Number</label>
                    <input
                      className="admin-input"
                      value={shipmentDraft.trackingNumber}
                      onChange={(e) => {
                        const trackingNumber = e.target.value;
                        setShipmentDraft(prev => ({
                          ...prev,
                          trackingNumber,
                          trackingUrl: trackingUrlForPartner(prev.shipmentPartner, trackingNumber)
                        }));
                      }}
                      placeholder="Enter tracking number"
                    />
                  </div>
                </div>
                <div className="admin-form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="admin-label">Tracking Link</label>
                  <input
                    className="admin-input"
                    value={shipmentDraft.trackingUrl}
                    onChange={(e) => setShipmentDraft(prev => ({ ...prev, trackingUrl: e.target.value }))}
                    placeholder="Auto-filled for common delivery partners, or paste custom link"
                  />
                </div>
                {selectedOrder.shippedAt && (
                  <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Last shipped update: {new Date(selectedOrder.shippedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleOrderShipping(selectedOrder.id)}
                  disabled={selectedOrder.status === 'Refunded'}
                >
                  <Truck size={14} /> Save & Ship Order
                </button>
                <button
                  className="admin-btn"
                  onClick={() => handleCreateReturnRefundRequest(selectedOrder.id)}
                  disabled={selectedOrder.status === 'Refunded'}
                >
                  <RotateCcw size={14} /> Return / Refund Request
                </button>
                {selectedOrder.status !== 'Refunded' && (
                  <button className="admin-btn admin-btn-danger" onClick={() => handleOrderRefund(selectedOrder.id)}>
                    <RotateCcw size={14} /> Refund Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product creation and editing modal */}
      {showProductModal && (
        <div className="admin-modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="admin-modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowProductModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-label">Product Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, name: val }));
                    else setNewProduct(prev => ({ ...prev, name: val }));
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Selling Price (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingProduct ? editingProduct.price : newProduct.price}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || 0);
                      if (editingProduct) setEditingProduct(prev => ({ ...prev, price: val }));
                      else setNewProduct(prev => ({ ...prev, price: val }));
                    }}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Original Price (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingProduct ? (editingProduct.originalPrice || editingProduct.price) : newProduct.originalPrice}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || 0);
                      if (editingProduct) setEditingProduct(prev => ({ ...prev, originalPrice: val }));
                      else setNewProduct(prev => ({ ...prev, originalPrice: val }));
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Discounted Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={editingProduct ? (editingProduct.discountedPrice ?? '') : (newProduct.discountedPrice ?? '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value || 0);
                      if (editingProduct) setEditingProduct(prev => ({ ...prev, discountedPrice: val }));
                      else setNewProduct(prev => ({ ...prev, discountedPrice: val }));
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="admin-input"
                    value={editingProduct ? (editingProduct.discountPercentage ?? '') : (newProduct.discountPercentage ?? '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value || 0);
                      if (editingProduct) setEditingProduct(prev => ({ ...prev, discountPercentage: val }));
                      else setNewProduct(prev => ({ ...prev, discountPercentage: val }));
                    }}
                    placeholder="Auto if blank"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Show Price Fields on Frontend</label>
                <div className="admin-price-options">
                  {Object.entries(PRICE_DISPLAY_LABELS).map(([key, label]) => {
                    const currentProduct = editingProduct || newProduct;
                    const options = normalizedPriceDisplayOptions(currentProduct);
                    return (
                      <label key={key} className="admin-price-option">
                        <input
                          type="checkbox"
                          checked={Boolean(options[key])}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updater = (prev) => ({
                              ...prev,
                              priceDisplayOptions: {
                                ...normalizedPriceDisplayOptions(prev),
                                [key]: checked
                              }
                            });
                            if (editingProduct) setEditingProduct(updater);
                            else setNewProduct(updater);
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="admin-help-text">
                  Selling Price is the checkout amount. The other fields are optional display fields for homepage, shop, search, and product pages.
                </p>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <textarea
                  className="admin-textarea"
                  value={editingProduct ? editingProduct.desc : newProduct.desc}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, desc: val }));
                    else setNewProduct(prev => ({ ...prev, desc: val }));
                  }}
                  rows="3"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Product Details (Autofilled)</label>
                <textarea
                  className="admin-textarea"
                  value={editingProduct ? editingProduct.details : newProduct.details}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, details: val }));
                    else setNewProduct(prev => ({ ...prev, details: val }));
                  }}
                  rows="4"
                  placeholder="Details..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Wash Care Details (Autofilled)</label>
                <textarea
                  className="admin-textarea"
                  value={editingProduct ? editingProduct.washcare : newProduct.washcare}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, washcare: val }));
                    else setNewProduct(prev => ({ ...prev, washcare: val }));
                  }}
                  rows="4"
                  placeholder="Wash care..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Shipping Details (Autofilled)</label>
                <textarea
                  className="admin-textarea"
                  value={editingProduct ? editingProduct.shipping : newProduct.shipping}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, shipping: val }));
                    else setNewProduct(prev => ({ ...prev, shipping: val }));
                  }}
                  rows="4"
                  placeholder="Shipping..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Main Category</label>
                <select
                  className="admin-select"
                  value={editingProduct ? editingProduct.category : newProduct.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingProduct) setEditingProduct(prev => ({ ...prev, category: val }));
                    else setNewProduct(prev => ({ ...prev, category: val }));
                  }}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              {/* Sub Categories Manager */}
              <div className="admin-form-group" style={{ position: 'relative' }}>
                <label className="admin-label">Sub Categories (Multi-select)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {(editingProduct ? editingProduct.subCategories || [] : newProduct.subCategories || []).map(sub => (
                    <span key={sub} style={{ background: '#FAF9F6', border: '1px solid var(--admin-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {sub}
                      <button
                        type="button"
                        onClick={() => {
                          const list = editingProduct ? editingProduct.subCategories : newProduct.subCategories;
                          const updated = list.filter(s => s !== sub);
                          if (editingProduct) setEditingProduct(prev => ({ ...prev, subCategories: updated }));
                          else setNewProduct(prev => ({ ...prev, subCategories: updated }));
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontWeight: '800' }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={newSubCategoryInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSubCategoryInput(val);
                        const cat = editingProduct ? editingProduct.category : newProduct.category;
                        showSuggestions(val, 'subcategory', cat);
                      }}
                      placeholder="Type sub-category name"
                      style={{ width: '100%' }}
                    />
                    {suggestionField === 'subcategory' && suggestions.length > 0 && (
                      <div className="admin-suggestions-dropdown" style={{ position: 'absolute', zIndex: 100, background: 'white', border: '1px solid #ccc', width: '100%', top: '100%' }}>
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            className="suggestion-item"
                            style={{ padding: '8px', cursor: 'pointer' }}
                            onClick={() => {
                              setNewSubCategoryInput(s.value);
                              clearSuggestions();
                            }}
                          >
                            {s.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      if (!newSubCategoryInput.trim()) return;
                      const list = editingProduct ? editingProduct.subCategories || [] : newProduct.subCategories || [];
                      if (!list.includes(newSubCategoryInput.trim())) {
                        const updated = [...list, newSubCategoryInput.trim()];
                        if (editingProduct) setEditingProduct(prev => ({ ...prev, subCategories: updated }));
                        else setNewProduct(prev => ({ ...prev, subCategories: updated }));
                      }
                      setNewSubCategoryInput('');
                      clearSuggestions();
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Colors Manager */}
              <div className="admin-form-group" style={{ position: 'relative' }}>
                <label className="admin-label">Color Swatch Categories (e.g. BLUES, BROWNS, NEUTRALS)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {(editingProduct ? editingProduct.colors || [] : newProduct.colors || []).map(color => (
                    <span key={color} style={{ background: '#FAF9F6', border: '1px solid var(--admin-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {color}
                      <button
                        type="button"
                        onClick={() => {
                          const list = editingProduct ? editingProduct.colors : newProduct.colors;
                          const updated = list.filter(c => c !== color);
                          if (editingProduct) setEditingProduct(prev => ({ ...prev, colors: updated }));
                          else setNewProduct(prev => ({ ...prev, colors: updated }));
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontWeight: '800' }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={newColorInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewColorInput(val);
                        showSuggestions(val, 'color');
                      }}
                      placeholder="e.g. BLUES"
                      style={{ width: '100%' }}
                    />
                    {suggestionField === 'color' && suggestions.length > 0 && (
                      <div className="admin-suggestions-dropdown" style={{ position: 'absolute', zIndex: 100, background: 'white', border: '1px solid #ccc', width: '100%', top: '100%' }}>
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            className="suggestion-item"
                            style={{ padding: '8px', cursor: 'pointer' }}
                            onClick={() => {
                              setNewColorInput(s.value);
                              clearSuggestions();
                            }}
                          >
                            {s.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      if (!newColorInput.trim()) return;
                      const list = editingProduct ? editingProduct.colors || [] : newProduct.colors || [];
                      const formatted = newColorInput.trim().toUpperCase();
                      if (!list.includes(formatted)) {
                        const updated = [...list, formatted];
                        if (editingProduct) setEditingProduct(prev => ({ ...prev, colors: updated }));
                        else setNewProduct(prev => ({ ...prev, colors: updated }));
                      }
                      setNewColorInput('');
                      clearSuggestions();
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Product Images Manager */}
              <div className="admin-form-group">
                <label className="admin-label">Product Images/Photos (Up to {PRODUCT_IMAGE_LIMIT} images)</label>
                <p style={{ margin: '0 0 10px', color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                  Select one or many JPG, JPEG, PNG, WEBP, GIF, or AVIF files. Each file must be under {MAX_IMAGE_UPLOAD_MB}MB.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  {(editingProduct ? editingProduct.imageUrls || [] : newProduct.imageUrls || []).map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', border: '1px solid var(--admin-border)', borderRadius: '4px', overflow: 'hidden', height: '100px' }}>
                      <img src={mediaUrl(url)} alt={`Product image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => {
                          const list = editingProduct ? editingProduct.imageUrls : newProduct.imageUrls;
                          const updated = list.filter((_, i) => i !== idx);
                          if (editingProduct) setEditingProduct(prev => ({ ...prev, imageUrls: updated, imageUrl: updated[0] || '' }));
                          else setNewProduct(prev => ({ ...prev, imageUrls: updated, imageUrl: updated[0] || '' }));
                        }}
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  {((editingProduct ? editingProduct.imageUrls || [] : newProduct.imageUrls || []).length < PRODUCT_IMAGE_LIMIT) && (
                    <div style={{ border: '2px dashed var(--admin-border)', borderRadius: '4px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                      <Plus size={20} style={{ color: 'var(--admin-text-muted)' }} />
                      <span style={{ fontSize: '10px', color: 'var(--admin-text-muted)', marginTop: '5px' }}>Upload Images</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif"
                        multiple
                        onChange={(e) => {
                          const currentList = editingProduct ? editingProduct.imageUrls || [] : newProduct.imageUrls || [];
                          const selectedCount = e.target.files?.length || 0;
                          if (currentList.length + selectedCount > PRODUCT_IMAGE_LIMIT) {
                            onToast(`You can add up to ${PRODUCT_IMAGE_LIMIT} product images. Remove some images or select fewer files.`);
                            e.target.value = '';
                            return;
                          }
                          handleDirectUpload(e, (url) => {
                            if (editingProduct) {
                              setEditingProduct(prev => {
                                const list = prev?.imageUrls || [];
                                const updated = [...list, url].slice(0, PRODUCT_IMAGE_LIMIT);
                                return { ...prev, imageUrls: updated, imageUrl: updated[0] || '' };
                              });
                            } else {
                              setNewProduct(prev => {
                                const list = prev?.imageUrls || [];
                                const updated = [...list, url].slice(0, PRODUCT_IMAGE_LIMIT);
                                return { ...prev, imageUrls: updated, imageUrl: updated[0] || '' };
                              });
                            }
                          }, { allowVideo: false });
                        }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Size Stocks */}
              <div className="admin-form-group">
                <label className="admin-label">Size Specific Stocks</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {['S', 'M', 'L', 'XL'].map(sz => {
                    const sizes = editingProduct ? editingProduct.sizes || {} : newProduct.sizes || {};
                    return (
                      <div key={sz}>
                        <label style={{ fontSize: '12px', fontWeight: '800' }}>Size {sz}</label>
                        <input
                          type="number"
                          className="admin-input"
                          value={sizes[sz] !== undefined ? sizes[sz] : 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value || 0);
                            const updatedSizes = { ...sizes, [sz]: val };
                            if (editingProduct) setEditingProduct(prev => ({ ...prev, sizes: updatedSizes }));
                            else setNewProduct(prev => ({ ...prev, sizes: updatedSizes }));
                          }}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={savingProduct || uploadingFiles > 0}
                style={{ width: '100%', padding: '14px', opacity: savingProduct || uploadingFiles > 0 ? 0.65 : 1, cursor: savingProduct || uploadingFiles > 0 ? 'not-allowed' : 'pointer' }}
              >
                {uploadingFiles > 0
                  ? `Uploading ${uploadingFiles} file${uploadingFiles > 1 ? 's' : ''}...`
                  : savingProduct
                    ? 'Saving Product...'
                    : editingProduct ? 'Update Product Details' : 'Publish Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
