import React, { useState } from 'react';

export default function Terms() {
  const [activeSubTab, setActiveSubTab] = useState('terms'); // terms, privacy

  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--ink)' }}>
      <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid var(--border-color)', marginBottom: '30px', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('terms')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '22px',
            fontWeight: activeSubTab === 'terms' ? '900' : '500',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '5px 0',
            color: activeSubTab === 'terms' ? 'var(--ink)' : 'var(--grey-muted)',
            borderBottom: activeSubTab === 'terms' ? '3px solid var(--ink)' : '3px solid transparent',
            marginBottom: '-13px',
            transition: 'all 0.2s'
          }}
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => setActiveSubTab('privacy')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '22px',
            fontWeight: activeSubTab === 'privacy' ? '900' : '500',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '5px 0',
            color: activeSubTab === 'privacy' ? 'var(--ink)' : 'var(--grey-muted)',
            borderBottom: activeSubTab === 'privacy' ? '3px solid var(--ink)' : '3px solid transparent',
            marginBottom: '-13px',
            transition: 'all 0.2s'
          }}
        >
          Privacy Policy
        </button>
      </div>

      <div style={{ lineHeight: '1.7', fontSize: '15px' }}>
        {activeSubTab === 'terms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>Welcome to LOG. By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions.</p>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>1. General</h3>
              <p>LOG reserves the right to modify these terms at any time. Continued use of the website constitutes acceptance of any changes.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>2. Eligibility</h3>
              <p>By using this website, you confirm that you are at least 18 years of age or accessing under parental supervision.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>3. Product Information</h3>
              <p>We strive to display accurate product details. However, actual product colors may slightly vary due to lighting and screen settings.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>4. Pricing & Payments</h3>
              <p>All prices are listed in Indian Rupees (INR). We reserve the right to modify prices without prior notice. Payments are securely processed via authorized payment gateways.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>5. Orders & Cancellation</h3>
              <p>LOG reserves the right to refuse or cancel any order due to product unavailability, pricing errors, or suspicious/fraudulent activity. Orders once shipped cannot be cancelled.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>6. Shipping</h3>
              <p>Shipping timelines and policies are defined under our Shipping Policy page.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>7. Returns & Refunds</h3>
              <p>Returns and refunds are governed by our Return & Refund Policy page.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>8. Intellectual Property</h3>
              <p>All content, logos, designs, images, and materials on this website are owned by LOG and are protected under Indian copyright laws. Unauthorized use is prohibited.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>9. User Conduct</h3>
              <p>You agree not to use the website for unlawful purposes, attempt to breach website security, or upload malicious content.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>10. Limitation of Liability</h3>
              <p>LOG shall not be liable for any indirect, incidental, or consequential damages arising from use of our products or website.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>11. Governing Law</h3>
              <p>These terms shall be governed and interpreted in accordance with the laws of India.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>12. Contact Information</h3>
              <p>
                For any queries, contact us at:
                <br />
                📧 <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a>
              </p>
            </div>
          </div>
        )}

        {activeSubTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>LOG (“we”, “our”, “us”) respects your privacy. This Privacy Policy describes how your personal information is collected, used and shared when you visit or make a purchase from www.logcloth.com.</p>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>Information We Collect</h3>
              <p>When you purchase or attempt to purchase, we collect your Name, Billing & shipping address, Phone number, Email, and Payment details (secured via payment gateway).</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>How We Use Your Information</h3>
              <p>We use your information to process orders, deliver products, communicate order updates, send offers (only if you opt-in), and prevent fraud.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>Data Security</h3>
              <p>All transactions are secured and encrypted via certified payment gateways. We do not store card details.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>Sharing of Information</h3>
              <p>We only share information with logistics partners and payment gateways strictly to complete your order.</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>Your Rights</h3>
              <p>
                You may request access, correction, or deletion of your data anytime by emailing:
                <br />
                📧 <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
