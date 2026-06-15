import React, { useState } from 'react';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      q: "What is your return & refund policy?",
      a: "You can request a return within 7 days of delivery. The product must be unworn, unwashed, with original tags & packaging. Discounted or clearance items and used/damaged products are non-returnable. Please note: we do not refund the ₹23 charity donation portion since it is immediately transferred to charity on your behalf."
    },
    {
      q: "How do I request a return or exchange?",
      a: "You can email us directly at contact@logcloth.com with your Order ID & reason for return. Alternatively, you can use our 'Make a Return' page form to submit your details online, and our support team will get in touch with you within 24-48 business hours."
    },
    {
      q: "How long does shipping take and what does it cost?",
      a: "LOG orders are dispatched within 24-48 business hours. We offer FREE standard shipping PAN India with zero delivery costs. Standard transit time is 3 to 5 business days after dispatch."
    },
    {
      q: "Why wasn't the ₹23 donation refunded?",
      a: "At LOG, we are a streetwear brand with a conscience. ₹23 from every item purchased is immediately allocated and donated to charity partners. Since this is an outright donation to those in need, it cannot be recalled or refunded."
    },
    {
      q: "Can I cancel my order?",
      a: "Yes, you can cancel your order before it has been shipped. Once your order has been dispatched from our warehouse, it cannot be cancelled."
    },
    {
      q: "How will I track my package?",
      a: "As soon as your shipment is dispatched, tracking details (including track ID and carrier link) are sent to you via SMS and email."
    }
  ];

  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Frequently Asked Questions</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '40px' }}>LOG Support Hub & FAQs</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {faqData.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx} 
              style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px', 
                overflow: 'hidden',
                background: isOpen ? '#FAF9F6' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: '800',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--ink)'
                }}
              >
                <span>{item.q}</span>
                <span style={{ fontSize: '18px', fontWeight: '400', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 20px 20px', fontSize: '14px', lineHeight: '1.6', color: 'rgba(0, 0, 0, 0.8)' }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
