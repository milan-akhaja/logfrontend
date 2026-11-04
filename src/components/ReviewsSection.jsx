import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// Endless side-swipe row. With more reviews than fit on screen the list is
// rendered three times and the scroll is parked in the middle copy; once a
// swipe settles in the first or last copy it jumps by one copy width to the
// same card in the middle, which looks identical, so the row never ends.
function ReviewCarousel({ reviews }) {
  const rowRef = useRef(null);
  // Card the arrows are heading to, so a click during the slide moves on from
  // there instead of from wherever the animation happens to be.
  const targetRef = useRef(null);
  const loop = reviews.length > 3;
  const items = loop ? [...reviews, ...reviews, ...reviews] : reviews;

  const copyWidth = () => {
    const cards = rowRef.current?.children;
    if (!cards || cards.length < reviews.length * 2) return 0;
    return cards[reviews.length].offsetLeft - cards[0].offsetLeft;
  };

  useLayoutEffect(() => {
    if (loop && rowRef.current) rowRef.current.scrollLeft = copyWidth();
  }, [loop, reviews.length]);

  useEffect(() => {
    const row = rowRef.current;
    if (!loop || !row) return undefined;
    let timer;
    const onScroll = () => {
      clearTimeout(timer);
      // Wait for the swipe (and any momentum) to stop before jumping.
      timer = setTimeout(() => {
        targetRef.current = null;
        const width = copyWidth();
        if (!width) return;
        if (row.scrollLeft < width * 0.5) row.scrollLeft += width;
        else if (row.scrollLeft > width * 1.5) row.scrollLeft -= width;
      }, 150);
    };
    row.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      row.removeEventListener('scroll', onScroll);
    };
  }, [loop, reviews.length]);

  const step = (direction) => {
    const row = rowRef.current;
    const cards = row?.children;
    if (!row || !cards || cards.length < 2) return;
    // Move by a whole screen of cards: three at a time on desktop. Aim at an
    // exact card; a relative scrollBy was sometimes dropped by scroll-snap.
    const cardStep = cards[1].offsetLeft - cards[0].offsetLeft;
    const perView = Math.max(1, Math.round(row.clientWidth / cardStep));
    const from = targetRef.current ?? Math.round(row.scrollLeft / cardStep);
    const target = Math.min(cards.length - 1, Math.max(0, from + direction * perView));
    targetRef.current = target;
    row.scrollTo({ left: cards[target].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
  };

  return (
    <div className="reviews-carousel">
      {loop && (
        <button type="button" className="reviews-nav reviews-nav-prev" aria-label="Previous reviews" onClick={() => step(-1)}>‹</button>
      )}
      <div className="reviews-row" ref={rowRef}>
        {items.map((review, index) => {
          const copy = Math.floor(index / reviews.length);
          return (
            <div key={`${copy}-${review.id}`} className="reviews-slide" aria-hidden={loop && copy !== 1 ? 'true' : undefined}>
              <ReviewCard review={review} />
            </div>
          );
        })}
      </div>
      {loop && (
        <button type="button" className="reviews-nav reviews-nav-next" aria-label="Next reviews" onClick={() => step(1)}>›</button>
      )}
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
        <ReviewCarousel reviews={reviews} />
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
