
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart2, Cpu } from 'lucide-react';
import { useConsultant } from '../ConsultantContext';
import { ConsultantView } from '../ConsultantDashboard';
import ConsultantWelcomeVisual from '../widgets/ConsultantWelcomeVisual';

interface OverviewProps {
    onNavigate: (view: ConsultantView) => void;
}

const ConsultantOverview = ({ onNavigate }: OverviewProps) => {
    const { stats, myRevenue, upcomingAppointments, sendNotification } = useConsultant();

    const cards = [
        { label: 'إجمالي الإيرادات', value: `${myRevenue.toLocaleString()} ر.س`, icon: <TrendingUp />, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
        { label: 'استشارات هذا الشهر', value: stats.consultationsThisMonth, icon: <Calendar />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        // Changed Card: From Ratings to AI Tokens
        { label: 'الرموز (Tokens) المولدة', value: stats.aiTokensGenerated.toLocaleString(), icon: <Cpu />, color: 'text-purple-400', bg: 'bg-purple-400/10', sub: 'بواسطة AI' },
    ];

    const handleStartMeeting = (e: React.MouseEvent, appt: any) => {
        e.stopPropagation(); // Prevent card click

        if (!appt.meetingLink) {
            sendNotification('رابط مفقود 🔗', "لم يتم إضافة رابط للاجتماع بعد.", 'warning');
            return;
        }

        // Logic: Allow access only 5 hours before the meeting
        const meetingDate = new Date(appt.date);

        // Parse time string (e.g., "10:00 AM") to set hours/minutes correctly
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

        if (diffInHours <= 5 && diffInHours > -3) {
            window.open(appt.meetingLink, '_blank');
        } else if (diffInHours > 5) {
            sendNotification('تنبيه موعد ⏳', `عذراً، لا يمكن بدء الاجتماع الآن. سيتاح الرابط قبل الموعد بـ 5 ساعات.`, 'warning');
        } else {
            window.open(appt.meetingLink, '_blank');
        }
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#0f2344] to-[#06152e] border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-right space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/30 text-brand-gold px-4 py-1.5 rounded-full text-xs font-bold">
                            <SparklesIcon size={14} /> لوحة تحكم الخبراء
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            أهلاً بك في مكتبك <span className="text-brand-gold">الرقمي</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            تابع حجوزاتك، قم بإدارة جلساتك الاستشارية، وحلل أداءك المالي واستفد من أدوات الذكاء الاصطناعي لتعزيز إنتاجيتك.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => onNavigate('schedule')}
                                className="bg-brand-gold text-brand-navy px-8 py-3.5 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-gold/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Calendar size={18} /> عرض جدول المواعيد
                            </button>
                        </div>
                    </div>

                    {/* Animated Illustration */}
                    <div className="md:w-1/3 flex justify-center items-center">
                        <ConsultantWelcomeVisual />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#0f2344]/40 border border-white/5 rounded-[2rem] p-6 hover:border-brand-gold/30 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                {React.cloneElement(card.icon as React.ReactElement<any>, { size: 24 })}
                            </div>
                            {/* Decorative Dot */}
                            <div className="bg-white/5 rounded-full p-1 cursor-pointer hover:bg-white/10">
                                <TrendingUp size={16} className={idx === 0 ? "text-green-400" : "text-gray-500"} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1 flex items-baseline gap-2">
                            {card.value}
                            {card.sub && <span className="text-xs text-gray-500 font-normal">{card.sub}</span>}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Appointments */}
                <div className="lg:col-span-2 bg-[#0f2344]/30 border border-white/5 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">الاستشارات القادمة</h3>
                        <button onClick={() => onNavigate('schedule')} className="text-sm text-brand-gold hover:underline">عرض الجدول</button>
                    </div>

                    <div className="space-y-4">
                        {upcomingAppointments.slice(0, 3).map((app, i) => (
                            <div
                                key={i}
                                onClick={() => onNavigate('schedule')}
                                className="flex items-center justify-between bg-[#06152e]/50 border border-white/5 p-4 rounded-2xl hover:border-brand-gold/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-brand-navy border border-white/10 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold group-hover:bg-brand-gold group-hover:text-brand-navy transition-colors">
                                        <span className="text-[10px] opacity-80 uppercase">{new Date(app.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg leading-none">{new Date(app.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{app.studentName}</h4>
                                        <p className="text-xs text-brand-gold">{app.title}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className="block text-white font-mono text-sm">{app.time}</span>
                                    <button
                                        onClick={(e) => handleStartMeeting(e, app)}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg mt-1 transition-colors z-10 relative"
                                    >
                                        بدء الاجتماع
                                    </button>
                                </div>
                            </div>
                        ))}
                        {upcomingAppointments.length === 0 && (
                            <div className="text-center py-10 text-gray-500">لا توجد استشارات قادمة</div>
                        )}
                    </div>
                </div>

                {/* Quick Action - Analytics Animated Card */}
                <div className="bg-[#0f2344]/30 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-gold via-brand-navy to-transparent"></div>

                    {/* Animated Chart Visual */}
                    <div className="h-32 flex items-end justify-center gap-3 mb-6 relative z-10">
                        {[40, 70, 50, 90, 60].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: '10%' }}
                                animate={{ height: `${h}%` }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                                className={`w-4 rounded-t-lg ${i === 3 ? 'bg-brand-gold' : 'bg-brand-navy/60'}`}
                            />
                        ))}
                    </div>

                    <div className="text-center relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2">تحليل الأداء</h3>
                        <p className="text-gray-400 text-sm mb-6">راقب أرباحك وتفاعل العملاء مع استشاراتك.</p>
                        <button
                            onClick={() => onNavigate('analytics')}
                            className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy hover:border-brand-gold transition-all flex items-center justify-center gap-2"
                        >
                            <BarChart2 size={18} /> عرض التقارير المالية
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SparklesIcon = ({ size }: { size?: number }) => (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275-1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);

export default ConsultantOverview;
