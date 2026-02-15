import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Sparkles, Calendar, Settings, LogOut,
  ChevronRight, ChevronLeft, BarChart3, X, Briefcase, FolderOpen, Wallet
} from 'lucide-react';
import { ConsultantView } from './ConsultantDashboard';

const LOGO_URL = "/Primary.png";

interface SidebarProps {
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  toggleDesktopSidebar: () => void;
  closeMobileMenu: () => void;
  currentView: ConsultantView;
  onNavigate: (view: ConsultantView) => void;
  onLogout: () => void;
}

const ConsultantSidebar = ({ isDesktopOpen, isMobileOpen, toggleDesktopSidebar, closeMobileMenu, currentView, onNavigate, onLogout }: SidebarProps) => {

  const menuItems = [
    { id: 'overview', name: 'نظرة عامة', icon: <LayoutGrid size={20} /> },
    { id: 'services', name: 'إدارة خدماتي', icon: <Briefcase size={20} /> },
    { id: 'ai-creator', name: 'مساعد المستشار', icon: <Sparkles size={20} />, highlight: true },
    { id: 'ai-drafts', name: 'المسودات المحفوظة', icon: <FolderOpen size={20} /> },
    { id: 'schedule', name: 'جدول الاستشارات', icon: <Calendar size={20} /> },
    { id: 'analytics', name: 'التحليلات', icon: <BarChart3 size={20} /> },
    { id: 'payments', name: 'المدفوعات والسحب', icon: <Wallet size={20} /> },
    { id: 'settings', name: 'الإعدادات', icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`
        fixed top-0 right-0 h-full bg-[#06152e]/95 backdrop-blur-xl border-l border-white/5 z-40 shadow-2xl flex flex-col justify-between transition-all duration-300
        ${isMobileOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:translate-x-0'}
        ${isDesktopOpen ? 'lg:w-[260px]' : 'lg:w-[90px]'}
      `}
    >
      {/* Header */}
      <div className="h-28 flex items-center justify-center border-b border-white/5 relative shrink-0">
        <div className={`flex flex-col items-center transition-all ${!isDesktopOpen && 'lg:scale-75'}`}>
          <img
            src={LOGO_URL}
            alt="Logo"
            className={`object-contain transition-all duration-300 filter brightness-0 invert ${isDesktopOpen ? 'h-14 mb-2' : 'h-8 mb-1'}`}
          />
          {(isDesktopOpen || isMobileOpen) && <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold text-center">بوابة الخبراء</span>}
        </div>

        {/* Desktop Toggle */}
        <button
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 bg-brand-gold text-brand-navy rounded-full p-1.5 shadow-lg hover:bg-brand-navy hover:text-white transition-colors"
        >
          {isDesktopOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Mobile Close */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 lg:px-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-3">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            const isHighlight = item.highlight;
            const showText = isMobileOpen || isDesktopOpen;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ConsultantView)}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isActive
                    ? 'bg-brand-gold/20 text-brand-gold font-bold shadow-sm border-r-2 border-brand-gold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'}
                  ${isHighlight && !isActive ? 'hover:text-brand-gold' : ''}
                  ${!showText && 'justify-center'}
                `}
                title={!showText ? item.name : ''}
              >
                <div className={`${isActive ? 'text-brand-gold' : isHighlight ? 'text-brand-gold animate-pulse' : 'text-gray-400 group-hover:text-white'} shrink-0`}>
                  {item.icon}
                </div>

                {showText && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 text-right whitespace-nowrap"
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
        >
          <LogOut size={20} />
          {(isDesktopOpen || isMobileOpen) && <span className="font-bold">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default ConsultantSidebar;
