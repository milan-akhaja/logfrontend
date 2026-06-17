import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { mediaUrl } from '../lib/urls';

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/blogs')
      .then(res => res.json())
      .then(data => {
        const found = data.find(b => b.id === id);
        setBlog(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching blog detail:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '160px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: '700' }}>Loading blog post...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container" style={{ padding: '160px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '15px' }}>Blog Post Not Found</h2>
        <p style={{ color: 'var(--grey-muted)', marginBottom: '30px' }}>The entry you are looking for does not exist or has been deleted.</p>
        <button className="btn btn-accent" onClick={() => navigate('/log-book')}>Back to Log Book</button>
      </div>
    );
  }

  const renderBlock = (block, index) => {
    const textStyle = {
      textTransform: block.uppercase ? 'uppercase' : 'none',
      backgroundColor: block.highlight ? 'rgba(229, 62, 62, 0.08)' : 'transparent',
      borderLeft: block.highlight ? '3px solid var(--accent)' : 'none',
      paddingLeft: block.highlight ? '15px' : '0px',
      paddingTop: block.highlight ? '8px' : '0px',
      paddingBottom: block.highlight ? '8px' : '0px',
      borderRadius: '2px',
      fontWeight: block.uppercase ? '800' : 'inherit'
    };

    switch (block.type) {
      case 'h1':
        return <h1 key={index} style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '900', marginTop: '30px', marginBottom: '15px', color: 'var(--ink)', ...textStyle }}>{block.text}</h1>;
      case 'h2':
        return <h2 key={index} style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: '900', marginTop: '25px', marginBottom: '12px', color: 'var(--ink)', ...textStyle }}>{block.text}</h2>;
      case 'h3':
        return <h3 key={index} style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '800', marginTop: '20px', marginBottom: '10px', color: 'var(--ink)', ...textStyle }}>{block.text}</h3>;
      case 'h4':
        return <h4 key={index} style={{ fontSize: '18px', fontWeight: '800', marginTop: '15px', marginBottom: '8px', color: 'var(--ink)', ...textStyle }}>{block.text}</h4>;
      case 'h5':
        return <h5 key={index} style={{ fontSize: '15px', fontWeight: '800', marginTop: '15px', marginBottom: '8px', color: 'var(--ink)', ...textStyle }}>{block.text}</h5>;
      case 'h6':
        return <h6 key={index} style={{ fontSize: '13px', fontWeight: '800', marginTop: '15px', marginBottom: '8px', color: 'var(--ink)', ...textStyle }}>{block.text}</h6>;
      case 'p':
      case 'paragraph':
        return <p key={index} style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '20px', color: 'var(--grey-dark)', ...textStyle }}>{block.text}</p>;
      case 'image':
        return (
          <div key={index} style={{ margin: '30px 0', textAlign: 'center' }}>
            <img
              src={mediaUrl(block.url)}
              alt="Blog attachment"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', boxShadow: 'var(--shadow-sm)' }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <article className="blog-detail-container" style={{ marginTop: '100px', paddingBottom: '80px' }}>
        {/* Cover Section */}
        <div style={{ position: 'relative', height: '400px', width: '100%', overflow: 'hidden', background: '#111113' }}>
          <img
            src={mediaUrl(blog.coverImage || 'assets/lookbook_polaroid_1.png')}
            alt={blog.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
          />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '40px 0', background: 'linear-gradient(to top, rgba(17,17,19,0.9), transparent)' }}>
            <div className="container">
              <button
                onClick={() => navigate('/log-book')}
                style={{ background: 'none', border: 'none', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.05em' }}
              >
                <ArrowLeft size={14} /> Back to Log Book
              </button>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '900', color: 'white', textTransform: 'uppercase', lineHeight: '1.1', maxWidth: '800px' }}>
                {blog.title}
              </h1>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '15px' }}>
                <Clock size={12} />
                <span>{new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container" style={{ maxWidth: '800px', marginTop: '50px' }}>
          <div className="blog-content-body">
            {blog.content && blog.content.length > 0 ? (
              blog.content.map((block, idx) => renderBlock(block, idx))
            ) : (
              <p style={{ color: 'var(--grey-muted)', fontStyle: 'italic' }}>This blog post has no content blocks.</p>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
