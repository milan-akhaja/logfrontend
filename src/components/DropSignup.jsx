import React, { useState } from 'react';
import { apiJson } from '../lib/apiClient';

/**
 * Drop signup — full-width band that sits directly above the footer.
 *
 * The site had no email or phone capture anywhere, so every visitor who wasn't
 * ready to buy that day was lost for good.
 *
 * Collects both channels: email works everywhere and costs nothing to send,
 * phone is for WhatsApp, which outperforms email in India. The consent checkbox
 * isn't decoration — WhatsApp Business requires provable opt-in, and sending
 * without it costs you the channel.
 *
 * To change the drop, edit the two constants below. The date shown, the
 * countdown and the copy all follow from them.
 */

const DROP_NAME = 'No Permission 3.0';
const DROP_DATE = new Date('2026-10-01T00:00:00+05:30');

function dropDayMonth() {
  return {
    day: String(DROP_DATE.getDate()).padStart(2, '0'),
    month: String(DROP_DATE.getMonth() + 1).padStart(2, '0')
  };
}

function hasDropped() {
  return DROP_DATE.getTime() - Date.now() <= 0;
}

export default function DropSignup({ source = 'footer-band', onToast }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const { day, month } = dropDayMonth();
  const live = hasDropped();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits && (digits.length < 10 || digits.length > 15)) {
      setError('Enter a valid phone number, or leave it blank.');
      return;
    }

    setError('');
    setStatus('sending');

    try {
      await apiJson('/api/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, phone: digits, consent, source })
      });
      setStatus('done');
      onToast?.("You're on the list. We'll message you before it drops.");
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Could not sign you up. Please try again.');
    }
  };

  return (
    <section className="drop-band" aria-labelledby="drop-band-heading">
      <p className="drop-band-kicker">{live ? 'Out now' : 'Next drop'}</p>

      <p className="drop-band-date">
        {day}<em>.{month}</em>
      </p>

      <h2 id="drop-band-heading" className="drop-band-name">{DROP_NAME}</h2>

      <div className="drop-band-inner">
        {status === 'done' ? (
          <p className="drop-band-done">
            You're on the list. We'll message you before it goes live — no spam, and you can leave any time.
          </p>
        ) : (
          <>
            <form className="drop-band-form" onSubmit={handleSubmit} noValidate>
              <input
                className="drop-band-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="drop-band-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="WhatsApp (optional)"
                aria-label="WhatsApp number, optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button className="drop-band-btn" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Joining…' : 'Notify me'}
              </button>
            </form>

            <label className="drop-band-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>Send me drop alerts by email and WhatsApp.</span>
            </label>

            {error && <p className="drop-band-error" role="alert">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}
