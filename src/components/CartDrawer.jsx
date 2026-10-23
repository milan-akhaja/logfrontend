import React, { useState, useEffect, useRef } from 'react';
import { apiUrl, mediaSrcSet, mediaUrl, srcSetFallback } from '../lib/urls';
import { apiJson } from '../lib/apiClient';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock';
import { getProducts } from '../lib/products';
import {
  FALLBACK_COUPONS,
  getCoupons,
  lookupCoupon,
  couponBadge,
  couponBlockedForPayment,
  couponAppliesToCart,
  couponTileNote,
  couponSubtitle
} from '../lib/coupons';
import { canTrackGA4, trackGA4Event, trackMetaEvent } from '../lib/analytics';

const WALL_TEXT_MAX = 20;

function cleanCityName(rawCity) {
  if (!rawCity) return '';
  return rawCity
    .replace(/\s+(?:G\s*P\s*O|H\.?O\.?|S\.?O\.?)$/i, '')
    .replace(/^(?:District Court|Municipal Corporation)\s*\((.*?)\)$/i, '$1')
    .trim();
}

const CHECKOUT_DRAFT_KEY = 'log_checkout_customer_draft';
const CHECKOUT_ORDER_KEY = 'log_checkout_client_order_id';
const FOUNDER_DELIVERY_FEE = 3000;
const PHONE_COUNTRY_CODES = [
  { value: '+91', label: '+91', country: 'India', digits: 10 },
  { value: '+1', label: '+1', country: 'United States', digits: 10 },
  { value: '+44', label: '+44', country: 'United Kingdom' },
  { value: '+971', label: '+971', country: 'United Arab Emirates' },
  { value: '+61', label: '+61', country: 'Australia' },
  { value: '+65', label: '+65', country: 'Singapore' },
  { value: '+49', label: '+49', country: 'Germany' },
  { value: '+33', label: '+33', country: 'France' }
];

function getSavedCustomerInfo(defaultInfo) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaultInfo;
    const merged = { ...defaultInfo, ...saved };
    delete merged.dob;
    const rawPhone = String(merged.phone || '').trim();
    const matchedCode = PHONE_COUNTRY_CODES.find((code) => rawPhone.startsWith(code.value));
    if (matchedCode) {
      merged.phoneCountryCode = matchedCode.value;
      merged.phone = rawPhone.slice(matchedCode.value.length).replace(/\D/g, '');
    } else {
      merged.phone = rawPhone.replace(/\D/g, '');
    }
    return merged;
  } catch {
    return defaultInfo;
  }
}

