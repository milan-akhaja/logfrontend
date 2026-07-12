import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="policy-page-container" style={{ padding: '140px 20px', maxWidth: '850px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--grey-muted)', fontSize: '14px', marginBottom: '30px' }}>Last Updated: July 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: '15px' }}>
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Introduction</h2>
          <p>
            LOG Clothing operates https://logcloth.com/ and respects your privacy. This Privacy Policy explains how we collect, use, share, protect, and process your personal information when you visit the website, place an order, contact us, or use our services.
          </p>
          <p style={{ marginTop: '10px' }}>
            We currently offer our products and services primarily within India, and your data is primarily stored and processed in India.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Information We Collect</h2>
          <p>
            We may collect information you provide during checkout, account use, return requests, or support communication, including name, date of birth, billing and shipping address, phone number, email address, order details, and payment-related information processed through payment partners.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>How We Use Information</h2>
          <p>
            We use personal information to process orders, fulfill deliveries, manage returns and exchanges, provide customer support, prevent fraud or misuse, improve the website, send order updates, and comply with legal obligations.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Sharing of Information</h2>
          <p>
            We may share your information with service providers required to complete your order, including logistics partners, payment service providers, technology vendors, support tools, and legal or government authorities where required by law.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Security</h2>
          <p>
            We follow reasonable security practices to protect personal data from unauthorized access, misuse, loss, or disclosure. However, internet transmission is not completely secure, and users are responsible for keeping their login and account details safe.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Data Retention & Deletion</h2>
          <p>
            We retain personal data only as long as needed for the purposes for which it was collected, to complete pending orders or returns, to prevent fraud, or as required by law. You may request access, correction, update, or deletion of your personal data by contacting us.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Consent</h2>
          <p>
            By using our website or providing your information, you consent to the collection, use, storage, disclosure, and processing of your information in accordance with this Privacy Policy. You may withdraw consent by writing to us, subject to applicable laws and legitimate business requirements.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Grievance & Contact</h2>
          <p>
            For privacy requests, complaints, or questions, contact us at <a href="mailto:contact@logcloth.com" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>contact@logcloth.com</a> or phone <a href="tel:+917878623123" style={{ fontWeight: '700', color: 'var(--ink)', textDecoration: 'underline' }}>+91 7878623123</a>. Support hours: Monday to Friday, 9:00 AM to 6:00 PM IST.
          </p>
        </section>
      </div>
    </div>
  );
}
