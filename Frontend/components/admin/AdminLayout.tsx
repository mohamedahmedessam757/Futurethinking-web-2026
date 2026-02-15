
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { AdminView } from './AdminDashboard';

interface AdminLayoutProps {
  children?: React.ReactNode;
  currentView: AdminView;
  onNavigate: (view: AdminView) => void;
  onLogout: () => void;
}

const AdminLayout = ({ children, currentView, onNavigate, onLogout }: AdminLayoutProps) => {
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDesktopSidebar = () => setDesktopSidebarOpen(!isDesktopSidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#06152e] text-gray-100 font-sans selection:bg-brand-gold selection:text-brand-navy flex relative overflow-x-hidden" dir="rtl">
      {/* Admin Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100 transition-opacity">
          <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-brand-navy/30 rounded-full blur-[120px] opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] opacity-30"></div>
          <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
          </div>
      </div>

      <AdminSidebar 
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

      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${isDesktopSidebarOpen ? 'lg:mr-64' : 'lg:mr-[90px]'}`}>
         <AdminHeader onMobileMenuToggle={toggleMobileMenu} />
         
         <main className="flex-1 p-4 lg:p-8 mt-4">
             <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
                 {children}
             </div>
         </main>
      </div>

       {/* Mobile Overlay */}
       {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={closeMobileMenu}
          ></div>
      )}
    </div>
  );
};

export default AdminLayout;
