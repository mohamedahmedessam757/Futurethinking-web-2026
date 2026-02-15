import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { DashboardView } from '../StudentDashboard';
import { useDashboard } from '../DashboardContext';

interface ActiveCoursesProps {
  onNavigate?: (view: DashboardView, id?: string) => void;
}

const ActiveCourses = ({ onNavigate }: ActiveCoursesProps) => {
  const { courses } = useDashboard();
  const activeCourses = courses.filter(c => !c.completed);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
         <h2 className="text-xl font-bold text-white border-r-4 border-brand-gold pr-3">الدورات النشطة</h2>
         <button 
           onClick={() => onNavigate && onNavigate('courses')}
           className="text-sm text-brand-gold hover:text-white transition-colors"
         >
           عرض الكل
         </button>
       </div>

       {activeCourses.length === 0 ? (
         <div className="text-center py-10 bg-[#0f2344]/30 rounded-2xl border border-white/5">
             <p className="text-gray-400">لا توجد دورات نشطة حالياً.</p>
             <button onClick={() => onNavigate && onNavigate('courses')} className="mt-2 text-brand-gold text-sm underline">تصفح الدورات</button>
         </div>
       ) : (
         <div className="space-y-4">
            {activeCourses.slice(0, 3).map((course, idx) => (
            <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="bg-[#0f2344]/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-6 hover:bg-[#0f2344]/60 transition-colors group cursor-pointer"
                onClick={() => onNavigate && onNavigate('course-details', String(course.id))}
            >
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden relative shrink-0">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-12 h-12" />
                </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-gold transition-colors">{course.title}</h3>
                    <p className="text-sm text-gray-400">بواسطة: {course.instructor}</p>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-gray-300">التقدم</span>
                    <span className="text-brand-gold">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#06152e] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-l from-brand-gold to-yellow-600 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                    ></div>
                    </div>
                </div>
                </div>
            </motion.div>
            ))}
         </div>
       )}
    </div>
  );
};

export default ActiveCourses;