function normalizeLocalPhone(value, countryCode = '+91') {
  let digits = String(value || '').replace(/\D/g, '');
  if (countryCode === '+91' && digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

function isAhmedabadCity(value) {
  return ['ahmedabad', 'amdavad'].includes(String(value || '').trim().toLowerCase());
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

function matchIndianState(rawState) {
  if (!rawState) return '';
  const cleanRaw = rawState.trim().toLowerCase().replace(/&/g, 'and');

  if (cleanRaw.includes('orissa')) return 'Odisha';
  if (cleanRaw.includes('pondicherry')) return 'Puducherry';
  if (cleanRaw.includes('delhi')) return 'Delhi';
  if (cleanRaw.includes('daman') || cleanRaw.includes('dadra')) return 'Dadra and Nagar Haveli and Daman and Diu';
  if (cleanRaw.includes('andaman')) return 'Andaman and Nicobar Islands';
  if (cleanRaw.includes('jammu')) return 'Jammu and Kashmir';

  const exactMatch = INDIAN_STATES.find(s => s.toLowerCase() === cleanRaw);
  if (exactMatch) return exactMatch;

  const includesMatch = INDIAN_STATES.find(s => {
    const cleanS = s.toLowerCase();
    return cleanRaw.includes(cleanS) || cleanS.includes(cleanRaw);
  });

  return includesMatch || '';
}

function getClientOrderId() {
  let value = localStorage.getItem(CHECKOUT_ORDER_KEY);
  if (!value) {
    value = window.crypto?.randomUUID ? window.crypto.randomUUID() : `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CHECKOUT_ORDER_KEY, value);
  }
  return value;
}

function CheckoutTags({ cart, cartHasDrop }) {
  const [idx, setIdx] = useState(0);
  const scrollerRef = useRef(null);
  const count = cart.length;
  const multi = count > 1;
  const active = Math.min(idx, Math.max(count - 1, 0));

  const getStep = (el) => {
    const slides = el.children;
    return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : (el.clientWidth || 1);
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const next = Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / getStep(el))));
    setIdx((prev) => (prev === next ? prev : next));
  };

  if (count === 0) return null;

  return (
    <div className="checkout-tags">
      <div className="checkout-tags-scroller" ref={scrollerRef} onScroll={handleScroll}>
        {cart.map((item, i) => {
          const qty = Number(item.quantity) || 1;
          return (
            <div
              className={`checkout-tag-slide${i === active ? ' is-active' : ''}`}
              key={item.cartItemId}
              role="group"
              aria-label={`Piece ${i + 1} of ${count}`}
            >
              <div className="checkout-tag">
                <span className="checkout-tag-string" aria-hidden="true"></span>
                <span className="checkout-tag-eyelet" aria-hidden="true"><span></span></span>
                <div className="checkout-tag-body">
                  <div className="checkout-tag-top">
                    <span>{cartHasDrop ? 'NUMBERED DROP' : 'LOGCLOTH'}</span>
                    {multi && <span className="checkout-tag-count">{i + 1} / {count}</span>}
                  </div>
                  <div className="checkout-tag-name">{item.name}</div>
                  <div className="checkout-tag-meta">
                    <div>
                      <span className="checkout-tag-k">SIZE</span>
                      <span className="checkout-tag-v">{item.selectedSize}{qty > 1 ? ` × ${qty}` : ''}</span>
                    </div>
                    <div>
                      <span className="checkout-tag-k">PRICE</span>
                      <span className="checkout-tag-v">{formatCurrency((Number(item.price) || 0) * qty)}</span>
                    </div>
                  </div>
                  <div className="checkout-tag-barcode" aria-hidden="true"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onQtyChange,
  onRemove,
  onClearCart,
  onPurchase,
  onToast
}) {
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const defaultCustomerInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '+91',
    phone: '',
    country: 'India',
    address: '',
    apartment: '',
    city: '',
    state: 'Gujarat',
    pinCode: '',
    saveInfo: false
  };
  const [customerInfo, setCustomerInfo] = useState(() => getSavedCustomerInfo(defaultCustomerInfo));
  const [paymentMethod, setPaymentMethod] = useState('payu');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Numbered drop. dropIds comes from the product list; quote is the server's
  // own pricing of this exact cart. Neither is ever used to set a price - the
  // server recomputes everything when the order is placed.
  const [dropIds, setDropIds] = useState(() => new Set());
  const [dropProducts, setDropProducts] = useState(() => new Map());
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(false);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [wallOptIn, setWallOptIn] = useState(false);
  const [wallDisplayName, setWallDisplayName] = useState('');
  const [wallCity, setWallCity] = useState('');

  const [lastDonation, setLastDonation] = useState(0);
  const [lastOrderSummary, setLastOrderSummary] = useState(null);
  const [emailHtml, setEmailHtml] = useState('');
  const [orderEmailSent, setOrderEmailSent] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [coupons, setCoupons] = useState(FALLBACK_COUPONS);
  const [typedCoupons, setTypedCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponChecking, setCouponChecking] = useState(false);

  // Scroll locking
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    }
    return () => {
      if (isOpen) unlockBodyScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    getProducts()
      .then((list) => {
        if (active) {
          setDropIds(new Set(list.filter((p) => p.isPreorder === true).map((p) => String(p.id))));
          setDropProducts(new Map(list.map((p) => [String(p.id), p])));
        }
      })
      .catch(() => { });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    getCoupons().then((list) => {
      if (active) setCoupons(list);
    });
    return () => { active = false; };
  }, [isOpen]);

  // A drop cart never offers COD - decided from the product list, and also
  // from the server quote, so either one alone is enough to hide it.
  const cartHasDrop = cart.some((item) => dropIds.has(String(item.id))) || quote?.hasPreorder === true;
  const getItemPreorderPhase = (item) => {
    const fresh = dropProducts.get(String(item?.id));
    if (fresh?.preorderPhase) return fresh.preorderPhase;
    if (item?.preorderPhase) return item.preorderPhase;
    for (const p of dropProducts.values()) {
      if (p.isPreorder === true && p.preorderPhase) return p.preorderPhase;
    }
    return undefined;
  };
  const isDropWindowClosed = cart.some((item) => {
    const isDrop = dropIds.has(String(item.id)) || item.isPreorder === true;
    return isDrop && getItemPreorderPhase(item) === 'after';
  });
  const isPreorderActive = cartHasDrop && !isDropWindowClosed;
  const isCodPayment = paymentMethod === 'cod';
  const isCouponDisabled = paymentMethod === 'founder_delivery' || isPreorderActive;
  const hasValidPhone = String(customerInfo.phone || '').replace(/\D/g, '').length >= 10;

  // Only trust the quote while it describes the exact cart, payment method, and coupon on screen.
  const normalizedPaymentMethod = String(paymentMethod || '').trim().toLowerCase();
  const tileCoupons = [...coupons, ...typedCoupons.filter((t) => !coupons.some((c) => c.code === t.code))];
  const selectedDef = tileCoupons.find((c) => c.code === selectedCoupon) || null;
  const expectedCoupon = isCouponDisabled
    || couponBlockedForPayment(selectedDef, isCodPayment)
    || (selectedDef?.firstOrderOnly && !hasValidPhone)
    ? null
    : (selectedCoupon || null);
  const quoteMatchesCart = Boolean(quote)
    && String(quote.paymentMethod || '').trim().toLowerCase() === normalizedPaymentMethod
    && (quote.couponCode || null) === expectedCoupon
    && quote.lines?.length === cart.length
    && quote.lines.every((line, index) => String(line.id) === String(cart[index]?.id) && line.quantity === cart[index]?.quantity);
  const useServerTotals = quoteMatchesCart;

  const clientSubtotal = cart.reduce((sum, item) => {
    if (item.isBogo && !dropIds.has(String(item.id))) {
      return sum + (item.price * Math.ceil(item.quantity / 2));
    }
    return sum + (item.price * item.quantity);
  }, 0);

  const subtotal = useServerTotals ? quote.subtotal : clientSubtotal;
  const discountAmount = useServerTotals ? quote.discount : 0;
  const netSubtotal = subtotal - discountAmount;
  // Shipping is free on every order. Must match FLAT_SHIPPING_FEE in the
  // backend's pricing.js - the server decides what is actually charged, so if
  // these disagree the customer sees one number and pays another.
  const baseShipping = 0;
  const founderDeliveryAvailable = isAhmedabadCity(customerInfo.city);
  const isFounderDelivery = paymentMethod === 'founder_delivery';
  const founderDeliveryFee = useServerTotals ? quote.founderDeliveryFee : (isFounderDelivery ? FOUNDER_DELIVERY_FEE : 0);
  const shipping = useServerTotals ? quote.shipping : baseShipping + founderDeliveryFee;
  const total = useServerTotals ? quote.total : netSubtotal + shipping;
  // When quote is loading or not yet matched, totals are pending.
  const totalPending = !useServerTotals;

  // Saves the email and phone typed at checkout so an unfinished order can be
  // followed up. Best effort: a failed save must never get in the way of buying.
  const captureKeyRef = useRef('');
  const lastCaptureRef = useRef('');
  useEffect(() => {
    if (cart.length === 0) {
      captureKeyRef.current = '';
      lastCaptureRef.current = '';
      return undefined;
    }
    if (!showCheckoutForm) return undefined;
    const email = String(customerInfo.email || '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const localDigits = String(customerInfo.phone || '').replace(/\D/g, '');
    const phoneOk = localDigits.length >= 10;
    if (!emailOk && !phoneOk) return undefined;
    const timer = setTimeout(() => {
      if (!captureKeyRef.current) {
        const raw = globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random().toString(36).slice(2)}`;
        captureKeyRef.current = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
      }
      const body = {
        sessionKey: captureKeyRef.current,
        email: emailOk ? email : '',
        phone: phoneOk ? `${String(customerInfo.phoneCountryCode || '+91').replace(/\D/g, '')}${localDigits}` : '',
        items: cart.map((item) => ({
          name: item.name,
          size: item.selectedSize || item.selectedSize1 || '',
          quantity: item.quantity,
          price: item.price
        })),
        bagTotal: clientSubtotal
      };
      const fingerprint = JSON.stringify(body);
      if (fingerprint === lastCaptureRef.current) return;
      apiJson('/api/abandoned-checkouts', { method: 'POST', body: fingerprint })
        .then(() => { lastCaptureRef.current = fingerprint; })
        .catch(() => { });
    }, 1500);
    return () => clearTimeout(timer);
  }, [showCheckoutForm, cart, customerInfo.email, customerInfo.phone, customerInfo.phoneCountryCode, clientSubtotal]);

  useEffect(() => {
    if (!isOpen || cart.length === 0) {
      setQuote(null);
      setQuoteError(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setQuoteError(false);
      apiJson('/api/orders/quote', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedSize1: item.selectedSize1,
            selectedSize2: item.selectedSize2
          })),
          paymentMethod,
          deliveryOption: paymentMethod === 'founder_delivery' ? 'founder_delivery' : 'standard',
          customerInfo: { city: customerInfo.city, phone: customerInfo.phone },
          couponCode: expectedCoupon
        })
      })
        .then((data) => {
          if (data?.success) {
            setQuote(data);
            setQuoteError(false);
          } else {
            if (data?.code === 'FIRST_ORDER_ONLY') {
              onToast('This coupon is only valid on your first order.');
              setSelectedCoupon(null);
            }
            setQuote(null);
            setQuoteError(true);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            const errCode = err?.data?.code || err?.code;
            const isFirstOrderError = errCode === 'FIRST_ORDER_ONLY' || err?.message?.includes('first order');
            const isCouponError = isFirstOrderError
              || ['PHONE_REQUIRED_FOR_COUPON', 'COUPON_PREPAID_ONLY', 'COUPON_PREORDER_CONFLICT', 'INVALID_COUPON', 'FIRST_ORDER_CHECK_FAILED'].includes(errCode)
              || (Boolean(expectedCoupon) && err?.status >= 400 && err?.status < 500);
            if (isCouponError) {
              onToast(isFirstOrderError ? 'This coupon is only valid on your first order.' : (err?.message || 'This offer cannot be applied to this order.'));
              setSelectedCoupon(null);
              return;
            }
            setQuote(null);
            setQuoteError(true);
          }
        });
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isOpen, cart, paymentMethod, customerInfo.city, customerInfo.phone, selectedCoupon, isCouponDisabled, hasValidPhone, quoteRetry]);

  useEffect(() => {
    if (selectedCoupon && (isCouponDisabled || couponBlockedForPayment(selectedDef, isCodPayment))) {
      setSelectedCoupon(null);
    }
  }, [isCouponDisabled, isCodPayment, selectedCoupon, coupons, typedCoupons]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('payu');
      setSelectedCoupon(null);
      setTypedCoupons([]);
      setCouponInput('');
      setShowCheckoutForm(false);
    }
  }, [isOpen]);

  // Donation calculation (₹23 per product quantity)
  const totalItemsQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const donation = totalItemsQty * 23;

  useEffect(() => {
    if (paymentMethod === 'founder_delivery' && !founderDeliveryAvailable) {
      setPaymentMethod('payu');
    }
  }, [founderDeliveryAvailable, paymentMethod]);

  const [isLoadingPincode, setIsLoadingPincode] = useState(false);

  useEffect(() => {
    const cleanPin = String(customerInfo.pinCode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchPincodeDetails = async () => {
      setIsLoadingPincode(true);

      const backendFetch = apiJson(`/api/pincode/${cleanPin}`, { signal: controller.signal })
        .then(data => {
          if (data?.success && (data.district || data.state)) {
            return { city: cleanCityName(data.district), state: matchIndianState(data.state) };
          }
          throw new Error('Backend pincode empty');
        });

      const zippoFetch = fetch(`https://api.zippopotam.us/in/${cleanPin}`, { signal: controller.signal })
        .then(r => {
          if (!r.ok) throw new Error('Zippo fetch error');
          return r.json();
        })
        .then(data => {
          if (data?.places?.length > 0) {
            const place = data.places.find(x => x['place name']?.toLowerCase().includes('g p o')) || data.places[0];
            return { city: cleanCityName(place['place name']), state: matchIndianState(place.state) };
          }
          throw new Error('Zippo places empty');
        });

      const postalFetch = fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: controller.signal })
        .then(r => {
          if (!r.ok) throw new Error('Postal fetch error');
          return r.json();
        })
        .then(data => {
          if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            return { city: cleanCityName(po.District || po.Block || po.Name), state: matchIndianState(po.State) };
          }
          throw new Error('Postal data empty');
        });

      try {
        const result = await Promise.any([backendFetch, zippoFetch, postalFetch]);
        if (!isMounted) return;

        setCustomerInfo(prev => ({
          ...prev,
          ...(result.city ? { city: result.city } : {}),
          ...(result.state ? { state: result.state } : {})
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Pincode auto-fill failed across all sources:', err);
        }
      } finally {
        if (isMounted) setIsLoadingPincode(false);
      }
    };

    const timer = setTimeout(fetchPincodeDetails, 200);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [customerInfo.pinCode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'pinCode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setCustomerInfo(prev => ({ ...prev, pinCode: digitsOnly }));
      return;
    }
    setCustomerInfo(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const getOrderCustomerInfo = () => {
    const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
    const fullAddress = [
      customerInfo.address,
      customerInfo.apartment,
      customerInfo.city,
      customerInfo.state,
      customerInfo.pinCode,
      customerInfo.country
    ].filter(Boolean).join(', ');

    const phoneCountryCode = customerInfo.phoneCountryCode || '+91';
    const phoneDigits = normalizeLocalPhone(customerInfo.phone, phoneCountryCode);

    return {
      ...customerInfo,
      phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : '',
      localPhone: phoneDigits,
      phoneCountryCode,
      name: fullName,
      address: fullAddress,
      shippingAddressLine1: customerInfo.address,
      shippingAddressLine2: customerInfo.apartment,
      deliveryOption: isFounderDelivery ? 'founder_delivery' : 'standard',
      deliveryMethod: isFounderDelivery ? 'Delivery by Founder - Ahmedabad only' : 'Standard shipping',
      baseShipping,
      founderDeliveryFee
    };
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmittingOrder || !quoteMatchesCart) return;

    const currentDonation = donation;
    setLastDonation(currentDonation);
    const orderCustomerInfo = getOrderCustomerInfo();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderCustomerInfo.email)) {
      onToast('Enter a valid email address.');
      return;
    }
    const selectedPhoneCode = PHONE_COUNTRY_CODES.find((code) => code.value === orderCustomerInfo.phoneCountryCode) || PHONE_COUNTRY_CODES[0];
    const localPhoneDigits = normalizeLocalPhone(orderCustomerInfo.localPhone, orderCustomerInfo.phoneCountryCode);
    if (selectedPhoneCode.value === '+91' && !/^[6-9]\d{9}$/.test(localPhoneDigits)) {
      onToast('Enter a valid 10 digit Indian phone number.');
      return;
    }
    if (selectedPhoneCode.value !== '+91' && localPhoneDigits.length < 6) {
      onToast('Enter a valid phone number.');
      return;
    }
    if (!/^\d{6}$/.test(String(orderCustomerInfo.pinCode || '').trim())) {
      onToast('Enter a valid 6 digit PIN code.');
      return;
    }
    if (isFounderDelivery && !founderDeliveryAvailable) {
      onToast('Delivery by founder is available only in Ahmedabad.');
      return;
    }

    const clientOrderId = getClientOrderId();
    const orderItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedSize1: item.selectedSize1,
      selectedSize2: item.selectedSize2
    }));
    const saveOrder = (paymentId) => apiJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: orderItems,
        customerInfo: orderCustomerInfo,
        paymentId,
        clientOrderId,
        couponCode: expectedCoupon,
        deliveryOption: orderCustomerInfo.deliveryOption
      })
    });
    try {
      setIsSubmittingOrder(true);
      if (paymentMethod === 'cod') {
        const data = await saveOrder('COD');
        onPurchase?.({
          transaction_id: data.order?.id || clientOrderId,
          value: Number(total || 0),
          tax: 0,
          shipping: Number(shipping || 0),
          currency: 'INR',
          payment_type: 'COD',
          items: orderItems.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            item_variant: item.selectedSize,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1)
          }))
        });
        setLastOrderSummary(data.order || null);
        setEmailHtml(data.emailHtml || '');
        setOrderEmailSent(Boolean(data.emailSent));
        if (!data.emailSent || !data.ownerEmailSent) {
          onToast('Order saved, but one email notification did not send. Check SMTP settings.');
        }
        localStorage.removeItem(CHECKOUT_ORDER_KEY);
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
        onClearCart();
        setShowCheckoutForm(false);
        setShowSuccessModal(true);
        setPaymentMethod('payu');
        setIsSubmittingOrder(false);
        return;
      }

      if (paymentMethod === 'payu' || paymentMethod === 'founder_delivery') {
        const data = await apiJson('/api/payments/payu/initiate', {
          method: 'POST',
          body: JSON.stringify({
            items: orderItems,
            customerInfo: orderCustomerInfo,
            clientOrderId,
            couponCode: expectedCoupon,
            deliveryOption: orderCustomerInfo.deliveryOption,
            ...(cartHasDrop && wallOptIn ? { wallOptIn: true, wallDisplayName, wallCity } : {})
          })
        });

        if (data.action && data.fields) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.action;

          Object.entries(data.fields).forEach(([key, val]) => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = val !== undefined && val !== null ? String(val) : '';
            form.appendChild(hiddenField);
          });

          document.body.appendChild(form);
          form.submit();
          return;
        }

        onToast(data?.error || 'Failed to initiate PayU payment.');
        setIsSubmittingOrder(false);
        return;
      }

      onToast('Select a valid payment option.');
      setIsSubmittingOrder(false);
    } catch (err) {
      console.error(err);
      const serverMessage = err?.data?.error || err?.data?.message || err?.message || 'Network error during checkout.';
      onToast(serverMessage);
      setIsSubmittingOrder(false);
    }
  };

  const couponProblem = (def) => {
    if (couponBlockedForPayment(def, isCodPayment)) {
      return isCodPayment ? `${def.code} is valid on prepaid orders only.` : `${def.code} is valid on Cash on Delivery orders only.`;
    }
    if (!couponAppliesToCart(def, cart)) return 'This coupon does not apply to the items in your bag.';
    if (Number(def.minOrderValue) > 0 && clientSubtotal < Number(def.minOrderValue)) {
      return `This coupon needs a minimum order of \u20B9${Number(def.minOrderValue)}.`;
    }
    return '';
  };
  const isTileDisabled = (def) => isCouponDisabled || Boolean(couponProblem(def));

  const couponDisabledNote = (() => {
    if (isCouponDisabled) {
      return cartHasDrop && !isDropWindowClosed
        ? 'Coupons cannot be combined with drop pre-order discount.'
        : 'Coupons are only valid on prepaid orders.';
    }
    const blocked = tileCoupons.filter((c) => couponBlockedForPayment(c, isCodPayment)).map((c) => c.code);
    if (!blocked.length) return '';
    return `${blocked.join(', ')} ${blocked.length > 1 ? 'are' : 'is'} valid on ${isCodPayment ? 'prepaid' : 'Cash on Delivery'} orders only.`;
  })();

  const selectCoupon = (def) => {
    if (isTileDisabled(def) || selectedCoupon === def.code) return;
    if (def.firstOrderOnly && !hasValidPhone && showCheckoutForm) {
      onToast(`Enter your phone number to apply ${def.code}.`);
    }
    setSelectedCoupon(def.code);
  };

  const applyTypedCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || couponChecking || isCouponDisabled) return;
    const known = tileCoupons.find((c) => c.code === code);
    if (known) {
      setCouponInput('');
      const problem = couponProblem(known);
      if (problem) onToast(problem);
      else selectCoupon(known);
      return;
    }
    setCouponChecking(true);
    const result = await lookupCoupon(code);
    setCouponChecking(false);
    if (!result.coupon) {
      onToast(result.error || 'This coupon code is not valid.');
      return;
    }
    setTypedCoupons((prev) => [...prev.filter((c) => c.code !== result.coupon.code), result.coupon]);
    setCouponInput('');
    const problem = couponProblem(result.coupon);
    if (problem) {
      onToast(problem);
      return;
    }
    if (result.coupon.firstOrderOnly && !hasValidPhone && showCheckoutForm) {
      onToast(`Enter your phone number to apply ${result.coupon.code}.`);
    }
    setSelectedCoupon(result.coupon.code);
  };

  const couponCodeBox = (
    <div className="coupon-code-box">
      <input
        type="text"
        className="coupon-code-input"
        value={couponInput}
        placeholder="Have a code?"
        maxLength={30}
        autoCapitalize="characters"
        autoComplete="off"
        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyTypedCoupon();
          }
        }}
      />
      <button
        type="button"
        className="coupon-code-btn"
        disabled={couponChecking || isCouponDisabled || !couponInput.trim()}
        onClick={applyTypedCoupon}
      >
        ADD CODE
      </button>
    </div>
  );

  const phoneHintNeeded = Boolean(selectedDef?.firstOrderOnly) && !hasValidPhone;

  const bagOffersSection = (
    <div className="bag-offers">
      <div className="bag-offers-label">Offers · one per order</div>
      {couponDisabledNote && (
        <p className="checkout-coupon-disabled-note">{couponDisabledNote}</p>
      )}
      {tileCoupons.length > 0 && (
        <div className="bag-offers-grid">
          {tileCoupons.map((def) => {
            const isSelected = selectedCoupon === def.code;
            const disabled = isTileDisabled(def);
            return (
              <div
                key={def.code}
                className={`bag-offer-tile ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                data-coupon={def.code}
                onClick={() => selectCoupon(def)}
              >
                <div className="bag-offer-head">
                  <span className="bag-offer-code">{def.code}</span>
                  <span className="bag-offer-badge">{couponBadge(def)}</span>
                </div>
                <span className="bag-offer-note">{couponTileNote(def)}</span>
                <button
                  type="button"
                  className="bag-offer-btn"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setSelectedCoupon(isSelected ? null : def.code);
                  }}
                >
                  {isSelected ? 'REMOVE' : 'APPLY'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {couponCodeBox}
      {phoneHintNeeded && (
        <div className="coupon-phone-hint">Applies at checkout once you enter your phone number</div>
      )}
    </div>
  );

  const offersSection = (
    <div className="checkout-coupon-section">
      <h4>Offers & Coupons</h4>
      <p style={{ fontSize: '11px', color: 'var(--grey-muted)', margin: '0 0 8px' }}>
        One offer per order. Tap APPLY to use it.
      </p>

      {couponDisabledNote && (
        <p className="checkout-coupon-disabled-note">{couponDisabledNote}</p>
      )}

      <div className={`checkout-coupon-options ${isCouponDisabled ? 'coupons-disabled' : ''}`}>
        {tileCoupons.map((def) => {
          const isSelected = selectedCoupon === def.code;
          const disabled = isTileDisabled(def);
          const needsPhone = Boolean(def.firstOrderOnly);
          const applied = needsPhone ? hasValidPhone : true;
          return (
            <div
              key={def.code}
              className={`checkout-coupon-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              data-coupon={def.code}
              onClick={() => selectCoupon(def)}
            >
              <div className="checkout-coupon-card-content">
                <div className="checkout-coupon-card-header">
                  <span className="checkout-coupon-code">{def.code}</span>
                  <span className="checkout-coupon-badge">{couponBadge(def)}</span>
                </div>
                <div className="checkout-coupon-card-subtitle">{couponSubtitle(def)}</div>
                {isSelected && needsPhone && !hasValidPhone && (
                  <div className="coupon-phone-hint">{showCheckoutForm ? 'Enter phone number to activate' : 'Applies at checkout once you enter your phone number'}</div>
                )}
              </div>
              <div className="checkout-coupon-card-action">
                {isSelected ? (
                  <div className="checkout-coupon-applied-wrap">
                    <button
                      type="button"
                      className={`checkout-coupon-action-btn ${applied ? 'applied' : ''}`}
                      disabled={applied}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!applied && showCheckoutForm) onToast(`Enter your phone number to apply ${def.code}.`);
                      }}
                    >
                      {applied ? 'APPLIED' : 'APPLY'}
                    </button>
                    <button
                      type="button"
                      className="checkout-coupon-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCoupon(null);
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="checkout-coupon-action-btn"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCoupon(def);
                    }}
                  >
                    APPLY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {couponCodeBox}
    </div>
  );

  return (
    <>
      <div
        className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      ></div>

      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">Your Bag</h2>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close bag">&times;</button>
        </div>

        <div className={`cart-body${showCheckoutForm ? '' : ' cart-body-bag'}`}>
          {showCheckoutForm ? (
            <form onSubmit={handleCheckoutSubmit} className="checkout-delivery-form">
              <CheckoutTags cart={cart} cartHasDrop={cartHasDrop} />

              <h3 className="checkout-delivery-title">Delivery</h3>

              <div className="checkout-ship-card">

              <div className="checkout-field">
                <label>Country/Region</label>
                <select name="country" value={customerInfo.country} onChange={handleInputChange} required>
                  <option value="India">India</option>
                </select>
              </div>

              <div className="checkout-two-col">
                <input type="text" name="firstName" value={customerInfo.firstName} onChange={handleInputChange} required placeholder="First name" />
                <input type="text" name="lastName" value={customerInfo.lastName} onChange={handleInputChange} required placeholder="Last name" />
              </div>
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                required
                className="checkout-input"
                placeholder="Email address"
              />

              <input type="text" name="address" value={customerInfo.address} onChange={handleInputChange} required className="checkout-input" placeholder="Address" />
              <input type="text" name="apartment" value={customerInfo.apartment} onChange={handleInputChange} className="checkout-input" placeholder="Apartment, suite, etc. (optional)" />

              <div className="checkout-three-col">
                <input type="text" name="city" value={customerInfo.city} onChange={handleInputChange} required placeholder="City" />
                <select name="state" value={customerInfo.state} onChange={handleInputChange} required>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="text"
                    name="pinCode"
                    value={customerInfo.pinCode}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN code"
                    style={{ width: '100%' }}
                  />
                  {isLoadingPincode && (
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#666', pointerEvents: 'none', background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>
                      Auto-filling...
                    </span>
                  )}
                </div>
              </div>

              <div className="checkout-field">
                <div className="checkout-phone-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    name="phoneCountryCode"
                    value={customerInfo.phoneCountryCode || '+91'}
                    onChange={handleInputChange}
                    required
                    aria-label="Phone country code"
                  >
                    {PHONE_COUNTRY_CODES.map((code) => (
                      <option key={code.value} value={code.value}>{code.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const matchedCode = PHONE_COUNTRY_CODES.find((code) => raw.startsWith(code.value));
                      if (matchedCode) {
                        setCustomerInfo(prev => ({
                          ...prev,
                          phoneCountryCode: matchedCode.value,
                          phone: normalizeLocalPhone(raw.slice(matchedCode.value.length), matchedCode.value).slice(0, 15)
                        }));
                        return;
                      }
                      const digits = normalizeLocalPhone(raw, customerInfo.phoneCountryCode || '+91').slice(0, 15);
                      setCustomerInfo(prev => ({ ...prev, phone: digits }));
                    }}
                    required
                    className="checkout-input"
                    inputMode="tel"
                    placeholder="Phone"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <p style={{ margin: '-4px 0 12px', fontSize: '12px', lineHeight: 1.5, color: '#666' }}>
                We save your contact details when you start checkout so we can help you complete your order.
              </p>

              <label className="checkout-save-row">
                <input type="checkbox" name="saveInfo" checked={customerInfo.saveInfo} onChange={handleInputChange} />
                <span>Save this information for next time</span>
              </label>

              </div>

              <div className="checkout-shipping-method">
                <h4>Shipping method</h4>
                <div>Enter your shipping address to view available shipping methods.</div>
              </div>

              <div className="checkout-payment-section">
                <h4>Payment Option</h4>
                <div className="checkout-payment-options">
                    <label className={`checkout-payment-card ${paymentMethod === 'payu' ? 'selected' : ''}`}>
                      <input type="radio" name="paymentMethod" value="payu" checked={paymentMethod === 'payu'} onChange={() => setPaymentMethod('payu')} />
                      <span style={{ width: '100%' }}>
                        <span className="checkout-payment-card-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span>Online Payment (PayU){!isPreorderActive && <span className="checkout-payment-offer-badge">15% OFF</span>}</span>
                          <span style={{ fontSize: '9px', background: 'var(--ink)', color: '#FFFFFF', padding: '2px 7px', borderRadius: '3px', fontWeight: '800', letterSpacing: '0.05em' }}>UPI • CARDS • NETBANKING</span>
                        </span>
                        <span className="checkout-payment-card-note">Pay securely via GPay, PhonePe, Paytm, Cards & Net Banking</span>
                      </span>
                    </label>
                    <label className={`checkout-payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                      <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                      <span className="checkout-payment-card-main">Cash on Delivery (COD){!isPreorderActive && <span className="checkout-payment-offer-badge">10% OFF · FIRST ORDER</span>}</span>
                    </label>
                    <label className={`checkout-payment-card ${paymentMethod === 'founder_delivery' ? 'selected' : ''} ${!founderDeliveryAvailable ? 'disabled' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="founder_delivery"
                        checked={paymentMethod === 'founder_delivery'}
                        disabled={!founderDeliveryAvailable}
                        onChange={() => {
                          if (!founderDeliveryAvailable) {
                            onToast('Delivery by founder is available only in Ahmedabad.');
                            return;
                          }
                          setPaymentMethod('founder_delivery');
                        }}
                      />
                      <span>
                        <span className="checkout-payment-card-main">Delivery by Founder</span>
                        <span className="checkout-payment-card-note">Ahmedabad only. Founder delivery charge +₹3,000. Pay online via PayU.</span>
                      </span>
                    </label>
                </div>
                {cartHasDrop && (
                  <div className="checkout-preorder-note">
                    <p>{isDropWindowClosed ? 'numbered drop — your piece number is assigned when you place the order.' : 'pre-order — full payment now.'}</p>
                  </div>
                )}
              </div>

              {offersSection}

              {cartHasDrop && (
                <div className="checkout-wall">
                  <label className="checkout-save-row">
                    <input type="checkbox" checked={wallOptIn} onChange={(e) => setWallOptIn(e.target.checked)} />
                    <span>show my name on the logcloth wall</span>
                  </label>
                  {wallOptIn && (
                    <div className="checkout-two-col">
                      <input
                        type="text"
                        value={wallDisplayName}
                        onChange={(e) => setWallDisplayName(e.target.value.slice(0, WALL_TEXT_MAX))}
                        maxLength={WALL_TEXT_MAX}
                        placeholder="Display name (optional)"
                        aria-label="Display name for the logcloth wall"
                      />
                      <input
                        type="text"
                        value={wallCity}
                        onChange={(e) => setWallCity(e.target.value.slice(0, WALL_TEXT_MAX))}
                        maxLength={WALL_TEXT_MAX}
                        placeholder="City (optional)"
                        aria-label="City for the logcloth wall"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="checkout-order-summary">
                <div className="cart-totals-row">
                  <span className="cart-totals-label">Subtotal</span>
                  <span className="cart-totals-val">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="cart-totals-row" style={{ color: 'var(--accent)', fontWeight: '700' }}>
                    <span className="cart-totals-label">{quote?.discountLabel || (cartHasDrop && !isDropWindowClosed ? 'Pre-order discount' : 'Discount')}</span>
                    <span className="cart-totals-val">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {baseShipping > 0 ? (
                  <div className="cart-totals-row">
                    <span className="cart-totals-label">Shipping</span>
                    <span className="cart-totals-val">{formatCurrency(baseShipping)}</span>
                  </div>
                ) : (
                  <div className="cart-totals-row">
                    <span className="cart-totals-label">Shipping</span>
                    <span className="cart-totals-val" style={{ color: 'var(--accent)', fontWeight: '800' }}>FREE</span>
                  </div>
                )}
                {founderDeliveryFee > 0 && (
                  <div className="cart-totals-row">
                    <span className="cart-totals-label">Founder delivery</span>
                    <span className="cart-totals-val">{formatCurrency(founderDeliveryFee)}</span>
                  </div>
                )}
                {totalPending ? (
                  <div className="cart-totals-row grand-total">
                    <span className="cart-totals-label">final price confirmed at payment.</span>
                  </div>
                ) : (
                  <div className="cart-totals-row grand-total">
                    <span className="cart-totals-label">Grand Total</span>
                    <span className="cart-totals-val">{formatCurrency(total)}</span>
                  </div>
                )}
              </div>

              <p className="checkout-policy-line">
                {cartHasDrop
                  ? (isDropWindowClosed
                    ? 'numbered drop: size exchange only within 7 days.'
                    : 'pre-order: size exchange only within 7 days.')
                  : '7-day returns. refunds minus ₹23 (goes to the LOG Fund). full refund if we got it wrong.'}
              </p>

              <div className="checkout-actions-bar">
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '12px', fontSize: '11px', border: '1px solid #111', color: '#111' }}
                  onClick={() => setShowCheckoutForm(false)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={isSubmittingOrder || !quoteMatchesCart}
                  style={{ flex: 1, padding: '12px', fontSize: '11px', opacity: (isSubmittingOrder || !quoteMatchesCart) ? 0.6 : 1 }}
                >
                  {isSubmittingOrder
                    ? 'Placing Order...'
                    : !quoteMatchesCart
                      ? 'Calculating...'
                      : 'Place Order'}
                </button>
              </div>
              {quoteError && !quoteMatchesCart && (
                <p style={{ color: '#c51616', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
                  Could not calculate order totals.{' '}
                  <button
                    type="button"
                    onClick={() => setQuoteRetry((c) => c + 1)}
                    style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: '700' }}
                  >
                    Retry
                  </button>
                </p>
              )}
              </div>
              <p className="checkout-contact">
                Questions? <a href="mailto:contact@logcloth.com">contact@logcloth.com</a>
              </p>
            </form>
          ) : cart.length === 0 ? (
            <div className="cart-empty-msg">
              <p style={{ fontSize: '15px', marginBottom: '15px' }}>Your bag is empty</p>
              <button
                className="btn btn-accent"
                style={{ padding: '10px 20px', fontSize: '11px' }}
                onClick={onClose}
              >
                Shop the collection
              </button>
            </div>
          ) : (
            <>
            {cart.map((item, index) => {
              const line = quoteMatchesCart ? quote.lines[index] : null;
              const isDropItem = line ? line.isPreorder : dropIds.has(String(item.id));
              const lineDiscount = line ? Number(line.preorderDiscount || 0) : 0;
              const sizeKey = item.selectedSize1 || item.selectedSize;
              const freshProduct = dropProducts.get(String(item.id)) || item;
              const sizeStock = freshProduct.sizes && typeof freshProduct.sizes === 'object' && !Array.isArray(freshProduct.sizes)
                ? (freshProduct.sizes[sizeKey] !== undefined ? Number(freshProduct.sizes[sizeKey]) : Infinity)
                : (freshProduct.stock !== undefined ? Number(freshProduct.stock) : Infinity);
              const isAtMaxStock = !item.isBogo && item.quantity >= sizeStock;
              return (
              <div className="cart-item" key={item.cartItemId}>
                <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3', borderRadius: '4px', overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <img
                      src={mediaUrl(item.imageUrl)}
                      srcSet={mediaSrcSet(item.imageUrl)}
                      sizes="100px"
                      onError={srcSetFallback}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={`product-graphic ${item.graphicClass}`}>
                      <div className={item.printClass}>{item.printText}</div>
                    </div>
                  )}
                </div>
                <div className="cart-item-details">
                  <div>
                    <div className="cart-item-name">{item.name} ({item.selectedSize})</div>
                    {isDropItem && lineDiscount > 0 ? (
                      <>
                        <div className="cart-item-price">
                          <span className="preorder-price-old">₹{line.price}</span>₹{line.price - lineDiscount}
                        </div>
                        <div className="preorder-note">pre-order · ₹{lineDiscount} off per piece</div>
                      </>
                    ) : (
                      <>
                        <div className="cart-item-price">₹{item.price}</div>
                        {isDropItem && <div className="preorder-note">{getItemPreorderPhase(item) === 'after' ? 'numbered drop' : 'pre-order'}</div>}
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="cart-item-qty">
                      <button className="qty-btn minus" onClick={() => onQtyChange(item.cartItemId, -1)} aria-label="Decrease quantity">-</button>
                      <span className="qty-num">{item.quantity}</span>
                      <button 
                        className="qty-btn plus" 
                        aria-label="Increase quantity"
                        onClick={() => {
                          if (isAtMaxStock) {
                            onToast(`Only ${sizeStock} left in stock for size ${sizeKey || 'selected'}`);
                            return;
                          }
                          onQtyChange(item.cartItemId, 1);
                        }}
                        disabled={isAtMaxStock}
                        style={isAtMaxStock ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                      >+</button>
                    </div>
                    <button className="cart-item-remove" onClick={() => onRemove(item.cartItemId)}>Remove</button>
                  </div>
                </div>
              </div>
              );
            })}
            {bagOffersSection}
            </>
          )}
        </div>

        {!showCheckoutForm && cart.length > 0 && (
          <div className="cart-footer">
            {discountAmount > 0 && (
              <>
                <div className="cart-totals-row">
                  <span className="cart-totals-label">Subtotal</span>
                  <span className="cart-totals-val">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="cart-totals-row" style={{ color: 'var(--accent)', fontWeight: '700' }}>
                  <span className="cart-totals-label">{quote?.discountLabel || (cartHasDrop && !isDropWindowClosed ? 'Pre-order discount' : 'Discount')}</span>
                  <span className="cart-totals-val">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
            {shipping > 0 && (
              <div className="cart-totals-row">
                <span className="cart-totals-label">Shipping</span>
                <span className="cart-totals-val">₹{shipping}</span>
              </div>
            )}
            <div className="cart-footer-note">
              {shipping > 0 ? '' : 'Free shipping · '}₹{donation} goes to the LOG Fund
            </div>
            {totalPending ? (
              <div className="cart-totals-row grand-total">
                <span className="cart-totals-label">final price confirmed at payment.</span>
              </div>
            ) : (
              <div className="cart-totals-row grand-total">
                <span className="cart-totals-label">Grand Total</span>
                <span className="cart-totals-val">₹{total.toLocaleString('en-IN')}</span>
              </div>
            )}
            <button
              className="checkout-btn"
              onClick={() => {
                setShowCheckoutForm(true);
                const items = cart.map((item) => ({
                  item_id: String(item.id || ''),
                  item_name: item.name,
                  price: Number(item.price || 0),
                  quantity: Number(item.quantity || 1),
                  item_variant: String(item.selectedSize || item.selectedSize1 || '')
                }));
                if (canTrackGA4() && window.dataLayer) {
                  window.dataLayer.push({
                    event: 'begin_checkout',
                    currency: 'INR',
                    value: Number(total || 0),
                    items
                  });
                }
                trackGA4Event('begin_checkout', {
                  currency: 'INR',
                  value: Number(total || 0),
                  items
                });
                try {
                  const contentIds = cart.map((item) => String(item.id || '')).filter(Boolean);
                  const numItems = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
                  trackMetaEvent('InitiateCheckout', {
                    content_ids: contentIds,
                    num_items: numItems,
                    value: Number(total || 0),
                    currency: 'INR'
                  });
                } catch {}
              }}
            >
              {totalPending ? 'Proceed to Checkout' : `Proceed to Checkout · ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        )}
      </div>

      {showSuccessModal && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(15, 15, 17, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '100000',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FAF9F6',
              color: '#0F0F11',
              padding: '40px 30px',
              borderRadius: '8px',
              textAlign: 'center',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <div
              style={{
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                padding: '30px 20px',
                borderRadius: '6px',
                color: '#2e7d32',
                marginBottom: '30px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', color: '#2e7d32' }}>
                Order placed successfully.
              </h2>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#388e3c', margin: 0 }}>
                {orderEmailSent
                  ? 'Order details are received on your mail.'
                  : 'Your order is saved. Our team will contact you if the confirmation email is delayed.'}
              </p>
            </div>

            {lastOrderSummary && (
              <div className="order-success-summary">
                <div className="order-success-summary-head">
                  <div>
                    <span>Order ID</span>
                    <strong>{lastOrderSummary.id}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{lastOrderSummary.status}</strong>
                  </div>
                </div>

                <div className="order-success-section">
                  <h3>Customer</h3>
                  <p>{lastOrderSummary.customerInfo?.name || `${lastOrderSummary.customerInfo?.firstName || ''} ${lastOrderSummary.customerInfo?.lastName || ''}`.trim()}</p>
                  <p>{lastOrderSummary.customerInfo?.phone}</p>
                  <p>{lastOrderSummary.customerInfo?.address}</p>
                </div>

                <div className="order-success-section">
                  <h3>Items</h3>
                  {lastOrderSummary.items?.map((item, index) => (
                    <div className="order-success-item" key={`${item.id || item.name}-${index}`}>
                      <span>{item.name} {item.selectedSize ? `(${item.selectedSize})` : ''} x {item.quantity}</span>
                      <strong>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-success-section">
                  <h3>Payment & Delivery</h3>
                  <div className="order-success-line">
                    <span>Payment</span>
                    <strong>
                      {lastOrderSummary.paymentId === 'FOUNDER_DELIVERY'
                        ? 'Delivery by Founder'
                        : 'Cash on Delivery'}
                    </strong>
                  </div>
                  <div className="order-success-line">
                    <span>Delivery</span>
                    <strong>{lastOrderSummary.customerInfo?.deliveryMethod || 'Standard shipping'}</strong>
                  </div>
                </div>

                <div className="order-success-totals">
                  <div className="order-success-line">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(lastOrderSummary.subtotal)}</strong>
                  </div>
                  {Number(lastOrderSummary.discount || 0) > 0 && (
                    <div className="order-success-line">
                      <span>Discount</span>
                      <strong>-{formatCurrency(lastOrderSummary.discount)}</strong>
                    </div>
                  )}
                  <div className="order-success-line">
                    <span>Shipping</span>
                    <strong>{formatCurrency(lastOrderSummary.shipping)}</strong>
                  </div>
                  <div className="order-success-line">
                    <span>Donation by LOG</span>
                    <strong>{formatCurrency(lastOrderSummary.donation || lastDonation)}</strong>
                  </div>
                  <div className="order-success-line order-success-grand">
                    <span>Grand Total</span>
                    <strong>{formatCurrency(lastOrderSummary.total)}</strong>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-accent"
              style={{ width: '100%', border: 'none', background: 'var(--ink)', color: 'white', padding: '14px', cursor: 'pointer', fontWeight: '800', textTransform: 'uppercase' }}
              onClick={() => {
                setShowSuccessModal(false);
                setLastOrderSummary(null);
                setEmailHtml('');
                setOrderEmailSent(false);
                onClose();
              }}
            >
              Return to Shop
            </button>
          </div>
        </div>
      )}
    </>
  );
}
