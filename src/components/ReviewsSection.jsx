import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CACHE_MS = 30 * 1000;
let cached = null;

function loadReviews() {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;
  const promise = fetch('/api/reviews')
    .then((res) => (res.ok ? res.json() : { count: 0, reviews: [] }))
    .then((data) => ({
      count: Number(data?.count) || 0,
      reviews: Array.isArray(data?.reviews) ? data.reviews : []
    }))
    .catch(() => ({ count: 0, reviews: [] }));
  cached = { at: Date.now(), promise };
  return promise;
}

export function useReviews() {
  const [state, setState] = useState({ count: 0, reviews: [], loaded: false });

  useEffect(() => {
    let active = true;
    loadReviews().then((data) => {
      if (active) setState({ ...data, loaded: true });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

function Stars({ value }) {
  return (
    <span className="review-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}
      {'☆'.repeat(5 - value)}
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <Stars value={review.rating} />
      <p className="review-body">{review.body}</p>
      <div className="review-author">
        <span className="review-name">{review.name}</span>
        {review.profession && <span className="review-role">{review.profession}</span>}
      </div>
    </article>
  );
}

function ReviewForm({ onClose }) {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) {
      setError('Please choose a rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, profession, rating, body, website })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send your review. Please try again.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Could not send your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Write a review"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="review-modal-close" aria-label="Close" onClick={onClose}>×</button>
        {done ? (
          <div className="review-modal-done">
            <h3>Thank you</h3>
            <p>Your review will appear on the site once we approve it.</p>
            <button type="button" className="review-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="review-form">
            <h3>Write a review</h3>
            <div className="review-rating-pick" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className={n <= rating ? 'on' : ''}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
            <input
              type="text"
              className="review-input"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
              autoComplete="name"
            />
            <input
              type="text"
              className="review-input"
              placeholder="Your profession (optional)"
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
              maxLength={100}
            />
            <span className="review-hint">For example: Student, Designer, Shop owner, Doctor</span>
            <textarea
              className="review-input review-textarea"
              placeholder="Your review"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1000}
              minLength={10}
              rows={4}
              required
            />
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="review-honeypot"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            {error && <p className="review-error" role="alert">{error}</p>}
            <button type="submit" className="review-btn review-btn-solid" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function WriteReviewButton({ onOpen }) {
  return (
    <button type="button" className="review-btn" onClick={onOpen}>
      Write a review
    </button>
  );
}

// Home page: sits under the gallery. Renders nothing until at least one review
// has been approved, so a visitor never sees an empty or zero-count block.
export default function ReviewsSection() {
  const { count, reviews } = useReviews();
  const [formOpen, setFormOpen] = useState(false);

  if (!count) return null;

  return (
    <section className="reviews-section" id="reviews">
      <div className="container">
        <div className="reviews-head">
          <div className="reviews-count">{count} {count === 1 ? 'review' : 'reviews'}</div>
          <WriteReviewButton onOpen={() => setFormOpen(true)} />
        </div>
        <div className="reviews-row">
          {reviews.slice(0, 3).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        <div className="reviews-all-wrap">
          <Link to="/reviews" className="reviews-all-link">See all reviews</Link>
        </div>
      </div>
      {formOpen && <ReviewForm onClose={() => setFormOpen(false)} />}
    </section>
  );
}

// /reviews page: every approved review. The page itself always works, so the
// link can be shared with customers before the first review exists.
export function ReviewsPage() {
  const { count, reviews, loaded } = useReviews();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="reviews-section reviews-page">
      <div className="container">
        <div className="reviews-head">
          <h1 className="reviews-title">Reviews</h1>
          <div className="reviews-head-right">
            {count > 0 && <span className="reviews-count">{count} {count === 1 ? 'review' : 'reviews'}</span>}
            <WriteReviewButton onOpen={() => setFormOpen(true)} />
          </div>
        </div>
        {loaded && count === 0 && <p className="reviews-empty">No reviews yet. Be the first to write one.</p>}
        <div className="reviews-grid">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
      {formOpen && <ReviewForm onClose={() => setFormOpen(false)} />}
    </section>
  );
}
