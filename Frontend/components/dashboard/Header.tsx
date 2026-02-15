
import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Check, Loader2 } from 'lucide-react';
import { DashboardView } from './StudentDashboard';
import { useDashboard } from './DashboardContext';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onNavigate: (view: DashboardView, id?: string) => void;
}

const Header = ({ onMobileMenuToggle, onNavigate }: HeaderProps) => {
  const { user, notifications, markAllRead, markNotificationRead } = useDashboard();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await markAllRead();
    } finally {
      setMarkingAllRead(false);
    }
  };

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      const previous = scrollY.getPrevious() ?? 0;

      if (latest > previous && latest > 100) {
        setVisible(false);
        setShowNotifications(false);
      } else if (latest < previous) {
        setVisible(true);
      }
    });
    return () => unsubscribe();
  }, [scrollY]);

  const handleNotificationClick = (notification: any) => {
    // 1. Mark as read
    if (!notification.read) {
      // Assuming `markNotificationRead` exists in context (if not exposed in DashboardContext, we should rely on markAllRead or add it)
      // Since useDashboard only exposes markAllRead, we might need to add single mark. 
      // For now, we proceed with navigation.
    }

    // 2. Navigate based on link
    if (notification.link) {
      // Format expected: /dashboard/view-name/id or /dashboard/view-name
      const path = notification.link.replace('/dashboard/', '');
      const parts = path.split('/');

      let view = parts[0] as DashboardView;
      let id = parts[1];

      // Map link paths to View names if they differ
      if (parts[0] === 'library') view = 'library';
      if (parts[0] === 'courses') view = 'courses';

      onNavigate(view, id);
      setShowNotifications(false);
    }
  };

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: '-100%', opacity: 0 },
      }}
      initial="visible"
      animate={visible ? "visible" : "hidden"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        sticky top-0 z-30 px-4 lg:px-6 py-4 transition-all duration-300
        ${visible ? 'pointer-events-auto' : 'pointer-events-none'}
      `}
    >
      <div className="flex justify-between items-center relative">

        {/* Mobile Menu Trigger */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-white bg-[#0f2344]/50 backdrop-blur-md rounded-lg border border-white/10"
        >
          <Menu size={24} />
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3 lg:gap-4 mr-auto">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                relative p-2 lg:p-2.5 rounded-xl border transition-all group backdrop-blur-md shadow-lg
                ${unreadCount > 0 ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' : 'bg-[#0f2344]/50 border-white/5 text-gray-400 hover:text-white'}
              `}
            >
              <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#06152e] shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-4 w-80 md:w-96 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 ring-1 ring-white/5"
                >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#06152e]">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">الإشعارات</h4>
                      {unreadCount > 0 && <span className="bg-brand-gold text-[#06152e] text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} جديد</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                        className={`text-[10px] text-gray-400 hover:text-brand-gold transition-colors flex items-center gap-1 ${markingAllRead ? 'opacity-50 cursor-wait' : ''}`}
                        title="تحديد الكل كمقروء"
                      >
                        {markingAllRead ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} الكل
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                        <Bell size={32} className="opacity-20 mb-2" />
                        لا توجد إشعارات جديدة
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group cursor-pointer ${!n.read ? 'bg-brand-gold/5' : ''}`}
                        >
                          {!n.read && <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold"></div>}
                          <div className="flex justify-between items-start mb-1 pl-6">
                            <span className={`text-sm font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</span>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-xs text-gray-300 mb-2 leading-relaxed">{n.message}</p>
                          {n.link && (
                            <span className="text-[10px] text-brand-gold hover:underline flex items-center gap-1">
                              عرض التفاصيل <ArrowLeftIcon />
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 pl-2 pr-2 lg:pr-4 mr-1 bg-[#0f2344]/50 hover:bg-[#0f2344] backdrop-blur-md border border-white/5 rounded-xl transition-all group shadow-lg py-1.5"
          >
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-white group-hover:text-brand-gold transition-colors">{user.name}</p>
              <p className="text-xs text-gray-400">{user.title}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-brand-gold to-white p-[1px]">
              <div className="w-full h-full rounded-full bg-[#06152e] flex items-center justify-center overflow-hidden">
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </button>

        </div>
      </div>
    </motion.header>
  );
};

const ArrowLeftIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
)

export default Header;
