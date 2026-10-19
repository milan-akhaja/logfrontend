import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Search, Menu, ShoppingBag } from 'lucide-react';
import StoriesOverlay from './StoriesOverlay';
import SearchOverlay from './SearchOverlay';
import BurgerMenuOverlay from './BurgerMenuOverlay';

const ANNOUNCEMENT_MESSAGES = [
  'COD AVAILABLE',
  'NO EXTRA FEES, TAXES INCLUDED',
  'FREE SHIPPING'
];
const ANNOUNCEMENT_CYCLES = Array.from({ length: 6 });

export default function Navbar({ onCartOpen, cartCount, onShopNow }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const cleanPath = location.pathname.toLowerCase().replace(/\/+$/, '');
  const isDarkPage = isHome || 
                     cleanPath === '/our-mission' ||  
                     cleanPath.startsWith('/blog');
  const [scrolled, setScrolled] = useState(false);
  const [stories, setStories] = useState([]);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch stories on load
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories((data || []).filter((story) => story.mediaUrl || story.image)))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <header className={`${scrolled ? 'scrolled' : ''} ${!isDarkPage ? 'transparent-inner-menu' : ''}`}>
        <div className="top-announcement-strip" role="region" aria-label="Announcement">
          <div className="announcement-track">
            <div className="announcement-group">
              {ANNOUNCEMENT_CYCLES.map((_, cycleIdx) => (
                <React.Fragment key={cycleIdx}>
                  {ANNOUNCEMENT_MESSAGES.map((msg, msgIdx) => (
                    <React.Fragment key={`${cycleIdx}-${msgIdx}`}>
                      <span className="announcement-item">{msg}</span>
                      <span className="announcement-divider" aria-hidden="true">•</span>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="announcement-group" aria-hidden="true">
              {ANNOUNCEMENT_CYCLES.map((_, cycleIdx) => (
                <React.Fragment key={cycleIdx}>
                  {ANNOUNCEMENT_MESSAGES.map((msg, msgIdx) => (
                    <React.Fragment key={`${cycleIdx}-${msgIdx}`}>
                      <span className="announcement-item">{msg}</span>
                      <span className="announcement-divider" aria-hidden="true">•</span>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="nav-container nav-bluorng-style">

          {/* Left: uppercase links */}
          <ul className="nav-menu nav-menu-left">
            <li>
              <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                SHOP
              </NavLink>
            </li>
            <li>
              <NavLink to="/our-mission" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                OUR MISSION
              </NavLink>
            </li>
            <li>
              <NavLink to="/log-book" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                LOG BOOK
              </NavLink>
            </li>
          </ul>

          {/* Center: logo */}
          <Link to="/" className="nav-logo logo-center">
            LOG
          </Link>

          {/* Right: story circle, search, bag, hamburger */}
          <div className="nav-right nav-right-actions">

            {/* Story Indicator Circle */}
            {stories.length > 0 && (
              <div
                className="bluorng-stories-wrap pc-only"
                onClick={() => setStoriesOpen(true)}
              >
                <div className="stories-circle-inner">
                  <span>LOG</span>

                </div>
              </div>
            )}

            {/* Search Icon button */}
            <button
              className="nav-action-icon-btn search-btn-trigger pc-only"
              onClick={() => setSearchOpen(true)}
              title="Search Products"
              aria-label="Search products"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Search size={18} />
            </button>

            {/* Bag button */}
            <button className="bag-btn header-bag-btn pc-only" onClick={onCartOpen} aria-label={`Open bag${cartCount > 0 ? ` with ${cartCount} item${cartCount > 1 ? 's' : ''}` : ''}`}>
              BAG {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
            </button>

            {/* Mobile header: story ring (always visible) */}
            {stories.length > 0 && (
              <div
                className="bluorng-stories-wrap header-story-mobile"
                role="button"
                tabIndex={0}
                aria-label="Open stories"
                onClick={() => setStoriesOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStoriesOpen(true); }}
              >
                <div className="stories-circle-inner">
                  <span>LOG</span>
                </div>
              </div>
            )}

            {/* Mobile header: bag with item count (always visible) */}
            <button
              type="button"
              className="nav-action-icon-btn header-bag-mobile"
              onClick={onCartOpen}
              aria-label={`Open bag${cartCount > 0 ? ` with ${cartCount} item${cartCount > 1 ? 's' : ''}` : ''}`}
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="header-bag-mobile-count">{cartCount}</span>}
            </button>

            {/* Hamburger Burger icon */}
            <button
              className="nav-action-icon-btn burger-menu-trigger"
              onClick={() => setBurgerOpen(true)}
              title="Browse Categories"
              aria-label="Open menu"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>

          </div>
        </div>
      </header>

      <StoriesOverlay
        isOpen={storiesOpen}
        onClose={() => setStoriesOpen(false)}
        stories={stories}
        onShopNow={onShopNow}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <BurgerMenuOverlay
        isOpen={burgerOpen}
        onClose={() => setBurgerOpen(false)}
        onOpenStories={() => {
          setBurgerOpen(false);
          setStoriesOpen(true);
        }}
      />
    </>
  );
}
