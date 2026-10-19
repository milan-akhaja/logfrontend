import React from 'react';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '850px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>
        Return, Refund & Cancellation Policy
      </h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: October 2026</p>

      {/* Free Pan-India Exchange Highlight Box */}
      <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: '8px', padding: '24px', marginBottom: '35px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🚚</span>
          <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0, color: '#166534' }}>
            Free Size Exchanges Available Pan-India
          </h2>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.6', color: '#15803D' }}>
          We provide 100% complimentary size exchanges across all pin codes in India. If the fit isn't right, we arrange doorstep reverse pickup and deliver your replacement size with <strong>zero courier fees</strong>.
        </p>
        <Link 
          to="/make-return" 
          style={{ 
            display: 'inline-block', 
            background: 'var(--ink)', 
            color: 'white', 
            fontWeight: '800', 
            padding: '12px 24px', 
            borderRadius: '4px', 
            textTransform: 'uppercase', 
            textDecoration: 'none', 
            fontSize: '12px', 
            letterSpacing: '0.05em' 
          }}
        >
          Start Return / Exchange Request →
        </Link>
      </div>

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
            <strong>Regular products:</strong> you can request a return or exchange within 7 days of delivery.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Free Pan-India Size Exchange:</strong> Free reverse pickup and re-shipment across India for size swaps.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Pre-order (numbered drop) pieces:</strong> size exchange only within 7 days of delivery (no returns or refunds).
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
            Once the returned product is received at our facility, it is inspected by our quality team. If the return or exchange request is approved after quality check, replacement dispatch or refund is processed immediately.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Refund Timeline</h2>
          <p>
            Approved refunds are sent within 5–7 business days of us receiving and inspecting the returned product, to the original payment method or bank account. Shipping is free on all orders.
          </p>
          <div style={{ background: '#FAF9F6', borderLeft: '4px solid var(--ink)', padding: '15px', marginTop: '15px', fontSize: '14px' }}>
            <strong>₹23 per product:</strong> for refunds you request, ₹23 per product is non-refundable — it goes directly to the LOG Charity Fund.<br />
            <strong>Full refund, nothing deducted, when the fault is ours:</strong> a defective item, wrong item or size sent, or a piece that sold out before payment completion.
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>How to Raise a Request</h2>
          <p>
            You can raise a return or exchange request online directly from our <Link to="/make-return" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>Return & Exchange Portal</Link>, or by emailing <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a> with your order ID, product details, and reason for the request.
          </p>
          <div style={{ marginTop: '15px' }}>
            <Link 
              to="/make-return" 
              style={{ 
                display: 'inline-block', 
                background: 'var(--ink)', 
                color: 'white', 
                fontWeight: '800', 
                padding: '12px 24px', 
                borderRadius: '4px', 
                textTransform: 'uppercase', 
                textDecoration: 'none', 
                fontSize: '12px', 
                letterSpacing: '0.05em' 
              }}
            >
              Go to Return & Exchange Portal →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
