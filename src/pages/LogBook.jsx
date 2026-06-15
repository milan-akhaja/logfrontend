import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogBook() {
  const [blogs, setBlogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch latest blogs
    fetch('/api/blogs')
      .then(res => res.json())
      .then(data => {
        // Sort by date descending
        const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setBlogs(sorted);
      })
      .catch(err => console.error('Error fetching blogs:', err));

    // 2. Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '/log-book',
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => {});
  }, []);

  const truncateTitle = (title) => {
    if (!title) return '';
    const words = title.split(/\s+/);
    if (words.length <= 5) return title;
    return words.slice(0, 5).join(' ') + '...';
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  // Helper rotation classes to keep the "perfect polaroid layout" look
  const getRotationClass = (index) => {
    const classes = [
      'polaroid-rotate-left',
      'polaroid-rotate-right',
      'polaroid-rotate-left-slight',
      'polaroid-rotate-right-slight'
    ];
    return classes[index % classes.length];
  };

  return (
    <>
      {/* LOOKBOOK HEADER */}
      <section className="lookbook-header" style={{ background: '#111113', color: 'white', padding: '120px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container reveal">
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '900', textTransform: 'uppercase', color: 'white' }}>Log Book</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }}>
            Aesthetic diary, styling showcase, and stories of social impact
          </p>
        </div>
      </section>

      {/* POLAROIDS GRID */}
      <section className="container lookbook-polaroids-container" style={{ paddingBottom: '40px' }}>
        {blogs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--grey-muted)', padding: '80px 0', fontSize: '15px' }}>
            No log entries written yet. Check back soon!
          </p>
        ) : (
          <>
            <div className="polaroid-grid">
              {blogs.slice(0, visibleCount).map((blog, index) => (
                <div 
                  className={`polaroid-card ${getRotationClass(index)} reveal`} 
                  key={blog.id}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="polaroid-image-frame">
                    <img 
                      src={blog.coverImage || 'assets/lookbook_polaroid_1.png'} 
                      alt={blog.title} 
                      className="polaroid-image" 
                    />
                  </div>
                  <div className="polaroid-caption" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                    {truncateTitle(blog.title)}
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < blogs.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={handleLoadMore}
                  style={{ color: 'var(--ink)', borderColor: 'var(--ink)', padding: '14px 28px', fontSize: '11px' }}
                >
                  LOAD MORE BLOGS
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* MID SECTION BANNER */}
      <section className="lookbook-banner">
        <div className="lookbook-banner-left reveal">
          <div className="hero-tagline" style={{ color: 'white' }}>Our Vision</div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' }}>
            Designed to last. <br />Earmarked to support.
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', maxWidth: '450px', lineHeight: '1.7', marginBottom: '30px' }}>
            Every product item represents a double footprint: an aesthetic garment in your hands, and a fixed ₹23 contribution directly supporting real community programs. No middlemen, no fine print.
          </p>
          <div className="hero-buttons">
            <a href="/our-mission" className="btn btn-outline" style={{ fontSize: '11px', padding: '12px 24px' }}>View the Promise</a>
          </div>
        </div>
        <div className="lookbook-banner-right reveal">
          <img src="assets/lookbook_polaroid_1.png" alt="LOG streetwear models lookbook" />
        </div>
      </section>

      {/* STATEMENT CTA */}
      <section className="statement-section">
        <div className="container">
          <h2 className="statement-title reveal">Liked the fits? <br /><span className="outline">Get Yours.</span></h2>
          <p className="statement-sub reveal">Explore heavyweight styles crafted for streetwear enthusiasts.</p>
          <a href="/" className="btn btn-white reveal">Shop the Drops</a>
        </div>
      </section>
    </>
  );
}
