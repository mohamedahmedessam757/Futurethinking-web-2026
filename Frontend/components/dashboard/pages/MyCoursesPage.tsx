import React, { useState, useEffect, useMemo } from 'react';
import { Play, CheckCircle2, Search, Star, Lock, ShoppingCart, BookOpen, Clock, Activity, Award, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../DashboardContext';
import { useGlobal } from '../../GlobalContext';
import { useCourses } from '../../../hooks/useCourses';
import { DashboardView } from '../StudentDashboard';
import PaymentModal from '../../PaymentModal';

interface MyCoursesPageProps {
    onNavigate?: (view: DashboardView, id?: string) => void;
}

const MyCoursesPage = ({ onNavigate }: MyCoursesPageProps) => {
    // Get enrolled courses from DashboardContext (already user-specific)
    const { courses: myEnrolledCourses, addTransaction: addToDashboardHistory, user } = useDashboard();

    // Fetch all courses for Catalog using scalable hook
    const { courses: allCourses, fetchCourses, isLoading } = useCourses();
    const { enrollStudent, currentUser } = useGlobal();

    // Fetch catalog on mount
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const [activeTab, setActiveTab] = useState<'my-learning' | 'browse'>('my-learning');
    const [subTab, setSubTab] = useState<'in-progress' | 'not-started' | 'completed'>('in-progress');
    const [searchQuery, setSearchQuery] = useState('');

    // Payment Logic
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    // --- PERMISSION LOGIC ---
    const isFreeTier = user.subscriptionTier === 'free';

    // 1. Enrolled Courses (Owned) - Categorized
    const { inProgress, notStarted, completed } = useMemo(() => {
        const filtered = myEnrolledCourses.filter(course =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return {
            inProgress: filtered.filter(c => c.progress > 0 && c.progress < 100),
            notStarted: filtered.filter(c => c.progress === 0),
            completed: filtered.filter(c => c.progress === 100)
        };
    }, [myEnrolledCourses, searchQuery]);

    // Determined displayed courses based on subTab
    const displayedMyCourses = useMemo(() => {
        switch (subTab) {
            case 'in-progress': return inProgress;
            case 'not-started': return notStarted;
            case 'completed': return completed;
            default: return [];
        }
    }, [subTab, inProgress, notStarted, completed]);

    // 2. Catalog (Not Enrolled)
    const catalogCourses = useMemo(() => {
        // Create a Set of enrolled IDs for O(1) lookup
        const enrolledIds = new Set(myEnrolledCourses.map(c => c.id));

        return allCourses.filter(globalCourse => {
            const isEnrolled = enrolledIds.has(globalCourse.id);
            const matchesSearch = globalCourse.title.toLowerCase().includes(searchQuery.toLowerCase());
            return !isEnrolled && matchesSearch;
        });
    }, [allCourses, myEnrolledCourses, searchQuery]);

    // Handle click on a course in Catalog
    const handleCourseClick = (course: any) => {
        // If user is Free Tier and course is NOT free -> Block access & prompt upgrade
        // Note: In real app, check `course.isFree` flag. Here assuming all catalog courses are paid/premium.
        if (isFreeTier) {
            // Trigger Navigation to Payments Page for Upgrade
            if (confirm("هذا المحتوى متاح فقط للمشتركين في الباقة الاحترافية. هل تريد ترقية باقتك الآن؟")) { // eslint-disable-line no-restricted-globals
                window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: { view: 'payments' } }));
            }
            return;
        }

        // If Pro/Enterprise, proceed to enroll/pay
        setSelectedCourse(course);
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!currentUser || !selectedCourse) return;

        const priceToPay = user.subscriptionTier !== 'free' ? 0 : selectedCourse.price;

        // If free (amount 0), manually enroll because no webhook will fire
        if (priceToPay === 0) {
            enrollStudent(selectedCourse.id, currentUser.id);
            addToDashboardHistory({
                desc: `اشتراك دورة: ${selectedCourse.title}`,
                amount: '0',
                date: new Date().toISOString().split('T')[0],
                status: 'paid'
            });
        }

        setTimeout(() => {
            setActiveTab('my-learning');
            setSubTab('not-started'); // Provide feedback by switching to where the new course is
        }, 500);
    };

    return (
        <div className="space-y-8 animate-fade-in relative min-h-screen">

            {/* Payment Modal */}
            {selectedCourse && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={handleConfirmPayment}
                    // If Pro/Enterprise, price is 0 (included in plan)
                    amount={user.subscriptionTier !== 'free' ? 0 : selectedCourse.price}
                    itemName={user.subscriptionTier !== 'free' ? `دورة (مشمولة في الباقة): ${selectedCourse.title}` : selectedCourse.title}
                    itemType="course"
                    itemId={selectedCourse.id}
                />
            )}

            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <BookOpen className="text-brand-gold" size={32} />
                        التدريب والكورسات
                    </h1>
                    <p className="text-gray-400">
                        {isFreeTier
                            ? 'أنت على الباقة المجانية. قم بالترقية للوصول إلى كامل المكتبة.'
                            : 'استمتع بوصول كامل لجميع الدورات التدريبية.'}
                    </p>
                </div>

                {/* Main Tabs */}
                <div className="flex bg-[#06152e] p-1.5 rounded-2xl border border-white/10 w-full md:w-auto shadow-lg">
                    <button
                        onClick={() => setActiveTab('my-learning')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'my-learning' ? 'bg-brand-gold text-brand-navy shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Activity size={18} /> دوراتي التعليمية
                    </button>
                    <div className="w-px bg-white/10 my-2 mx-1"></div>
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'browse' ? 'bg-brand-gold text-brand-navy shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid size={18} /> تصفح الكورسات
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-gold/5 rounded-2xl blur-xl group-hover:bg-brand-gold/10 transition-colors"></div>
                <div className="relative">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-hover:text-brand-gold transition-colors" />
                    <input
                        type="text"
                        placeholder={activeTab === 'my-learning' ? "ابحث في دوراتك..." : "ابحث عن دورة جديدة..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-2xl py-4 pr-14 pl-4 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all shadow-xl placeholder:text-gray-600"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* === TAB 1: MY LEARNING === */}
                {activeTab === 'my-learning' ? (
                    <motion.div
                        key="my-learning"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        {/* Sub Tabs for Categorization */}
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
                            <button
                                onClick={() => setSubTab('in-progress')}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${subTab === 'in-progress' ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <Play size={14} fill={subTab === 'in-progress' ? "currentColor" : "none"} />
                                قيد التنفيذ
                                <span className="bg-[#0f172a] px-2 py-0.5 rounded-md text-[10px] opacity-70 border border-white/10">{inProgress.length}</span>
                            </button>
                            <button
                                onClick={() => setSubTab('not-started')}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${subTab === 'not-started' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <Clock size={14} />
                                لم تبدأ بعد
                                <span className="bg-[#0f172a] px-2 py-0.5 rounded-md text-[10px] opacity-70 border border-white/10">{notStarted.length}</span>
                            </button>
                            <button
                                onClick={() => setSubTab('completed')}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${subTab === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <CheckCircle2 size={14} />
                                المكتملة
                                <span className="bg-[#0f172a] px-2 py-0.5 rounded-md text-[10px] opacity-70 border border-white/10">{completed.length}</span>
                            </button>
                        </div>

                        {/* Course Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedMyCourses.length > 0 ? (
                                displayedMyCourses.map((course) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={course.id}
                                        className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden group hover:border-brand-gold/30 transition-all flex flex-col hover:bg-[#0f172a]/80 shadow-lg hover:shadow-2xl hover:-translate-y-1"
                                    >
                                        <div className="h-48 relative overflow-hidden cursor-pointer" onClick={() => onNavigate && onNavigate('course-details', String(course.id))}>
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90"></div>

                                            <div className="absolute top-4 left-4">
                                                {course.completed ? (
                                                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md shadow-lg">
                                                        <CheckCircle2 size={12} /> مكتمل
                                                    </span>
                                                ) : course.progress === 0 ? (
                                                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md shadow-lg">
                                                        <Clock size={12} /> جديد
                                                    </span>
                                                ) : (
                                                    <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md shadow-lg">
                                                        <Play size={10} fill="currentColor" /> مستمر ({course.progress}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-brand-gold transition-colors">{course.title}</h3>
                                            <div className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">{course.instructor.charAt(0)}</div>
                                                {course.instructor}
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
                                                {/* Progress Bar */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className="text-gray-400">التقدم الكلي</span>
                                                        <span className={course.completed ? "text-green-400" : course.progress > 0 ? "text-brand-gold" : "text-gray-500"}>{course.progress}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#06152e] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${course.completed ? 'bg-green-500' : 'bg-brand-gold'}`}
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => onNavigate && onNavigate('course-details', String(course.id))}
                                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                                                        ${course.completed
                                                            ? 'bg-[#06152e] text-white border border-white/10 hover:border-brand-gold hover:text-brand-gold'
                                                            : 'bg-brand-gold text-brand-navy hover:bg-white hover:text-brand-navy hover:shadow-lg hover:shadow-brand-gold/20'}`}
                                                >
                                                    {course.completed ? (
                                                        <> <Award size={16} /> عرض الشهادة </>
                                                    ) : course.progress === 0 ? (
                                                        <> <Play size={16} fill="currentColor" /> ابدأ الدورة </>
                                                    ) : (
                                                        <> <Play size={16} fill="currentColor" /> متابعة المشاهدة </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-20 text-center"
                                >
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                                        {subTab === 'completed' ? <Award size={48} opacity={0.5} /> : <BookOpen size={48} opacity={0.5} />}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {subTab === 'completed' ? 'لم تكمل أي دورات بعد' : subTab === 'not-started' ? 'لا توجد دورات جديدة' : 'لا توجد دورات قيد التنفيذ'}
                                    </h3>
                                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                        {subTab === 'completed'
                                            ? 'استمر في التعلم! ستظهر دوراتك المكتملة وشهاداتك هنا.'
                                            : 'تصفح مكتبة الكورسات وابدأ رحلة تعلم جديدة اليوم.'}
                                    </p>
                                    <button onClick={() => setActiveTab('browse')} className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-colors">
                                        تصفح الكورسات
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* === TAB 2: BROWSE (CATALOG) === */
                    <motion.div
                        key="browse"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {isLoading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-400">جاري تحميل الكورسات المميزة...</p>
                            </div>
                        ) : catalogCourses.length > 0 ? (
                            catalogCourses.map((course) => {
                                // Calculate Rating Dynamically for Catalog Card
                                const reviewsCount = course.reviews ? course.reviews.length : 0;
                                const avgRating = reviewsCount > 0
                                    ? (course.reviews.reduce((a: number, b: any) => a + b.rating, 0) / reviewsCount).toFixed(1)
                                    : 'جديد';

                                return (
                                    <div
                                        key={course.id}
                                        className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden shadow-lg group relative hover:border-brand-gold/30 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all duration-300"
                                    >
                                        {/* Lock Overlay for Free Users */}
                                        {isFreeTier && (
                                            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mb-4 text-brand-gold border border-brand-gold/30 animate-bounce-slow">
                                                    <Lock size={32} />
                                                </div>
                                                <h3 className="text-white font-bold text-lg mb-2">محتوى حصري</h3>
                                                <p className="text-gray-300 text-sm mb-6">هذه الدورة متاحة فقط لمشتركي باقة المحترفين والمؤسسات.</p>
                                                <button
                                                    onClick={() => handleCourseClick(course)}
                                                    className="bg-brand-gold text-brand-navy px-6 py-3 rounded-xl font-bold hover:bg-white transition-all shadow-lg w-full scale-105"
                                                >
                                                    ترقية الباقة الآن
                                                </button>
                                            </div>
                                        )}

                                        <div className="h-56 relative overflow-hidden">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80"></div>

                                            {/* Premium Badge */}
                                            {isFreeTier && (
                                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-brand-gold border border-brand-gold/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm z-10">
                                                    <Lock size={12} /> PRO
                                                </div>
                                            )}

                                            {/* Rating Badge */}
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-yellow-400 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm z-10">
                                                <Star size={12} fill="currentColor" /> {avgRating}
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded border border-brand-gold/20 uppercase tracking-wider">
                                                    {course.category || 'تطوير مهني'}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-brand-gold transition-colors">{course.title}</h3>
                                            <p className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">{course.instructor ? course.instructor.charAt(0) : 'M'}</div>
                                                بقيادة: {course.instructor || 'مدرب محترف'}
                                            </p>

                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 mb-0.5">سعر الدورة</span>
                                                    <span className="text-2xl font-bold text-white">
                                                        {isFreeTier ? course.price : 'مجانأ'}
                                                        <span className="text-sm font-medium text-brand-gold ml-1">{isFreeTier ? 'ر.س' : '(ضمن الباقة)'}</span>
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleCourseClick(course)}
                                                    className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 
                                                        ${!isFreeTier
                                                            ? 'bg-brand-navy text-white hover:bg-brand-gold hover:text-brand-navy border border-white/10'
                                                            : 'bg-white/5 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {isFreeTier ? 'اشترك الآن' : 'ابدأ المشاهدة'}
                                                    {!isFreeTier && <Play size={16} fill="currentColor" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Search className="w-16 h-16 text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج بحث</h3>
                                <p className="text-gray-400">لم نعثر على أي دورات تطابق بحثك. حاول استخدام كلمات أخرى.</p>
                                <button onClick={() => setSearchQuery('')} className="mt-6 text-brand-gold hover:underline">
                                    المسح وإظهار الكل
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyCoursesPage;
