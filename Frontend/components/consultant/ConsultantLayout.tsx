
import React, { useState } from 'react';
import ConsultantSidebar from './ConsultantSidebar';
import { ConsultantView } from './ConsultantDashboard';
import { useConsultant } from './ConsultantContext';
import { Bell, X, Menu, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsultantLayoutProps {
    children?: React.ReactNode;
    currentView: ConsultantView;
    onNavigate: (view: ConsultantView) => void;
    onLogout: () => void;
}

const ConsultantLayout = ({ children, currentView, onNavigate, onLogout }: ConsultantLayoutProps) => {
    const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const {
        consultant, notifications, markNotificationRead, markAllNotificationsRead
    } = useConsultant();

    const toggleDesktopSidebar = () => setDesktopSidebarOpen(!isDesktopSidebarOpen);
    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllRead = async () => {
        if (markingAllRead) return;
        setMarkingAllRead(true);
        try {
            await markAllNotificationsRead();
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markNotificationRead(notification.id);
        }

        if (notification.link) {
            // Parse link to navigate
            const path = notification.link.split('/');
            const view = path[path.length - 1] as ConsultantView;
            // Simple mapping for demo
            if (view === 'schedule' || view === 'analytics' || view === 'ai-creator' || view === 'settings') {
                onNavigate(view);
            }
            setShowNotifications(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020b18] text-gray-100 font-sans selection:bg-brand-gold selection:text-brand-navy flex relative overflow-x-hidden" dir="rtl">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-navy/20 rounded-full blur-[120px] opacity-30"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(#c6a568 1px, transparent 1px), linear-gradient(90deg, #c6a568 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
                </div>
            </div>

            <ConsultantSidebar
                isDesktopOpen={isDesktopSidebarOpen}
                isMobileOpen={isMobileMenuOpen}
                toggleDesktopSidebar={toggleDesktopSidebar}
                closeMobileMenu={closeMobileMenu}
                currentView={currentView}
                onNavigate={(view) => {
                    onNavigate(view);
                    closeMobileMenu();
                }}
                onLogout={onLogout}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 w-full ${isDesktopSidebarOpen ? 'lg:mr-[260px]' : 'lg:mr-[90px]'}`}>

                {/* Top Bar */}
                <header className="sticky top-0 z-30 px-4 lg:px-8 py-5 pointer-events-auto">
                    <div className="flex justify-between items-center relative">

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2.5 text-white bg-[#0f2344]/50 hover:bg-[#0f2344] backdrop-blur-md rounded-xl border border-white/10 transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center gap-3 lg:gap-4 mr-auto">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`relative p-2 rounded-xl border transition-all group backdrop-blur-md shadow-lg ${unreadCount > 0 ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' : 'bg-[#0f2344]/50 hover:bg-[#0f2344] border-white/5 text-gray-400 hover:text-white'}`}
                                >
                                    <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#020b18] shadow-sm animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
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
                                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative group ${!n.read ? 'bg-brand-gold/5' : ''}`}
                                                        >
                                                            {!n.read && <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold"></div>}
                                                            <div className="flex justify-between items-start mb-1 pl-6">
                                                                <span className={`text-sm font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</span>
                                                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{n.time}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-300 mb-2 leading-relaxed">{n.message}</p>
                                                            {n.link && (
                                                                <span className="text-[10px] text-brand-gold hover:underline flex items-center gap-1">
                                                                    عرض التفاصيل <ArrowLeft size={10} />
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

                            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>

                            {/* User Profile Trigger */}
                            <button
                                onClick={() => onNavigate('settings')}
                                className="flex items-center gap-3 bg-[#0f2344]/50 hover:bg-[#0f2344] backdrop-blur-md border border-white/5 p-1 pr-3 rounded-xl transition-all shadow-lg group"
                            >
                                <div className="text-left hidden sm:block leading-tight">
                                    <p className="text-sm font-bold text-white group-hover:text-brand-gold transition-colors">{consultant.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">استشاري معتمد</p>
                                </div>
                                <img
                                    src={consultant.avatar}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full border-2 border-brand-gold/50 shadow-md object-cover"
                                />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 mt-2">
                    <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
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

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
                    onClick={closeMobileMenu}
                ></div>
            )}
        </div>
    );
};

export default ConsultantLayout;
