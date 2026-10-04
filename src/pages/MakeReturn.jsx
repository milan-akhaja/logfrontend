import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MakeReturn() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [action, setAction] = useState('Exchange'); // 'Exchange' or 'Return'
  const [exchangeSize, setExchangeSize] = useState('M');
  const [customSize, setCustomSize] = useState('');
  const [reason, setReason] = useState('Size too small');
  const [notes, setNotes] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedAction, setSubmittedAction] = useState('Exchange');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const exchangeReasons = [
    'Size too small',
    'Size too large',
    'Want a different fit',
    'Defective / damaged product',
    'Incorrect item received',
    'Other'
  ];

  const returnReasons = [
    'Defective / damaged product',
    'Incorrect item received',
    'Quality not as expected',
    'Changed my mind',
    'Other'
  ];

  const handleActionChange = (newAction) => {
    setAction(newAction);
    if (newAction === 'Exchange') {
      setReason('Size too small');
    } else {
      setReason('Defective / damaged product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    const finalExchangeSize = action === 'Exchange' ? (customSize.trim() || exchangeSize) : '';
    const formattedAction = action === 'Exchange' ? 'Exchange (Free Pan-India)' : 'Return / Refund';

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: orderId.trim(), 
          email: email.trim(), 
          action: formattedAction,
          exchangeSize: finalExchangeSize,
          reason, 
          notes 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEmailSent(Boolean(data.emailSent));
        setSubmittedAction(action);
        setSubmitted(true);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Wrong Order ID or Email. Please check and try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to submit request. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="make-return-container">
      {/* Page Header */}
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>
          Return & Exchange Portal
        </h1>
        <p style={{ color: 'var(--grey-muted)', fontSize: '15px', lineHeight: '1.6', maxWidth: '720px' }}>
          Need a different size or wish to return? We've made it effortless. <strong>Free size exchanges are available Pan-India</strong> with complimentary doorstep reverse pickup.
        </p>
      </div>

      {submitted ? (
        <div style={{ background: '#f0fff4', border: '2px solid #22c55e', padding: '45px 30px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', color: '#14532d' }}>
            {submittedAction === 'Exchange' ? 'Exchange Request Received!' : 'Return Request Received!'}
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#166534', maxWidth: '540px', margin: '0 auto 25px auto' }}>
            {emailSent
              ? `A confirmation email has been sent to ${email}. Our support team has also been notified and will arrange doorstep pickup shortly.`
              : `Your request has been registered. Our support team will contact you at ${email} shortly to coordinate pickup.`}
          </p>

          <div style={{ background: 'white', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', maxWidth: '520px', margin: '0 auto', textAlign: 'left', fontSize: '14px', lineHeight: '1.7', color: '#1f2937' }}>
            <strong style={{ color: '#111827', display: 'block', marginBottom: '8px' }}>What Happens Next:</strong>
            <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Keep the garment unworn, unwashed, and packed with original tags intact.</li>
              <li>Our courier partner will arrive at your address for doorstep reverse pickup.</li>
              {submittedAction === 'Exchange' ? (
                <li>Your replacement size will be dispatched immediately after inspection. <strong>No delivery or return fees!</strong></li>
              ) : (
                <li>Refund will be credited to your original payment method or bank within 5–7 days of product inspection.</li>
              )}
            </ul>
          </div>

          <button 
            type="button"
            onClick={() => {
              setSubmitted(false);
              setOrderId('');
              setNotes('');
              setCustomSize('');
            }}
            style={{ 
              marginTop: '30px', 
              background: 'var(--ink)', 
              color: 'white', 
              border: 'none', 
              padding: '14px 28px', 
              fontWeight: '800', 
              borderRadius: '4px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontSize: '13px',
              letterSpacing: '0.05em'
            }}
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <div className="make-return-grid">
          
          {/* Form Side */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {errorMsg && (
              <div style={{ border: '2px solid #ef4444', padding: '14px 18px', borderRadius: '6px', color: '#b91c1c', background: '#fef2f2', fontSize: '14px', fontWeight: '700' }}>
                {errorMsg}
              </div>
            )}

            {/* Step 1: Choose Action (Exchange vs Return) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--grey-muted)', letterSpacing: '0.08em' }}>
                Select Request Type *
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Exchange Option */}
                <div 
                  onClick={() => handleActionChange('Exchange')}
                  style={{
                    border: action === 'Exchange' ? '2px solid var(--ink)' : '1px solid var(--border-color)',
                    background: action === 'Exchange' ? '#FAF9F6' : 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: action === 'Exchange' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: 'var(--ink)', textTransform: 'uppercase' }}>
                      Size Exchange
                    </span>
                    <span style={{ background: '#111113', color: 'white', fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '12px', letterSpacing: '0.05em' }}>
                      FREE PAN-INDIA
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--grey-muted)', lineHeight: '1.4' }}>
                    100% free doorstep pickup & replacement delivery across India.
                  </p>
                </div>

                {/* Return Option */}
                <div 
                  onClick={() => handleActionChange('Return')}
                  style={{
                    border: action === 'Return' ? '2px solid var(--ink)' : '1px solid var(--border-color)',
                    background: action === 'Return' ? '#FAF9F6' : 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: action === 'Return' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: 'var(--ink)', textTransform: 'uppercase' }}>
                      Return & Refund
                    </span>
                    <span style={{ background: '#E5E7EB', color: '#374151', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px' }}>
                      7-DAY WINDOW
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--grey-muted)', lineHeight: '1.4' }}>
                    Refund to source/bank. ₹23 charity donation is non-refundable.
                  </p>
                </div>
              </div>
            </div>

            {/* Free Exchange Banner if Exchange is Selected */}
            {action === 'Exchange' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '14px 16px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.5', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🚚</span>
                <div>
                  <strong>Free Exchanges Available Pan-India:</strong> We provide 100% free doorstep pickup and new size replacement across all pin codes in India with zero additional courier fees.
                </div>
              </div>
            )}

            {/* Order ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>
                Order ID *
              </label>
              <input 
                type="text" 
                placeholder="e.g. LOG-2301"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '2px solid var(--ink)', borderRadius: '4px', background: 'white', fontWeight: '700', fontSize: '14px' }}
              />
            </div>

            {/* Email Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>
                Email Address (Used during checkout) *
              </label>
              <input 
                type="email" 
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white', fontSize: '14px' }}
              />
            </div>

            {/* If Exchange: Select Replacement Size */}
            {action === 'Exchange' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>
                  Preferred Replacement Size *
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => { setExchangeSize(sz); setCustomSize(''); }}
                      style={{
                        padding: '10px 18px',
                        border: exchangeSize === sz && !customSize ? '2px solid var(--ink)' : '1px solid var(--border-color)',
                        background: exchangeSize === sz && !customSize ? 'var(--ink)' : 'white',
                        color: exchangeSize === sz && !customSize ? 'white' : 'var(--ink)',
                        fontWeight: '800',
                        fontSize: '13px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>
                Reason for {action === 'Exchange' ? 'Exchange' : 'Return'} *
              </label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ padding: '12px 14px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white', fontSize: '14px' }}
              >
                {(action === 'Exchange' ? exchangeReasons : returnReasons).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Additional Comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>
                Additional Notes / Instructions
              </label>
              <textarea 
                placeholder={action === 'Exchange' ? "Any specific fit preferences or details..." : "Describe reason or feedback..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                style={{ padding: '12px 14px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white', fontFamily: 'inherit', fontSize: '14px' }}
              />
            </div>

            {/* Return Charity Notice */}
            {action === 'Return' && (
              <div style={{ background: '#FFFDF9', border: '1px solid #FFE8B8', padding: '14px 16px', borderRadius: '4px', fontSize: '13px', lineHeight: '1.5', color: '#825c00' }}>
                ℹ️ <strong>Charity Donation Notice:</strong> ₹23 donated to charity on your behalf is non-refundable and will be deducted from the final refund amount. Full refund is provided if the fault is ours (defective piece or wrong item sent).
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'var(--ink)', 
                color: 'white', 
                border: 'none', 
                padding: '16px 28px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                letterSpacing: '0.06em',
                transition: 'opacity 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading 
                ? 'Verifying & Submitting...' 
                : action === 'Exchange' 
                  ? 'Request Free Exchange' 
                  : 'Submit Return Request'}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--grey-muted)', textAlign: 'center', margin: 0 }}>
              Both you and the LOG support team will receive an email confirmation immediately upon submission.
            </p>
          </form>

          {/* Policy Overview Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: '8px', background: '#FAF9F6' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '18px', letterSpacing: '0.05em' }}>
                Key Highlights
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.6' }}>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>✨ Free Pan-India Exchanges:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>
                    We provide complimentary size exchanges across India with doorstep reverse pickup and zero courier fees.
                  </p>
                </div>

                <div>
                  <strong style={{ color: 'var(--ink)' }}>⏱ 7-Day Window:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>
                    Requests must be submitted within 7 days of package delivery.
                  </p>
                </div>

                <div>
                  <strong style={{ color: 'var(--ink)' }}>🏷 Original Condition:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>
                    Garments must be unworn, unwashed, and returned with original tags intact.
                  </p>
                </div>

                <div>
                  <strong style={{ color: 'var(--ink)' }}>⚡ Fast Dispatch:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>
                    Exchange pieces are dispatched within 2–4 business days following product inspection approval.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <strong style={{ color: 'var(--ink)' }}>Need Support?</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>
                    Email: <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a><br />
                    Phone: <a href="tel:+917878623123" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>+91 78786 23123</a>
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <Link to="/refund-policy" style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--ink)', textDecoration: 'underline' }}>
                    Read Complete Refund & Exchange Policy →
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
