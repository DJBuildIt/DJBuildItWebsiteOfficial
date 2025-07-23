import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { TYPOGRAPHY, COLORS, ANIMATIONS, TOUCH_TARGETS, MOBILE_LAYOUT } from '@/lib/design-system';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Add background when scrolled down
      setIsScrolled(currentScrollY > 20);
      
      // Hide/show header based on scroll direction (mobile only)
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down
          setIsHeaderVisible(false);
        } else {
          // Scrolling up
          setIsHeaderVisible(true);
        }
      } else {
        // Always show on desktop
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Header - Clean design with scroll behavior */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      } ${isScrolled ? 'bg-black/20 backdrop-blur-sm border-b border-white/10' : ''}`}>
        <div className="flex justify-between items-center p-2 sm:p-2 md:p-3">
          {/* Logo */}
          <Link 
            to="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`${TYPOGRAPHY.label.primary} ${COLORS.text.primary} ${ANIMATIONS.transition.colors} hover:text-white/80 ${TOUCH_TARGETS.comfortable} flex items-center justify-center`}
          >
            DJBUILDIT
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6 xl:space-x-8">
            <Link 
              to="/finance" 
              className={`${TYPOGRAPHY.label.small} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${ANIMATIONS.hover.scale} ${TOUCH_TARGETS.minimum} flex items-center justify-center hover:text-blue-400`}
            >
              FINANCE
            </Link>
            <Link 
              to="/fitness" 
              className={`${TYPOGRAPHY.label.small} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${ANIMATIONS.hover.scale} ${TOUCH_TARGETS.minimum} flex items-center justify-center hover:text-emerald-400`}
            >
              FITNESS
            </Link>
            <Link 
              to="/apps" 
              className={`${TYPOGRAPHY.label.small} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${ANIMATIONS.hover.scale} ${TOUCH_TARGETS.minimum} flex items-center justify-center hover:text-purple-400`}
            >
              APPS
            </Link>
            <Link 
              to="/store" 
              className={`${TYPOGRAPHY.label.small} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${ANIMATIONS.hover.scale} ${TOUCH_TARGETS.minimum} flex items-center justify-center hover:text-pink-400`}
            >
              STORE
            </Link>
            <Link 
              to="/contact" 
              className={`${TYPOGRAPHY.label.small} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${ANIMATIONS.hover.scale} ${TOUCH_TARGETS.minimum} flex items-center justify-center hover:text-cyan-400`}
            >
              CONTACT
            </Link>
          </nav>

          {/* Mobile Menu Button - Visible only on mobile */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center`}
              aria-label="Toggle Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={MOBILE_LAYOUT.mobileNav.overlay}>
          <div 
            className={MOBILE_LAYOUT.mobileNav.backdrop}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <nav className="absolute top-12 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-white/10 p-6">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/finance" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center hover:text-blue-400 ${MOBILE_LAYOUT.mobileNav.item}`}
              >
                FINANCE
              </Link>
              <Link 
                to="/fitness" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center hover:text-emerald-400 ${MOBILE_LAYOUT.mobileNav.item}`}
              >
                FITNESS
              </Link>
              <Link 
                to="/apps" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center hover:text-purple-400 ${MOBILE_LAYOUT.mobileNav.item}`}
              >
                APPS
              </Link>
              <Link 
                to="/store" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center hover:text-pink-400 ${MOBILE_LAYOUT.mobileNav.item}`}
              >
                STORE
              </Link>
              <Link 
                to="/contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.comfortable} flex items-center justify-center hover:text-cyan-400 py-3`}
              >
                CONTACT
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header; 