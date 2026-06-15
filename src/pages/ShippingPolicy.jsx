import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Shipping Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: June 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', lineHeight: '1.7', fontSize: '15px' }}>
        
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Processing Timelines</h2>
          <p>
            All streetwear orders placed on LOG are processed and dispatched within <strong>24 to 48 business hours</strong>. Orders are not processed or shipped on Sundays or national holidays.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Shipping Costs</h2>
          <p>
            We offer <strong>FREE standard shipping PAN India</strong> on all orders. There are no minimum order value requirements to qualify for free shipping.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Delivery Estimates</h2>
          <p>
            Standard orders delivered across India generally arrive within <strong>3 to 5 business days</strong> after dispatch, depending on your geographic location and local logistics support.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Tracking Info</h2>
          <p>
            Once your order is handed over to our logistics carrier, tracking details (including the tracking number and link) will be shared with you automatically via <strong>SMS and email</strong>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Address Changes & Support</h2>
          <p>
            If you need to update your shipping address details, please email us immediately at <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a>. Please note that address modifications are only possible before the order has been dispatched.
          </p>
        </section>

      </div>
    </div>
  );
}
