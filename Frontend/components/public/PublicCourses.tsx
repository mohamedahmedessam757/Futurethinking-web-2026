
import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Search, Star, Lock, ShoppingCart, ArrowRight, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../GlobalContext';
import { useCourses } from '../../hooks/useCourses';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { Course } from '../../types/store';

interface PublicCoursesProps {
    onNavigate: (page: string, id?: string) => void;
    selectedId?: string | null;
}

const PublicCourses = ({ onNavigate, selectedId }: PublicCoursesProps) => {
    const { currentUser } = useGlobal(); // Keep auth from global
    const { courses: listCourses, isLoading: isListLoading, fetchCourses } = useCourses();
    const { course: detailedCourse, isLoading: isDetailsLoading } = useCourseDetails(selectedId);

    // Trigger fetch on mount
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const [searchQuery, setSearchQuery] = useState('');

    // Details View State
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });

    // Filter Courses (from the lightweight list)
    const filteredCourses = listCourses.filter(course =>
        course.status === 'active' && (
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Use detailed course if selectedId is present, otherwise null
    const selectedCourse = selectedId ? detailedCourse : null;

    // --- Actions ---
    const handleAction = (course: any) => {
        if (currentUser) {
            // Logged in: Go to dashboard to resume/buy
            onNavigate('dashboard-courses', String(course.id));
        } else {
            // Not logged in: Go to Auth with redirect
            onNavigate('auth', `redirect=public-courses&id=${course.id}`);
        }
    };

    const toggleModule = (index: number) => {
        setExpandedModules(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // --- Details View Render ---
    if (selectedId) {
        if (isDetailsLoading) {
            return (
                <div className="container mx-auto px-4 py-32 text-center animate-pulse" dir="rtl">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري تحميل تفاصيل الدورة...</p>
                </div>
            );
        }

        if (!selectedCourse) {
            return (
                <div className="container mx-auto px-4 py-32 text-center" dir="rtl">
                    <p className="text-red-400">عذراً، لم يتم العثور على الدورة المطلوبة.</p>
                    <button onClick={() => onNavigate('public-courses')} className="mt-4 text-brand-navy underline">العودة</button>
                </div>
            );
        }

        const reviewsCount = selectedCourse.reviews ? selectedCourse.reviews.length : 0;
        const avgRating = reviewsCount > 0
            ? (selectedCourse.reviews.reduce((a, b) => a + b.rating, 0) / reviewsCount).toFixed(1)
            : 'جديد';

        return (
            <div className="container mx-auto px-4 py-8 animate-fade-in pb-24 text-right" dir="rtl">
                <button onClick={() => onNavigate('public-courses')} className="flex items-center gap-2 text-gray-500 hover:text-brand-navy transition-colors mb-6 group font-bold">
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    العودة للكورسات
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero / Preview */}
                        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-200 aspect-video relative group">
                            <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 mb-4 shadow-lg animate-pulse">
                                    <Lock className="text-white w-8 h-8" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white text-center px-4 mb-2 drop-shadow-md">{selectedCourse.title}</h2>
                                <p className="text-gray-200 text-sm mb-6">سجل الدخول لمشاهدة المحتوى الكامل</p>
                                <button onClick={() => handleAction(selectedCourse)} className="bg-brand-gold text-brand-navy px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-xl">
                                    اشترك الآن للمشاهدة
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="flex border-b border-gray-100">
                                <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-brand-navy text-brand-navy bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                    نظرة عامة
                                </button>
                                <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-brand-navy text-brand-navy bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                    التقييمات ({reviewsCount})
                                </button>
                            </div>

                            <div className="p-6 md:p-8">
                                {activeTab === 'overview' ? (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-brand-navy mb-4">عن الدورة</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {selectedCourse.description || 'وصف الدورة غير متاح حالياً.'}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-brand-navy mb-6">محتوى الكورس</h3>
                                            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                                <button onClick={() => toggleModule(0)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-brand-navy">الدروس المتاحة</span>
                                                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{selectedCourse.lessons.length} دروس</span>
                                                    </div>
                                                    {expandedModules[0] ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                                </button>

                                                <AnimatePresence>
                                                    {expandedModules[0] && (
                                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                            {selectedCourse.lessons.map((lesson, idx) => (
                                                                <div key={lesson.id} className="p-4 flex items-center justify-between border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-gray-800">{lesson.title}</p>
                                                                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><Clock size={10} /> {lesson.duration}</span>
                                                                        </div>
                                                                    </div>
                                                                    <Lock size={16} className="text-gray-300" />
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Reviews Tab */
                                    <div className="space-y-6">
                                        {selectedCourse.reviews.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400">لا توجد تقييمات بعد.</div>
                                        ) : (
                                            selectedCourse.reviews.map(review => (
                                                <div key={review.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold">{review.userName.charAt(0)}</div>
                                                            <div>
                                                                <h4 className="font-bold text-brand-navy text-sm">{review.userName}</h4>
                                                                <div className="flex text-yellow-400 text-xs">
                                                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{review.date}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                                </div>
                                            ))
                                        )}
                                        <div className="bg-brand-gold/10 p-4 rounded-xl text-center text-sm text-brand-navy mt-4">
                                            يجب عليك <span className="font-bold cursor-pointer underline" onClick={() => handleAction(selectedCourse)}>شراء الكورس</span> لإضافة تقييم.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 sticky top-24 shadow-xl">
                            <div className="text-center pb-6 border-b border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">سعر الدورة</p>
                                <h3 className="text-4xl font-bold text-brand-navy">{selectedCourse.price} <span className="text-lg font-medium text-gray-400">ر.س</span></h3>
                            </div>

                            <div className="space-y-4 py-6">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckCircle2 size={16} className="text-brand-gold" /> <span>شهادة إتمام معتمدة</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Clock size={16} className="text-brand-gold" /> <span>{selectedCourse.lessons.length} دروس تعليمية</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Star size={16} className="text-brand-gold" /> <span>{avgRating} تقييم عام</span>
                                </div>
                            </div>

                            <button onClick={() => handleAction(selectedCourse)} className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-gold hover:text-brand-navy transition-all flex items-center justify-center gap-2 shadow-lg">
                                اشترك الآن <ShoppingCart size={20} />
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-4">ضمان استرجاع الأموال 100%</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Grid View Render ---
    return (
        <div className="container mx-auto px-4 pt-32 pb-12 animate-fade-in" dir="rtl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-navy mb-4">الدورات التدريبية</h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">تصفح مجموعتنا المتميزة من الدورات التدريبية المصممة لرفع كفاءتك المهنية.</p>
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto relative mb-12">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="ابحث عن دورة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-brand-navy focus:outline-none focus:border-brand-gold shadow-sm"
                />
            </div>

            {isListLoading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => {
                            // Note: Lightweight courses might not have reviews in list view
                            // We use provided counts or fallback
                            const reviewsCount = (course as any).reviewsCount || 0; // Use detailed count if available
                            const avgRating = 'جديد'; // Or pass average rating from backend

                            return (
                                <div key={course.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-lg group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="h-56 relative overflow-hidden cursor-pointer" onClick={() => onNavigate('public-courses', String(course.id))}>
                                        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4 bg-brand-gold text-brand-navy px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                            {course.price === 0 ? 'مجاني' : `${course.price} ر.س`}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded">{course.category || 'عام'}</span>
                                            <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                                <Star size={12} fill="currentColor" /> {avgRating}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-brand-navy mb-2 line-clamp-2 cursor-pointer hover:text-brand-gold transition-colors" onClick={() => onNavigate('public-courses', String(course.id))}>
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-6">بقيادة: {course.instructor}</p>

                                        <div className="flex gap-3">
                                            <button onClick={() => onNavigate('public-courses', String(course.id))} className="flex-1 bg-gray-50 text-brand-navy border border-gray-200 py-3 rounded-xl font-bold hover:bg-white hover:border-brand-gold transition-colors">
                                                التفاصيل
                                            </button>
                                            <button onClick={() => handleAction(course)} className="flex-1 bg-brand-navy text-white py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors flex items-center justify-center gap-2">
                                                اشترك <ShoppingCart size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-500">لا توجد دورات مطابقة للبحث.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicCourses;
