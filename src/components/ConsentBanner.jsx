import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSavedConsent, saveConsent, isAdminUser } from '../lib/analytics';

export default function ConsentBanner({ forceOpen = false, onClose }) {
  const isAdmin = isAdminUser();
  const [savedConsent, setSavedConsent] = useState(() => getSavedConsent());
  const [customizing, setCustomizing] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setDismissed(false);
      const current = getSavedConsent();
      if (current) {
        setAnalyticsChoice(Boolean(current.analytics));
        setMarketingChoice(Boolean(current.marketing));
      } else {
        setAnalyticsChoice(false);
        setMarketingChoice(false);
      }
    }
  }, [forceOpen]);

  if (isAdmin) return null;
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return null;
  if (dismissed && !forceOpen) return null;
  if (savedConsent !== null && !forceOpen) return null;

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
    setSavedConsent({ analytics: true, marketing: true });
    setDismissed(true);
    setCustomizing(false);
    if (onClose) onClose();
  };

  const handleRejectAll = () => {
    saveConsent({ analytics: false, marketing: false });
    setSavedConsent({ analytics: false, marketing: false });
    setDismissed(true);
    setCustomizing(false);
    if (onClose) onClose();
  };

  const handleSaveCustom = () => {
    saveConsent({ analytics: analyticsChoice, marketing: marketingChoice });
    setSavedConsent({ analytics: analyticsChoice, marketing: marketingChoice });
    setDismissed(true);
    setCustomizing(false);
    if (onClose) onClose();
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="log-consent-banner"
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        right: '12px',
        margin: '0 auto',
        maxWidth: '540px',
        background: '#0B0B0C',
        color: '#FFFFFF',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '8px',
        padding: '16px 18px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
        zIndex: 9995,
        fontFamily: 'inherit',
        fontSize: '13px',
        lineHeight: 1.45
      }}
    >
      <div style={{ marginBottom: '12px', color: '#E0E0E2' }}>
        <strong style={{ color: '#FFFFFF', letterSpacing: '0.02em' }}>logcloth</strong> uses essential cookies for core site features, and optional cookies for traffic analytics and marketing. You can update your choice anytime via Cookie settings in the footer. Read our{' '}
        <Link
          to="/privacy-policy"
          onClick={() => {
            if (forceOpen && onClose) onClose();
          }}
          style={{ color: '#C9A24D', textDecoration: 'underline' }}
        >
          Privacy Policy
        </Link>.
      </div>

      {!customizing ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'stretch'
          }}
        >
          <button
            type="button"
            className="log-consent-btn"
            onClick={handleAcceptAll}
            style={{
              flex: '1 1 120px',
              padding: '9px 12px',
              background: '#1A1A1D',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Accept all
          </button>
          <button
            type="button"
            className="log-consent-btn"
            onClick={handleRejectAll}
            style={{
              flex: '1 1 120px',
              padding: '9px 12px',
              background: '#1A1A1D',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            className="log-consent-btn"
            onClick={() => setCustomizing(true)}
            style={{
              flex: '1 1 120px',
              padding: '9px 12px',
              background: '#1A1A1D',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Customize
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', color: '#FFFFFF' }}>Necessary Cookies</div>
              <div style={{ fontSize: '11.5px', color: '#8E8E93' }}>Required for site navigation and security</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#C9A24D', textTransform: 'uppercase' }}>
              Always on
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <label htmlFor="log-consent-analytics" style={{ fontWeight: '700', color: '#FFFFFF', cursor: 'pointer' }}>
                Analytics
              </label>
              <div style={{ fontSize: '11.5px', color: '#8E8E93' }}>Helps measure audience traffic and page performance</div>
            </div>
            <input
              id="log-consent-analytics"
              type="checkbox"
              checked={analyticsChoice}
              onChange={(e) => setAnalyticsChoice(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#C9A24D' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <label htmlFor="log-consent-marketing" style={{ fontWeight: '700', color: '#FFFFFF', cursor: 'pointer' }}>
                Marketing
              </label>
              <div style={{ fontSize: '11.5px', color: '#8E8E93' }}>Enables relevant campaign measurement and ads</div>
            </div>
            <input
              id="log-consent-marketing"
              type="checkbox"
              checked={marketingChoice}
              onChange={(e) => setMarketingChoice(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#C9A24D' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="log-consent-btn"
              onClick={handleSaveCustom}
              style={{
                flex: '1',
                padding: '9px 12px',
                background: '#1A1A1D',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              Save preferences
            </button>
            <button
              type="button"
              className="log-consent-btn"
              onClick={() => setCustomizing(false)}
              style={{
                padding: '9px 14px',
                background: 'transparent',
                color: '#8E8E93',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
