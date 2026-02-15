import React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../DashboardContext';
import { DashboardView } from '../StudentDashboard';

import StudentWelcomeVisual from './StudentWelcomeVisual';

interface WelcomeBannerProps {
  onNavigate?: (view: DashboardView) => void;
}

const WelcomeBanner = ({ onNavigate }: WelcomeBannerProps) => {
  const { user } = useDashboard();
  const firstName = user.name.split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-brand-navy to-[#1e3a6e] rounded-[2rem] p-8 relative overflow-hidden shadow-2xl border border-white/10"
    >
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-right md:w-2/3">
          <div className="inline-block px-3 py-1 bg-brand-gold/20 border border-brand-gold/30 rounded-full text-brand-gold text-xs font-bold mb-4">
            🚀 رحلتك التعليمية مستمرة
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            مرحباً بك، <span className="text-brand-gold">{firstName}</span> 👋
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
            واصل تقدمك المذهل! استكشف دوراتك الجديدة أو تواصل مع مستشاريك لتحقيق أهدافك.
          </p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => onNavigate && onNavigate('courses')}
              className="bg-brand-gold text-brand-navy px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-gold/10 hover:shadow-brand-gold/20 hover:scale-105 transition-all"
            >
              استئناف التعلم
            </button>
            <button
              onClick={() => onNavigate && onNavigate('schedule')}
              className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all"
            >
              حجز استشارة
            </button>
          </div>
        </div>

        {/* 3D Animated Illustration */}
        <div className="md:w-1/3 flex justify-center items-center">
          <StudentWelcomeVisual />
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;