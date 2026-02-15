
import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import Overview from './StudentOverview';
import ProfilePage from './pages/ProfilePage';
import MyCoursesPage from './pages/MyCoursesPage';
import SchedulePage from './pages/SchedulePage';
import CertificatesPage from './pages/CertificatesPage';
import LibraryPage from './pages/LibraryPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import BookDetailsPage from './pages/BookDetailsPage';
import ConsultantDetailsPage from './pages/ConsultantDetailsPage'; // Import New Page
import { DashboardProvider } from './DashboardContext';

interface StudentDashboardProps {
  onLogout: () => void;
  initialView?: DashboardView;
  initialSelectedItemId?: string | null;
}

export type DashboardView = 'overview' | 'courses' | 'schedule' | 'certificates' | 'library' | 'payments' | 'settings' | 'profile' | 'course-details' | 'book-details' | 'consultant-details';

const StudentDashboardContent = ({ onLogout, initialView = 'overview', initialSelectedItemId = null }: StudentDashboardProps) => {
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedItemId);

  // Update view if prop changes
  useEffect(() => {
    if (initialView) {
      if (initialView === 'courses' && initialSelectedItemId) {
        setCurrentView('course-details');
        setSelectedId(initialSelectedItemId);
      } else if (initialView === 'library' && initialSelectedItemId) {
        setCurrentView('book-details');
        setSelectedId(initialSelectedItemId);
      } else if (initialView === 'schedule' && initialSelectedItemId) {
        setCurrentView('consultant-details');
        setSelectedId(initialSelectedItemId);
      } else {
        setCurrentView(initialView);
        // Only reset ID if explicit null? No, keep context if switching views might be jarring. 
        // But here we want to respect the prop.
        if (initialSelectedItemId) setSelectedId(initialSelectedItemId);
      }
    }
  }, [initialView, initialSelectedItemId]);

  // Listen for custom navigation events (from Course Details)
  useEffect(() => {
    const handleCustomNav = (e: any) => {
      if (e.detail && e.detail.view) {
        handleNavigate(e.detail.view, e.detail.id);
      }
    };
    window.addEventListener('dashboard-navigate', handleCustomNav);
    return () => window.removeEventListener('dashboard-navigate', handleCustomNav);
  }, []);

  const handleNavigate = (view: DashboardView, id?: string) => {
    if (id) setSelectedId(id);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <Overview onViewChange={handleNavigate} />;
      case 'profile': return <ProfilePage onNavigate={handleNavigate} />;
      case 'courses': return <MyCoursesPage onNavigate={handleNavigate} />;
      case 'schedule': return <SchedulePage onNavigate={handleNavigate} />;
      case 'certificates': return <CertificatesPage selectedCertId={selectedId} />;
      case 'library': return <LibraryPage onNavigate={handleNavigate} />;
      case 'payments': return <PaymentsPage />;
      case 'settings': return <SettingsPage />;
      case 'course-details': return <CourseDetailsPage courseId={selectedId} onBack={() => handleNavigate('courses')} />;
      case 'book-details': return <BookDetailsPage bookId={selectedId} onBack={() => handleNavigate('library')} />;
      case 'consultant-details': return <ConsultantDetailsPage consultantId={selectedId} onBack={() => handleNavigate('schedule')} />;
      default: return <Overview onViewChange={handleNavigate} />;
    }
  };

  // Full-screen views bypass the DashboardLayout entirely
  const isFullScreenView = currentView === 'course-details';

  if (isFullScreenView) {
    return (
      <div className="min-h-screen bg-[#06152e]" dir="rtl">
        <CourseDetailsPage courseId={selectedId} onBack={() => handleNavigate('courses')} />
      </div>
    );
  }

  return (
    <DashboardLayout
      onLogout={onLogout}
      currentView={currentView}
      onNavigate={handleNavigate}
    >
      {renderView()}
    </DashboardLayout>
  );
};

const StudentDashboard = (props: StudentDashboardProps) => (
  <DashboardProvider>
    <StudentDashboardContent {...props} />
  </DashboardProvider>
);

export default StudentDashboard;
