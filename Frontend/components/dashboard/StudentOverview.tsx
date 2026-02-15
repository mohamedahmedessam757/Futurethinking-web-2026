import React from 'react';
import WelcomeBanner from './widgets/WelcomeBanner';
import StatsCards from './widgets/StatsCards';
import ActiveCourses from './widgets/ActiveCourses';
import UpcomingSchedule from './widgets/UpcomingSchedule';
import CertificatesWidget from './widgets/CertificatesWidget';
import { DashboardView } from './StudentDashboard';

interface OverviewProps {
  onViewChange: (view: DashboardView, id?: string) => void;
}

const StudentOverview = ({ onViewChange }: OverviewProps) => {
  return (
    <>
      <WelcomeBanner onNavigate={onViewChange} />
      
      <div className="my-8">
        <StatsCards />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column (Courses) */}
        <div className="lg:col-span-2 space-y-8">
           <ActiveCourses onNavigate={onViewChange} />
        </div>

        {/* Side Column (Schedule & Extras) */}
        <div className="lg:col-span-1 space-y-8">
           <UpcomingSchedule onNavigate={onViewChange} />
           <div className="w-full h-px bg-white/5 my-6"></div>
           <CertificatesWidget onNavigate={onViewChange} />
        </div>
      </div>
    </>
  );
};

export default StudentOverview;