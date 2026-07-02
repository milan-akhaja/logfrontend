import React, { useState, useEffect } from 'react';
import ContentBlockLines from '../components/ContentBlockLines';
import useContentBlocks from '../hooks/useContentBlocks';
import { appPath } from '../lib/urls';

export default function OurMission() {
  const [donationCount, setDonationCount] = useState(0);
  const contentBlocks = useContentBlocks();
  const missionHero = contentBlocks.mission_hero;
  const missionConscience = contentBlocks.mission_conscience;
  const missionStatement = contentBlocks.mission_statement;

  useEffect(() => {
    // 1. Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '/our-mission',
        sessionId: localStorage.getItem('log_session_id') || 'guest'
      })
    }).catch(() => {});

    // 2. Fetch and animate counter to actual total (baseline + orders)
    let animationFrameId;
    fetch('/api/donations/total')
      .then(res => res.json())
      .then(data => {
        const targetAmount = data.total || 759;
        const duration = 2000;
        const startTime = performance.now();
        let current = 0;

        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          
          current = Math.floor(eased * targetAmount);
          setDonationCount(current);

          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      })
      .catch(err => {
        console.error('Error loading donation total:', err);
        setDonationCount(759);
      });
 
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <>
      <section className="mission-showcase">
        <div className="container">
          <h1 className="mission-title-big reveal">
            <ContentBlockLines block={missionHero} />
          </h1>
          
          <p className="mission-intro reveal">
            {missionHero.body}
          </p>

          <div className="counter-container reveal">
            <div className="counter-glow-wrapper">
              <div className="counter-pulse-header">
                <span className="pulse-dot"></span>Live Donation Tracker - All Time
              </div>
              <div className="counter-num">
                ₹{donationCount.toLocaleString('en-IN')}
              </div>
              <div className="counter-desc">RUPEES AND COUNTING</div>
            </div>
          </div>

          {/* Core Pillars */}
          <div className="mission-grid">
            <div className="mission-card reveal">
              <div className="mission-num" style={{ color: 'white' }}>₹23</div>
              <h3 className="mission-card-title">Donated Per Product</h3>
              <p className="mission-card-text">
                Not a vague percentage. Every single product item in your order triggers a ₹23 donation, automatically. Buy 2 tees, ₹46 goes out the door with them.
              </p>
            </div>
            <div className="mission-card reveal">
              <div className="mission-num" style={{ color: 'white' }}>0</div>
              <h3 className="mission-card-title">Fine Print</h3>
              <p className="mission-card-text">
                No minimum spend. No special code needed. No "up to" asterisk. The donation happens on every product item, period. We put it on the homepage because we mean it.
              </p>
            </div>
            <div className="mission-card reveal">
              <div className="mission-num" style={{ color: 'white' }}>1</div>
              <h3 className="mission-card-title">Simple Promise</h3>
              <p className="mission-card-text">
                You shop for clothes you actually want to wear. We make sure something good happens every time you do. That's the whole deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO SECTION */}
      <section className="manifesto-section" style={{ background: missionConscience.background || 'var(--paper)' }}>
        <div className="container">
          <div className="manifesto-layout" style={{ textAlign: missionConscience.align || 'left' }}>
            <div className="manifesto-label reveal">{missionConscience.label}</div>
            <div className="manifesto-quote reveal">
              <ContentBlockLines block={missionConscience} />
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT CTA */}
      <section className="statement-section" style={{ background: missionStatement.background || 'var(--ink)' }}>
        <div className="container" style={{ textAlign: missionStatement.align || 'center' }}>
          <h2 className="statement-title reveal">
            <ContentBlockLines block={missionStatement} lineBreak={false} />
          </h2>
          <p className="statement-sub reveal" style={{ color: 'rgba(255,255,255,0.7)' }}>{missionStatement.body}</p>
          <a href={appPath(missionStatement.buttonLink || '/')} className="btn btn-accent reveal">
            {missionStatement.buttonText || 'Shop Collections'}
          </a>
        </div>
      </section>
    </>
  );
}
