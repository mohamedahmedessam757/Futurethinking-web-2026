
import React, { useState } from 'react';
import { Bell, X, Menu, Loader2 } from 'lucide-react';
import { useAdmin } from './AdminContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

const AdminHeader = ({ onMobileMenuToggle }: AdminHeaderProps) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, adminUser } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (markingAllRead) return; // Prevent double-clicks
    setMarkingAllRead(true);
    try {
      await markAllNotificationsRead();
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 px-4 lg:px-6 py-4 pointer-events-auto">
      <div className="flex justify-between items-center relative">

        {/* Mobile Menu Trigger */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-white bg-[#0f172a]/50 backdrop-blur-md rounded-lg border border-white/10"
        >
          <Menu size={24} />
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3 lg:gap-4 mr-auto">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                relative p-2 lg:p-2.5 rounded-xl border transition-all group backdrop-blur-md shadow-lg
                ${unreadCount > 0 ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' : 'bg-[#0f172a]/50 hover:bg-[#0f172a] border-white/5 text-gray-400 hover:text-white'}
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
                  className="absolute left-0 mt-4 w-72 lg:w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#06152e]">
                    <h4 className="font-bold text-white text-sm">الإشعارات</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                        className={`text-[10px] text-brand-gold hover:text-white transition-colors flex items-center gap-1 ${markingAllRead ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {markingAllRead && <Loader2 size={10} className="animate-spin" />}
                        تحديد الكل كمقروء
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">لا توجد إشعارات</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-brand-gold/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</span>
                            {!n.read && <span className="w-1.5 h-1.5 bg-brand-gold rounded-full shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-gray-500 block text-left ltr">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pl-2 pr-2 lg:pr-4 mr-1 bg-[#0f172a]/50 hover:bg-[#0f172a] backdrop-blur-md border border-white/5 rounded-xl transition-all shadow-lg py-1.5">
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-white">{adminUser?.name || 'مدير النظام'}</p>
              <p className="text-xs text-brand-gold">{adminUser?.title || 'Super Admin'}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-brand-gold to-white p-[1px] relative">
              <div className="w-full h-full rounded-full bg-[#06152e] overflow-hidden">
                <img src={adminUser?.avatar || "https://ui-avatars.com/api/?name=Admin&background=c6a568&color=fff"} className="w-full h-full object-cover" alt="Admin" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#06152e] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
