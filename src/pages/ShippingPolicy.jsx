import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '850px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Shipping Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: July 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: '15px' }}>
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Courier Partners</h2>
          <p>
            Orders are shipped through registered domestic courier companies, logistics partners, and/or speed post services within India.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Dispatch Timeline</h2>
          <p>
            Orders are generally shipped within 2 days from the date of order confirmation and/or payment, or as per the delivery date agreed at the time of order confirmation, subject to courier company or postal authority norms.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Delivery Responsibility</h2>
          <p>
            LOG shall not be liable for delay in delivery caused by courier companies, logistics providers, postal authorities, weather, strikes, operational disruptions, or events beyond our reasonable control.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Delivery Address</h2>
          <p>
            Delivery of all orders will be made to the address provided by the customer at the time of purchase. Please ensure your name, phone number, PIN code, and complete shipping address are accurate before placing the order.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Shipping Charges</h2>
          <p>
            Any shipping costs charged at checkout are displayed before order confirmation. If shipping charges are levied, they are non-refundable unless required by applicable law or specifically approved by LOG.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Delivery Confirmation & Support</h2>
          <p>
            Delivery updates and order confirmation may be shared on the email ID or phone number provided during checkout. For shipping support, contact <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
