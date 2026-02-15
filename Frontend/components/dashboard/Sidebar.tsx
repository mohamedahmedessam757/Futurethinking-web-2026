
import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Calendar, Award,
  ShoppingBag, CreditCard, Settings, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { DashboardView } from './StudentDashboard';

const LOGO_URL = "/Primary.png";

interface SidebarProps {
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  toggleDesktopSidebar: () => void;
  closeMobileMenu: () => void;
  onLogout: () => void;
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const Sidebar = ({ isDesktopOpen, isMobileOpen, toggleDesktopSidebar, closeMobileMenu, onLogout, currentView, onNavigate }: SidebarProps) => {

  const menuItems = [
    { id: 'overview', name: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', name: 'التدريب والكورسات', icon: <BookOpen size={20} /> }, // Renamed from دوراتي
    { id: 'library', name: 'متجر الكتب', icon: <ShoppingBag size={20} /> }, // Renamed from المكتبة الرقمية & Icon Changed
    { id: 'schedule', name: 'الاستشارات', icon: <Calendar size={20} /> },
    { id: 'certificates', name: 'الشهادات', icon: <Award size={20} /> },
    { id: 'payments', name: 'المدفوعات', icon: <CreditCard size={20} /> },
    { id: 'settings', name: 'الإعدادات', icon: <Settings size={20} /> },
  ];

  return (
    <>
      <aside
        className={`
            fixed top-0 right-0 h-full bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/5 z-[60] lg:z-40 shadow-2xl flex flex-col justify-between transition-all duration-300 ease-in-out
            ${isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'}
            ${isDesktopOpen ? 'lg:w-64' : 'lg:w-[90px]'}
        `}
      >
        {/* Header */}
        <div className="h-20 lg:h-28 flex items-center justify-center border-b border-white/5 relative shrink-0">
          {/* Logo */}
          <div className={`transition-all duration-300 flex items-center justify-center ${!isDesktopOpen && 'lg:scale-75'}`}>
            <img
              src={LOGO_URL}
              alt="Logo"
              className={`object-contain filter brightness-0 invert ${isDesktopOpen ? 'h-10 lg:h-16 w-auto' : 'h-10 w-auto'}`}
            />
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 bg-brand-gold text-brand-navy rounded-full p-1.5 shadow-lg hover:bg-brand-navy hover:text-white transition-colors"
          >
            {isDesktopOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileMenu}
            className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 lg:px-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              // On Mobile: always show text. On Desktop: show text if open.
              const showText = isMobileOpen || isDesktopOpen;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as DashboardView)}
                  className={`
                    w-full flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive
                      ? 'bg-brand-gold/10 text-brand-gold font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'}
                    ${!showText && 'justify-center'}
                  `}
                  title={!showText ? item.name : ''}
                >
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold rounded-l-full"></div>
                  )}
                  <div className={`${isActive ? 'text-brand-gold' : 'text-gray-400 group-hover:text-white'} shrink-0`}>
                    {item.icon}
                  </div>

                  {showText && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors
              ${(!isDesktopOpen && !isMobileOpen) && 'justify-center'}
            `}
            title="تسجيل الخروج"
          >
            <LogOut size={20} />
            {(isDesktopOpen || isMobileOpen) && <span className="font-bold">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
