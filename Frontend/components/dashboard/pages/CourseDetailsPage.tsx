import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, CheckCircle2, Lock, Clock, BookOpen, Star, Award,
    ChevronDown, ChevronUp, ShoppingCart, MessageSquare, Send,
    Volume2, FileText, HelpCircle, SkipForward, RotateCcw,
    ArrowRight, Menu, X, Check, AlertCircle, Layout, List
} from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { useCourseDetails } from '../../../hooks/useCourseDetails';
import { DashboardView } from '../StudentDashboard';
import PaymentModal from '../../PaymentModal';
import type { Lesson, QuizQuestion } from '../../../types/store';
import LessonViewer from '../components/LessonViewer';

interface CourseDetailsPageProps {
    courseId: string | null;
    onBack: () => void;
    onNavigate?: (view: DashboardView, id?: string) => void;
}

// --- HELPER: Group Lessons into Units (Virtual Units) ---
const ITEMS_PER_UNIT = 4;
const groupLessonsIntoUnits = (lessons: Lesson[]) => {
    const units = [];
    for (let i = 0; i < lessons.length; i += ITEMS_PER_UNIT) {
        units.push({
            id: `unit-${Math.floor(i / ITEMS_PER_UNIT) + 1}`,
            title: `الوحدة ${Math.floor(i / ITEMS_PER_UNIT) + 1}`,
            lessons: lessons.slice(i, i + ITEMS_PER_UNIT)
        });
    }
    return units;
};

// ============================================
// SUB-COMPONENTS
// ============================================

