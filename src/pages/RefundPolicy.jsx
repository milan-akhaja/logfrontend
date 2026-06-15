import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Refund & Exchange Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: June 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', lineHeight: '1.7', fontSize: '15px' }}>
        
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>The Basics</h2>
          <p>
            Our return and exchange policy lasts for <strong>7 days</strong> after your purchase or delivery date. Any return or exchange requests submitted after this 7-day timeframe will not be accepted.
          </p>
          <div style={{ background: '#FAF9F6', borderLeft: '4px solid var(--ink)', padding: '15px', marginTop: '15px', fontSize: '14px' }}>
            <strong>Charity Contribution Notice:</strong> We do not refund the <strong>₹23 donation</strong> portion of your order because this amount is directly donated to charity on your behalf immediately upon purchase.
          </div>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Return Conditions</h2>
          <p>To be eligible for a return or exchange, your product must satisfy the following criteria:</p>
          <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Unworn:</strong> Items must not have been worn, used, or showing any signs of wear.</li>
            <li><strong>Unwashed:</strong> Fabric must be in its original post-manufactured state.</li>
            <li><strong>Original Packaging:</strong> Must be in original tags and polybag packaging intact.</li>
          </ul>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Non-Returnable Items</h2>
          <p>The following items are strictly non-returnable and non-exchangeable:</p>
          <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Discounted or clearance sale items.</li>
            <li>Used, washed, or damaged products.</li>
          </ul>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Processing & Crediting</h2>
          <p>
            Once your return product is received and inspected at our warehouse, and subsequently approved:
          </p>
          <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Exchanges are processed and dispatched within <strong>5 days</strong>.</li>
            <li>Refund amounts will be credited back to your original payment method (minus the ₹23 charity donation).</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>How to Request a Return</h2>
          <p>
            You can request a return directly via our online portal or email us at:
            <br />
            <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a>
          </p>
          <p style={{ marginTop: '10px' }}>
            Please make sure to include your <strong>Order ID</strong> (e.g. LOG-ORD-XXXX) and the specific <strong>reason for return or exchange</strong> in your message.
          </p>
        </section>

      </div>
    </div>
  );
}
