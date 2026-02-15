
import React from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Plus, ExternalLink, Clock, CalendarX } from 'lucide-react';
import { DashboardView } from '../StudentDashboard';
import { useDashboard } from '../DashboardContext';

interface UpcomingScheduleProps {
  onNavigate?: (view: DashboardView, id?: string) => void;
}

const UpcomingSchedule = ({ onNavigate }: UpcomingScheduleProps) => {
  const { appointments, sendNotification } = useDashboard();

  // Logic: Filter for FUTURE appointments only, then sort by closest date
  const nextAppt = appointments
    .filter(a => new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0))) // Filter out past days
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]; // Get closest upcoming

  const handleJoin = (link?: string, appt?: any) => {
    if (!link) return;

    if (appt) {
      // Logic: Allow access only 5 hours before the meeting
      const meetingDate = new Date(appt.date);

      // Parse time string (e.g., "10:00 AM")
      const timeParts = appt.time.match(/(\d+):(\d+)\s?(AM|PM)?/i);
      if (timeParts) {
        let h = parseInt(timeParts[1]);
        const m = parseInt(timeParts[2]);
        const amp = timeParts[3];
        if (amp?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (amp?.toUpperCase() === 'AM' && h === 12) h = 0;
        meetingDate.setHours(h, m, 0, 0);
      }

      const now = new Date();
      const diffInHours = (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 5) {
        sendNotification('تنبيه موعد ⏳', `عذراً، لا يمكن الدخول للاجتماع الآن.\nسيتاح الرابط قبل الموعد بـ 5 ساعات.`, 'warning');
        return;
      }
    }

    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-bold text-white border-r-4 border-brand-gold pr-3">الاستشارات القادمة</h2>
        <button
          onClick={() => onNavigate && onNavigate('schedule')}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-brand-gold hover:bg-white/10 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {nextAppt ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#0f2344]/60 to-[#06152e]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-brand-gold to-transparent"></div>

          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Video size={24} />
            </div>
            <div className="text-center bg-[#06152e] px-3 py-1 rounded-lg border border-white/5">
              <span className="block text-xs text-gray-500">{new Date(nextAppt.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
              <span className="block text-xl font-bold text-white">{new Date(nextAppt.date).getDate()}</span>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-xs text-gray-500 font-mono mb-1 flex items-center gap-1">
              <Clock size={10} /> {nextAppt.time}
            </span>
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{nextAppt.title}</h3>
            <p className="text-sm text-gray-400">مع: {nextAppt.expertName}</p>
            {nextAppt.preferredPlatform && (
              <span className="inline-block mt-2 text-[10px] bg-white/5 px-2 py-0.5 rounded text-brand-gold uppercase tracking-wider border border-white/5">
                {nextAppt.preferredPlatform.replace('_', ' ')}
              </span>
            )}
          </div>

          <button
            onClick={() => handleJoin(nextAppt.meetingLink, nextAppt)}
            disabled={!nextAppt.meetingLink}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2
                ${nextAppt.meetingLink
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
              `}
          >
            {nextAppt.meetingLink ? (
              <>انضم للاجتماع <ExternalLink size={16} /></>
            ) : (
              <>بانتظار رابط المستشار...</>
            )}
          </button>
        </motion.div>
      ) : (
        <div className="p-8 bg-[#0f2344]/40 border border-white/5 rounded-3xl text-center relative overflow-hidden group hover:border-brand-gold/30 transition-all duration-500">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-colors"></div>

          {/* Updated Icon Design (Replaces Image) */}
          <div className="w-24 h-24 mx-auto mb-6 relative z-10">
            <div className="absolute inset-0 bg-brand-gold/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
            <div className="relative w-full h-full bg-[#06152e] rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-brand-gold/50 group-hover:scale-105 transition-all duration-500 shadow-2xl">
              <CalendarX size={40} className="text-gray-500 group-hover:text-brand-gold transition-colors" strokeWidth={1.5} />
            </div>
            {/* Decorative Dot */}
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-navy rounded-full border border-white/10 flex items-center justify-center z-20">
              <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
            </div>
          </div>

          <h3 className="text-white font-bold text-lg mb-2 relative z-10">جدولك فارغ حالياً</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto leading-relaxed relative z-10">
            استغل وقتك وطور مهاراتك مع خبرائنا المعتمدين.
          </p>

          <button
            onClick={() => onNavigate && onNavigate('schedule')}
            className="relative z-10 bg-white/5 border border-white/10 hover:bg-brand-gold hover:text-brand-navy hover:border-brand-gold text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg inline-flex items-center gap-2"
          >
            <Plus size={16} /> حجز استشارة جديدة
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedule;
