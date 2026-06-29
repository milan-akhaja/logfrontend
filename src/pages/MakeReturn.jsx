import React, { useState } from 'react';

export default function MakeReturn() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Size mismatch');
  const [action, setAction] = useState('Exchange'); // Exchange or Refund
  const [notes, setNotes] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim(), email: email.trim(), reason, action, notes })
      });

      if (res.ok) {
        const data = await res.json();
        setEmailSent(Boolean(data.emailSent));
        setSubmitted(true);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Wrong Order ID or Email');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Wrong Order ID or Email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="make-return-container">
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Make a Return / Exchange</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '40px' }}>Request a hassle-free return or size exchange within 7 days of delivery.</p>

      {submitted ? (
        <div style={{ background: '#f0fff4', border: '2px solid green', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Request Submitted Successfully!</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'rgba(0, 0, 0, 0.7)', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            {emailSent
              ? 'A confirmation email has been sent to your registered email address.'
              : 'Your request is saved. Our team will connect with you shortly.'}
          </p>
          <div style={{ background: 'white', border: '1px dashed green', padding: '15px', borderRadius: '6px', maxWidth: '450px', margin: '0 auto', textAlign: 'left', fontSize: '13px', lineHeight: '1.6' }}>
            <strong>Important Next Steps:</strong>
            <ul style={{ paddingLeft: '15px', marginTop: '5px' }}>
              <li>Ensure the item is unworn, unwashed, and packed with original tags.</li>
              <li>Hand over the package to the courier partner when they arrive.</li>
              <li>Exchanges will be shipped within 5 days of product inspection approval.</li>
            </ul>
          </div>
          <button 
            onClick={() => {
              setSubmitted(false);
              setOrderId('');
              setNotes('');
            }}
            style={{ 
              marginTop: '30px', 
              background: 'var(--ink)', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              fontWeight: '800', 
              borderRadius: '4px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <div className="make-return-grid">
          
          {/* Form Side */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
              <div style={{ border: '2px solid red', padding: '15px', borderRadius: '6px', color: 'red', background: '#fff5f5', fontSize: '14px', fontWeight: 'bold' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>Order ID *</label>
              <input 
                type="text" 
                placeholder="e.g. LOG-2301"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                style={{ padding: '12px', border: '2px solid var(--ink)', borderRadius: '4px', background: 'white', fontWeight: '600' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>Email Address *</label>
              <input 
                type="email" 
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white' }}
              />
            </div>

            <div className="make-return-select-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>Request Action</label>
                <select 
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white' }}
                >
                  <option value="Exchange">Size Exchange</option>
                  <option value="Return">Refund (Store Credit/Bank)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>Reason for Request</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white' }}
                >
                  <option value="Size mismatch">Size mismatch</option>
                  <option value="Defective product">Defective / damaged product</option>
                  <option value="Incorrect item received">Incorrect item received</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--grey-muted)' }}>Additional Comments</label>
              <textarea 
                placeholder="Please describe the issue or specify the new size you require..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                style={{ padding: '12px', border: '2px solid var(--border-color)', borderRadius: '4px', background: 'white', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ background: '#FFFDF9', border: '1px solid #FFE8B8', padding: '15px', borderRadius: '4px', fontSize: '13px', lineHeight: '1.5', color: '#825c00' }}>
              ⚠️ <strong>Charity Donation Notice:</strong> Please note that ₹23 donated to charity on your behalf is non-refundable and will be deducted from the final refund amount.
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'var(--ink)', 
                color: 'white', 
                border: 'none', 
                padding: '14px 28px', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Verifying & Submitting...' : 'Submit Request'}
            </button>
          </form>

          {/* Policy Overview Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', background: '#FAF9F6' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>Policy Highlights</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', lineHeight: '1.6' }}>
                <div>
                  <strong>7-Day Window:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>Requests must be submitted within 7 days of package delivery.</p>
                </div>
                <div>
                  <strong>Original Tags:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>Products must be unworn, unwashed, and returned in original packing with tags intact.</p>
                </div>
                <div>
                  <strong>Exchange Speed:</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>Approved exchanges are shipped within 5 business days after inspection.</p>
                </div>
                <div>
                  <strong>Need help?</strong>
                  <p style={{ color: 'rgba(0,0,0,0.7)', marginTop: '2px' }}>Email support at:<br />📧 <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a></p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
