
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Library, Clock } from 'lucide-react';
import { useDashboard } from '../DashboardContext';

const StatsCards = () => {
  const { stats } = useDashboard();

  const data = [
    { label: 'دورات مكتملة', value: stats.completedCourses, sub: 'حافظ على الزخم!', icon: <BookOpen />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'كتب مملوكة', value: stats.ownedBooks, sub: 'في مكتبتك الرقمية', icon: <Library />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    // Changed Metric: Points -> Training Hours
    { label: 'ساعة تدريبية', value: stats.trainingHours, sub: 'استثمارك في التعلم', icon: <Clock />, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + (index * 0.1) }}
          className="bg-[#0f2344]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:border-brand-gold/30 transition-colors group"
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 28 })}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1" dir="ltr">{stat.value}</h3>
            <p className="text-gray-400 font-bold mb-2">{stat.label}</p>
            <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">{stat.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
