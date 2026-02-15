
import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, ShoppingBag, BookOpen, Home, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useGlobal } from './GlobalContext';

const LOGO_URL = "/Primary.png";

interface NavbarProps {
  onNavigate?: (page: string) => void;
}

const Navbar = ({ onNavigate }: NavbarProps) => {
  const { currentUser } = useGlobal();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      const previous = scrollY.getPrevious() ?? 0;
      const isScrollingDown = latest > previous;
      const isScrollingUp = latest < previous;

      if (isScrollingDown && latest > 100) {
        setVisible(false);
      } else if (isScrollingUp) {
        setVisible(true);
      }

      setScrolled(latest > 50);
    });

    return () => unsubscribe();
  }, [scrollY]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavigation = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (item.action && onNavigate) {
      onNavigate(item.action);
    } else if (item.href) {
      if (onNavigate) onNavigate('home');
      setTimeout(() => {
        const targetId = item.href.replace('#', '');
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Updated Links Configuration based on request
  const navLinks = [
    { name: 'الرئيسية', href: '#hero', icon: <Home size={18} /> },
    { name: 'الكورسات', action: 'public-courses', icon: <BookOpen size={18} /> },
    { name: 'الاستشارات', action: 'public-consultations', icon: <GraduationCap size={18} /> }, // Renamed from التدريب
    { name: 'متجر الكتب', action: 'public-library', icon: <ShoppingBag size={18} /> },
  ];

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 },
        }}
        initial="visible"
        animate={visible ? "visible" : "hidden"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pointer-events-none px-4"
      >
        <div
          className={`
            pointer-events-auto flex items-center justify-between py-2 px-3 pl-2 rounded-full transition-all duration-300
            ${scrolled
              ? 'bg-white/90 backdrop-blur-xl shadow-lg border border-white/20 w-full max-w-4xl'
              : 'bg-white/70 backdrop-blur-md border border-white/40 w-full max-w-5xl mt-2 shadow-sm'}
          `}
        >
          {/* Logo Area */}
          <div className="flex items-center shrink-0 pr-2">
            <a href="#hero" onClick={(e) => handleNavigation(e, { href: '#hero' })}>
              <img
                src={LOGO_URL}
                alt="Future Thinking Logo"
                className={`transition-all duration-300 object-contain hover:scale-105 ${scrolled ? 'h-9' : 'h-11'}`}
              />
            </a>
          </div>

          {/* Desktop Links - Centered & Capsule Style */}
          <div className="hidden lg:flex items-center gap-1 mx-auto bg-[#0f2c59]/5 p-1 rounded-full border border-white/50">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href || '#'}
                onClick={(e) => handleNavigation(e, link)}
                className={`
                  relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2
                  text-brand-navy hover:bg-white hover:shadow-sm hover:text-brand-gold
                `}
              >
                <span>{link.icon}</span>
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Always show "دخول المنصة" - Dashboard has its own navigation */}
            <button
              onClick={() => onNavigate && onNavigate('auth')}
              className="hidden sm:flex items-center gap-2 bg-[#0f2c59] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-md group whitespace-nowrap"
            >
              <span>دخول المنصة</span>
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 text-brand-navy hover:bg-white bg-white/50 rounded-full transition-colors active:scale-95 border border-white/20 backdrop-blur-sm"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay (Side Drawer) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 right-0 w-[85%] max-w-xs bg-white z-[51] shadow-2xl flex flex-col lg:hidden rounded-l-[2rem]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-tl-[2rem]">
                <h2 className="text-xl font-bold text-brand-navy">القائمة</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-white rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm border border-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-3">
                {navLinks.map((link, idx) => (
                  <motion.a
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    href={link.href || '#'}
                    onClick={(e) => handleNavigation(e, link)}
                    className="text-lg font-bold p-4 rounded-2xl flex justify-between items-center transition-all bg-gray-50 border border-transparent hover:border-brand-gold/30 hover:bg-white hover:shadow-md text-brand-navy"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-brand-gold">{link.icon}</span>
                      {link.name}
                    </span>
                  </motion.a>
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-bl-[2rem]">
                <button
                  onClick={() => { setMobileMenuOpen(false); if (onNavigate) onNavigate(currentUser ? 'dashboard' : 'auth'); }}
                  className="w-full bg-brand-navy text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-navy transition-colors active:scale-95"
                >
                  <><LogIn className="w-5 h-5" /> تسجيل الدخول</>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
