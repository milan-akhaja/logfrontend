import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '850px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Return, Refund & Cancellation Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: July 2026</p>

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
            We offer return or exchange requests within the first 7 days from the date of purchase or delivery. If 7 days have passed, the order will not be eligible for return, exchange, or refund.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Eligibility Conditions</h2>
          <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>The product must be unused, unworn, unwashed, and in the same condition as received.</li>
            <li>The product must be returned with original packaging, tags, labels, and invoice where applicable.</li>
            <li>Products purchased during sale or clearance may not be eligible for return or exchange unless defective or damaged.</li>
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
            Approved refunds are processed within 10 business days. Refunds are credited to the original payment method where applicable. Shipping charges, if any, are non-refundable.
          </p>
          <div style={{ background: '#FAF9F6', borderLeft: '4px solid var(--ink)', padding: '15px', marginTop: '15px', fontSize: '14px' }}>
            <strong>Charity Contribution Notice:</strong> The Rs. 23 donation amount from each product is non-refundable because it is committed toward charity/social contribution from the order.
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