// --- 1. Course Landing Hero (Start View) ---
const CourseHero = ({ course, isEnrolled, onStart, onPurchase, onBack, enrolledProgress }: any) => {
    return (
        <div className="min-h-screen bg-[#06152e] text-white relative overflow-hidden flex flex-col">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            {/* Back Button */}
            <div className="p-6 md:p-8 relative z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold">العودة للدورات</span>
                </button>
            </div>

            {/* Hero Content */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
                <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">

                    {/* Right: Text Content */}
                    <div className="space-y-8 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-bold border border-brand-gold/20">
                            <Star size={14} fill="currentColor" />
                            <span>دورة مميزة</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                            {course.title}
                        </h1>

                        <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                            {course.description || 'اكتشف مهارات جديدة وطور قدراتك مع هذه الدورة التدريبية المتكاملة.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-gray-400">
                            <div className="flex items-center gap-2">
                                <Clock size={20} className="text-brand-gold" />
                                <span>{course.lessons?.length || 0} درس</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Award size={20} className="text-brand-gold" />
                                <span>شهادة معتمدة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-brand-gold" />
                                <span>{course.level === 'beginner' ? 'مبتدئ' : course.level === 'intermediate' ? 'متوسط' : 'متقدم'}</span>
                            </div>
                        </div>

                        <div className="pt-8">
                            {isEnrolled ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm font-bold text-gray-300 mb-2">
                                        <span>تقدمك في الدورة</span>
                                        <span>{Math.round(enrolledProgress)}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden max-w-md">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-gold to-yellow-500 transition-all duration-1000"
                                            style={{ width: `${enrolledProgress}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={onStart}
                                        className="mt-6 bg-brand-gold text-brand-navy px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(198,165,104,0.3)] flex items-center gap-3"
                                    >
                                        <Play fill="currentColor" size={24} />
                                        {enrolledProgress > 0 ? 'متابعة الدورة' : 'ابدأ الدورة الآن'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={onPurchase}
                                        className="bg-brand-gold text-brand-navy px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(198,165,104,0.3)] flex items-center gap-3"
                                    >
                                        <ShoppingCart size={24} />
                                        اشترك الآن ({course.price} ر.س)
                                    </button>
                                    <button onClick={onStart} className="px-8 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
                                        <Play size={20} />
                                        مشاهدة المقدمة
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Left: Image Card */}
                    <div className="relative animate-fade-in delay-200 hidden lg:block">
                        <div className="absolute inset-0 bg-brand-gold/20 blur-3xl rounded-full transform rotate-12 scale-90"></div>
                        <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-white/5 shadow-2xl transform hover:rotate-2 transition-transform duration-500">
                            <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover aspect-[4/3]"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#06152e] via-transparent to-transparent opacity-60"></div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-8 -right-8 bg-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4 animate-bounce-slow">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">ضمان الجودة</p>
                                <p className="font-bold text-white">محتوى احترافي 100%</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- 2. Auto-Correct Quiz Component ---
const InlineQuiz = ({ questions, onComplete }: { questions: QuizQuestion[], onComplete: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const question = questions[currentIndex];

    const handleOptionClick = (option: string) => {
        if (selectedOption) return; // Prevent re-selection
        setSelectedOption(option);

        const correct = option === question.answer;
        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);

        // Auto-advance after delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                setCompleted(true);
                onComplete();
            }
        }, 1500);
    };

    if (completed) {
        return (
            <div className="bg-[#0f172a] rounded-2xl p-8 text-center border border-white/10 animate-fade-in mt-12">
                <div className="w-20 h-20 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
                    <Award size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">أحسنت! أكملت الاختبار</h3>
                <p className="text-gray-400 mb-6">نتيجتك: {score} من {questions.length}</p>
                <button onClick={() => { setCurrentIndex(0); setCompleted(false); setScore(0); setSelectedOption(null); }} className="text-brand-gold hover:underline font-bold">
                    إعادة الاختبار
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172a] rounded-2xl p-6 md:p-10 border border-white/10 mt-12 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold">
                    <HelpCircle size={14} />
                    <span>اختبار سريع</span>
                </div>
                <span className="text-gray-400 text-sm">سؤال {currentIndex + 1} من {questions.length}</span>
            </div>

            {/* Question */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
                {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    let styleClass = "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300";

                    if (isSelected) {
                        if (isCorrect) styleClass = "border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                        else styleClass = "border-red-500 bg-red-500/20 text-red-400 shake-animation";
                    } else if (selectedOption && option === question.answer) {
                        styleClass = "border-green-500 bg-green-500/10 text-green-400 opacity-50"; // Show correct answer if wrong selected
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            disabled={!!selectedOption}
                            className={`w-full text-right p-4 rounded-xl border-2 font-medium transition-all duration-300 relative overflow-hidden ${styleClass}`}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <span>{option}</span>
                                {isSelected && (
                                    isCorrect ? <CheckCircle2 size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                <div className="h-full bg-brand-gold transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
        </div>
    );
};

// --- 3. Course Interior (Sidebar + Content) ---
const CourseInterior = ({ course, activeLessonId, onSelectLesson, onExit, completedLessons, onLessonComplete, onNextLesson, onPrevLesson, showCelebration, onShowCelebration, onNavigateToCertificates }: any) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const units = useMemo(() => groupLessonsIntoUnits(course.lessons || []), [course.lessons]);

    // Find active lesson object
    const activeLesson = course.lessons.find((l: any) => l.id === activeLessonId);

    // Helper to check if unit is completed
    const isUnitCompleted = (unitLessons: Lesson[]) => {
        return unitLessons.every(l => completedLessons.includes(l.id));
    };

    return (
        <div className="flex h-screen bg-[#06152e] overflow-hidden" dir="rtl">
            {/* --- SIDEBAR (Right Side in RTL) --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed lg:relative inset-y-0 right-0 w-80 bg-[#0f172a] border-l border-white/5 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Sidebar Header */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3">
                                <h2 className="font-bold text-white text-lg truncate flex-1">{course.title}</h2>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="px-5 py-3 border-b border-white/5">
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-2">
                                    <span>التقدم</span>
                                    <span>{completedLessons.length} / {course.lessons.length}</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-brand-gold to-yellow-500 transition-all duration-700" style={{ width: `${course.lessons.length > 0 ? (completedLessons.length / course.lessons.length) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* Units List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                                {units.map((unit: any) => {
                                    const unitComplete = isUnitCompleted(unit.lessons);
                                    return (
                                        <div key={unit.id} className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                                                <span className="flex items-center gap-2">
                                                    {unitComplete && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                                                            <CheckCircle2 size={14} />
                                                        </motion.div>
                                                    )}
                                                    {unit.title}
                                                </span>
                                                <span className="text-[10px] text-gray-600">{unit.lessons.length} دروس</span>
                                            </div>
                                            <div className="space-y-1">
                                                {unit.lessons.map((lesson: any) => {
                                                    const isActive = lesson.id === activeLessonId;
                                                    const isCompleted = completedLessons.includes(lesson.id);
                                                    return (
                                                        <button
                                                            key={lesson.id}
                                                            onClick={() => { onSelectLesson(lesson.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all group ${isActive ? 'bg-brand-gold text-brand-navy shadow-lg font-bold' : 'hover:bg-white/5 text-gray-300'}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] border transition-all ${isActive ? 'border-brand-navy/30' : 'border-white/10 group-hover:border-white/30'} ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}`}>
                                                                {isCompleted ? (
                                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={12} /></motion.div>
                                                                ) : (
                                                                    lesson.type === 'video' ? <Play size={10} fill="currentColor" /> : <FileText size={10} />
                                                                )}
                                                            </div>
                                                            <span className="text-sm truncate">{lesson.title}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sidebar Footer */}
                            <div className="p-4 border-t border-white/5 bg-[#0a101f]">
                                <button onClick={onExit} className="w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                                    <ArrowRight size={16} /> العودة للدورات
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Top Header Bar (Always Visible) */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#0f172a]/80 backdrop-blur-md shrink-0 z-30">
                    <div className="flex items-center gap-3 min-w-0">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
                                <Menu size={20} />
                            </button>
                        )}
                        <span className="font-bold text-white truncate text-sm">{activeLesson?.title || 'اختر درساً'}</span>
                    </div>
                    <button onClick={onExit} className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 shrink-0">
                        <X size={16} /> خروج
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="w-full min-h-full px-6 md:px-12 lg:px-16 py-8">
                        {activeLesson ? (
                            <div className="pb-24 animate-fade-in">
                                {/* Lesson Content (Uses Enhanced Viewer — no duplicate quiz) */}
                                <LessonViewer lesson={activeLesson} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">اختر درساً للبدء</div>
                        )}
                    </div>
                </div>

                {/* Bottom Navigation — no background overlay, no lesson title */}
                <div className="shrink-0 px-6 md:px-12 lg:px-16 py-4 z-40 flex items-center justify-between">
                    {/* RIGHT SIDE (RTL): Previous Lesson */}
                    <div>
                        {onPrevLesson && (
                            <button
                                onClick={onPrevLesson}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
                            >
                                <ArrowRight size={18} /> الدرس السابق
                            </button>
                        )}
                    </div>

                    {/* LEFT SIDE (RTL): Next / Complete */}
                    <div>
                        {onNextLesson ? (
                            <button
                                onClick={() => {
                                    onLessonComplete(activeLessonId);
                                    onNextLesson();
                                }}
                                className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
                            >
                                الدرس التالي <SkipForward size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onShowCelebration();
                                }}
                                className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-400 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                            >
                                <Award size={20} /> إتمام الدورة بنجاح
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Celebration Overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                            className="bg-[#0f172a] border border-white/10 rounded-3xl p-10 md:p-14 text-center max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            {/* Confetti Particles */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 1 }}
                                        animate={{ y: 500, rotate: Math.random() * 720, opacity: 0 }}
                                        transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, repeat: Infinity, repeatDelay: Math.random() * 3 }}
                                        className="absolute top-0 w-3 h-3 rounded-full"
                                        style={{ backgroundColor: ['#C6A568', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 6], left: `${Math.random() * 100}%` }}
                                    />
                                ))}
                            </div>

                            {/* Trophy Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.5, damping: 10 }}
                                className="w-24 h-24 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-brand-gold/30"
                            >
                                <Award size={48} className="text-brand-gold" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="text-3xl font-bold text-white mb-3"
                            >
                                🎉 مبروك! أتممت الدورة بنجاح
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="text-gray-400 text-lg mb-10"
                            >
                                لقد أكملت جميع دروس الدورة. يمكنك الآن الحصول على شهادتك.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="flex flex-col gap-3"
                            >
                                <button
                                    onClick={() => onNavigateToCertificates()}
                                    className="w-full bg-brand-gold text-brand-navy py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors shadow-lg"
                                >
                                    🏆 احصل على الشهادة
                                </button>
                                <button
                                    onClick={onExit}
                                    className="w-full py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    العودة للدورات
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// MAIN PAGE CONTROLLER
// ============================================

const CourseDetailsPage = ({ courseId, onBack }: CourseDetailsPageProps) => {
    // 1. Data Fetching
    const { course: courseGlobal, isLoading, error } = useCourseDetails(courseId);
    const { courses: myCourses, updateCourseProgress, user } = useDashboard();

    // 2. State
    const [viewMode, setViewMode] = useState<'hero' | 'interior'>('hero');
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // 3. Derived State
    const enrolledCourse = myCourses.find(c => String(c.id) === courseId);
    const isEnrolled = !!enrolledCourse;
    const progress = enrolledCourse?.progress || 0;

    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

    useEffect(() => {
        if (courseGlobal?.lessons?.length > 0 && !activeLessonId) {
            setActiveLessonId(courseGlobal.lessons[0].id);
        }
    }, [courseGlobal, activeLessonId]);

    // 4. Handlers
    const handleStartCourse = () => {
        if (!isEnrolled) {
            if (courseGlobal?.lessons?.[0]?.isFree) {
                setViewMode('interior');
            } else {
                setShowPaymentModal(true);
            }
        } else {
            setViewMode('interior');
        }
    };

    const handleLessonComplete = (lessonId: string) => {
        if (!isEnrolled || !user || !courseGlobal) return;

        if (!completedLessonIds.includes(lessonId)) {
            setCompletedLessonIds(prev => [...prev, lessonId]);
        }

        const totalLessons = courseGlobal.lessons.length;
        const currentProgress = enrolledCourse?.progress || 0;
        const newCount = completedLessonIds.includes(lessonId) ? completedLessonIds.length : completedLessonIds.length + 1;
        const newProgress = Math.min(100, Math.round((newCount / totalLessons) * 100));

        if (newProgress > currentProgress) {
            updateCourseProgress(courseGlobal.id, user.id, newProgress);
        }
    };

    const handleCourseComplete = () => {
        if (!courseGlobal || !user) return;
        // Mark all lessons as complete
        const allIds = courseGlobal.lessons.map((l: any) => l.id);
        setCompletedLessonIds(allIds);
        // Set progress to 100%
        updateCourseProgress(courseGlobal.id, user.id, 100);
        // Show celebration
        setShowCelebration(true);
    };

    const handleNavigateToCertificates = () => {
        setShowCelebration(false);
        // Dispatch custom navigation event to go to certificates page
        window.dispatchEvent(new CustomEvent('dashboard-navigate', {
            detail: { view: 'certificates', id: courseGlobal?.id }
        }));
    };

    const handleNavigateLesson = (direction: 'next' | 'prev') => {
        if (!courseGlobal) return;
        const currentIndex = courseGlobal.lessons.findIndex((l: any) => l.id === activeLessonId);
        if (direction === 'next' && currentIndex < courseGlobal.lessons.length - 1) {
            setActiveLessonId(courseGlobal.lessons[currentIndex + 1].id);
        } else if (direction === 'prev' && currentIndex > 0) {
            setActiveLessonId(courseGlobal.lessons[currentIndex - 1].id);
        }
    };

    // 5. Render Loading/Error
    if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div></div>;
    if (error || !courseGlobal) return <div className="text-center text-white py-20">عذراً، لم يتم العثور على الدورة. <button onClick={onBack} className="underline text-brand-gold">العودة</button></div>;

    // 6. Main Render Switch
    return (
        <>
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={async () => { setShowPaymentModal(false); }}
                amount={courseGlobal.price}
                itemName={`دورة: ${courseGlobal.title}`}
                itemType="course"
                itemId={courseGlobal.id}
            />

            {viewMode === 'hero' ? (
                <CourseHero
                    course={courseGlobal}
                    isEnrolled={isEnrolled}
                    enrolledProgress={progress}
                    onStart={handleStartCourse}
                    onPurchase={() => setShowPaymentModal(true)}
                    onBack={onBack}
                />
            ) : (
                <CourseInterior
                    course={courseGlobal}
                    activeLessonId={activeLessonId}
                    onSelectLesson={setActiveLessonId}
                    onExit={() => setViewMode('hero')}
                    completedLessons={completedLessonIds}
                    onLessonComplete={handleLessonComplete}
                    onNextLesson={
                        activeLessonId !== courseGlobal.lessons[courseGlobal.lessons.length - 1].id
                            ? () => handleNavigateLesson('next')
                            : undefined
                    }
                    onPrevLesson={
                        activeLessonId !== courseGlobal.lessons[0].id
                            ? () => handleNavigateLesson('prev')
                            : undefined
                    }
                    showCelebration={showCelebration}
                    onShowCelebration={handleCourseComplete}
                    onNavigateToCertificates={handleNavigateToCertificates}
                />
            )}
        </>
    );
};

export default CourseDetailsPage;
