import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, ShieldCheck, Star, Clock } from 'lucide-react';
import { DashboardView } from '../StudentDashboard';
import { useConsultants, Consultant } from '../../../hooks/useConsultants';
import { motion, AnimatePresence } from 'framer-motion';

interface SchedulePageProps {
    onNavigate: (view: DashboardView, id?: string) => void;
}

const SchedulePage = ({ onNavigate }: SchedulePageProps) => {
    const { consultants, fetchConsultants, isLoading } = useConsultants();

    // Fetch on mount
    useEffect(() => {
        fetchConsultants();
    }, [fetchConsultants]);

    const [searchTerm, setSearchTerm] = useState('');

    // Filter Logic
    const filteredConsultants = useMemo(() => {
        return consultants.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.specialization.toLowerCase().includes(searchTerm.toLowerCase());
            return matchSearch;
        });
    }, [consultants, searchTerm]);

    return (
        <div className="space-y-8 relative animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-[#0f2344] to-[#06152e] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-3xl font-bold text-white mb-2">استشارات الخبراء</h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        تواصل مع نخبة من الخبراء والمستشارين المعتمدين لحل تحدياتك وبناء قدراتك المؤسسية.
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                    <button onClick={() => onNavigate('overview')} className="flex items-center gap-2 text-brand-gold hover:text-white transition-colors group">
                        العودة للرئيسية <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث باسم المستشار أو التخصص..."
                    className="w-full bg-[#06152e] border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
                />
            </div>

            {/* Consultants Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {isLoading ? (
                        <div className="col-span-full text-center py-20 text-gray-400">جاري تحميل المستشارين...</div>
                    ) : filteredConsultants.length > 0 ? (
                        filteredConsultants.map((expert, idx) => (
                            <motion.div
                                key={expert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#0f2344]/40 border border-white/5 rounded-3xl p-6 flex flex-col hover:border-brand-gold/30 transition-all group hover:bg-[#0f2344]/60 relative overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand-gold transition-colors">
                                            <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                                        </div>
                                        {expert.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-brand-navy rounded-full p-0.5" title="موثق">
                                                <ShieldCheck size={16} className="text-brand-gold fill-brand-navy" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-brand-gold transition-colors">{expert.name}</h3>
                                        <p className="text-sm text-gray-400 mb-1">{expert.title}</p>
                                        <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                            <Star size={12} fill="currentColor" /> {expert.ratingAverage || 'جديد'}
                                            <span className="text-gray-500 font-normal">({expert.reviewsCount} تقييم)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex gap-2 mb-6">
                                    <span className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-lg text-xs font-bold border border-brand-gold/20">
                                        {expert.specialization}
                                    </span>
                                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                        <Clock size={12} /> متاح اليوم
                                    </span>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">سعر الجلسة</p>
                                        <p className="text-xl font-bold text-white">{expert.hourlyRate} <span className="text-sm font-normal text-brand-gold">ر.س</span></p>
                                    </div>
                                    <button
                                        onClick={() => onNavigate('consultant-details', expert.id)}
                                        className="bg-brand-navy border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-lg"
                                    >
                                        عرض التفاصيل
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-[#0f2344]/20 rounded-3xl border border-white/5">
                            <p className="text-gray-400 text-lg">لم يتم العثور على مستشارين مطابقين للبحث.</p>
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-brand-gold underline">عرض جميع المستشارين</button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SchedulePage;
