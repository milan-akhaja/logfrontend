import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Search, Menu, Compass, ShoppingBag } from 'lucide-react';
import StoriesOverlay from './StoriesOverlay';
import SearchOverlay from './SearchOverlay';
import BurgerMenuOverlay from './BurgerMenuOverlay';

export default function Navbar({ onCartOpen, cartCount, onShopNow }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [stories, setStories] = useState([]);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBottomNav, setShowBottomNav] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Hide bottom nav on scroll down, show on scroll up
      if (currentScrollY < 10) {
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollY) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Fetch stories on load
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories((data || []).filter((story) => story.mediaUrl || story.image)))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <header className={`${scrolled ? 'scrolled' : ''} ${!isHome ? 'solid-black-menu' : ''}`}>
        <div className="nav-container nav-bluorng-style">

          {/* Left: uppercase links */}
          <ul className="nav-menu nav-menu-left">
            <li>
              <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                SHOP
              </NavLink>
            </li>
            <li>
              <NavLink to="/new-in" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                NEW IN
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
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Search size={18} />
            </button>

            {/* Bag button */}
            <button className="bag-btn header-bag-btn pc-only" onClick={onCartOpen}>
              BAG {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
            </button>

            {/* Hamburger Burger icon */}
            <button
              className="nav-action-icon-btn burger-menu-trigger"
              onClick={() => setBurgerOpen(true)}
              title="Browse Categories"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>

          </div>
        </div>
      </header>

      {/* Floating Bottom Nav for Mobile Only */}
      <div className={`mobile-bottom-navbar mobile-only ${showBottomNav ? 'visible' : 'hidden'}`}>
        <div className="mobile-bottom-nav-inner">
          <Link to="/shop" className="mobile-bottom-nav-btn" title="All Products">
            <Compass size={22} />
          </Link>
          <button className="mobile-bottom-nav-btn" onClick={() => setSearchOpen(true)} title="Search">
            <Search size={22} />
          </button>
          <button className="mobile-bottom-nav-btn" onClick={onCartOpen} title="Cart" style={{ position: 'relative' }}>
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="mobile-bag-count">{cartCount}</span>}
          </button>
        </div>

        {/* Story button on the right, outside the bar */}
        {stories.length > 0 && (
          <div
            className="mobile-bottom-story-wrap"
            onClick={() => setStoriesOpen(true)}
          >
            <div className="mobile-bottom-story-inner">
              <span className="story-logo-text">LOG</span>
            </div>
          </div>
        )}
      </div>

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
