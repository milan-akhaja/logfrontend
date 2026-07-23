import React, { useState, useEffect } from 'react';
import { apiUrl, mediaUrl } from '../lib/urls';
import { apiJson } from '../lib/apiClient';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock';

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
  { value: '+91', label: 'India +91', country: 'India', digits: 10 },
  { value: '+1', label: 'USA/Canada +1', country: 'United States', digits: 10 },
  { value: '+44', label: 'UK +44', country: 'United Kingdom' },
  { value: '+971', label: 'UAE +971', country: 'United Arab Emirates' },
  { value: '+61', label: 'Australia +61', country: 'Australia' },
  { value: '+65', label: 'Singapore +65', country: 'Singapore' },
  { value: '+49', label: 'Germany +49', country: 'Germany' },
  { value: '+33', label: 'France +33', country: 'France' }
];

function trackGoAffProOrder(orderId, totalAmount, email = '') {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.gproTrackOrder === 'function') {
        window.gproTrackOrder(orderId, totalAmount);
      } else if (typeof window.goaffproTrackOrder === 'function') {
        window.goaffproTrackOrder(orderId, totalAmount);
      } else if (window.gpro && typeof window.gpro.trackOrder === 'function') {
        window.gpro.trackOrder({
          order_id: orderId,
          total: totalAmount,
          currency: 'INR',
          email: email
        });
      }
    }
  } catch (err) {
    console.warn('GoAffPro tracking warning:', err);
  }
}


