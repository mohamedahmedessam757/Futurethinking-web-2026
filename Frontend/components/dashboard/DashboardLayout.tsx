
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { DashboardView } from './StudentDashboard';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  onLogout: () => void;
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const DashboardLayout = ({ children, onLogout, currentView, onNavigate }: DashboardLayoutProps) => {
  // Desktop Sidebar State (Expanded/Collapsed - Default Expanded)
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Mobile Sidebar State (Visible/Hidden - Default Hidden)
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDesktopSidebar = () => setDesktopSidebarOpen(!isDesktopSidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#06152e] text-gray-100 font-sans selection:bg-brand-gold selection:text-brand-navy flex relative overflow-x-hidden" dir="rtl">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100 transition-opacity">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-navy/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-brand-gold/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      {/* Sidebar - Handles both mobile overlay and desktop fixed layout */}
      <Sidebar
        isDesktopOpen={isDesktopSidebarOpen}
        isMobileOpen={isMobileMenuOpen}
        toggleDesktopSidebar={toggleDesktopSidebar}
        closeMobileMenu={closeMobileMenu}
        onLogout={onLogout}
        currentView={currentView}
        onNavigate={(view) => {
          onNavigate(view);
          closeMobileMenu(); // Auto close on mobile nav
        }}
      />

      {/* Main Content Area */}
      {/* Logic: On mobile, no margin. On Desktop, margin equals sidebar width. */}
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 w-full ${isDesktopSidebarOpen ? 'lg:mr-64' : 'lg:mr-[90px]'}`}>
        <Header
          onMobileMenuToggle={toggleMobileMenu}
          onNavigate={onNavigate}
        />

        {/* Scrollable Content */}
        <main className="flex-1 p-4 lg:p-8 mt-4">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* WhatsApp Support Button */}
      <a
        href="https://wa.me/966534786272"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 group"
        title="تواصل مع الدعم"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          تواصل مع الدعم
        </span>
      </a>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;
