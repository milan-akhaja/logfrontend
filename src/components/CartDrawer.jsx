import React, { useState, useEffect } from 'react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onQtyChange, 
  onRemove, 
  onClearCart,
  onToast 
}) {
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('online'); // online or cod

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [lastDonation, setLastDonation] = useState(0);
  const [emailHtml, setEmailHtml] = useState('');

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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount based on subtotal
  useEffect(() => {
    if (appliedCoupon === 'LOG10') {
      setDiscountAmount(Math.round(subtotal * 0.10));
    } else if (appliedCoupon === 'LOG20') {
      setDiscountAmount(Math.round(subtotal * 0.20));
    } else if (appliedCoupon === 'SPYSTUDIO') {
      setDiscountAmount(Math.round(subtotal * 0.15));
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, appliedCoupon]);

  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const shipping = netSubtotal > 799 ? 0 : (cart.length > 0 ? 80 : 0);
  const total = netSubtotal + shipping;

  // Donation calculation (₹23 per product quantity)
  const totalItemsQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const donation = totalItemsQty * 23;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'LOG10' || code === 'LOG20' || code === 'SPYSTUDIO') {
      setAppliedCoupon(code);
      setCouponError('');
      onToast(`Coupon ${code} applied successfully!`);
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponInput('');
    setDiscountAmount(0);
    setCouponError('');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const currentDonation = donation;
    setLastDonation(currentDonation);

    try {
      if (paymentMethod === 'cod') {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              selectedSize: item.selectedSize
            })),
            customerInfo,
            paymentId: 'COD',
            couponCode: appliedCoupon || null,
            discountAmount: discountAmount
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEmailHtml(data.emailHtml || '');
          onClearCart();
          setShowCheckoutForm(false);
          setShowSuccessModal(true);
          handleRemoveCoupon();
        } else {
          onToast('Failed to place Cash on Delivery order.');
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        onToast('Razorpay SDK failed to load. Check your internet.');
        return;
      }

      const keyRes = await fetch('/api/payments/key');
      const { key } = await keyRes.json();

      const orderRes = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total * 100,
          currency: 'INR'
        })
      });

      const razorpayOrder = await orderRes.json();

      if (!orderRes.ok) {
        onToast(razorpayOrder.error || 'Failed to initiate checkout.');
        return;
      }

      // Fallback sandbox payment
      if (razorpayOrder.is_mock) {
        onToast('API keys default: Simulating sandbox order...');
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              selectedSize: item.selectedSize
            })),
            customerInfo,
            paymentId: 'mock_payment_' + Date.now(),
            couponCode: appliedCoupon || null,
            discountAmount: discountAmount
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEmailHtml(data.emailHtml || '');
          onClearCart();
          setShowCheckoutForm(false);
          setShowSuccessModal(true);
          handleRemoveCoupon();
        } else {
          onToast('Failed to place order record.');
        }
        return;
      }

      const options = {
        key: key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'LOG Clothing',
        description: 'Streetwear purchase',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verification = await verifyRes.json();

            if (verifyRes.ok && verification.verified) {
              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    selectedSize: item.selectedSize
                  })),
                  customerInfo,
                  paymentId: response.razorpay_payment_id,
                  couponCode: appliedCoupon || null,
                  discountAmount: discountAmount
                })
              });

              if (res.ok) {
                const data = await res.json();
                setEmailHtml(data.emailHtml || '');
                onClearCart();
                setShowCheckoutForm(false);
                setShowSuccessModal(true);
                handleRemoveCoupon();
              } else {
                onToast('Payment verified, but failed to log order record.');
              }
            } else {
              onToast('Payment verification failed.');
            }
          } catch (err) {
            console.error(err);
            onToast('Error verifying transaction.');
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: '#E53E3E'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      onToast('Network error during checkout.');
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
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>Shipping Details</h3>
              
              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label" style={{ fontSize: '11px' }}>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={customerInfo.name} 
                  onChange={handleInputChange} 
                  required 
                  className="admin-input" 
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label" style={{ fontSize: '11px' }}>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={customerInfo.email} 
                  onChange={handleInputChange} 
                  required 
                  className="admin-input" 
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label" style={{ fontSize: '11px' }}>Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={customerInfo.phone} 
                  onChange={handleInputChange} 
                  required 
                  className="admin-input" 
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label" style={{ fontSize: '11px' }}>Shipping Address</label>
                <textarea 
                  name="address" 
                  value={customerInfo.address} 
                  onChange={handleInputChange} 
                  required 
                  className="admin-textarea" 
                  rows="3"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '15px' }}>
                <label className="admin-label" style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>Payment Option</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '12px', 
                      border: paymentMethod === 'cod' ? '2.5px solid var(--ink)' : '1px solid var(--border)', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      background: paymentMethod === 'cod' ? 'rgba(15, 15, 17, 0.03)' : '#fff',
                      fontWeight: '800',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                      style={{ accentColor: 'var(--ink)', width: '16px', height: '16px' }}
                    />
                    Cash on Delivery (COD)
                  </label>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '12px', 
                      border: paymentMethod === 'online' ? '2.5px solid var(--ink)' : '1px solid var(--border)', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      background: paymentMethod === 'online' ? 'rgba(15, 15, 17, 0.03)' : '#fff',
                      fontWeight: '800',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="online" 
                      checked={paymentMethod === 'online'} 
                      onChange={() => setPaymentMethod('online')}
                      style={{ accentColor: 'var(--ink)', width: '16px', height: '16px' }}
                    />
                    Pay by Razorpay
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
                  style={{ flex: 1, padding: '12px', fontSize: '11px' }}
                >
                  Place Order
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
                      src={item.imageUrl} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className={`product-graphic ${item.graphicClass}`}>
                      <div className={item.printClass} dangerouslySetInnerHTML={{ __html: item.printText }}></div>
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
            {/* Coupon Section */}
            <div className="coupon-container" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '15px' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F1EF', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800' }}>COUPON APPLIED: {appliedCoupon} (-₹{discountAmount})</span>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>&times;</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="ENTER COUPON CODE" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '11px', border: '1px solid var(--border)', textTransform: 'uppercase', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button type="submit" style={{ padding: '8px 16px', background: 'var(--ink)', color: 'white', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>APPLY</button>
                </form>
              )}
              {couponError && <p style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>{couponError}</p>}
            </div>

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
                Order details are received on your mail.
              </p>
            </div>

            <button 
              className="btn btn-accent" 
              style={{ width: '100%', border: 'none', background: 'var(--ink)', color: 'white', padding: '14px', cursor: 'pointer', fontWeight: '800', textTransform: 'uppercase' }}
              onClick={() => {
                setShowSuccessModal(false);
                setEmailHtml('');
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