function getSavedCustomerInfo(defaultInfo) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaultInfo;
    const merged = { ...defaultInfo, ...saved };
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
    dob: '',
    saveInfo: false
  };
  const [customerInfo, setCustomerInfo] = useState(() => getSavedCustomerInfo(defaultCustomerInfo));
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [lastDonation, setLastDonation] = useState(0);
  const [lastOrderSummary, setLastOrderSummary] = useState(null);
  const [emailHtml, setEmailHtml] = useState('');
  const [orderEmailSent, setOrderEmailSent] = useState(false);

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

  const subtotal = cart.reduce((sum, item) => {
    if (item.isBogo) {
      return sum + (item.price * Math.ceil(item.quantity / 2));
    }
    return sum + (item.price * item.quantity);
  }, 0);
  
  const discountAmount = 0;
  const netSubtotal = subtotal;
  const baseShipping = netSubtotal > 799 ? 0 : (cart.length > 0 ? 80 : 0);
  const founderDeliveryAvailable = isAhmedabadCity(customerInfo.city);
  const isFounderDelivery = paymentMethod === 'founder_delivery';
  const founderDeliveryFee = isFounderDelivery ? FOUNDER_DELIVERY_FEE : 0;
  const shipping = baseShipping + founderDeliveryFee;
  const total = netSubtotal + shipping;

  // Donation calculation (₹23 per product quantity)
  const totalItemsQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const donation = totalItemsQty * 23;

  useEffect(() => {
    if (paymentMethod === 'founder_delivery' && !founderDeliveryAvailable) {
      setPaymentMethod('cod');
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
    if (cart.length === 0 || isSubmittingOrder) return;

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
        couponCode: null,
        discountAmount,
        deliveryOption: orderCustomerInfo.deliveryOption
      })
    });
    try {
      setIsSubmittingOrder(true);
      if (paymentMethod === 'cod') {
        const data = await saveOrder('COD');
        trackGoAffProOrder(data.order?.id || clientOrderId, total, orderCustomerInfo.email);
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
        setIsSubmittingOrder(false);
        return;
      }

      if (paymentMethod === 'payu' || paymentMethod === 'founder_delivery') {
        const data = await apiJson('/api/payments/payu/initiate', {
          method: 'POST',
          body: JSON.stringify({
            items: orderItems,
            customerInfo: orderCustomerInfo,
            amount: total,
            clientOrderId,
            couponCode: null,
            discountAmount,
            deliveryOption: orderCustomerInfo.deliveryOption
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
      onToast(err.message || 'Network error during checkout.');
      setIsSubmittingOrder(false);
    }
  };

  return (
    <>
      <div 
        className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      ></div>
      
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">Your Bag</h2>
          <button className="cart-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-body">
          {showCheckoutForm ? (
            <form onSubmit={handleCheckoutSubmit} className="checkout-delivery-form">
              <h3 className="checkout-delivery-title">Delivery</h3>

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

              <input type="email" name="email" value={customerInfo.email} onChange={handleInputChange} required className="checkout-input" placeholder="Email" />
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

              <div className="checkout-phone-row">
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
                />
              </div>

              <div className="checkout-field">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={customerInfo.dob} onChange={handleInputChange} required />
              </div>

              <label className="checkout-save-row">
                <input type="checkbox" name="saveInfo" checked={customerInfo.saveInfo} onChange={handleInputChange} />
                <span>Save this information for next time</span>
              </label>

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
                        <span>Online Payment (PayU)</span>
                        <span style={{ fontSize: '9px', background: 'var(--ink)', color: '#FFFFFF', padding: '2px 7px', borderRadius: '3px', fontWeight: '800', letterSpacing: '0.05em' }}>UPI • CARDS • NETBANKING</span>
                      </span>
                      <span className="checkout-payment-card-note">Pay securely via GPay, PhonePe, Paytm, Cards & Net Banking</span>
                    </span>
                  </label>
                  <label className={`checkout-payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <span className="checkout-payment-card-main">Cash on Delivery (COD)</span>
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
              </div>

              <div className="checkout-order-summary">
                <div className="cart-totals-row">
                  <span className="cart-totals-label">Subtotal</span>
                  <span className="cart-totals-val">{formatCurrency(subtotal)}</span>
                </div>
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
                <div className="cart-totals-row grand-total">
                  <span className="cart-totals-label">Grand Total</span>
                  <span className="cart-totals-val">{formatCurrency(total)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
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
                  disabled={isSubmittingOrder}
                  style={{ flex: 1, padding: '12px', fontSize: '11px' }}
                >
                  {isSubmittingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
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
            cart.map(item => (
              <div className="cart-item" key={item.cartItemId}>
                <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3', borderRadius: '4px', overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <img 
                      src={mediaUrl(item.imageUrl)} 
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
                    <div className="cart-item-price">₹{item.price}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="cart-item-qty">
                      <button className="qty-btn minus" onClick={() => onQtyChange(item.cartItemId, -1)}>-</button>
                      <span className="qty-num">{item.quantity}</span>
                      <button className="qty-btn plus" onClick={() => onQtyChange(item.cartItemId, 1)}>+</button>
                    </div>
                    <button className="cart-item-remove" onClick={() => onRemove(item.cartItemId)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!showCheckoutForm && cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals-row">
              <span className="cart-totals-label">Subtotal</span>
              <span className="cart-totals-val">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="cart-totals-row" style={{ color: 'var(--accent)', fontWeight: '700' }}>
                <span className="cart-totals-label">Discount</span>
                <span className="cart-totals-val">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {shipping > 0 ? (
              <div className="cart-totals-row">
                <span className="cart-totals-label">Shipping</span>
                <span className="cart-totals-val">₹{shipping}</span>
              </div>
            ) : (
              <div className="cart-totals-row">
                <span className="cart-totals-label">Shipping</span>
                <span className="cart-totals-val" style={{ color: 'var(--accent)', fontWeight: '800' }}>FREE</span>
              </div>
            )}
            <div className="cart-donation-banner">
              ₹{donation} will be donated to charity from this order (₹23 per product)
            </div>
            <div className="cart-totals-row grand-total">
              <span className="cart-totals-label">Grand Total</span>
              <span className="cart-totals-val">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button 
              className="checkout-btn" 
              onClick={() => setShowCheckoutForm(true)}
            >
              Proceed to Checkout
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
                    <strong>{lastOrderSummary.paymentId === 'FOUNDER_DELIVERY' ? 'Delivery by Founder' : 'Cash on Delivery'}</strong>
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
                    <span>Donation</span>
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
