
import React, { useState, Suspense, lazy } from 'react';
import { UserRole } from '../../App';
import ConsultantLayout from './ConsultantLayout';
import { ConsultantProvider } from './ConsultantContext';

// Lazy Load Pages
const ConsultantOverview = lazy(() => import('./pages/ConsultantOverview'));
const ConsultantAICreator = lazy(() => import('./pages/ConsultantAICreator'));
const ConsultantAIDrafts = lazy(() => import('./pages/ConsultantAIDrafts'));
const ConsultantSchedule = lazy(() => import('./pages/ConsultantSchedule'));
const ConsultantSettings = lazy(() => import('./pages/ConsultantSettings'));
const ConsultantAnalytics = lazy(() => import('./pages/ConsultantAnalytics'));
const ConsultantServicesPage = lazy(() => import('./pages/ConsultantServicesPage'));
const ConsultantPaymentsPage = lazy(() => import('./pages/ConsultantPaymentsPage'));

interface ConsultantDashboardProps {
  userRole: UserRole;
  onLogout: () => void;
}

export type ConsultantView = 'overview' | 'ai-creator' | 'ai-drafts' | 'schedule' | 'analytics' | 'settings' | 'services' | 'payments';

const DashboardLoader = () => (
  <div className="flex items-center justify-center h-[50vh] w-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm animate-pulse">جاري تحميل البيانات...</p>
    </div>
  </div>
);

const ConsultantDashboardContent = ({ userRole, onLogout }: ConsultantDashboardProps) => {
  const [currentView, setCurrentView] = useState<ConsultantView>('overview');

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <ConsultantOverview onNavigate={setCurrentView} />;
      case 'services': return <ConsultantServicesPage />;
      case 'ai-creator': return <ConsultantAICreator />;
      case 'ai-drafts': return <ConsultantAIDrafts />;
      case 'schedule': return <ConsultantSchedule />;
      case 'analytics': return <ConsultantAnalytics />;
      case 'payments': return <ConsultantPaymentsPage />;
      case 'settings': return <ConsultantSettings />;
      default: return <ConsultantOverview onNavigate={setCurrentView} />;
    }
  };

  return (
    <ConsultantLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={onLogout}
    >
      <Suspense fallback={<DashboardLoader />}>
        {renderView()}
      </Suspense>
    </ConsultantLayout>
  );
};

const ConsultantDashboard = (props: ConsultantDashboardProps) => (
  <ConsultantProvider>
    <ConsultantDashboardContent {...props} />
  </ConsultantProvider>
);

export default ConsultantDashboard;
