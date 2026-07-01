import React, { useState, useEffect } from 'react';
import { mediaUrl } from '../lib/urls';
import { apiJson } from '../lib/apiClient';

const CHECKOUT_DRAFT_KEY = 'log_checkout_customer_draft';
const CHECKOUT_ORDER_KEY = 'log_checkout_client_order_id';

function getSavedCustomerInfo(defaultInfo) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || 'null');
    return saved && typeof saved === 'object' ? { ...defaultInfo, ...saved } : defaultInfo;
  } catch {
    return defaultInfo;
  }
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
  const [paymentMethod, setPaymentMethod] = useState('payu');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [lastDonation, setLastDonation] = useState(0);
  const [emailHtml, setEmailHtml] = useState('');
  const [orderEmailSent, setOrderEmailSent] = useState(false);

  // Scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(customerInfo));
  }, [customerInfo]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = 0;
  const netSubtotal = subtotal;
  const shipping = netSubtotal > 799 ? 0 : (cart.length > 0 ? 80 : 0);
  const total = netSubtotal + shipping;

  // Donation calculation (₹23 per product quantity)
  const totalItemsQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const donation = totalItemsQty * 23;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
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

    return {
      ...customerInfo,
      name: fullName,
      address: fullAddress,
      shippingAddressLine1: customerInfo.address,
      shippingAddressLine2: customerInfo.apartment
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
    if (!/^[6-9]\d{9}$/.test(String(orderCustomerInfo.phone || '').replace(/\D/g, ''))) {
      onToast('Enter a valid 10 digit Indian phone number.');
      return;
    }
    if (!/^\d{6}$/.test(String(orderCustomerInfo.pinCode || '').trim())) {
      onToast('Enter a valid 6 digit PIN code.');
      return;
    }

    const clientOrderId = getClientOrderId();
    const orderItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize
    }));
    const saveOrder = (paymentId) => apiJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: orderItems,
        customerInfo: orderCustomerInfo,
        paymentId,
        clientOrderId,
        couponCode: null,
        discountAmount
      })
    });
    const redirectToPayu = async () => {
      const data = await apiJson('/api/payments/payu/initiate', {
        method: 'POST',
        body: JSON.stringify({
          amount: total,
          items: orderItems,
          customerInfo: orderCustomerInfo,
          clientOrderId,
          couponCode: null,
          discountAmount
        })
      });
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.style.display = 'none';
      Object.entries(data.fields || {}).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value ?? '';
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    };

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

      if (paymentMethod === 'payu') {
        await redirectToPayu();
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
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
                <input type="text" name="pinCode" value={customerInfo.pinCode} onChange={handleInputChange} required inputMode="numeric" placeholder="PIN code" />
              </div>

              <input type="tel" name="phone" value={customerInfo.phone} onChange={handleInputChange} required className="checkout-input" placeholder="Phone" />

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
                  <label className={`checkout-payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    Cash on Delivery (COD)
                  </label>
                  <label className={`checkout-payment-card ${paymentMethod === 'payu' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentMethod" value="payu" checked={paymentMethod === 'payu'} onChange={() => setPaymentMethod('payu')} />
                    Pay by PayU
                  </label>
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

            <button 
              className="btn btn-accent" 
              style={{ width: '100%', border: 'none', background: 'var(--ink)', color: 'white', padding: '14px', cursor: 'pointer', fontWeight: '800', textTransform: 'uppercase' }}
              onClick={() => {
                setShowSuccessModal(false);
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
