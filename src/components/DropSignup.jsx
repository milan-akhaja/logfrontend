import React, { useState } from 'react';
import { apiJson } from '../lib/apiClient';

/**
 * Drop signup.
 *
 * The site had no way to collect an email or a phone number anywhere — the
 * footer newsletter had been replaced with contact icons — so every visitor who
 * wasn't ready to buy that day was lost for good.
 *
 * Captures both channels in one step: email works everywhere and costs nothing,
 * phone is for WhatsApp, which outperforms email in India. The consent checkbox
 * isn't decoration — WhatsApp Business requires provable opt-in, and sending
 * without it costs you the channel.
 */

const DROP_DATE = new Date('2026-09-30T00:00:00+05:30');

function daysUntilDrop() {
  const diff = DROP_DATE.getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

export default function DropSignup({ source = 'footer', onToast }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const days = daysUntilDrop();

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

  if (status === 'done') {
    return (
      <div className="drop-signup drop-signup-done">
        <p className="drop-signup-title">You're on the list</p>
        <p className="drop-signup-sub">
          We'll message you before NO PERMISSION 3.0 goes live. No spam, and you can leave any time.
        </p>
      </div>
    );
  }

  return (
    <form className="drop-signup" onSubmit={handleSubmit} noValidate>
      <p className="drop-signup-title">Get the drop first</p>
      <p className="drop-signup-sub">
        {days > 0
          ? `NO PERMISSION 3.0 lands in ${days} day${days === 1 ? '' : 's'}. The list gets first access — sizes sell out.`
          : 'NO PERMISSION 3.0 is live. Join the list so you never miss the next one.'}
      </p>

      <div className="drop-signup-fields">
        <label className="drop-signup-label" htmlFor="drop-email">Email</label>
        <input
          id="drop-email"
          className="drop-signup-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="drop-signup-label" htmlFor="drop-phone">
          WhatsApp <span className="drop-signup-optional">optional</span>
        </label>
        <input
          id="drop-phone"
          className="drop-signup-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <label className="drop-signup-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>Send me drop alerts by email and WhatsApp.</span>
      </label>

      {error && <p className="drop-signup-error" role="alert">{error}</p>}

      <button className="drop-signup-btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Joining...' : 'Notify me'}
      </button>
    </form>
  );
}
