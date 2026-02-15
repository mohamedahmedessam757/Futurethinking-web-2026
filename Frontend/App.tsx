
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { GlobalProvider, useGlobal } from './components/GlobalContext';
import { ToastProvider } from './components/ui/ToastContext';
import NotificationListener from './components/NotificationListener';
import { AlertTriangle, Lock } from 'lucide-react';

// Import Layouts & Pages
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import AboutIdentity from './components/AboutIdentity';
import VisionMissionValues from './components/VisionMissionValues';
import Methodology from './components/Methodology';
import Services from './components/Services';
import TargetSectors from './components/TargetSectors';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';

// Lazy Load Heavy Components (Code Splitting for Performance)
const AuthPage = lazy(() => import('./components/AuthPage'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const AuthCallbackPage = lazy(() => import('./components/pages/AuthCallbackPage'));
const StudentDashboard = lazy(() => import('./components/dashboard/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ConsultantDashboard = lazy(() => import('./components/consultant/ConsultantDashboard'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./components/pages/TermsConditions'));
const PublicCourses = lazy(() => import('./components/public/PublicCourses'));
const PublicConsultations = lazy(() => import('./components/public/PublicConsultations'));
const PublicLibrary = lazy(() => import('./components/public/PublicLibrary'));
const StandaloneEditorPage = lazy(() => import('./components/admin/pages/StandaloneEditorPage'));

// Debug Component for RLS Testing (REMOVE AFTER DEBUGGING)
import DebugRLS from './components/DebugRLS';

// Updated to match GlobalContext
export type UserRole = 'guest' | 'student' | 'admin' | 'instructor' | 'consultant';

const LoadingScreen = ({ showSlowMessage }: { showSlowMessage?: boolean }) => (
  <div className="min-h-screen bg-[#06152e] flex flex-col items-center justify-center text-white">
    <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-brand-gold font-bold animate-pulse">جاري التحميل...</p>
    {showSlowMessage && (
      <p className="mt-4 text-red-400 text-sm animate-fade-in text-center max-w-md px-4">
        يستغرق التحميل وقتاً أطول من المعتاد. يرجى الانتظار أو تحديث الصفحة.
      </p>
    )}
  </div>
);

// Maintenance Screen Component
interface MaintenanceScreenProps {
  onLogin: () => void;
}

const MaintenanceScreen = ({ onLogin }: MaintenanceScreenProps) => (
  <div className="min-h-screen bg-[#06152e] flex flex-col items-center justify-center text-white px-4 text-center relative overflow-hidden" dir="rtl">
    {/* Background Ambience */}
    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[150px]"></div>

    <div className="relative z-10 p-8 border border-white/5 bg-white/5 backdrop-blur-md rounded-3xl max-w-lg shadow-2xl">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">الموقع تحت الصيانة</h1>
      <p className="text-gray-300 text-lg mb-8 leading-relaxed">
        نحن نقوم حالياً بإجراء بعض التحسينات والتحديثات الهامة على النظام لتقديم تجربة أفضل.
        <br />
        سنعود للعمل قريباً.
      </p>

      {/* Clickable Admin Access Link */}
      <button
        onClick={onLogin}
        className="inline-flex items-center gap-2 text-sm text-gray-500 bg-[#06152e] px-4 py-2 rounded-full border border-white/10 hover:text-brand-gold hover:border-brand-gold/50 transition-all cursor-pointer group"
      >
        <Lock size={14} className="group-hover:text-brand-gold" /> الوصول مقيد للمشرفين فقط
      </button>
    </div>
  </div>
);

const AppContent = () => {
  const { currentUser, logout, systemSettings, isLoading } = useGlobal();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    // Check for OAuth callback URL
    if (window.location.pathname === '/auth/callback' || window.location.hash.includes('access_token')) {
      return 'auth-callback';
    }
    // Check for redirect param (CleanState Redirect)
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (redirectParam) return redirectParam;

    return 'home';
  });
  // State to handle direct navigation to specific dashboard tabs
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'courses' | 'library' | 'schedule'>('overview');
  const [selectedPublicItemId, setSelectedPublicItemId] = useState<string | null>(null);


  // MAINTENANCE LOGIC CHECK
  const isMaintenanceActive = systemSettings.maintenanceMode;
  // Admin bypasses maintenance. Everyone else (including guests) sees maintenance screen IF trying to access app.
  // Exception: AuthPage must be accessible so Admin can login.
  const canAccessApp = !isMaintenanceActive || (currentUser?.role === 'admin') || currentPage === 'auth' || currentPage === 'admin-editor';

  const handleNavigate = (page: string, param?: string) => {
    // Check for dashboard deep links
    if (page === 'dashboard-courses') {
      setDashboardTab('courses');
      if (param) setSelectedPublicItemId(param);
      setCurrentPage(currentUser ? 'dashboard' : 'auth');
    } else if (page === 'dashboard-library') {
      setDashboardTab('library');
      if (param) setSelectedPublicItemId(param);
      setCurrentPage(currentUser ? 'dashboard' : 'auth');
    } else if (page === 'dashboard-schedule') {
      setDashboardTab('schedule');
      if (param) setSelectedPublicItemId(param);
      setCurrentPage(currentUser ? 'dashboard' : 'auth');
    } else if (page === 'auth' && param) {
      // Handle redirect params from public pages
      window.history.pushState({}, '', `/auth?${param}`);
      setCurrentPage('auth');
    } else if (page.startsWith('public-')) {
      // Handle public page navigation with optional ID
      setSelectedPublicItemId(param || null);
      setCurrentPage(page);
    } else {
      // Standard navigation
      setDashboardTab('overview'); // Reset default
      setDashboardTab('overview'); // Reset default
      setCurrentPage(page);

      // Handle params for admin editor
      if (page === 'admin-editor' && param) {
        window.history.pushState({}, '', `/admin/editor?id=${param}`);
      }
    }

    window.scrollTo(0, 0);
  };

  // Sync current page with user role if logged in
  // Redirect to dashboard when user is loaded on auth/home pages
  useEffect(() => {
    // Redirect when user is loaded and on certain pages
    if (currentUser && (currentPage === 'auth' || currentPage === 'forgot-password' || currentPage === 'auth-callback' || currentPage === 'home')) {
      const timeout = setTimeout(() => {
        // Check for redirect params
        const params = new URLSearchParams(window.location.search);
        const redirectPage = params.get('redirect');
        const redirectId = params.get('id');

        if (redirectPage && redirectPage !== 'home' && redirectPage !== 'auth-callback') {
          if (redirectId) setSelectedPublicItemId(redirectId);
          setCurrentPage(redirectPage);
          window.history.pushState({}, '', '/');
        } else {
          // Default role-based routing
          if (currentUser.role === 'admin') {
            if (window.location.pathname.includes('/admin/editor')) {
              setCurrentPage('admin-editor');
            } else {
              setCurrentPage('admin');
            }
          } else if (currentUser.role === 'consultant') {
            setCurrentPage('consultant');
          } else {
            setCurrentPage('dashboard');
          }
          window.history.pushState({}, '', '/');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentUser, currentPage]);

  const handleLogout = () => {
    logout();
    handleNavigate('home');
  };

  // Expose navigation to window for deep component access
  useEffect(() => {
    (window as any).navigateApp = handleNavigate;
  }, []);

  // --- Maintenance Guard Render ---
  if (!canAccessApp) {
    return <MaintenanceScreen onLogin={() => handleNavigate('auth')} />;
  }

  // --- Global Loading Guard ---
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => setShowSlowMessage(true), 8000); // Show warning after 8s
    } else {
      setShowSlowMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // --- OAuth Redirect Cleanup ---
  // The AuthCallbackPage now redirects to '/' and the role-based routing 
  // in the useEffect above (lines 140-162) handles navigation automatically.
  // No additional localStorage handling needed.

  if (isLoading) {
    return <LoadingScreen showSlowMessage={showSlowMessage} />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {/* Landing Page Route */}
      {currentPage === 'home' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900 overflow-x-hidden selection:bg-brand-gold selection:text-white" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <main>
            <Hero onNavigate={(page: any) => handleNavigate(page)} />
            <Stats />
            <AboutIdentity />
            <VisionMissionValues />
            <Methodology />
            <Services />
            <TargetSectors />
            <Newsletter />
          </main>
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {/* Auth Route */}
      {currentPage === 'auth' && (
        <AuthPage
          onBack={() => handleNavigate('home')}
          onForgotPassword={() => handleNavigate('forgot-password')}
        />
      )}

      {/* Forgot Password Route */}
      {currentPage === 'forgot-password' && (
        <ForgotPassword
          onBack={() => handleNavigate('auth')}
        />
      )}

      {/* OAuth Callback Route */}
      {currentPage === 'auth-callback' && (
        <AuthCallbackPage />
      )}

      {/* Legal Pages */}
      {currentPage === 'privacy' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <PrivacyPolicy />
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {currentPage === 'terms' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <TermsConditions />
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {/* Public Pages Routes */}
      {currentPage === 'public-courses' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <PublicCourses onNavigate={handleNavigate} selectedId={selectedPublicItemId} />
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {currentPage === 'public-consultations' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <PublicConsultations onNavigate={handleNavigate} selectedId={selectedPublicItemId} />
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {currentPage === 'public-library' && (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900" dir="rtl">
          <Navbar onNavigate={handleNavigate} />
          <PublicLibrary onNavigate={handleNavigate} selectedId={selectedPublicItemId} />
          <Footer onNavigate={(page: any) => handleNavigate(page)} />
        </div>
      )}

      {/* Student Dashboard Route */}
      {currentPage === 'dashboard' && currentUser && (
        <StudentDashboard
          onLogout={handleLogout}
          initialView={dashboardTab} // Pass the deep-link tab
          initialSelectedItemId={selectedPublicItemId}
        />
      )}

      {/* Admin Dashboard Route */}
      {currentPage === 'admin' && currentUser && (
        <AdminDashboard userRole={currentUser.role as any} onLogout={handleLogout} />
      )}

      {/* Admin Standalone Editor */}
      {currentPage === 'admin-editor' && currentUser && (
        <StandaloneEditorPage />
      )}

      {/* Consultant Dashboard Route */}
      {currentPage === 'consultant' && currentUser && (
        <ConsultantDashboard userRole={currentUser.role as any} onLogout={handleLogout} />
      )}
    </Suspense>
  );
};

const App = () => (
  <GlobalProvider>
    <ToastProvider>
      {/* DEBUG: Uncomment to enable debug overlay
      <DebugRLS /> */}
      <AppContent />
      <NotificationListener />
    </ToastProvider>
  </GlobalProvider>
);

export default App;
