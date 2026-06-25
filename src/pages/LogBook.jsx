import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../lib/urls';

export default function LogBook() {
  const [blogs, setBlogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
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
    return title.length > 52 ? `${title.slice(0, 52).trim()}...` : title;
  };

  const getBlogExcerpt = (blog) => {
    const content = Array.isArray(blog.content)
      ? blog.content.map(block => block.text).filter(Boolean).join(' ')
      : String(blog.content || '');
    const text = content || blog.excerpt || blog.description || '';
    return text.length > 155 ? `${text.slice(0, 155).trim()}...` : text;
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <>
      <section className="blog-index-page">
        <div className="blog-index-label">Blogs / News</div>
        <div className="blog-index-shell">
          {blogs.length === 0 ? (
            <p className="blog-empty-state">
              No log entries written yet. Check back soon!
            </p>
          ) : (
            <>
              <div className="blog-card-grid">
                {blogs.slice(0, visibleCount).map((blog) => (
                  <article
                    className="blog-card"
                    key={blog.id}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                  >
                    <div className="blog-card-image-frame">
                      <img
                        src={mediaUrl(blog.coverImage || blog.image || 'assets/lookbook_polaroid_1.png')}
                        alt={blog.title}
                        className="blog-card-image"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="blog-card-body">
                      <h2>{truncateTitle(blog.title)}</h2>
                      <p>{getBlogExcerpt(blog)}</p>
                    </div>
                  </article>
                ))}
              </div>

              {visibleCount < blogs.length && (
                <div className="blog-load-more-row">
                  <button
                    className="btn btn-outline"
                    onClick={handleLoadMore}
                  >
                    LOAD MORE BLOGS
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
