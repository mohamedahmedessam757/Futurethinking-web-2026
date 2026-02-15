
import React, { useState } from 'react';
import { UserRole } from '../../App';
import AdminLayout from './AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AICourseCreator from './pages/AICourseCreator';
import AdminAIDraftsPage from './pages/AdminAIDraftsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminFinancePage from './pages/AdminFinancePage';
import AdminCourseManagement from './pages/AdminCourseManagement';
import AdminLibraryManagement from './pages/AdminLibraryManagement';
import AdminConsultationsPage from './pages/AdminConsultationsPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import { AdminProvider } from './AdminContext';

interface AdminDashboardProps {
  userRole: UserRole;
  onLogout: () => void;
}

export type AdminView = 'overview' | 'ai-creator' | 'ai-drafts' | 'users' | 'finance' | 'withdrawals' | 'settings' | 'courses' | 'library' | 'consultations';

const AdminDashboardContent = ({ userRole, onLogout }: AdminDashboardProps) => {
  // Initialize view from URL if present
  const [currentView, setCurrentView] = useState<AdminView>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab as AdminView) || 'overview';
  });
  // State to hold data passed between views (e.g., search term for finance page)
  const [viewData, setViewData] = useState<any>(null);

  const handleNavigate = (view: AdminView, data?: any) => {
    setCurrentView(view);
    if (data) {
      setViewData(data);
    } else {
      setViewData(null); // Clear data if none provided
    }
    window.scrollTo(0, 0);
  };

  // RBAC Guard
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06152e] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-2">غير مصرح لك</h1>
          <p>ليس لديك صلاحيات للوصول إلى لوحة تحكم المشرف.</p>
          <button onClick={onLogout} className="mt-4 px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20">عودة</button>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <AdminOverview onNavigate={handleNavigate} />;
      case 'ai-creator': return <AICourseCreator />;
      case 'ai-drafts': return <AdminAIDraftsPage />;
      case 'users': return <AdminUsersPage />;
      case 'finance': return <AdminFinancePage initialSearch={viewData?.searchQuery} />;
      case 'withdrawals': return <AdminWithdrawalsPage />;
      case 'courses': return <AdminCourseManagement />;
      case 'library': return <AdminLibraryManagement />;
      case 'consultations': return <AdminConsultationsPage />;
      case 'settings': return <AdminSettingsPage />;
      default: return <AdminOverview onNavigate={handleNavigate} />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={onLogout}
    >
      {renderView()}
    </AdminLayout>
  );
};

const AdminDashboard = (props: AdminDashboardProps) => (
  <AdminProvider>
    <AdminDashboardContent {...props} />
  </AdminProvider>
);

export default AdminDashboard;
