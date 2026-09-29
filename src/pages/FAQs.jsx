import React, { useState } from 'react';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      q: "What is your return & refund policy?",
      a: "Regular products: you can request a return within 7 days of delivery. The product must be unworn, unwashed, with original tags & packaging. Discounted or clearance items and used/damaged products are non-returnable. Refunds are sent within 7 days of us receiving the return, minus ₹23 per product (it goes to the LOG Fund) — full refund if we got it wrong. Pre-order (numbered drop) pieces: no returns or refunds, size exchange only within 7 days of delivery."
    },
    {
      q: "How do I request a return or exchange?",
      a: "You can email us directly at contact@logcloth.com with your Order ID & reason for return. Alternatively, you can use our 'Make a Return' page form to submit your details online, and our support team will get in touch with you within 24-48 business hours."
    },
    {
      q: "How long does shipping take and what does it cost?",
      a: "Regular orders are dispatched within 15 days. Pre-order (numbered drop) pieces ship by the date shown on the product page and at checkout. Shipping is FREE on all orders across India. Standard transit time is 3 to 5 business days after dispatch."
    },
    {
      q: "Why wasn't the ₹23 donation refunded?",
      a: "For refunds you request, ₹23 per product is deducted — it goes to the LOG Fund. If the fault is ours (a defective item, the wrong item or size sent, or a pre-order piece that sold out before your payment reached us), you get a full refund with nothing deducted."
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
