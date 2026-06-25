import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <main className="policy-page-container" style={{ padding: '150px 20px 90px', minHeight: '70vh', textAlign: 'center' }}>
      <SEO title="Page Not Found" description="The LOG page you requested could not be found." noindex canonicalPath="/404" />
      <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--grey-muted)', marginBottom: '12px' }}>
        404
      </p>
      <h1 style={{ fontSize: 'clamp(32px, 7vw, 72px)', lineHeight: 1, fontWeight: 900, textTransform: 'uppercase', marginBottom: '18px' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--grey-muted)', maxWidth: '460px', margin: '0 auto 30px' }}>
        The page may have moved, expired, or never existed.
      </p>
      <Link to="/shop" className="btn btn-accent">
        Shop Now
      </Link>
    </main>
  );
}
