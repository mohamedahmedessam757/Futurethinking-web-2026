
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight, 
    MoreHorizontal, Link as LinkIcon, Save, MapPin, User, X 
} from 'lucide-react';
import { useConsultant } from '../ConsultantContext';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'week' | 'day' | 'list';

// Helper to parse time string "10:00 AM" to float (10.0)
const parseTimeToFloat = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours + (minutes / 60);
};

const PlatformBadge = ({ platform }: { platform: string }) => {
    const config: any = {
        zoom: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Zoom' },
        google_meet: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Meet' },
        teams: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Teams' },
        discord: { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', label: 'Discord' },
    };
    const style = config[platform] || { color: 'bg-gray-500/20 text-gray-400', label: 'Video' };

    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.color} font-bold flex items-center gap-1`}>
            <Video size={10} /> {style.label}
        </span>
    );
};

const ConsultantSchedule = () => {
  const { upcomingAppointments, updateAppointmentLink } = useConsultant();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [linkInput, setLinkInput] = useState('');

  // Calendar Config
  const startHour = 8; // 8 AM
  const endHour = 22; // 10 PM
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const rowHeight = 80; // px height per hour

  // Date Navigation
  const nextPeriod = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
      else newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
  };

  const prevPeriod = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
      else newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
  };

  const goToday = () => setCurrentDate(new Date());

  // Generate Days for View
  const daysToShow = useMemo(() => {
      const days = [];
      const startOfWeek = new Date(currentDate);
      // Adjust to start on Sunday (0) or Saturday (6) depending on locale preference. Assuming Sunday start.
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) - 1; // Adjust for "Sunday is start" visually if needed, standard is usually Sun=0
      // Let's force Sunday start for display
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 

      const count = viewMode === 'week' ? 7 : 1;
      const startPoint = viewMode === 'week' ? startOfWeek : currentDate;

      for (let i = 0; i < count; i++) {
          const d = new Date(startPoint);
          d.setDate(startPoint.getDate() + i);
          days.push(d);
      }
      return days;
  }, [currentDate, viewMode]);

  // Handle appointment click
  const handleApptClick = (appt: any) => {
      setSelectedAppt(appt);
      setLinkInput(appt.meetingLink || '');
  };

  const handleSaveLink = () => {
      if (selectedAppt) {
          updateAppointmentLink(selectedAppt.id, linkInput);
          setSelectedAppt(null);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-fade-in relative">
        
        {/* Top Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#0f2344] p-2 rounded-2xl border border-white/5 shrink-0">
            <div className="flex items-center gap-4 w-full md:w-auto px-2">
                <button onClick={goToday} className="text-xs font-bold text-brand-gold hover:bg-white/5 px-3 py-1.5 rounded-lg border border-brand-gold/30">
                    اليوم
                </button>
                <div className="flex items-center gap-1 bg-[#06152e] rounded-lg p-1">
                    <button onClick={prevPeriod} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"><ChevronRight size={18}/></button>
                    <button onClick={nextPeriod} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"><ChevronLeft size={18}/></button>
                </div>
                <h2 className="text-lg font-bold text-white min-w-[150px] text-center">
                    {currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                </h2>
            </div>

            <div className="flex bg-[#06152e] p-1 rounded-xl w-full md:w-auto mt-2 md:mt-0">
                {(['week', 'day', 'list'] as const).map((m) => (
                    <button 
                        key={m}
                        onClick={() => setViewMode(m)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === m ? 'bg-brand-gold text-brand-navy shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {m === 'week' ? 'أسبوع' : m === 'day' ? 'يوم' : 'قائمة'}
                    </button>
                ))}
            </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="flex-1 bg-[#0f2344]/30 border border-white/10 rounded-3xl overflow-hidden relative flex flex-col">
            
            {viewMode === 'list' ? (
                // --- LIST VIEW ---
                <div className="p-6 overflow-y-auto">
                    {upcomingAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingAppointments.map((app) => (
                                <div key={app.id} onClick={() => handleApptClick(app)} className="bg-[#06152e] p-4 rounded-xl border border-white/5 hover:border-brand-gold/50 cursor-pointer flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-[#0f172a] px-3 py-2 rounded-lg border border-white/5">
                                            <span className="block text-xs text-gray-500">{new Date(app.date).toLocaleDateString('ar-SA', { weekday: 'short' })}</span>
                                            <span className="block text-xl font-bold text-white">{new Date(app.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg group-hover:text-brand-gold transition-colors">{app.studentName}</h4>
                                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                                <Clock size={12} /> {app.time} • {app.title}
                                            </p>
                                        </div>
                                    </div>
                                    <PlatformBadge platform={app.preferredPlatform} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">لا توجد مواعيد قادمة.</div>
                    )}
                </div>
            ) : (
                // --- GRID VIEW (Week & Day) ---
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Grid Header (Days) */}
                    <div className="flex border-b border-white/10 bg-[#0f172a] pr-14 scrollbar-hide">
                        {daysToShow.map((day, i) => {
                            const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                            return (
                                <div key={i} className="flex-1 py-4 text-center border-l border-white/5 min-w-[100px]">
                                    <span className={`block text-xs uppercase mb-1 ${isToday ? 'text-brand-gold font-bold' : 'text-gray-500'}`}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${isToday ? 'bg-brand-gold text-brand-navy' : 'text-white'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Grid Body (Time Slots) */}
                    <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                        <div className="relative min-h-full" style={{ height: hours.length * rowHeight }}>
                            
                            {/* Time Labels Column */}
                            <div className="absolute top-0 right-0 w-14 h-full border-l border-white/5 bg-[#0f172a] z-10">
                                {hours.map((hour) => (
                                    <div key={hour} className="absolute w-full text-center pr-2" style={{ top: (hour - startHour) * rowHeight, height: rowHeight }}>
                                        <span className="text-[10px] text-gray-500 relative -top-2 bg-[#0f172a] px-1">
                                            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Grid Lines & Columns */}
                            <div className="absolute top-0 right-14 left-0 h-full flex">
                                {/* Horizontal Hour Lines */}
                                {hours.map((hour) => (
                                    <div 
                                        key={hour} 
                                        className="absolute w-full border-b border-white/5" 
                                        style={{ top: (hour - startHour) * rowHeight }}
                                    ></div>
                                ))}

                                {/* Vertical Day Columns */}
                                {daysToShow.map((day, dayIndex) => {
                                    // Current Time Line (Only if today)
                                    const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                                    const now = new Date();
                                    const currentHourFloat = now.getHours() + (now.getMinutes() / 60);
                                    
                                    // Find appointments for this day
                                    const daysAppointments = upcomingAppointments.filter(app => {
                                        const appDate = new Date(app.date);
                                        return appDate.getDate() === day.getDate() && appDate.getMonth() === day.getMonth();
                                    });

                                    return (
                                        <div key={dayIndex} className="flex-1 border-l border-white/5 relative min-w-[100px] h-full group">
                                            
                                            {/* Hover Highlight */}
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors pointer-events-none"></div>

                                            {/* Red Current Time Line */}
                                            {isToday && currentHourFloat >= startHour && currentHourFloat <= endHour && (
                                                <div 
                                                    className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none"
                                                    style={{ top: (currentHourFloat - startHour) * rowHeight }}
                                                >
                                                    <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                                </div>
                                            )}

                                            {/* Appointments */}
                                            {daysAppointments.map(app => {
                                                const start = parseTimeToFloat(app.time);
                                                // Assume 1 hour duration default if not specified (could be dynamic)
                                                const duration = 1; 
                                                const top = (start - startHour) * rowHeight;
                                                const height = duration * rowHeight;

                                                return (
                                                    <motion.div
                                                        key={app.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        onClick={(e) => { e.stopPropagation(); handleApptClick(app); }}
                                                        className={`
                                                            absolute left-1 right-1 rounded-lg border-l-4 p-2 cursor-pointer shadow-lg overflow-hidden
                                                            bg-[#0f2344] border-brand-gold hover:brightness-110 z-10
                                                        `}
                                                        style={{ top: `${top}px`, height: `${height - 4}px` }}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[10px] font-bold text-brand-gold">{app.time}</span>
                                                            {app.meetingLink && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>}
                                                        </div>
                                                        <p className="text-xs text-white font-bold truncate mt-0.5">{app.studentName}</p>
                                                        <div className="mt-1 opacity-70">
                                                            <PlatformBadge platform={app.preferredPlatform} />
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Appointment Details Modal / Side Panel */}
        <AnimatePresence>
            {selectedAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppt(null)}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#06152e]">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">تفاصيل الاستشارة</h3>
                                <p className="text-xs text-gray-400">{new Date(selectedAppt.date).toLocaleDateString('ar-SA')} • {selectedAppt.time}</p>
                            </div>
                            <button onClick={() => setSelectedAppt(null)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-lg"><X size={18}/></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">الطالب</p>
                                    <p className="text-white font-bold text-lg">{selectedAppt.studentName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Video size={12}/> المنصة</p>
                                    <p className="text-sm font-bold text-white uppercase">{selectedAppt.preferredPlatform}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={12}/> المدة</p>
                                    <p className="text-sm font-bold text-white">60 دقيقة</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300 block">رابط الاجتماع</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input 
                                            type="text" 
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                            placeholder="الصق رابط Zoom/Meet هنا..."
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm focus:border-brand-gold outline-none dir-ltr"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveLink}
                                        className="bg-brand-gold text-brand-navy px-4 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center shadow-lg"
                                    >
                                        <Save size={18} />
                                    </button>
                                </div>
                                {!selectedAppt.meetingLink && (
                                    <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                                        <MapPin size={10} /> يرجى إضافة الرابط قبل الموعد بـ 15 دقيقة
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 bg-[#06152e] border-t border-white/5 flex justify-end">
                            <button onClick={() => setSelectedAppt(null)} className="text-gray-400 hover:text-white text-sm font-bold">إغلاق</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default ConsultantSchedule;
