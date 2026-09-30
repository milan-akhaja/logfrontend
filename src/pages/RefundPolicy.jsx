import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '850px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Return, Refund & Cancellation Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: September 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: '15px' }}>
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Cancellation Policy</h2>
          <p>
            Cancellation requests are considered only if they are raised within 7 days of placing the order. A cancellation may not be accepted if the order has already been processed for shipping, handed over to a courier partner, or is out for delivery. In such cases, you may reject the shipment at the doorstep where applicable.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Return & Exchange Window</h2>
          <p>
            <strong>Regular products:</strong> you can return within 7 days of delivery.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Pre-order (numbered drop) pieces:</strong> no returns and no refunds. Size exchange only, within 7 days of delivery.
          </p>
          <p style={{ marginTop: '10px' }}>
            After 7 days from delivery, an order is not eligible for return, exchange, or refund.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Eligibility Conditions</h2>
          <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>The product must be unused, unworn, unwashed, and in the same condition as received.</li>
            <li>The product must be returned with original packaging, tags, labels, and invoice where applicable.</li>
            <li>Products purchased during sale or clearance may not be eligible for return or exchange unless defective or damaged. Pre-order drop pieces follow the pre-order rule above.</li>
            <li>Damaged, defective, or incorrect items must be reported to customer support within 7 days of receipt.</li>
          </ul>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Inspection & Approval</h2>
          <p>
            Once the returned product is received, it will be inspected by our team. If the return, exchange, or refund request is approved after quality check, we will process it in accordance with this policy.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Refund Timeline</h2>
          <p>
            Approved refunds are sent within 7 days of us receiving the returned product, to the original payment method. Shipping is free on all orders.
          </p>
          <div style={{ background: '#FAF9F6', borderLeft: '4px solid var(--ink)', padding: '15px', marginTop: '15px', fontSize: '14px' }}>
            <strong>₹23 per product:</strong> for refunds you request, ₹23 per product is deducted — it goes to the LOG Fund.
            <br />
            <strong>Full refund, nothing deducted, when the fault is ours:</strong> a defective item, the wrong item or size sent, or a pre-order piece that sold out before your payment reached us.
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>How to Raise a Request</h2>
          <p>
            You can raise a return, refund, or exchange request from our return page or by emailing <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a> with your order ID, product details, and reason for the request.
          </p>
        </section>
      </div>
    </div>
  );
}
