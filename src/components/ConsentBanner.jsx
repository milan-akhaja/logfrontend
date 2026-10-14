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
    >
      <div className="log-consent-banner-text">
        <strong>logcloth</strong> uses essential cookies for site security and features, and optional cookies for audience analytics and marketing. You can update your choice anytime via Cookie settings in the footer. Read our{' '}
        <Link
          to="/privacy-policy"
          onClick={() => {
            if (forceOpen && onClose) onClose();
          }}
          className="log-consent-link"
        >
          Privacy Policy
        </Link>.
      </div>

      {!customizing ? (
        <div className="log-consent-banner-actions">
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleAcceptAll}
          >
            Accept all
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRejectAll}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            className="btn btn-outline btn-customize"
            onClick={() => setCustomizing(true)}
          >
            Customize
          </button>
        </div>
      ) : (
        <div className="log-consent-custom-panel">
          <div className="log-consent-custom-row">
            <div>
              <div className="log-consent-custom-title">Necessary Cookies</div>
              <div className="log-consent-custom-desc">Required for navigation, bag and security</div>
            </div>
            <span className="log-consent-badge-always">
              Always on
            </span>
          </div>

          <div className="log-consent-custom-row">
            <div>
              <label htmlFor="log-consent-analytics" className="log-consent-custom-title" style={{ cursor: 'pointer' }}>
                Analytics
              </label>
              <div className="log-consent-custom-desc">Helps measure traffic and page performance</div>
            </div>
            <input
              id="log-consent-analytics"
              type="checkbox"
              className="log-consent-checkbox"
              checked={analyticsChoice}
              onChange={(e) => setAnalyticsChoice(e.target.checked)}
            />
          </div>

          <div className="log-consent-custom-row">
            <div>
              <label htmlFor="log-consent-marketing" className="log-consent-custom-title" style={{ cursor: 'pointer' }}>
                Marketing
              </label>
              <div className="log-consent-custom-desc">Enables relevant campaign measurement and ads</div>
            </div>
            <input
              id="log-consent-marketing"
              type="checkbox"
              className="log-consent-checkbox"
              checked={marketingChoice}
              onChange={(e) => setMarketingChoice(e.target.checked)}
            />
          </div>

          <div className="log-consent-custom-actions">
            <button
              type="button"
              className="btn btn-accent"
              style={{ flex: 1 }}
              onClick={handleSaveCustom}
            >
              Save preferences
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCustomizing(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
