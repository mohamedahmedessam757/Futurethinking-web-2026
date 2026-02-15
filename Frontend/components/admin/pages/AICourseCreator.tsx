import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, ArrowLeft, Layers, FileText, CheckCircle2,
    Mic, Save, MonitorPlay, HelpCircle, BookOpen, Clock, BrainCircuit,
    Loader2, Edit3, RefreshCw, ChevronDown, ChevronUp, Upload, Play,
    Volume2, Image, Film, Target, Users, Calendar, Briefcase,
    AlertCircle, Check, X, Settings, ToggleLeft, ToggleRight,
    Shield, Activity, BarChart3, FileUp, Wand2, Maximize2, Plus, Trash2
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { useGlobal } from '../../GlobalContext';
import { supabase } from '../../../lib/supabase';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import aiService from '../../../services/ai';
import voiceService from '../../../services/voice';
import videoService from '../../../services/video';
import fileParserService from '../../../services/fileParser';
import aiCourseStorage from '../../../services/aiCourseStorage';
import { realtimeService } from '../../../services/realtimeService';
import { wavespeedService } from '../../../services/wavespeed';
import { aiGuard, aiManagement, aiMonitoring, GenerationPipeline, StepStatus } from '../../../services/aiSystems';
import { courseStructurePrompt, lessonScriptPrompt, trainingScenarioPrompt } from '../../../services/prompts';
import {
    TrainingBag, CourseUnit, EnhancedLesson, TrainingScenario,
    CourseGenerationJob, TrainingCourse, QuizQuestion
} from '../../../types/store';
import { AICreatorGuide } from './AICreatorGuide';

// ============================================
// TYPES
// ============================================
interface ParsedTrainingBag {
    title: string;
    description: string;
    thinkingPatterns: string[];
    mainTopics: string[];
    targetAudience: string;
    suggestedDuration: string;
    learningOutcomes: string[];
    content?: string;
    fileUrl?: string;
}

interface CourseSettings {
    totalDays: number;
    unitsCount: number;
    lessonsPerUnit: number;
    includeVoice: boolean;
    includeQuizzes: boolean;
    includeImages: boolean;
    includeVideos: boolean;
    includeScripts: boolean;
    includeScenarios: boolean;
}

interface GenerationProgress {
    phase: 'idle' | 'parsing' | 'structure' | 'content' | 'voice' | 'video' | 'complete';
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    currentLesson?: string;
}

interface AISystemStatus {
    guard: { status: 'idle' | 'checking' | 'passed' | 'failed'; message: string };
    management: { status: 'idle' | 'organizing' | 'done'; message: string };
    monitoring: { status: 'idle' | 'tracking' | 'complete'; message: string };
}

// ============================================
// STEP COMPONENTS
// ============================================

// Step 1: Training Bag Input with File Upload & Settings
const TrainingBagInput: React.FC<{
    content: string;
    setContent: (c: string) => void;
    settings: CourseSettings;
    setSettings: (s: CourseSettings) => void;
    uploadedFile: File | null;
    setUploadedFile: (f: File | null) => void;
    sourceFileUrl: string | null;
    setSourceFileUrl: (url: string | null) => void;
    onParse: () => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    apiStatus: 'checking' | 'online' | 'offline';
}> = ({ content, setContent, settings, setSettings, uploadedFile, setUploadedFile, sourceFileUrl, setSourceFileUrl, onParse, loading, setLoading, setError, apiStatus }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showGuide, setShowGuide] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('course-files')
                .upload(filePath, file);

            if (uploadError) {
                // Handle "Bucket not found" error
                if (uploadError.message.includes('Bucket not found')) {
                    // Try to Create Bucket (if RLS/Policy allows - unlikely for anon but worth a shot or fallback to instructions)
                    // In a real app, this should be done via migrations.
                    // We will notify the user to run the migration.
                    console.error('Bucket missing. Please run the migration.');
                    throw new Error('Storage bucket "course-files" not found. Please contact admin to run the database setup.');
                }
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-files')
                .getPublicUrl(filePath);

            setUploadedFile(file);
            setSourceFileUrl(publicUrl);

            // Clear manual content to avoid confusion
            setContent(`[تم رفع الملف بنجاح: ${file.name}]\nسيتم تحليل الملف بواسطة الذكاء الاصطناعي مباشرة.`);

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError('فشل في رفع الملف. تأكد من إعدادات Supabase Storage.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = (key: keyof CourseSettings) => {
        if (typeof settings[key] === 'boolean') {
            setSettings({ ...settings, [key]: !settings[key] });
        }
    };

    return (
        <div className="p-6 md:p-10 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <AICreatorGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <div className="text-center mb-8 relative">
                {/* Guide Button - Absolute Positioned */}
                <button
                    onClick={() => setShowGuide(true)}
                    className="absolute top-0 right-0 p-2 bg-brand-gold/10 text-brand-gold rounded-full hover:bg-brand-gold/20 transition-colors"
                    title="دليل الاستخدام"
                >
                    <HelpCircle size={20} />
                </button>

                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-gold/20 group hover:scale-105 transition-transform duration-300">
                    <div className="relative">
                        <Upload className="w-8 h-8 text-[#06152e]" />
                        {loading && <div className="absolute inset-0 bg-white/50 animate-pulse rounded-full" />}
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">مولد الكورسات المتكامل</h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-gray-400 text-sm">ارفع ملف (PDF/Word) ليقوم الذكاء الاصطناعي بإنشاء الكورس مباشرة</p>
                    {apiStatus === 'checking' && <span className="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> التحقق من النظام</span>}
                    {apiStatus === 'online' && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> النظام متصل</span>}
                    {apiStatus === 'offline' && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10} /> خطأ في الاتصال</span>}
                </div>
            </div>

            {/* Premium File Upload Zone */}
            <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`relative group mb-8 ${loading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-[#0f172a] border-2 border-dashed border-white/10 group-hover:border-brand-gold/50 rounded-2xl p-10 text-center transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.pptx,.ppt,.txt" onChange={handleFileUpload} disabled={loading} />

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${uploadedFile || sourceFileUrl
                            ? 'bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]'
                            : 'bg-[#06152e] text-gray-400 group-hover:text-brand-gold group-hover:bg-brand-gold/10 group-hover:shadow-[0_0_20px_rgba(198,165,104,0.2)]'
                            }`}>
                            {loading ? <Loader2 size={40} className="animate-spin text-brand-gold" /> : (uploadedFile || sourceFileUrl ? <CheckCircle2 size={40} /> : <FileUp size={40} />)}
                        </div>

                        {uploadedFile || sourceFileUrl ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {uploadedFile ? uploadedFile.name : 'تم استعادة الملف المرفق'}
                                </h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                                    <Check size={12} /> {sourceFileUrl ? 'تم الرفع للسحابة بنجاح' : 'جاهز للتحليل'}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-gold transition-colors">اضغط لرفع ملف</h3>
                                <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">ارفع ملفك (PDF/Word) ودع الذكاء الاصطناعي يتولى الباقي</p>
                                <div className="flex gap-2 justify-center">
                                    {['PDF', 'DOCX', 'PPTX', 'TXT'].map(ext => (
                                        <span key={ext} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-500 border border-white/5">{ext}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Content Textarea */}
            <div className="relative group mb-8">
                <div className="absolute inset-x-0 bottom-0 top-6 bg-gradient-to-t from-brand-gold/10 to-transparent rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2 px-2">
                    <span className="p-1.5 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-lg text-[#06152e] shadow-lg shadow-brand-gold/20"><FileText size={16} /></span>
                    محتوى الحقيبة التدريبية
                    <span className="text-[10px] text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-full ml-auto">أو اكتب المحتوى يدوياً هنا</span>
                </label>

                <div className="relative bg-[#06152e] border border-white/10 rounded-2xl p-1 transition-all duration-300 group-focus-within:border-brand-gold/50 group-focus-within:shadow-[0_0_30px_rgba(198,165,104,0.1)]">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[200px] bg-[#0f172a]/50 border-none rounded-xl p-6 text-white text-base leading-relaxed placeholder-gray-600 focus:ring-0 outline-none resize-none custom-scrollbar transition-colors focus:bg-[#0f172a]"
                        placeholder="الصق محتوى الحقيبة التدريبية هنا، أو اكتب المحاور الرئيسية للكورس..."
                        dir="rtl"
                    />

                    {/* Character Count / Info */}
                    <div className="absolute bottom-4 left-6 text-xs text-gray-600 font-mono bg-[#06152e]/80 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                        {content.length} حرف
                    </div>
                </div>
            </div>

            {/* Premium Course Settings */}
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-brand-gold/30 via-purple-500/20 to-blue-500/10 mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />

                <div className="relative bg-[#06152e]/90 backdrop-blur-xl rounded-2xl p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="p-2 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-lg text-[#06152e] shadow-lg shadow-brand-gold/20">
                                    <Settings size={20} />
                                </span>
                                إعدادات الكورس
                            </h3>
                            <p className="text-gray-400 text-sm mt-1 mr-12">تخصيص هيكل ومحتوى الدورة التدريبية بدقة</p>
                        </div>
                    </div>

                    {/* Core Parameters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: 'مدة الكورس (أيام)', value: settings.totalDays, key: 'totalDays', min: 1, max: 30, icon: Calendar },
                            { label: 'عدد الوحدات', value: settings.unitsCount, key: 'unitsCount', min: 1, max: 20, icon: Layers },
                            { label: 'دروس لكل وحدة', value: settings.lessonsPerUnit, key: 'lessonsPerUnit', min: 1, max: 10, icon: BookOpen },
                        ].map((item) => (
                            <div key={item.key} className="bg-[#0f172a] border border-white/5 rounded-xl p-4 hover:border-brand-gold/30 transition-colors group/input">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-400 text-xs font-medium flex items-center gap-2">
                                        <item.icon size={14} className="text-brand-gold/50 group-hover/input:text-brand-gold transition-colors" /> {item.label}
                                    </label>
                                    <span className="text-xs font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded">
                                        {item.key === 'totalDays' ? 'Training Days' : item.key === 'unitsCount' ? 'Total Units' : 'Lessons/Unit'}
                                    </span>
                                </div>
                                <div className="relative flex items-center">
                                    <button
                                        onClick={() => setSettings({ ...settings, [item.key]: Math.max(item.min, (settings[item.key as keyof CourseSettings] as number) - 1) })}
                                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min={item.min}
                                        max={item.max}
                                        value={settings[item.key as keyof CourseSettings] as number}
                                        onChange={e => setSettings({ ...settings, [item.key]: parseInt(e.target.value) || item.min })}
                                        className="flex-1 bg-transparent border-none text-center text-white font-bold text-xl focus:ring-0 outline-none h-10 mx-2"
                                    />
                                    <button
                                        onClick={() => setSettings({ ...settings, [item.key]: Math.min(item.max, (settings[item.key as keyof CourseSettings] as number) + 1) })}
                                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Toggles */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-brand-gold" /> خيارات المحتوى الذكي
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { key: 'includeVoice', label: 'تسجيل صوتي (AI Voice)', icon: Mic, desc: 'سرد صوتي احترافي' },
                                { key: 'includeQuizzes', label: 'اختبارات تفاعلية', icon: HelpCircle, desc: 'أسئلة وتقييم' },
                                { key: 'includeImages', label: 'صور توضيحية', icon: Image, desc: 'رسومات بيانية' },
                                { key: 'includeVideos', label: 'فيديوهات تعليمية', icon: Film, desc: 'مقاطع Veo3 القصيرة' },
                                { key: 'includeScripts', label: 'السكريبت الكامل', icon: FileText, desc: 'نص المحتوى' },
                                { key: 'includeScenarios', label: 'سيناريوهات تدريبية', icon: Briefcase, desc: 'أمثلة واقعية' },
                            ].map(({ key, label, icon: Icon, desc }) => {
                                const isActive = settings[key as keyof CourseSettings];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleSetting(key as keyof CourseSettings)}
                                        className={`relative group p-4 rounded-xl border transition-all duration-300 text-right overflow-hidden ${isActive
                                            ? 'bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 border-brand-gold/50 shadow-[0_0_15px_rgba(198,165,104,0.1)]'
                                            : 'bg-[#0f172a] border-white/5 hover:border-white/20 hover:bg-[#16223a]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-brand-gold text-[#06152e]' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isActive ? 'bg-brand-gold' : 'bg-gray-700'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isActive ? '-translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className={`font-bold text-sm mb-0.5 transition-colors ${isActive ? 'text-brand-gold' : 'text-gray-300 group-hover:text-white'}`}>
                                                {label}
                                            </h5>
                                            <p className={`text-[10px] transition-colors ${isActive ? 'text-brand-gold/70' : 'text-gray-500'}`}>
                                                {desc}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            <button onClick={onParse} disabled={(!content.trim() && !sourceFileUrl) || loading}
                className="w-full bg-gradient-to-r from-brand-gold to-[#d4b67d] text-brand-navy font-bold py-4 rounded-xl text-lg hover:shadow-[0_0_30px_rgba(198,165,104,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" /> جاري التحليل...</> : <><Sparkles /> بدء إنشاء الكورس</>}
            </button>
        </div>
    );
};

// AI Monitor Panel - Shows Guard/Management/Monitoring Status
const AIMonitorPanel: React.FC<{
    status: AISystemStatus;
    isVisible: boolean;
}> = ({ status, isVisible }) => {
    if (!isVisible) return null;

    const getStatusIcon = (s: 'idle' | 'checking' | 'passed' | 'failed' | 'organizing' | 'done' | 'tracking' | 'complete') => {
        if (s === 'idle') return <Clock size={14} className="text-gray-500" />;
        if (s === 'checking' || s === 'organizing' || s === 'tracking') return <Loader2 size={14} className="animate-spin text-brand-gold" />;
        if (s === 'passed' || s === 'done' || s === 'complete') return <Check size={14} className="text-green-400" />;
        if (s === 'failed') return <X size={14} className="text-red-400" />;
        return null;
    };

    const getStatusColor = (s: string) => {
        if (s === 'idle') return 'border-gray-600/30 bg-gray-500/5';
        if (['checking', 'organizing', 'tracking'].includes(s)) return 'border-brand-gold/30 bg-brand-gold/5';
        if (['passed', 'done', 'complete'].includes(s)) return 'border-green-500/30 bg-green-500/5';
        if (s === 'failed') return 'border-red-500/30 bg-red-500/5';
        return '';
    };

    return (
        <div className="bg-[#0f2344]/80 border border-white/10 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity size={16} className="text-brand-gold" /> مركز التحكم الذكي
            </h4>
            <div className="space-y-2">
                <div className={`flex items-center justify-between p-2 rounded-lg border ${getStatusColor(status.guard.status)}`}>
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                        <Shield size={12} /> AI Guard
                    </span>
                    <span className="text-xs flex items-center gap-1">
                        {getStatusIcon(status.guard.status)}
                        {status.guard.message || (status.guard.status === 'idle' ? 'جاهز' : '')}
                    </span>
                </div>
                <div className={`flex items-center justify-between p-2 rounded-lg border ${getStatusColor(status.management.status)}`}>
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                        <BarChart3 size={12} /> AI Management
                    </span>
                    <span className="text-xs flex items-center gap-1">
                        {getStatusIcon(status.management.status)}
                        {status.management.message || (status.management.status === 'idle' ? 'جاهز' : '')}
                    </span>
                </div>
                <div className={`flex items-center justify-between p-2 rounded-lg border ${getStatusColor(status.monitoring.status)}`}>
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                        <Activity size={12} /> AI Monitoring
                    </span>
                    <span className="text-xs flex items-center gap-1">
                        {getStatusIcon(status.monitoring.status)}
                        {status.monitoring.message || (status.monitoring.status === 'idle' ? 'جاهز' : '')}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Step 2: Course Structure Review
const CourseStructureReview: React.FC<{
    parsedData: ParsedTrainingBag | null;
    courseStructure: TrainingCourse | null;
    onGenerateStructure: () => void;
    onProceed: () => void;
    onBack: () => void;
    loading: boolean;
    error?: string | null;
    progress?: GenerationProgress;
    onGenerateContent: (unitId?: string) => void;
}> = ({ parsedData, courseStructure, onGenerateStructure, onProceed, onBack, loading, error, progress, onGenerateContent }) => {
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full max-h-[800px]">
            {/* Header */}
            <div className="p-6 md:p-8 bg-[#06152e] border-b border-white/10 shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {courseStructure?.title || parsedData?.title || 'هيكل الدورة'}
                        </h2>
                        <p className="text-gray-400 text-sm max-w-2xl">
                            {courseStructure?.description || parsedData?.description || 'مراجعة هيكل الدورة التدريبية'}
                        </p>
                    </div>
                    {courseStructure && (
                        <div className="text-left bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/30">
                            <p className="text-xs text-gray-400">الوحدات</p>
                            <p className="text-xl font-bold text-green-400">{courseStructure.units.length}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                {!courseStructure ? (
                    // Show parsed data summary
                    <div className="space-y-6">
                        {parsedData && (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-5">
                                        <h4 className="text-brand-gold font-bold mb-3 flex items-center gap-2">
                                            <Target size={18} /> أنماط التفكير
                                        </h4>
                                        <div className="space-y-2">
                                            {parsedData.thinkingPatterns?.map((pattern, i) => (
                                                <div key={i} className="flex items-center gap-2 text-gray-300">
                                                    <span className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold text-xs flex items-center justify-center font-bold">
                                                        {i + 1}
                                                    </span>
                                                    {pattern}
                                                </div>
                                            )) || <p className="text-gray-500 text-sm">لا توجد أنماط تفكير</p>}
                                        </div>
                                    </div>
                                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-5">
                                        <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                                            <BookOpen size={18} /> المخرجات التعليمية
                                        </h4>
                                        <ul className="space-y-2 text-gray-300 text-sm">
                                            {parsedData.learningOutcomes?.map((outcome, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 size={14} className="text-green-400 mt-1 shrink-0" />
                                                    {outcome}
                                                </li>
                                            )) || <p className="text-gray-500 text-sm">لا توجد مخرجات تعليمية</p>}
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-5">
                                    <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                                        <Users size={18} /> الفئة المستهدفة
                                    </h4>
                                    <p className="text-gray-300">{parsedData.targetAudience}</p>
                                </div>
                            </>
                        )}

                        <div className="space-y-3">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                                    <p className="mb-2 font-bold flex items-center justify-center gap-2">
                                        <AlertCircle size={18} /> حدث خطأ أثناء التوليد
                                    </p>
                                    <p className="text-sm mb-4">{error}</p>
                                    <button
                                        onClick={onGenerateStructure}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        إعادة المحاولة
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onGenerateStructure}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" />
                                            <span>جاري إنشاء هيكل الدورة...</span>
                                        </div>
                                        <span className="text-xs font-normal opacity-80">{progress?.currentStep || 'جاري العمل...'}</span>
                                    </div>
                                ) : (
                                    <><Layers /> {error ? 'إعادة المحاولة' : 'إنشاء هيكل الدورة الكامل'}</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    // Show course structure
                    <div className="space-y-4">
                        {[1, 2].map(day => (
                            <div key={day} className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Calendar size={20} className="text-brand-gold" />
                                    اليوم {day === 1 ? 'الأول' : 'الثاني'}
                                </h3>
                                {courseStructure.units
                                    .filter(u => u.dayNumber === day)
                                    .map(unit => (
                                        <div key={unit.id} className="bg-[#0f2344]/50 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="flex w-full items-center justify-between">
                                                <button
                                                    onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                                                    className="flex-1 p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-right"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold">
                                                            {unit.unitNumber}
                                                        </span>
                                                        <div className="text-right">
                                                            <h4 className="font-bold text-white">{unit.title}</h4>
                                                            <p className="text-xs text-gray-500">{unit.thinkingPattern} • {unit.lessons.length} دروس</p>
                                                        </div>
                                                    </div>
                                                    {expandedUnit === unit.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                                </button>

                                                <div className="px-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onGenerateStructure(); // Actually this prop name is 'onGenerateStructure' but we need content gen.
                                                            // Wait, CourseStructureReview props does NOT have onGenerateContent.
                                                            // I need to add it to props first.
                                                        }}
                                                        disabled={loading}
                                                        className="p-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="توليد محتوى هذه الوحدة فقط"
                                                    >
                                                        <Sparkles size={14} />
                                                        <span className="hidden md:inline">توليد الوحدة</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedUnit === unit.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-white/10"
                                                    >
                                                        <div className="p-4 space-y-2">
                                                            {unit.lessons.map((lesson, idx) => (
                                                                <div key={lesson.id} className="flex items-center gap-3 p-3 bg-[#06152e] rounded-lg">
                                                                    <span className="w-6 h-6 rounded-full bg-white/10 text-gray-400 text-xs flex items-center justify-center">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className="text-white text-sm">{lesson.title}</p>
                                                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                                                            <Clock size={10} /> {lesson.duration}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-[#06152e] flex justify-between items-center shrink-0">
                <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors">
                    ← العودة
                </button>
                {courseStructure && (
                    <button
                        onClick={onProceed}
                        className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2"
                    >
                        بدء توليد المحتوى <ArrowLeft size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

const ContentGeneration: React.FC<{
    courseStructure: TrainingCourse;
    progress: GenerationProgress;
    generatedLessons: Map<string, EnhancedLesson>;
    onGenerateContent: (unitId?: string) => void;
    onProceed: () => void;
    onBack: () => void;
    isGenerating: boolean;
}> = ({ courseStructure, progress, generatedLessons, onGenerateContent, onProceed, onBack, isGenerating }) => {
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

    // Auto-expand current lesson during generation (Live View)
    useEffect(() => {
        if (isGenerating && progress.currentLesson) {
            setExpandedLesson(progress.currentLesson);
        }
    }, [isGenerating, progress.currentLesson]);

    const totalLessons = courseStructure.units.reduce((acc, u) => acc + u.lessons.length, 0);
    const generatedCount = generatedLessons.size;
    const progressPercent = Math.round((progress.completedSteps / progress.totalSteps) * 100) || 0;

    return (
        <div className="flex flex-col h-full max-h-[800px]">
            {/* Header with Progress */}
            <div className="p-6 md:p-8 bg-[#06152e] border-b border-white/10 shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">توليد المحتوى</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-left">
                            <p className="text-xs text-gray-400">الدروس المكتملة</p>
                            <p className="text-xl font-bold text-brand-gold">{generatedCount} / {totalLessons}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{progress.currentStep || 'جاهز للبدء'}</span>
                        <span className="text-brand-gold font-bold">{progressPercent}%</span>
                    </div>
                    <div className="h-3 bg-[#0f2344] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-brand-gold to-yellow-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </div>

            {/* Units and Lessons */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                {courseStructure.units.map(unit => (
                    <div key={unit.id} className="bg-[#0f2344]/50 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-[#0f2344] border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center text-sm font-bold">
                                    {unit.unitNumber}
                                </span>
                                <div>
                                    <h3 className="font-bold text-white">{unit.title}</h3>
                                    <p className="text-xs text-gray-500">{unit.thinkingPattern}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onGenerateContent(unit.id)}
                                disabled={isGenerating}
                                className="p-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="توليد محتوى هذه الوحدة فقط"
                            >
                                <Sparkles size={14} />
                                <span className="hidden md:inline">توليد الوحدة</span>
                            </button>
                        </div>

                        <div className="divide-y divide-white/5">
                            {unit.lessons.map(lesson => {
                                const generated = generatedLessons.get(lesson.id);
                                const isCurrentlyGenerating = progress.currentLesson === lesson.id;

                                return (
                                    <div key={lesson.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${generated ? 'bg-green-500/20 text-green-400' :
                                                    isCurrentlyGenerating ? 'bg-brand-gold/20 text-brand-gold' :
                                                        'bg-gray-500/20 text-gray-500'
                                                    }`}>
                                                    {generated ? <Check size={14} /> :
                                                        isCurrentlyGenerating ? <Loader2 size={14} className="animate-spin" /> :
                                                            <Clock size={14} />}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${generated ? 'text-white' : 'text-gray-400'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {generated?.duration || lesson.duration}</span>
                                                        {generated && (
                                                            <>
                                                                <span className="flex items-center gap-1 text-green-400"><FileText size={10} /> سكريبت</span>
                                                                <span className="flex items-center gap-1 text-purple-400"><HelpCircle size={10} /> اختبار</span>
                                                                <span className="flex items-center gap-1 text-blue-400"><Briefcase size={10} /> سيناريو</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {generated && (
                                                <button
                                                    onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                                    className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs hover:bg-white/10 transition-colors"
                                                >
                                                    <ChevronDown size={14} className={`transition-transform ${expandedLesson === lesson.id ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Expanded Content Preview */}
                                        <AnimatePresence>
                                            {(expandedLesson === lesson.id || isCurrentlyGenerating) && (generated || isCurrentlyGenerating) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-4 overflow-hidden"
                                                >
                                                    <div className="bg-[#06152e] p-4 rounded-xl border border-white/5 space-y-4">
                                                        <div>
                                                            <h5 className="text-brand-gold text-sm font-bold mb-2 flex items-center gap-2">
                                                                <FileText size={14} />
                                                                {generated?.status === 'writing' ? 'جاري الكتابة (Live)...' :
                                                                    generated?.status === 'quizzing' ? 'جاري إعداد الاختبار...' :
                                                                        generated?.status === 'scenarios' ? 'جاري تصميم السيناريوهات...' :
                                                                            generated?.status === 'failed' ? 'فشل التوليد ❌' :
                                                                                'السكريبت'}
                                                            </h5>
                                                            <div className="text-gray-300 text-sm leading-relaxed p-3 bg-black/20 rounded-lg font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                                                                {generated?.script || ''}
                                                                {isCurrentlyGenerating && (
                                                                    <motion.span
                                                                        animate={{ opacity: [0, 1, 0] }}
                                                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                                                        className="inline-block w-2 h-4 bg-brand-gold ml-1 align-middle"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(generated?.quizData && generated.quizData.length > 0) || generated?.status === 'quizzing' ? (
                                                            <div>
                                                                <h5 className="text-purple-400 text-sm font-bold mb-2 flex items-center gap-2">
                                                                    <HelpCircle size={14} /> الاختبار
                                                                    {generated?.status === 'quizzing' && <span className="text-xs animate-pulse">(جاري التوليد...)</span>}
                                                                    {generated?.quizData && ` (${generated.quizData.length} أسئلة)`}
                                                                </h5>
                                                            </div>
                                                        ) : null}
                                                        {(generated?.trainingScenarios && generated.trainingScenarios.length > 0) || generated?.status === 'scenarios' ? (
                                                            <div>
                                                                <h5 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                                                                    <Briefcase size={14} /> السيناريوهات
                                                                    {generated?.status === 'scenarios' && <span className="text-xs animate-pulse">(جاري التوليد...)</span>}
                                                                    {generated?.trainingScenarios && ` (${generated.trainingScenarios.length})`}
                                                                </h5>
                                                            </div>
                                                        ) : null}

                                                        {/* RETRY BUTTON for Failed Lessons */}
                                                        {generated?.status === 'failed' && (
                                                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                                                <div className="flex items-start gap-3">
                                                                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <p className="text-red-400 font-bold text-sm mb-1">فشل توليد المحتوى</p>
                                                                        <p className="text-gray-400 text-xs mb-3">{generated?.error || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}</p>
                                                                        <button
                                                                            onClick={() => onGenerateContent(unit.id)}
                                                                            disabled={isGenerating}
                                                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <RefreshCw size={14} />
                                                                            إعادة المحاولة للوحدة
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-[#06152e] flex justify-between items-center shrink-0">
                <button onClick={onBack} disabled={isGenerating} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors disabled:opacity-50">
                    ← العودة
                </button>
                <div className="flex gap-3">
                    {generatedCount === 0 && (
                        <button
                            onClick={() => onGenerateContent()}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 className="animate-spin" /> جاري التوليد...</>
                            ) : (
                                <><Sparkles /> بدء توليد المحتوى</>
                            )}
                        </button>
                    )}
                    {generatedCount > 0 && (
                        <button
                            onClick={onProceed}
                            disabled={isGenerating}
                            className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            توليد الصوت والوسائط <ArrowLeft size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper: Calculate Reading Time (Dynamic Duration)
const calculateReadingDuration = (text: string): string => {
    if (!text) return '0 دقيقة';
    const cleanText = text.replace(/<[^>]*>/g, '').trim(); // Remove basic HTML if any
    const words = cleanText.split(/\s+/).length;
    // Average reading speed: 130 wpm for academic/dense content
    const minutes = Math.ceil(words / 130);
    return `${minutes} دقيقة`;
};

// Step 4: Content Review & Segmentation
const ContentReview: React.FC<{
    courseStructure: TrainingCourse;
    generatedLessons: Map<string, EnhancedLesson>;
    setGeneratedLessons: React.Dispatch<React.SetStateAction<Map<string, EnhancedLesson>>>;
    onProceed: () => void;
    onBack: () => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    generationId: string | null;
    sendNotification: (type: string, title: string, message: string, status: 'success' | 'error' | 'info') => void;
}> = ({ courseStructure, generatedLessons, setGeneratedLessons, onProceed, onBack, loading, setLoading, generationId, sendNotification }) => {
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track active tab per lesson (content, quiz, or scenarios)
    const [activeTabs, setActiveTabs] = useState<Record<string, 'content' | 'quiz' | 'scenarios'>>({});

    // Debounced Save to DB
    const debouncedSaveLesson = useCallback((lessonId: string, updatedLesson: EnhancedLesson) => {
        if (!generationId) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus('جاري الحفظ...');

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Find unit/lesson numbers
                let unitNum = 1;
                let lessonNum = 1;
                let found = false;

                courseStructure.units.forEach((u, uIdx) => {
                    u.lessons.forEach((l, lIdx) => {
                        if (l.id === lessonId) {
                            unitNum = u.unitNumber;
                            lessonNum = lIdx + 1; // Or check saved index
                            found = true;
                        }
                    });
                });

                if (found) {
                    await aiCourseStorage.saveLesson(generationId, unitNum, lessonNum, updatedLesson);
                    setSaveStatus('تم الحفظ ✅');
                    setTimeout(() => setSaveStatus(null), 2000);
                }
            } catch (e: any) {
                console.error("Auto-save failed", e);
                setSaveStatus('فشل الحفظ ❌');

                // Smart Error Detection for Missing Columns (Schema Mismatch)
                if (e.message?.includes('training_scenarios') || e.code === '42703') { // 42703 = undefined_column
                    sendNotification('error', 'خطأ قاعدة البيانات', 'لم يتم العثور على عمود training_scenarios. يرجى تشغيل سكربت الترحيل (SQL Migration) في Supabase.', 'error');
                } else if (e.message?.includes('explanation')) {
                    sendNotification('error', 'خطأ قاعدة البيانات', 'لم يتم العثور على عمود explanation. يرجى تحديث قاعدة البيانات.', 'error');
                }
            }
        }, 2000); // 2 seconds debounce
    }, [generationId, courseStructure]);

    // ----------------------------------------------------
    // CONTENT EDITOR UTILS (Verified Senior Implementation)
    // ----------------------------------------------------

    // 1. Text Cleaner
    const handleCleanText = (lessonId: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) { console.error('Lesson not found in map'); return; }

        const cleanString = (str: string) => {
            if (!str) return '';
            return str
                .replace(/[\*\#\_\-\`]/g, '')
                .replace(/\n\s*\n/g, '\n\n')
                .replace(/[ ]+/g, ' ')
                .trim();
        };

        const cleanedScript = cleanString(lesson.script || '');

        // Clean Segments
        let cleanedSegments = undefined;
        if (lesson.segments && lesson.segments.length > 0) {
            cleanedSegments = lesson.segments.map((s: any) => ({
                ...s,
                text: cleanString(s.text)
            }));
        }


        const updated = {
            ...lesson,
            script: cleanedScript,
            segments: cleanedSegments || lesson.segments
        };

        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated as any));

        if (generationId) {
            debouncedSaveLesson(lessonId, updated);
        }

        sendNotification('admin', 'تم تنظيف النص ✅', 'تم إزالة العلامات وتنسيق النص بنجاح', 'success');
    };

    // 2. AI Auto-Split
    const handleAISegment = async (lessonId: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.script) { console.error('Lesson or script missing'); return; }

        setLoading(true);
        try {
            const prompt = `
            Act as a strict text segmenter.
            Split the following Arabic text into natural segments (JSON array) EXACTLY as they appear in the source.
            
            CRITICAL RULES:
            1. **VERBATIM ONLY**: Do NOT rewrite, summarize, rephrase, or edit the text in any way. 
            2. **NO OMISSION**: Every single word and character from the source must be present in the output segments.
            3. **Segmentation**: Split based on natural pauses (periods, question marks, newlines) to create segments suitable for audio generation (approx 1-3 sentences each).
            4. **Format**: Return ONLY a JSON array of strings.
            
            Source Text:
            "${lesson.script}"

            Output Format (JSON Only):
            ["segment 1", "segment 2", "segment 3"]
            `;

            // Call Wavespeed Text Generation (Fast Model)
            const result = await wavespeedService.generateText(
                [{ role: 'user', content: prompt }],
                4000,
                { model_tier: 'fast' }
            );
            let rawSegments: string[] = [];

            try {
                // Parse JSON response (handling potential markdown wrapper)
                const jsonStr = result.replace(/```json|```/g, '').trim();
                rawSegments = JSON.parse(jsonStr);

                if (!Array.isArray(rawSegments)) throw new Error('Not an array');
            } catch (e) {
                // Fallback if AI fails to return strict JSON
                rawSegments = lesson.script.split(/\n+/).filter(s => s.trim().length > 10);
            }

            // Map to System Format
            const segments = rawSegments.map((text, i) => ({
                id: `seg-${Date.now()}-${i}`,
                order: i + 1,
                text: text.trim(),
                audioStatus: 'pending',
                imageStatus: 'pending',
                videoStatus: 'pending'
            }));

            const updated = { ...lesson, segments };
            setGeneratedLessons(prev => new Map(prev).set(lessonId, updated as any));

            // Save Persistence
            if (generationId) {
                await aiCourseStorage.updateLessonMedia(generationId, lessonId, {
                    content_segments: segments
                });
            }
            sendNotification('admin', 'تم التقسيم بالذكاء الاصطناعي ✅', 'تم تقسيم النص بنجاح', 'success');

        } catch (err: any) {
            console.error('AI Split Failed:', err);
            sendNotification('admin', 'خطأ في التقسيم', 'فشل التقسيم بالذكاء الاصطناعي', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateSegmentText = (lessonId: string, segmentId: string, newText: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.segments) return;

        const updatedSegments = lesson.segments.map((s: any) =>
            s.id === segmentId ? { ...s, text: newText } : s
        );

        const updated = { ...lesson, segments: updatedSegments };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
    };

    const updateScript = (lessonId: string, newScript: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        // Recalculate duration based on new script length
        const newDuration = calculateReadingDuration(newScript);

        const updated = { ...lesson, script: newScript, duration: newDuration };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));

        // Trigger Auto-Save
        debouncedSaveLesson(lessonId, updated);
    };

    const saveLessonSegments = async (lessonId: string) => {
        if (!generationId) return;
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        await aiCourseStorage.updateLessonMedia(generationId, lesson.id, {
            content_segments: lesson.segments
        });
    };

    // 3. Quiz & Scenario Editor Helpers
    const updateQuiz = (lessonId: string, qIdx: number, field: string, value: any) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.quizData) return;

        const newQuiz = [...lesson.quizData];
        newQuiz[qIdx] = { ...newQuiz[qIdx], [field]: value };

        // Handle options separately if needed, but for now assuming direct edit
        // If editing options array (e.g., options[0]), handle in UI

        const updated = { ...lesson, quizData: newQuiz };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const updateQuizOption = (lessonId: string, qIdx: number, optIdx: number, value: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.quizData) return;

        const newQuiz = [...lesson.quizData];
        const newOptions = [...newQuiz[qIdx].options];
        newOptions[optIdx] = value;
        newQuiz[qIdx] = { ...newQuiz[qIdx], options: newOptions };

        const updated = { ...lesson, quizData: newQuiz };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const deleteQuiz = (lessonId: string, qIdx: number) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.quizData) return;

        const newQuiz = lesson.quizData.filter((_, i) => i !== qIdx);
        const updated = { ...lesson, quizData: newQuiz };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const addQuiz = (lessonId: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        const newQ = { question: 'سؤال جديد', options: ['إجابة 1', 'إجابة 2'], answer: 'إجابة 1', type: 'mcq' as const };
        const newQuiz = [...(lesson.quizData || []), newQ];

        const updated = { ...lesson, quizData: newQuiz };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const updateScenario = (lessonId: string, sIdx: number, field: string, value: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.trainingScenarios) return;

        const newScenarios = [...lesson.trainingScenarios];
        newScenarios[sIdx] = { ...newScenarios[sIdx], [field]: value };

        const updated = { ...lesson, trainingScenarios: newScenarios };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const deleteScenario = (lessonId: string, sIdx: number) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.trainingScenarios) return;

        const newScenarios = lesson.trainingScenarios.filter((_, i) => i !== sIdx);
        const updated = { ...lesson, trainingScenarios: newScenarios };
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const addScenario = (lessonId: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        const newS = {
            title: 'سيناريو جديد',
            context: 'صف الموقف...',
            roleDescription: 'دور المتدرب...',
            challenge: 'التحدي...',
            solution: 'الحل الأمثل...',
            objectives: [],
            expectedOutcome: '',
            discussionPoints: [],
            id: `scenario-${Date.now()}`
        };
        const newScenarios = [...(lesson.trainingScenarios || []), newS];

        const updated = { ...lesson, trainingScenarios: newScenarios };
        updated.trainingScenarios = newScenarios as any; // Type assertion to avoid temporary mismatch if strict
        setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
        debouncedSaveLesson(lessonId, updated);
    };

    const handleGenerateSingleScenario = async (lessonId: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson || !lesson.script) {
            sendNotification('warning', 'تنبيه', 'يجب توفر محتوى للدرس أولاً', 'info');
            return;
        }

        setLoading(true);
        try {
            // Find unit for thinking pattern
            let thinkingPattern = 'General';
            courseStructure.units.forEach(u => {
                if (u.lessons.some(l => l.id === lessonId)) {
                    thinkingPattern = u.thinkingPattern;
                }
            });

            const result = await aiService.generateTrainingScenarios(
                lesson.title,
                lesson.script.substring(0, 3000),
                thinkingPattern,
                () => { }
            );

            if (result.success && result.content?.scenarios) {
                const newScenarios = [...(lesson.trainingScenarios || []), ...result.content.scenarios];
                const updated = { ...lesson, trainingScenarios: newScenarios };
                setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
                debouncedSaveLesson(lessonId, updated);
                sendNotification('success', 'تم بنجاح', `تم توليد ${result.content.scenarios.length} سيناريو جديد`, 'success');
            } else {
                throw new Error(result.error || 'فشل التوليد');
            }
        } catch (error: any) {
            sendNotification('error', 'خطأ', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[80vh]">
            <div className="p-6 md:p-8 bg-[#06152e] border-b border-white/10 shrink-0">
                <h2 className="text-2xl font-bold text-white mb-1">مراجعة وتقسيم المحتوى</h2>
                <p className="text-gray-400 text-sm">راجع المحتوى وقسمه إلى أجزاء لتوليد الوسائط بدقة</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                {(Array.from(generatedLessons.values()) as EnhancedLesson[]).map(lesson => (
                    <div key={lesson.id} className="bg-[#0f2344]/50 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between bg-[#0f2344]">
                            <h3 className="font-bold text-white">{lesson.title}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAISegment(lesson.id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                    {loading ? 'جاري التقسيم...' : 'تقسيم ذكي (AI)'}
                                </button>
                                <button
                                    onClick={() => handleCleanText(lesson.id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                                    title="إزالة الرموز (#, *) وتنسيق المسافات"
                                >
                                    <Edit3 size={12} /> تنظيف النص
                                </button>
                                <button
                                    onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                    className="px-3 py-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    {expandedLesson === lesson.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>
                        </div>

                        {expandedLesson === lesson.id && (
                            <div className="p-4 space-y-4">
                                {/* Lesson Tabs - Clickable Navigation */}
                                <div className="flex gap-2 border-b border-white/10 pb-2 mb-4">
                                    <button
                                        onClick={() => setActiveTabs(prev => ({ ...prev, [lesson.id]: 'content' }))}
                                        className={`px-3 py-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${(activeTabs[lesson.id] || 'content') === 'content'
                                            ? 'border-brand-gold text-brand-gold'
                                            : 'border-transparent text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <FileText size={14} /> المحتوى
                                    </button>

                                    {lesson.quizData && lesson.quizData.length > 0 && (
                                        <button
                                            onClick={() => setActiveTabs(prev => ({ ...prev, [lesson.id]: 'quiz' }))}
                                            className={`px-3 py-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTabs[lesson.id] === 'quiz'
                                                ? 'border-purple-500 text-purple-400'
                                                : 'border-transparent text-gray-400 hover:text-purple-400'
                                                }`}
                                        >
                                            <HelpCircle size={14} /> الاختبار ({lesson.quizData.length})
                                        </button>
                                    )}

                                    {lesson.trainingScenarios && lesson.trainingScenarios.length > 0 && (
                                        <button
                                            onClick={() => setActiveTabs(prev => ({ ...prev, [lesson.id]: 'scenarios' }))}
                                            className={`px-3 py-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTabs[lesson.id] === 'scenarios'
                                                ? 'border-blue-500 text-blue-400'
                                                : 'border-transparent text-gray-400 hover:text-blue-400'
                                                }`}
                                        >
                                            <Briefcase size={14} /> السيناريوهات ({lesson.trainingScenarios.length})
                                        </button>
                                    )}
                                </div>

                                {/* Content Editor */}
                                {/* 1. Content Editor Tab */}
                                {(activeTabs[lesson.id] || 'content') === 'content' && (
                                    <div className="animate-in fade-in duration-300">
                                        {lesson.segments && lesson.segments.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-gray-500">محتوى الدرس مقسم لإنتاج الفيديو</span>
                                                    <span className="text-xs text-brand-gold">{lesson.segments.length} مقطع</span>
                                                </div>
                                                {lesson.segments.map((seg: any) => (
                                                    <div key={seg.id} className="flex gap-3 bg-[#06152e] p-3 rounded-lg border border-white/5 group">
                                                        <span className="shrink-0 w-6 h-6 rounded-full bg-white/5 text-gray-500 text-xs flex items-center justify-center group-hover:bg-brand-gold/20 group-hover:text-brand-gold transition-colors">{seg.order}</span>
                                                        <textarea
                                                            value={seg.text}
                                                            onChange={(e) => updateSegmentText(lesson.id, seg.id, e.target.value)}
                                                            onBlur={() => saveLessonSegments(lesson.id)}
                                                            className="w-full bg-transparent border-none text-white text-lg font-bold leading-relaxed focus:ring-0 resize-none min-h-[80px]"
                                                            rows={3}
                                                            style={{ direction: 'rtl' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                                                <p className="mb-2">المحتوى غير مقسم</p>
                                                <div className="flex gap-2 text-sm justify-center">
                                                    <button onClick={() => handleAISegment(lesson.id)} className="text-brand-gold underline flex items-center gap-1 hover:text-white transition-colors"><Wand2 size={12} /> تقسيم ذكي بالذكاء الاصطناعي</button>
                                                    <span className="text-gray-600">|</span>
                                                    <button onClick={() => handleCleanText(lesson.id)} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"><Edit3 size={12} /> تنظيف النص</button>
                                                </div>
                                                <div className="mt-4 space-y-2 text-right">
                                                    <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                                                        <div className="flex items-center gap-3">
                                                            <span>حرر المحتوى قبل التقسيم</span>
                                                            {saveStatus && (
                                                                <span className={`flex items-center gap-1 ${saveStatus.includes('فشل') ? 'text-red-400' : 'text-green-400'} animate-pulse`}>
                                                                    {saveStatus}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="flex items-center gap-1 text-brand-gold">
                                                            <Clock size={12} /> مدة القراءة الفعلية: {lesson.duration || calculateReadingDuration(lesson.script || '')}
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        value={lesson.script}
                                                        onChange={(e) => updateScript(lesson.id, e.target.value)}
                                                        className="w-full h-[400px] bg-[#06152e] border border-white/10 rounded-lg p-4 text-white text-lg font-bold leading-relaxed focus:ring-1 focus:ring-brand-gold/50 outline-none resize-none custom-scrollbar"
                                                        dir="rtl"
                                                        placeholder="نص الدرس..."
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Quiz Preview (Read Only for now or simple list) */}
                                {/* 2. Quiz Editor Tab */}
                                {activeTabs[lesson.id] === 'quiz' && lesson.quizData && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex justify-between items-center mb-3 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                                            <div className="flex gap-2 items-center">
                                                <HelpCircle className="text-purple-400" size={18} />
                                                <div>
                                                    <h4 className="text-purple-400 font-bold text-sm">محرر الاختبارات</h4>
                                                    <p className="text-gray-400 text-[10px]">قم بتعديل الأسئلة والخيارات وتحديد الإجابة الصحيحة</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addQuiz(lesson.id)}
                                                className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-1"
                                            >
                                                <Plus size={12} /> سؤال جديد
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            {lesson.quizData.map((q: any, qIdx: number) => (
                                                <div key={qIdx} className="bg-[#06152e] p-4 rounded-xl border border-white/5 relative group hover:border-purple-500/30 transition-colors">
                                                    <button
                                                        onClick={() => deleteQuiz(lesson.id, qIdx)}
                                                        className="absolute top-2 left-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-[#0f2344] p-1.5 rounded-full hover:bg-red-500/10"
                                                        title="حذف السؤال"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <div className="mb-4 pr-2 border-r-2 border-purple-500/30 mr-1">
                                                        <label className="text-[10px] text-purple-300 block mb-1 font-bold">نص السؤال {qIdx + 1}</label>
                                                        <input
                                                            value={q.question}
                                                            onChange={(e) => updateQuiz(lesson.id, qIdx, 'question', e.target.value)}
                                                            className="w-full bg-[#0f2344] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                                                            placeholder="اكتب السؤال هنا..."
                                                        />
                                                    </div>

                                                    <div className="space-y-2 bg-[#0f2344]/50 p-3 rounded-lg">
                                                        <label className="text-[10px] text-gray-400 block mb-1">الخيارات (حدد الإجابة الصحيحة)</label>
                                                        {q.options.map((opt: string, optIdx: number) => (
                                                            <div key={optIdx} className="flex items-center gap-2 group/opt">
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`q-${lesson.id}-${qIdx}`}
                                                                        checked={q.answer === opt}
                                                                        onChange={() => updateQuiz(lesson.id, qIdx, 'answer', opt)}
                                                                        className="peer appearance-none w-4 h-4 rounded-full border border-gray-500 checked:border-purple-500 checked:bg-purple-500 transition-all cursor-pointer"
                                                                    />
                                                                    <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 pointer-events-none transition-transform"></div>
                                                                </div>

                                                                <input
                                                                    value={opt}
                                                                    onChange={(e) => updateQuizOption(lesson.id, qIdx, optIdx, e.target.value)}
                                                                    className={`flex-1 bg-[#06152e] border ${q.answer === opt ? 'border-purple-500/50 text-purple-100' : 'border-white/5 text-gray-300'} rounded px-3 py-2 text-xs focus:text-white focus:border-purple-500 outline-none transition-all`}
                                                                    placeholder={`الخيار ${optIdx + 1}`}
                                                                />
                                                                {q.answer === opt && <CheckCircle2 size={14} className="text-purple-500 animate-in fade-in" />}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-purple-900/10 p-3 rounded-lg border border-purple-500/10 mt-2">
                                                        <label className="text-[10px] text-purple-300 block mb-1 flex items-center gap-1">
                                                            <BrainCircuit size={12} /> تفسير الإجابة (يظهر للطالب بعد الحل)
                                                        </label>
                                                        <textarea
                                                            value={q.explanation || ''}
                                                            onChange={(e) => updateQuiz(lesson.id, qIdx, 'explanation', e.target.value)}
                                                            className="w-full bg-[#06152e] border border-white/5 rounded-lg p-2 text-xs text-gray-300 focus:border-purple-500 outline-none transition-colors resize-none h-16"
                                                            placeholder="اكتب شرحاً توضيحياً لسبب صحة الإجابة..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scenarios Preview */}
                                {/* 3. Scenarios Editor Tab */}
                                {activeTabs[lesson.id] === 'scenarios' && lesson.trainingScenarios && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex justify-between items-center mb-3 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                            <div className="flex gap-2 items-center">
                                                <Briefcase className="text-blue-400" size={18} />
                                                <div>
                                                    <h4 className="text-blue-400 font-bold text-sm">محرر السيناريوهات</h4>
                                                    <p className="text-gray-400 text-[10px]">تعديل سياق التدريب والأدوار والتحديات</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleGenerateSingleScenario(lesson.id)}
                                                    disabled={loading}
                                                    className="text-xs bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-lg hover:bg-brand-gold hover:text-black transition-colors shadow-lg shadow-yellow-900/20 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} توليد بال AI
                                                </button>
                                                <button
                                                    onClick={() => addScenario(lesson.id)}
                                                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> يدوي
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {lesson.trainingScenarios.map((s: any, sIdx: number) => (
                                                <div key={sIdx} className="bg-[#06152e] p-5 rounded-xl border border-white/5 relative group hover:border-blue-500/30 transition-colors">
                                                    <button
                                                        onClick={() => deleteScenario(lesson.id, sIdx)}
                                                        className="absolute top-3 left-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-[#0f2344] p-1.5 rounded-full hover:bg-red-500/10"
                                                        title="حذف السيناريو"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] text-blue-300 block mb-1 font-bold">عنوان السيناريو</label>
                                                            <input
                                                                value={s.title}
                                                                onChange={(e) => updateScenario(lesson.id, sIdx, 'title', e.target.value)}
                                                                className="w-full bg-[#0f2344] border border-white/10 rounded-lg p-2 text-sm font-bold text-brand-gold focus:border-blue-500 outline-none transition-colors"
                                                                placeholder="مثال: التعامل مع عميل غاضب"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] text-gray-400 block mb-1">سياق الموقف (Context)</label>
                                                                <textarea
                                                                    value={s.context}
                                                                    onChange={(e) => updateScenario(lesson.id, sIdx, 'context', e.target.value)}
                                                                    className="w-full bg-[#0f2344] border border-white/10 rounded-lg p-3 text-xs text-gray-200 resize-none h-24 focus:border-blue-500 outline-none leading-relaxed transition-colors"
                                                                    placeholder="وصف تفصيلي للموقف..."
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] text-gray-400 block mb-1">دور المتدرب</label>
                                                                <input
                                                                    value={s.roleDescription}
                                                                    onChange={(e) => updateScenario(lesson.id, sIdx, 'roleDescription', e.target.value)}
                                                                    className="w-full bg-[#0f2344] border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 outline-none transition-colors"
                                                                    placeholder="مثال: موظف خدمة عملاء"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] text-gray-400 block mb-1">التحدي الرئيسي</label>
                                                                <input
                                                                    value={s.challenge || ''}
                                                                    onChange={(e) => updateScenario(lesson.id, sIdx, 'challenge', e.target.value)}
                                                                    className="w-full bg-[#0f2344] border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 outline-none transition-colors"
                                                                    placeholder="ما هي الصعوبة؟"
                                                                />
                                                            </div>

                                                            <div className="col-span-2">
                                                                <label className="text-[10px] text-green-400 block mb-1">الحل النموذجي (Best Practice)</label>
                                                                <textarea
                                                                    value={s.solution || ''}
                                                                    onChange={(e) => updateScenario(lesson.id, sIdx, 'solution', e.target.value)}
                                                                    className="w-full bg-[#0f2344] border border-green-500/20 rounded-lg p-3 text-xs text-gray-200 resize-none h-20 focus:border-green-500 outline-none leading-relaxed transition-colors"
                                                                    placeholder="كيف يجب أن يتصرف المتدرب بشكل مثالي؟"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-6 border-t border-white/10 bg-[#06152e] flex justify-between items-center shrink-0">
                <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors">← العودة</button>
                <button onClick={onProceed} className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2">
                    التالي: استوديو الوسائط <ArrowLeft size={18} />
                </button>
            </div>
        </div>
    );
};
// Step 5: Media Generation (Audio, Visuals & Video) - Studio Layout
const MediaGeneration: React.FC<{
    courseStructure: TrainingCourse;
    generatedLessons: Map<string, EnhancedLesson>;
    onGenerateVoice: (lessonId: string, segmentId?: string) => void;
    onGenerateAllVoice: () => void;
    onGenerateImage: (lessonId: string, type: 'infographic' | 'illustration', segmentId?: string) => void;
    onGenerateVideo: (lessonId: string, segmentId?: string) => void;
    onProceed: () => void;
    onBack: () => void;
    isGenerating: boolean;
    voiceProgress: { current: string; completed: string[] };
}> = ({
    courseStructure,
    generatedLessons,
    onGenerateVoice,
    onGenerateAllVoice,
    onGenerateImage,
    onGenerateVideo,
    onProceed,
    onBack,
    isGenerating,
    voiceProgress
}) => {
        const [activeTab, setActiveTab] = useState<'audio' | 'visuals' | 'video'>('audio');
        const lessons = Array.from(generatedLessons.values()) as EnhancedLesson[];

        // State for the "Studio" Focus
        const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || '');
        const [selectedSegmentId, setSelectedSegmentId] = useState<string>(''); // If empty, lesson level
        const [imageStyle, setImageStyle] = useState<'illustration' | 'infographic'>('illustration');

        // Audio Player State
        const [isPlaying, setIsPlaying] = useState(false);
        const audioRef = useRef<HTMLAudioElement>(null);

        // Hydrate initial selection
        useEffect(() => {
            if (!selectedLessonId && lessons.length > 0) setSelectedLessonId(lessons[0].id);
        }, [lessons, selectedLessonId]);

        const activeLesson = lessons.find(l => l.id === selectedLessonId);
        const activeSegment = activeLesson?.segments?.find((s: any) => s.id === selectedSegmentId);
        const activeText = activeSegment ? activeSegment.text : activeLesson?.script || '';

        // Status Logic
        const currentMediaUrl = activeSegment
            ? (activeTab === 'audio' ? activeSegment.audioUrl : activeTab === 'visuals' ? activeSegment.imageUrl : activeSegment.videoUrl)
            : (activeTab === 'audio' ? activeLesson?.voiceUrl : activeTab === 'visuals' ? activeLesson?.imageUrl : activeLesson?.videoUrl);

        const isCurrentGenerating = isGenerating && (voiceProgress.current === (selectedSegmentId || selectedLessonId));

        // Stats
        const totalSegments = lessons.reduce((acc, l) => acc + (l.segments?.length || 1), 0);
        const completedCount = lessons.reduce((acc, l) => {
            if (l.segments?.length) {
                return acc + l.segments.filter((s: any) => activeTab === 'audio' ? s.audioUrl : activeTab === 'visuals' ? s.imageUrl : s.videoUrl).length;
            }
            return acc + (activeTab === 'audio' && l.voiceUrl ? 1 : activeTab === 'visuals' && l.imageUrl ? 1 : activeTab === 'video' && l.videoUrl ? 1 : 0);
        }, 0);

        const handlePlayPause = () => {
            if (audioRef.current) {
                if (isPlaying) audioRef.current.pause();
                else audioRef.current.play();
                setIsPlaying(!isPlaying);
            }
        };

        return (
            <div className="flex flex-col h-full min-h-[85vh] bg-[#020617]">
                {/* Header */}
                <div className="p-6 bg-[#06152e] border-b border-white/10 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                            <MonitorPlay size={24} className="text-brand-gold" /> استوديو الوسائط الذكي
                        </h2>
                        <p className="text-gray-400 text-sm">توليد احترافي للصوت والصور والفيديو</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex bg-[#0f2344] p-1 rounded-xl">
                        <button onClick={() => setActiveTab('audio')} className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'audio' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
                            <Mic size={18} /> الصوت
                        </button>
                        <button onClick={() => setActiveTab('visuals')} className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'visuals' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
                            <Image size={18} /> الصور
                        </button>
                        <button onClick={() => setActiveTab('video')} className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'video' ? 'bg-pink-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
                            <Film size={18} /> الفيديو
                        </button>
                    </div>

                    <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-center min-w-[100px]">
                        <span className="block text-xs text-gray-400">المكتمل</span>
                        <span className={`text-xl font-bold ${activeTab === 'audio' ? 'text-purple-400' : activeTab === 'visuals' ? 'text-blue-400' : 'text-pink-400'}`}>
                            {completedCount}/{totalSegments}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Navigation List */}
                    <div className="w-[350px] shrink-0 border-l border-white/10 overflow-y-auto bg-[#06152e] custom-scrollbar">
                        {lessons.map(lesson => (
                            <div key={lesson.id} className="border-b border-white/5">
                                <button
                                    onClick={() => { setSelectedLessonId(lesson.id); setSelectedSegmentId(''); }}
                                    className={`w-full text-right p-4 transition-colors hover:bg-white/5 ${selectedLessonId === lesson.id && !selectedSegmentId ? 'bg-brand-gold/10 border-r-4 border-brand-gold' : ''}`}
                                >
                                    <h4 className={`font-bold text-sm ${selectedLessonId === lesson.id ? 'text-white' : 'text-gray-400'}`}>{lesson.title}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-500">{lesson.duration || '00:00'}</span>
                                        {lesson.segments && <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-500">{lesson.segments.length} أجزاء</span>}
                                    </div>
                                </button>

                                {/* Sub-segments */}
                                {selectedLessonId === lesson.id && lesson.segments && (
                                    <div className="bg-[#020617]/50">
                                        {lesson.segments.map((seg: any) => (
                                            <button
                                                key={seg.id}
                                                onClick={() => setSelectedSegmentId(seg.id)}
                                                className={`w-full text-right py-3 px-6 text-xs flex items-center justify-between transition-colors border-b border-white/5 ${selectedSegmentId === seg.id ? `bg-white/5 text-${activeTab === 'audio' ? 'purple' : activeTab === 'visuals' ? 'blue' : 'pink'}-400 font-bold` : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                <span className="line-clamp-1">{seg.text.substring(0, 40)}...</span>
                                                {/* Status Dot */}
                                                {((activeTab === 'audio' && seg.audioUrl) || (activeTab === 'visuals' && seg.imageUrl) || (activeTab === 'video' && seg.videoUrl)) &&
                                                    <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                                }
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: Studio Workspace */}
                    <div className="flex-1 bg-black/40 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        {activeLesson ? (
                            <div className="w-full h-full flex flex-col max-w-7xl animate-in fade-in zoom-in duration-300">
                                {/* Text Context Card */}
                                <div className="bg-[#06152e] border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl shrink-0 max-h-[200px] flex flex-col">
                                    <h5 className="text-gray-500 text-xs font-bold mb-3 flex items-center gap-2">
                                        <FileText size={14} /> النص المصدر ({selectedSegmentId ? 'جزء محدد' : 'الدرس كامل'})
                                    </h5>
                                    <p className="text-white text-lg leading-loose font-medium overflow-y-auto custom-scrollbar" dir="rtl">
                                        {activeText}
                                    </p>
                                </div>

                                {/* Media Player / Generator Area */}
                                <div className="bg-[#06152e] border border-white/10 rounded-2xl p-2 flex-1 min-h-[400px] flex flex-col overflow-hidden relative group">

                                    {/* 1. AUDIO VIEW (WhatsApp Style) */}
                                    {activeTab === 'audio' && (
                                        <div className="flex-1 flex flex-col p-8 bg-gradient-to-b from-[#0f2344] to-[#06152e]">
                                            {currentMediaUrl ? (
                                                <div className="flex-1 flex flex-col items-center justify-center w-full">
                                                    {/* WhatsApp Player Bubble */}
                                                    <div className={`w-full bg-[#1f2c34] p-4 rounded-xl rounded-tr-none flex items-center gap-4 transition-all ${isPlaying ? 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}`}>
                                                        <button
                                                            onClick={handlePlayPause}
                                                            className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-400 transition-colors shadow-lg"
                                                        >
                                                            {isPlaying ? <span className="w-3 h-3 bg-white block"></span> : <Play size={20} className="fill-current ml-1" />}
                                                        </button>

                                                        {/* Waveform Visualization */}
                                                        <div className="flex-1 h-12 flex items-center gap-1 overflow-hidden">
                                                            {[...Array(30)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-purple-400' : 'bg-gray-600'}`}
                                                                    style={{
                                                                        height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '30%',
                                                                        animation: isPlaying ? `waveform 0.5s infinite ease-in-out ${i * 0.05}s` : 'none'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>

                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {activeLesson.voiceDuration ? `${Math.floor(activeLesson.voiceDuration / 60)}:${(activeLesson.voiceDuration % 60).toString().padStart(2, '0')}` : '00:00'}
                                                        </span>
                                                    </div>

                                                    <audio
                                                        ref={audioRef}
                                                        src={currentMediaUrl}
                                                        className="hidden"
                                                        onEnded={() => setIsPlaying(false)}
                                                        onPlay={() => setIsPlaying(true)}
                                                        onPause={() => setIsPlaying(false)}
                                                    />

                                                    <div className="mt-8 flex justify-between w-full opacity-60 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-blue-400" /> تم الحفظ في السحابة</span>
                                                        <span>{new Date().toLocaleTimeString('ar-SA')}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                                    <Mic size={64} className="mx-auto mb-4 text-purple-500/30" />
                                                    <p className="text-gray-400">لم يتم توليد تسجيل صوتي بعد</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => onGenerateVoice(selectedLessonId, selectedSegmentId || undefined)}
                                                disabled={isGenerating}
                                                className={`mt-6 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:shadow-lg ${isCurrentGenerating ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/20'}`}
                                            >
                                                {isCurrentGenerating ? <Loader2 className="animate-spin" /> : currentMediaUrl ? <RefreshCw size={18} /> : <Wand2 size={18} />}
                                                {currentMediaUrl ? 'إعادة توليد التسجيل' : 'توليد الصوت (AI)'}
                                            </button>
                                        </div>
                                    )}

                                    {/* 2. VISUALS VIEW (Large Frame) */}
                                    {activeTab === 'visuals' && (
                                        <div className="flex-1 flex flex-col items-center p-6 bg-black/20">
                                            {/* Style Select */}
                                            <div className="w-full flex justify-end gap-3 mb-4">
                                                <button onClick={() => setImageStyle('illustration')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${imageStyle === 'illustration' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>رسوم توضيحية</button>
                                                <button onClick={() => setImageStyle('infographic')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${imageStyle === 'infographic' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>انفوجرافيك</button>
                                            </div>

                                            {currentMediaUrl ? (
                                                <div className="relative w-full flex-1 rounded-2xl overflow-hidden group-hover:shadow-2xl transition-all border border-white/10 group bg-black/50">
                                                    <img src={currentMediaUrl} alt="Generated" className="w-full h-full object-contain" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-8">
                                                        <a href={currentMediaUrl} target="_blank" rel="noreferrer" className="text-white bg-white/20 backdrop-blur-md px-8 py-3 rounded-full hover:bg-white hover:text-black transition-colors font-bold flex items-center gap-2">
                                                            <Maximize2 size={20} /> تكبير الصورة
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full flex-1 border-2 border-dashed border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-6 bg-blue-500/5">
                                                    <Image size={64} className="text-blue-500/30" />
                                                    <p className="text-lg font-bold text-blue-400/50">مساحة توليد الصور</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => onGenerateImage(selectedLessonId, imageStyle, selectedSegmentId || undefined)}
                                                disabled={isGenerating}
                                                className={`mt-4 w-full py-5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-lg ${isCurrentGenerating ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'}`}
                                            >
                                                {isCurrentGenerating ? <Loader2 className="animate-spin" size={24} /> : currentMediaUrl ? <RefreshCw size={24} /> : <Wand2 size={24} />}
                                                {currentMediaUrl ? 'إعادة توليد الصورة' : 'توليد الصورة الآن'}
                                            </button>
                                        </div>
                                    )}

                                    {/* 3. VIDEO VIEW (Large Frame) */}
                                    {activeTab === 'video' && (
                                        <div className="flex-1 flex flex-col items-center p-6 bg-black/20">
                                            {currentMediaUrl ? (
                                                <div className="relative w-full flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                                                    <video controls src={currentMediaUrl} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-full flex-1 border-2 border-dashed border-pink-500/20 rounded-2xl flex flex-col items-center justify-center gap-6 bg-pink-500/5">
                                                    <Film size={64} className="text-pink-500/30" />
                                                    <p className="text-lg font-bold text-pink-400/50">مساحة الفيديو</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => onGenerateVideo(selectedLessonId, selectedSegmentId || undefined)}
                                                disabled={isGenerating}
                                                className={`mt-4 w-full py-5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-lg ${isCurrentGenerating ? 'bg-gray-700 text-gray-400' : 'bg-pink-600 text-white hover:bg-pink-500 shadow-pink-900/20'}`}
                                            >
                                                {isCurrentGenerating ? <Loader2 className="animate-spin" size={24} /> : currentMediaUrl ? <RefreshCw size={24} /> : <Wand2 size={24} />}
                                                {currentMediaUrl ? 'إعادة توليد الفيديو' : 'توليد فيديو توضيحي'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Loading Overlay */}
                                    {isCurrentGenerating && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full bg-white/5 mb-6 ${activeTab === 'audio' ? 'text-purple-500' : activeTab === 'visuals' ? 'text-blue-500' : 'text-pink-500'}`}>
                                                <Loader2 size={40} className="animate-spin absolute" />
                                                {activeTab === 'audio' && <Mic size={20} className="animate-pulse" />}
                                                {activeTab === 'visuals' && <Image size={20} className="animate-pulse" />}
                                                {activeTab === 'video' && <Film size={20} className="animate-pulse" />}
                                            </div>
                                            <p className="text-white font-bold text-lg animate-pulse mb-2">
                                                {activeTab === 'audio' ? 'جاري المعالجة الصوتية...' : activeTab === 'visuals' ? 'جاري رسم وتصميم الصورة...' : 'جاري إنتاج المشهد...'}
                                            </p>
                                            <p className="text-gray-500 text-xs">قد يستغرق الأمر بعض الوقت لضمان أعلى جودة</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>اختر درساً من القائمة الجانبية للبدء</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#06152e] flex justify-between items-center shrink-0">
                    <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors">← العودة</button>
                    <div className="flex gap-4">
                        {activeTab === 'audio' && (
                            <button onClick={onGenerateAllVoice} className="text-purple-400 hover:text-purple-300 text-sm underline px-4 flex items-center gap-2">
                                <Activity size={14} /> توليد لكل الكورس (دفعة واحدة)
                            </button>
                        )}
                        <button onClick={onProceed} className="bg-brand-gold text-brand-navy px-8 py-3 rounded-xl font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2">
                            التالي: الحفظ والنشر <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

// Step 5: Review & Save
const ReviewAndSave: React.FC<{
    courseStructure: TrainingCourse;
    generatedLessons: Map<string, EnhancedLesson>;
    onSave: () => void;
    onBack: () => void;
    loading: boolean;
    coverImage: string | null;
    onGenerateCover: () => void;
    onGenerateContent: (unitId?: string) => void;
}> = ({ courseStructure, generatedLessons, onSave, onBack, loading, coverImage, onGenerateCover, onGenerateContent }) => {
    const totalLessons = generatedLessons.size;
    const lessonsArray = Array.from(generatedLessons.values()) as EnhancedLesson[];
    const lessonsWithVoice = lessonsArray.filter(l => l.voiceUrl || (l.segments && l.segments.some(s => s.audioUrl))).length;
    const lessonsWithScenarios = lessonsArray.filter(l => l.trainingScenarios && l.trainingScenarios.length > 0).length;

    return (
        <div className="flex flex-col h-full max-h-[800px]">
            {/* Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20 shrink-0">
                <div className="text-center">
                    {/* Dynamic Cover Image */}
                    <div className="w-full max-w-md mx-auto mb-6 relative group">
                        {coverImage ? (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-gold/30 shadow-2xl">
                                <img src={coverImage} alt="Course Cover" className="w-full h-48 object-cover" />
                                <button
                                    onClick={onGenerateCover}
                                    disabled={loading}
                                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg text-xs flex items-center gap-1 backdrop-blur-sm transition-colors"
                                >
                                    <RefreshCw size={12} /> إعادة تصميم
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#0f2344] border-2 border-dashed border-white/10 rounded-2xl h-48 flex flex-col items-center justify-center p-6 hover:border-brand-gold/50 transition-colors">
                                <Image className="w-12 h-12 text-gray-500 mb-3" />
                                <p className="text-gray-400 text-sm mb-3">لا يوجد غلاف للكورس</p>
                                <button
                                    onClick={onGenerateCover}
                                    disabled={loading}
                                    className="px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-lg hover:bg-brand-gold hover:text-[#06152e] transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                    تصميم غلاف بالذكاء الاصطناعي
                                </button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{courseStructure.title}</h2>
                    <p className="text-gray-400">الكورس جاهز للحفظ</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-4 text-center">
                        <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{courseStructure.totalDays}</p>
                        <p className="text-gray-500 text-xs">أيام</p>
                    </div>
                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-4 text-center">
                        <Layers className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{courseStructure.units.length}</p>
                        <p className="text-gray-500 text-xs">وحدات</p>
                    </div>
                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-4 text-center">
                        <BookOpen className="w-8 h-8 text-brand-gold mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{totalLessons}</p>
                        <p className="text-gray-500 text-xs">درس</p>
                    </div>
                    <div className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-4 text-center">
                        <Volume2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{lessonsWithVoice}</p>
                        <p className="text-gray-500 text-xs">تسجيل صوتي</p>
                    </div>
                </div>

                {/* Course Content Summary */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">محتوى الكورس</h3>
                    {courseStructure.units.map(unit => {
                        const unitLessons = unit.lessons;
                        const quizCount = unitLessons.filter(l => generatedLessons.get(l.id)?.quizData).length;
                        const scenarioCount = unitLessons.filter(l => (generatedLessons.get(l.id)?.trainingScenarios?.length || 0) > 0).length;
                        const voiceCount = unitLessons.filter(l => {
                            const gl = generatedLessons.get(l.id);
                            return gl?.voiceUrl || (gl?.segments && gl.segments.some((s: any) => s.audioUrl));
                        }).length;

                        return (
                            <div key={unit.id} className="bg-[#0f2344]/50 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3 justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center text-sm font-bold">
                                            {unit.unitNumber}
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-white">{unit.title}</h4>
                                            <p className="text-xs text-gray-500">اليوم {unit.dayNumber === 1 ? 'الأول' : 'الثاني'} • {unit.thinkingPattern}</p>
                                        </div>
                                    </div>
                                    {/* GENERATE BUTTON REMOVED for Final Polish */}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-[#06152e] rounded-lg p-2 text-center">
                                        <FileText size={14} className="text-brand-gold mx-auto mb-1" />
                                        <span className="text-gray-400">{unit.lessons.length} دروس</span>
                                    </div>
                                    <div className="bg-[#06152e] rounded-lg p-2 text-center">
                                        <HelpCircle size={14} className="text-purple-400 mx-auto mb-1" />
                                        <span className={`font-bold ${quizCount > 0 ? 'text-white' : 'text-gray-500'}`}>{quizCount} اختبارات</span>
                                    </div>
                                    <div className="bg-[#06152e] rounded-lg p-2 text-center">
                                        <Briefcase size={14} className="text-blue-400 mx-auto mb-1" />
                                        <span className={`font-bold ${scenarioCount > 0 ? 'text-white' : 'text-gray-500'}`}>{scenarioCount} سيناريوهات</span>
                                    </div>
                                    <div className="bg-[#06152e] rounded-lg p-2 text-center">
                                        <Mic size={14} className="text-green-400 mx-auto mb-1" />
                                        <span className={`font-bold ${voiceCount > 0 ? 'text-white' : 'text-gray-500'}`}>{voiceCount} صوتيات</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-[#06152e] flex justify-between items-center shrink-0">
                <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors">
                    ← تعديل
                </button>
                <button
                    onClick={onSave}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" /> جاري الحفظ...</>
                    ) : (
                        <><Save size={20} /> حفظ الكورس</>
                    )}
                </button>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AICourseCreator: React.FC = () => {
    const { addCourse, trackAiUsage } = useAdmin();
    const { sendNotification } = useGlobal();

    // Wizard State (Persisted)
    const [step, setStep] = useLocalStorage<number>('ai_course_step', 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State (Persisted Content)
    const [trainingBagContent, setTrainingBagContent] = useLocalStorage<string>('ai_course_content', '');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [sourceFileUrl, setSourceFileUrl] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedTrainingBag | null>(null);

    // Structure persisted to ensure Step 2 load
    const [courseStructure, setCourseStructure] = useLocalStorage<TrainingCourse | null>('ai_course_structure', null);
    const [generatedLessons, setGeneratedLessons] = useState<Map<string, EnhancedLesson>>(() => {
        if (typeof window === 'undefined') return new Map();
        try {
            const saved = localStorage.getItem('ai_generated_lessons_backup');
            if (saved) {
                const parsed = JSON.parse(saved);
                return new Map(parsed);
            }
            return new Map();
        } catch (e) {
            console.error('Failed to parse lessons from local storage', e);
            return new Map();
        }
    });

    // Course Settings State (Persisted)
    const [courseSettings, setCourseSettings] = useLocalStorage<CourseSettings>('ai_course_settings', {
        totalDays: 2,
        unitsCount: 4,
        lessonsPerUnit: 3,
        includeVoice: true,
        includeQuizzes: true,
        includeImages: true,
        includeVideos: false,
        includeScripts: true,
        includeScenarios: true,
    });

    // AI System Status
    const [aiSystemStatus, setAiSystemStatus] = useState<AISystemStatus>({
        guard: { status: 'idle', message: '' },
        management: { status: 'idle', message: '' },
        monitoring: { status: 'idle', message: '' },
    });

    const [generationId, setGenerationId] = useLocalStorage<string | null>('ai_course_gen_id', null);

    // Generation Progress
    const [progress, setProgress] = useState<GenerationProgress>({
        phase: 'idle',
        currentStep: '',
        totalSteps: 0,
        completedSteps: 0,
    });
    const [voiceProgress, setVoiceProgress] = useState<{ current: string; completed: string[] }>({
        current: '',
        completed: [],
    });

    // --- SAFETY GUARDS ---
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // 1. Check API on Mount
    useEffect(() => {
        const checkConnection = async () => {
            setApiStatus('checking');
            const isOnline = await wavespeedService.testConnection();
            setApiStatus(isOnline ? 'online' : 'offline');
            if (!isOnline) {
                sendNotification('admin', 'خطأ في الاتصال ⚠️', 'لم نتمكن من الاتصال بخدمة Wavespeed AI. يرجى التحقق من مفتاح API.', 'error');
            }
        };
        checkConnection();
    }, []);

    // 2. Prevent Exit while Generating
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (loading || progress.phase !== 'idle') {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires this
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [loading, progress.phase]);

    // LocalStorage Backup for Generated Lessons
    useEffect(() => {
        try {
            const lessonsArray = Array.from(generatedLessons.entries());
            localStorage.setItem('ai_generated_lessons_backup', JSON.stringify(lessonsArray));
        } catch (e) {
            console.error('Failed to save lessons to local storage', e);
        }
    }, [generatedLessons]);

    // Step 1: Parse Training Bag

    // Cover Image State
    const [coverImage, setCoverImage] = useLocalStorage<string | null>('ai_course_cover', null);

    // ======================================
    // CRITICAL: Validate stale generationId on mount
    // If localStorage has a generationId that doesn't exist in DB, clear it
    // ======================================
    useEffect(() => {
        const validateGenerationId = async () => {
            if (!generationId) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Check if the generation actually exists in the database
                const { data, error } = await supabase
                    .from('ai_course_generations')
                    .select('id, status')
                    .eq('id', generationId)
                    .maybeSingle();

                if (error || !data) {
                    // Generation doesn't exist — clear ALL stale state
                    console.warn('[AICourseCreator] Stale generationId detected, clearing:', generationId);
                    setGenerationId(null);
                    setStep(1);
                    setCourseStructure(null);
                    setGeneratedLessons(new Map());
                    setCoverImage(null);
                    localStorage.removeItem('ai_generated_lessons_backup');
                }
            } catch (err) {
                console.error('[AICourseCreator] Error validating generationId:', err);
            }
        };
        validateGenerationId();
    }, []); // Run once on mount

    // Auto-Resume Effect
    useEffect(() => {
        const checkResume = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Only check if we are on step 1 and have no content
                if (step === 1 && !generationId) {
                    const result = await aiCourseStorage.getLatestInProgressGeneration(user.id);
                    if (result.success && result.data) {
                        const draft = result.data;
                        if (confirm('يوجد كورس قيد الإنشاء لم يكتمل. هل تريد استكمال العمل عليه؟')) {
                            setGenerationId(draft.id);
                            if (draft.source_content) setTrainingBagContent(draft.source_content);
                            if (draft.settings) setCourseSettings(draft.settings);
                            if (draft.course_structure) {
                                setCourseStructure(draft.course_structure);
                                // Ensure generationJobId is set
                                setCourseStructure(prev => prev ? ({ ...prev, generationJobId: draft.id }) : null);
                            }
                            if (draft.cover_image) setCoverImage(draft.cover_image); // Restore cover

                            // Restore File URL if exists
                            if (draft.source_file_url) {
                                setSourceFileUrl(draft.source_file_url);
                            }

                            // Restore step
                            // Restore step logic with Hydration
                            if (draft.generation_progress && draft.generation_progress.currentStep) {
                                const savedStep = typeof draft.generation_progress.currentStep === 'number'
                                    ? draft.generation_progress.currentStep
                                    : parseInt(draft.generation_progress.currentStep);

                                if (!isNaN(savedStep)) {
                                    // HYDRATION: Ensure data exists for the step we are jumping to

                                    // 1. If Step >= 2, we need parsedData
                                    if (savedStep >= 2) {
                                        if (draft.parsed_data) {
                                            setParsedData(draft.parsed_data);
                                        } else if (draft.source_content && !parsedData) {
                                            // Fallback: Silent re-parse
                                            aiService.parseTrainingBag(draft.source_content).then(res => {
                                                if (res.success) setParsedData(res.content);
                                            });
                                        }
                                    }

                                    // 2. If Step >= 3, we need generatedLessons (fetch from DB)
                                    if (savedStep >= 3) {
                                        const lessons = await aiCourseStorage.getGenerationLessons(draft.id);
                                        if (lessons && lessons.length > 0) {
                                            const lessonsMap = new Map<string, EnhancedLesson>();
                                            lessons.forEach((l: any) => {
                                                // Map db record to EnhancedLesson
                                                lessonsMap.set(l.lesson_id, {
                                                    id: l.lesson_id,
                                                    title: l.title,
                                                    duration: l.duration || '5:00',
                                                    type: 'video', // default
                                                    script: l.script,
                                                    scriptSummary: l.script_summary,
                                                    quizData: l.quiz_data,
                                                    trainingScenarios: l.training_scenarios,
                                                    isGenerated: true,
                                                    segments: l.content_segments,
                                                    videoUrl: l.video_url,
                                                    imageUrl: l.image_urls?.[0],
                                                    voiceUrl: l.voice_url,
                                                    voiceDuration: l.voice_duration
                                                } as EnhancedLesson);
                                            });
                                            setGeneratedLessons(lessonsMap);
                                        }
                                    }

                                    setStep(savedStep);
                                }
                                sendNotification('admin', 'تم الاستعادة', `تم استعادة المسودة: ${draft.title}`, 'info');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error resuming:', error);
            }
        };
        checkResume();
    }, []); // Run once on mount

    // Step 6: Generate Cover Image
    const handleGenerateCover = async () => {
        if (!courseStructure) return;
        setLoading(true);
        try {
            // Import dynamically to avoid circular issues if any, but since we are in same file context it's fine.
            const result = await videoService.generateVicseeImages(
                [`Professional futuristic educational cover image for course: ${courseStructure.title}. Style: 3D render, high quality, golden and blue theme`],
                'educational'
            );

            if (result.success && result.imageUrls && result.imageUrls.length > 0) {
                setCoverImage(result.imageUrls[0]);

                // PERSISTENCE: Upload Cover Blob
                if (result.imageBlobs && result.imageBlobs[0]) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const uploadRes = await aiCourseStorage.uploadAsset(result.imageBlobs[0], 'image', user.id);
                        if (uploadRes.success && uploadRes.url) {
                            setCoverImage(uploadRes.url); // Use permanent URL
                            await aiCourseStorage.updateGenerationProgress(generationId!, {
                                cover_image: uploadRes.url
                            } as any);
                        } else if (generationId) {
                            // Fallback to CDN URL if upload fails
                            await aiCourseStorage.updateGenerationProgress(generationId, {
                                cover_image: result.imageUrls[0]
                            } as any);
                        }
                    }
                } else if (generationId) {
                    await aiCourseStorage.updateGenerationProgress(generationId, {
                        cover_image: result.imageUrls[0]
                    } as any);
                }
                sendNotification('admin', 'تم تصميم الغلاف 🎨', 'تم إنشاء غلاف الكورس بنجاح', 'success');
            }
        } catch (e: any) {
            sendNotification('admin', 'خطأ ❌', 'فشل في تصميم الغلاف: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };




    // Auto-Save Helper
    const saveProgress = async (nextStep: number, extraData: any = {}) => {
        if (!generationId) return;

        try {
            const updates: any = {
                progress: {
                    phase: getPhaseForStep(nextStep),
                    currentStep: nextStep,
                    totalSteps: 6,
                    completedSteps: nextStep - 1
                },
                status: 'generating'
            };

            if (extraData.settings) updates.settings = extraData.settings;
            if (extraData.content) updates.sourceContent = extraData.content;
            if (extraData.structure) updates.courseStructure = extraData.structure;

            await aiCourseStorage.updateGenerationProgress(generationId, updates);
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    const getPhaseForStep = (step: number) => {
        switch (step) {
            case 1: return 'idle';
            case 2: return 'structure';
            case 3: return 'content';
            case 4: return 'content';
            case 5: return 'voice';
            case 6: return 'complete';
            default: return 'idle';
        }
    };

    const handleParseTrainingBag = async () => {
        if (!trainingBagContent.trim() && !sourceFileUrl) {
            setError('يرجى رفع ملف أو كتابة محتوى للكورس');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress({ ...progress, phase: 'parsing', currentStep: 'جاري تحليل الحقيبة التدريبية واستخراج العناوين...' });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. AI Analysis (Server-Side)
            let parsedResult: any = null;
            let contentToAnalyze = trainingBagContent;

            // CLIENT-SIDE PARSING: Extract text from file if available
            if (uploadedFile) {
                setProgress({ ...progress, phase: 'parsing', currentStep: 'جاري استخراج النصوص من الملف...' });
                try {
                    const parseRes = await fileParserService.parseFile(uploadedFile);
                    if (parseRes.success && parseRes.content) {
                        // Combine manual content with parsed file content
                        contentToAnalyze = (trainingBagContent ? trainingBagContent + "\n\n" : "") + parseRes.content;
                    }
                } catch (parseErr) {
                    // Local parsing failed, will fallback to server
                }
            }

            // Prefer file URL if available, but perform analysis using the TEXT we just prepared
            if (sourceFileUrl || contentToAnalyze) {
                const aiResult = await aiService.analyzeTrainingBag(sourceFileUrl || '', contentToAnalyze);

                if (aiResult.success && aiResult.data) {
                    parsedResult = aiResult.data;
                } else {
                    // Show warning to user so they know WHY it failed
                    // Show warning to user so they know WHY it failed
                    setError(`تنبيه: واجه الذكاء الاصطناعي مشكلة في التحليل: ${aiResult.error || 'خطأ غير محدد'}. سيتم استخدام المحتوى الخام.`);
                }
            }

            // Default Fallback if AI fails (but we should try to use AI result)
            // Use title from AI or first line of content
            const title = parsedResult?.title || contentToAnalyze.split('\n')[0].substring(0, 100) || 'دورة تدريبية جديدة';

            // Fix: Use contentToAnalyze for fallback description, not the stale trainingBagContent state
            const description = parsedResult?.description || contentToAnalyze.substring(0, 500);

            const manualParsedData = {
                title: title,
                description: description,
                targetAudience: parsedResult?.targetAudience || 'عام',
                mainTopics: parsedResult?.mainTopics || [],
                learningOutcomes: parsedResult?.learningOutcomes || [],
                thinkingPatterns: parsedResult?.thinkingPatterns || [],
                content: contentToAnalyze,
                fileUrl: sourceFileUrl || undefined,
                suggestedDuration: '4 أسابيع'
            };

            // Validate that we actually have something
            if (!manualParsedData.title || !manualParsedData.content) {
                throw new Error("لم يتم العثور على محتوى قابل للتحليل. يرجى التأكد من الملف أو النص.");
            }

            setParsedData(manualParsedData);
            // Update content view to show what was extracted/used (Full Context)
            if (contentToAnalyze) setTrainingBagContent(contentToAnalyze);

            // RESET STATE for new generation
            setCourseStructure(null);
            setGeneratedLessons(new Map());

            // 2. Create Draft IMMEDIATELY (Persistence)
            if (user) {
                // Create or Update
                if (!generationId) {
                    const genResult = await aiCourseStorage.createGeneration(
                        user.id,
                        manualParsedData.title,
                        courseSettings,
                        contentToAnalyze, // Use the actual content
                        sourceFileUrl || '',
                        manualParsedData
                    );

                    if (genResult.success && genResult.generationId) {
                        setGenerationId(genResult.generationId);
                        sendNotification('admin', 'تم التحليل ✅', 'تم استخراج هيكل الحقيبة بنجاح', 'success');
                    }
                } else {
                    // Update content and parsedData if draft exists
                    const updates: any = {
                        sourceContent: contentToAnalyze,
                        settings: courseSettings,
                        parsedData: manualParsedData
                    };
                    if (sourceFileUrl) updates.sourceFileUrl = sourceFileUrl;

                    await aiCourseStorage.updateGenerationProgress(generationId, updates);
                }
            }

            setStep(2);
        } catch (err: any) {
            console.error('Parsing Error:', err);
            setError('حدث خطأ أثناء تحليل الملف: ' + err.message);
            // Do not reset step or loading here, allow user to retry
        } finally {
            setLoading(false);
            setProgress({ ...progress, phase: 'idle', currentStep: '' });
        }
    };

    // Step 2: Generate Course Structure
    const handleGenerateStructure = async () => {
        if (!parsedData) return;


        setLoading(true);
        setError(null);

        // Phase 1: AI Generation (No DB dependency)
        setProgress({
            phase: 'structure',
            currentStep: '1/3: 🧠 الذكاء الاصطناعي يفكر ويبني الهيكل...',
            totalSteps: 3,
            completedSteps: 0
        });

        try {


            // Timeout wrapper for Auth
            const authPromise = supabase.auth.getUser();
            const timeoutPromise = new Promise<{ data: { user: any } }>((resolve) =>
                setTimeout(() => resolve({ data: { user: null } }), 3000)
            );

            // Race: If auth takes > 3s, proceed as null (guest/offline logic)
            const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

            if (!user) {
                // User check timed out or not logged in - proceeding
            } else {
                // Keep if block structure if needed, or remove log inside else
            }

            // --- 1. AI GENERATION (CRITICAL PATH) ---

            const result = await aiService.generateCourseStructure(parsedData, courseSettings);


            if (!result.success) {
                const errorMsg = result.error || 'فشل في إنشاء الهيكل من الذكاء الاصطناعي';
                sendNotification('admin', 'فشل التوليد ❌', errorMsg, 'error');
                throw new Error(errorMsg);
            }

            const tempId = `draft-${Date.now()}`;
            const newStructure = {
                ...result.content,
                id: tempId,
                status: 'draft',
                createdAt: new Date().toISOString(),
                generationJobId: 'pending-save', // Placeholder
            } as TrainingCourse;

            setCourseStructure(newStructure);
            sendNotification('admin', 'تم إنشاء الهيكل 🧠', 'نجح الذكاء الاصطناعي في بناء هيكل الدورة المبدئي', 'success');

            // --- 2. DATABASE SAVING (BACKGROUND / SECONDARY) ---
            if (user && generationId) {
                setProgress(prev => ({ ...prev, currentStep: '2/3: 💾 جاري حفظ البيانات في السحابة...', completedSteps: 1 }));

                try {
                    // Update existing generation with new structure
                    await aiCourseStorage.updateGenerationProgress(generationId, {
                        courseStructure: newStructure,
                        status: 'generating',
                        progress: {
                            phase: 'structure',
                            currentStep: 2,
                            completedSteps: 1,
                            totalSteps: 6
                        }
                    });

                    // Link structure
                    await aiCourseStorage.saveCourseStructure(generationId, newStructure);

                    // Update structure state with real ID linkage
                    setCourseStructure({ ...newStructure, generationJobId: generationId });

                    sendNotification('admin', 'تم الحفظ 💾', 'تم حفظ هيكل الدورة بنجاح', 'success');

                    if (realtimeService && typeof realtimeService.broadcastStatus === 'function') {
                        realtimeService.broadcastStatus(generationId, {
                            status: 'structure_ready',
                            step: 3,
                            total: 3,
                            message: 'تم إنشاء الهيكل وحفظه!'
                        });
                    }
                } catch (dbErr: any) {
                    console.error('⚠️ [Flow] DB Save Error (Non-blocking):', dbErr);
                }
            }

            setProgress(prev => ({ ...prev, currentStep: '3/3: ✅ اكتمل!', completedSteps: 2 }));
            sendNotification('admin', 'تم بنجاح ✅', 'تم إنشاء هيكل الدورة', 'success');

        } catch (err: any) {
            console.error("❌ [Flow] Critical Error:", err);

            let userMessage = 'حدث خطأ غير متوقع أثناء المعالجة.';

            if (err.message && (err.message.includes('timeout') || err.message.includes('مهلة') || err.message.includes('504'))) {
                userMessage = 'استغرق الخادم وقتاً طويلاً. يرجى المحاولة مرة أخرى أو تقليل حجم المحتوى.';
            } else if (err.message) {
                userMessage = err.message;
            }

            setError(userMessage);
            sendNotification('admin', 'فشل الإنشاء ❌', userMessage, 'error');
        } finally {
            setLoading(false);
            setTimeout(() => {
                if (!error) {
                    setProgress({ ...progress, phase: 'idle', currentStep: '' });
                }
            }, 1000);
        }
    };

    // Step 3: Generate All Content (or Specific Unit)
    const handleGenerateContent = async (targetUnitId?: string | any) => {
        if (!courseStructure) return;

        // If targetUnitId is an Event object (from onClick), reset it to undefined
        const unitIdFilter = (typeof targetUnitId === 'string') ? targetUnitId : undefined;

        setLoading(true);
        setError(null);

        const allLessons: { unitId: string; lesson: any; unit: CourseUnit }[] = [];
        courseStructure.units.forEach(unit => {
            // If unitIdFilter is set, only include lessons from that unit
            if (unitIdFilter && unit.id !== unitIdFilter) return;

            unit.lessons.forEach(lesson => {
                allLessons.push({ unitId: unit.id, lesson, unit });
            });
        });

        // Calculate total steps based on settings
        const stepsPerLesson = 1 + (courseSettings.includeQuizzes ? 1 : 0) + (courseSettings.includeScenarios ? 1 : 0);
        const totalSteps = allLessons.length * stepsPerLesson;

        setProgress({
            phase: 'content',
            currentStep: 'بدء توليد المحتوى...',
            totalSteps: totalSteps,
            completedSteps: 0,
        });

        try {
            let previousLessonContext = '';

            for (let i = 0; i < allLessons.length; i++) {
                const { lesson, unit } = allLessons[i];
                let currentLessonState = generatedLessons.get(lesson.id) || {
                    id: lesson.id,
                    title: lesson.title,
                    duration: lesson.duration,
                    type: lesson.type,
                    isGenerated: false
                } as EnhancedLesson;

                // --- 1. Generate Rich Content (Article) ---
                setProgress(prev => ({
                    ...prev,
                    currentStep: `كتابة المحتوى: ${lesson.title}`,
                    currentLesson: lesson.id,
                }));

                // Initialize state in UI immediately
                currentLessonState.status = 'writing';
                currentLessonState.isGenerated = false;
                currentLessonState.script = '';
                setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));

                const contentResult = await aiService.generateLessonContent(
                    lesson.title,
                    unit.title,
                    unit.thinkingPattern,
                    lesson.objectives || [],
                    previousLessonContext,
                    (chunk) => {
                        currentLessonState.script = chunk;
                        const words = chunk.trim().split(/\s+/).length;
                        const mins = Math.ceil(words / 200);
                        const secs = Math.ceil((words % 200) / (200 / 60));
                        currentLessonState.duration = `${mins}:${secs.toString().padStart(2, '0')}`;

                        // Keep status as writing during stream
                        setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState, status: 'writing' }));
                    }
                );

                if (contentResult.success) {
                    currentLessonState.script = contentResult.content.script;
                    currentLessonState.scriptSummary = contentResult.content.scriptSummary;
                    currentLessonState.duration = calculateReadingDuration(contentResult.content.script || '');
                    currentLessonState.isGenerated = true;
                    currentLessonState.status = 'completed'; // Temporary completion

                    const summary = contentResult.content.scriptSummary || contentResult.content.script?.substring(0, 200) || '';
                    previousLessonContext = `الدرس السابق: ${lesson.title}. الملخص: ${summary}`;

                    setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                    if (generationId) await aiCourseStorage.saveLesson(generationId, unit.unitNumber, i + 1, currentLessonState);
                    trackAiUsage(contentResult.tokens_used || 800);
                } else {
                    currentLessonState.status = 'failed';

                    setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                }
                setProgress(prev => ({ ...prev, completedSteps: prev.completedSteps + 1 }));

                // --- 2. Generate Quiz (Optional but MUST succeed if enabled) ---
                if (courseSettings.includeQuizzes && contentResult.success) {
                    currentLessonState.status = 'quizzing';
                    setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));

                    setProgress(prev => ({ ...prev, currentStep: `إعداد الاختبار: ${lesson.title}` }));

                    // Generate quiz with live progress updates
                    const quizResult = await aiService.generateQuizFromContent(
                        lesson.title,
                        currentLessonState.script || '',
                        'medium',
                        (statusMsg) => {
                            // Live progress update
                            setProgress(prev => ({ ...prev, currentStep: `${lesson.title}: ${statusMsg}` }));
                        }
                    );

                    if (quizResult.success) {
                        currentLessonState.quizData = quizResult.content.questions;
                        currentLessonState.status = 'completed';
                        setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                        if (generationId) await aiCourseStorage.saveLesson(generationId, unit.unitNumber, i + 1, currentLessonState);
                        trackAiUsage(quizResult.tokens_used || 300);
                        sendNotification('admin', 'تم إنشاء الاختبار ✅', `${lesson.title}`, 'success');
                    } else {
                        // CRITICAL: Quiz failed - halt and notify user
                        currentLessonState.status = 'failed';
                        currentLessonState.error = quizResult.error;
                        setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                        sendNotification('admin', 'فشل الاختبار ❌', quizResult.error || 'فشل توليد الاختبار', 'error');
                        throw new Error(`فشل توليد اختبار الدرس "${lesson.title}": ${quizResult.error}`);
                    }
                    setProgress(prev => ({ ...prev, completedSteps: prev.completedSteps + 1 }));
                }

                // --- 3. Generate Scenarios (Optional but MUST succeed if enabled) ---
                if (courseSettings.includeScenarios && contentResult.success) {
                    currentLessonState.status = 'scenarios';
                    setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));

                    setProgress(prev => ({ ...prev, currentStep: `تصميم السيناريوهات: ${lesson.title}` }));

                    // Generate scenarios with live progress updates
                    const scenariosResult = await aiService.generateTrainingScenarios(
                        lesson.title,
                        currentLessonState.script || '',
                        unit.thinkingPattern,
                        (statusMsg) => {
                            // Live progress update
                            setProgress(prev => ({ ...prev, currentStep: `${lesson.title}: ${statusMsg}` }));
                        }
                    );

                    if (scenariosResult.success) {
                        currentLessonState.trainingScenarios = scenariosResult.content.scenarios;
                        currentLessonState.status = 'completed';
                        setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                        if (generationId) await aiCourseStorage.saveLesson(generationId, unit.unitNumber, i + 1, currentLessonState);
                        trackAiUsage(scenariosResult.tokens_used || 400);
                        sendNotification('admin', 'تم إنشاء السيناريوهات ✅', `${lesson.title}`, 'success');
                    } else {
                        // CRITICAL: Scenarios failed - halt and notify user
                        currentLessonState.status = 'failed';
                        currentLessonState.error = scenariosResult.error;
                        setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                        sendNotification('admin', 'فشل السيناريوهات ❌', scenariosResult.error || 'فشل توليد السيناريوهات', 'error');
                        throw new Error(`فشل توليد سيناريوهات الدرس "${lesson.title}": ${scenariosResult.error}`);
                    }
                    setProgress(prev => ({ ...prev, completedSteps: prev.completedSteps + 1 }));
                }

                // Final Completion Status (Redundant safety check)
                if (contentResult.success) {
                    currentLessonState.status = 'completed';
                    setGeneratedLessons(prev => new Map(prev).set(lesson.id, { ...currentLessonState }));
                }
            } // End for loop
        } catch (err: any) {
            setError(err.message);
            sendNotification('admin', 'خطأ ❌', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Generate Voice for single lesson or segment
    const handleGenerateVoice = async (lessonId: string, segmentId?: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) {
            console.error('❌ Lesson not found in generatedLessons:', lessonId);
            return;
        }

        const rawText = segmentId && lesson.segments
            ? lesson.segments.find((s: any) => s.id === segmentId)?.text
            : lesson.script;

        // AGGRESSIVE CLEANING: Strip ALL Markdown, Symbols, and formatting. Keep only Letters, Numbers, Punctuation.
        // This prevents "Hash Hash" or "Asterisk" reading.
        const textToVoice = rawText
            ? rawText
                .replace(/[#*\[\]`_~>]/g, '') // Remove Markdown symbols
                .replace(/^\s*-\s*/gm, '') // Remove list bullets
                .replace(/https?:\/\/\S+/g, '') // Remove URLs
                .replace(/\n{2,}/g, '\n') // Collapse excessive newlines
                .trim()
            : '';


        if (!textToVoice) {
            console.error('❌ No text to voice found');
            return;
        }

        // Tracking ID (segmentId or lessonId)
        const trackId = segmentId || lessonId;
        setVoiceProgress(prev => ({ ...prev, current: trackId }));
        setLoading(true); // FIX: Trigger UI Loading State

        try {
            const result = await voiceService.generateVoice(textToVoice);

            if (!result.success) {
                throw new Error(result.error);
            }


            if (result.success) {
                let finalVoiceUrl = result.audioUrl;

                // Upload via unified storage service (same path as image/video)
                if (result.audioBlob) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const uploadRes = await aiCourseStorage.uploadAsset(
                            result.audioBlob,
                            'voice',
                            user.id
                        );
                        if (uploadRes.success && uploadRes.url) {
                            finalVoiceUrl = uploadRes.url;
                            console.log('✅ [Voice] Uploaded to Supabase:', uploadRes.url);
                        } else {
                            console.error('❌ [Voice] Upload to storage failed:', uploadRes.error);
                        }
                    }
                }

                let updated = { ...lesson };

                if (segmentId && lesson.segments) {
                    const updatedSegments = lesson.segments.map((s: any) =>
                        s.id === segmentId ? { ...s, audioUrl: finalVoiceUrl, audioDuration: result.audioDuration, audioStatus: 'completed' } : s
                    );
                    updated = { ...lesson, segments: updatedSegments };
                } else {
                    updated = { ...lesson, voiceUrl: finalVoiceUrl, voiceDuration: result.audioDuration };
                }

                setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
                setVoiceProgress(prev => ({
                    current: '',
                    completed: [...prev.completed, trackId],
                }));

                // Update Supabase — ALWAYS save to top-level columns + segments
                if (generationId) {
                    const saveRes = await aiCourseStorage.updateLessonMedia(generationId, lessonId, {
                        voice_url: finalVoiceUrl,
                        voice_duration: result.audioDuration,
                        ...(segmentId ? { content_segments: updated.segments } : {})
                    });

                    if (!saveRes.success) {
                        console.error('❌ Failed to save voice URL to DB:', saveRes.error);
                        sendNotification('admin', 'خطأ في الحفظ', 'تم توليد الصوت لكن فشل حفظه في قاعدة البيانات', 'error');
                    }
                }
            }
        } catch (err: any) {
            console.error('🚨 Voice generation CRITICAL error:', err);
            window.alert(`خطأ في توليد الصوت: ${err.message || err}`);
            setVoiceProgress(prev => ({ ...prev, current: '' }));
        } finally {
            setLoading(false); // FIX: Ensure loading stops
        }
    };

    // Step 4: Generate All Voice
    const handleGenerateAllVoice = async () => {
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const [lessonId, lesson] of generatedLessons) {
            if (voiceProgress.completed.includes(lessonId)) continue;

            setVoiceProgress(prev => ({ ...prev, current: lessonId }));

            try {
                // Clean text before voice generation (same cleaning as single voice handler)
                const cleanedScript = lesson.script
                    ? lesson.script
                        .replace(/[#*\[\]`_~>]/g, '') // Remove Markdown symbols
                        .replace(/^\s*-\s*/gm, '') // Remove list bullets
                        .replace(/https?:\/\/\S+/g, '') // Remove URLs
                        .replace(/\n{2,}/g, '\n') // Collapse excessive newlines
                        .trim()
                    : '';

                if (!cleanedScript) {
                    failCount++;
                    console.warn(`⚠️ [AllVoice] Skipping lesson ${lessonId}: no text after cleaning`);
                    continue;
                }

                const result = await voiceService.generateVoice(cleanedScript);

                if (result.success) {
                    let finalVoiceUrl = result.audioUrl;

                    // Upload via unified storage service (same path as image/video)
                    if (result.audioBlob) {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const uploadRes = await aiCourseStorage.uploadAsset(
                                result.audioBlob,
                                'voice',
                                user.id
                            );
                            if (uploadRes.success && uploadRes.url) {
                                finalVoiceUrl = uploadRes.url;
                                console.log('✅ [AllVoice] Uploaded to Supabase:', uploadRes.url);
                            } else {
                                console.error('❌ [AllVoice] Upload to storage failed:', uploadRes.error);
                            }
                        }
                    }

                    const updated = { ...lesson, voiceUrl: finalVoiceUrl, voiceDuration: result.audioDuration };
                    setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));
                    setVoiceProgress(prev => ({
                        current: '',
                        completed: [...prev.completed, lessonId],
                    }));

                    // Update Supabase DB with media URL
                    if (generationId) {
                        const saveRes = await aiCourseStorage.updateLessonMedia(generationId, lessonId, {
                            voice_url: finalVoiceUrl,
                            voice_duration: result.audioDuration
                        });
                        if (!saveRes.success) {
                            console.error('❌ [AllVoice] Failed to save voice URL to DB:', saveRes.error);
                        }
                    }
                    successCount++;
                } else {
                    failCount++;
                    console.error(`Voice generation failed for lesson ${lessonId}:`, result.error);
                }
            } catch (err: any) {
                console.error('Voice generation error:', err);
                failCount++;
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 2000));
        }

        setLoading(false);
        setVoiceProgress(prev => ({ ...prev, current: '' }));

        if (successCount > 0 && failCount === 0) {
            sendNotification('admin', 'الصوتيات ✅', `تم توليد ${successCount} تسجيل صوتي بنجاح`, 'success');
        } else if (successCount > 0 && failCount > 0) {
            sendNotification('admin', 'اكتمل جزئياً ⚠️', `نجح ${successCount} وفشل ${failCount}`, 'warning');
        } else if (failCount > 0) {
            sendNotification('admin', 'فشل التوليد ❌', 'لم يتم توليد أي تسجيل صوتي', 'error');
        }
    };

    // Step 4b: Generate Image for single lesson or segment
    const handleGenerateImage = async (lessonId: string, type: 'infographic' | 'illustration' = 'illustration', segmentId?: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        // Use segment text for context if segmented
        const contextText = segmentId && lesson.segments
            ? lesson.segments.find((s: any) => s.id === segmentId)?.text || lesson.title
            : lesson.scriptSummary || lesson.title;

        setLoading(true);
        // FIX: Set progress tracker so the UI Overlay appears (reusing voiceProgress for generic media state)
        setVoiceProgress(prev => ({ ...prev, current: segmentId || lessonId }));

        try {
            const prompt = `Educational image for: ${lesson.title}. Context: ${contextText.substring(0, 300)}`;
            const result = await videoService.generateImages([prompt], type === 'illustration' ? 'educational' : 'infographic');

            if (result.success && result.imageUrls && result.imageUrls.length > 0) {
                let finalImageUrl = result.imageUrls[0];

                // PERSISTENCE: Upload Image Blob
                if (result.imageBlobs && result.imageBlobs[0]) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const uploadRes = await aiCourseStorage.uploadAsset(result.imageBlobs[0], 'image', user.id);
                        if (uploadRes.success && uploadRes.url) finalImageUrl = uploadRes.url;
                    }
                }

                let updated = { ...lesson };

                if (segmentId && lesson.segments) {
                    const updatedSegments = lesson.segments.map((s: any) =>
                        s.id === segmentId ? { ...s, imageUrl: finalImageUrl, imageStatus: 'completed' } : s
                    );
                    updated = { ...lesson, segments: updatedSegments };
                } else {
                    updated = { ...lesson, imageUrl: finalImageUrl, images: [finalImageUrl] };
                }

                setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));

                // Update Supabase — ALWAYS save to top-level columns + segments
                if (generationId) {
                    const saveRes = await aiCourseStorage.updateLessonMedia(generationId, lessonId, {
                        image_urls: [finalImageUrl],
                        ...(segmentId ? { content_segments: updated.segments } : {})
                    });

                    if (!saveRes.success) {
                        console.error('❌ Failed to save image URL to DB:', saveRes.error);
                        sendNotification('admin', 'خطأ في الحفظ', 'تم توليد الصورة لكن فشل حفظها في قاعدة البيانات', 'error');
                    }
                }
                sendNotification('admin', 'تم توليد الصورة ✅', `تم توليد الصورة بنجاح`, 'success');
            } else {
                throw new Error(result.error || 'فشل توليد الصورة');
            }
        } catch (err: any) {
            sendNotification('admin', 'خطأ ❌', err.message, 'error');
        } finally {
            setLoading(false);
            setVoiceProgress(prev => ({ ...prev, current: '' }));
        }
    };

    // Step 4c: Generate Video for single lesson or segment
    const handleGenerateVideo = async (lessonId: string, segmentId?: string) => {
        const lesson = generatedLessons.get(lessonId);
        if (!lesson) return;

        const contextText = segmentId && lesson.segments
            ? lesson.segments.find((s: any) => s.id === segmentId)?.text || lesson.title
            : lesson.title;

        setLoading(true);
        // FIX: Set progress tracker so the UI Overlay appears for Video
        setVoiceProgress(prev => ({ ...prev, current: segmentId || lessonId }));

        try {
            const prompt = `Professional educational video about: ${contextText.substring(0, 100)}. Style: Clean, generic, corporate training.`;
            const result = await videoService.generateShortVideo(prompt);

            if (result.success && result.videoUrl) {
                let finalVideoUrl = result.videoUrl;

                // PERSISTENCE: Upload Video Blob
                if (result.videoBlob) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const uploadRes = await aiCourseStorage.uploadAsset(result.videoBlob, 'video', user.id);
                        if (uploadRes.success && uploadRes.url) finalVideoUrl = uploadRes.url;
                    }
                }

                let updated = { ...lesson };

                if (segmentId && lesson.segments) {
                    const updatedSegments = lesson.segments.map((s: any) =>
                        s.id === segmentId ? { ...s, videoUrl: finalVideoUrl, videoStatus: 'completed' } : s
                    );
                    updated = { ...lesson, segments: updatedSegments };
                } else {
                    updated = { ...lesson, videoUrl: finalVideoUrl };
                }

                setGeneratedLessons(prev => new Map(prev).set(lessonId, updated));

                // Update Supabase — ALWAYS save to top-level columns + segments
                if (generationId) {
                    const saveRes = await aiCourseStorage.updateLessonMedia(generationId, lessonId, {
                        video_url: finalVideoUrl,
                        ...(segmentId ? { content_segments: updated.segments } : {})
                    });

                    if (!saveRes.success) {
                        console.error('❌ Failed to save video URL to DB:', saveRes.error);
                        sendNotification('admin', 'خطأ في الحفظ', 'تم توليد الفيديو لكن فشل حفظه في قاعدة البيانات', 'error');
                    }
                }
                sendNotification('admin', 'تم توليد الفيديو ✅', `تم توليد الفيديو بنجاح`, 'success');
            } else {
                throw new Error(result.error || 'فشل توليد الفيديو');
            }
        } catch (err: any) {
            sendNotification('admin', 'خطأ ❌', err.message, 'error');
        } finally {
            setLoading(false);
            setVoiceProgress(prev => ({ ...prev, current: '' }));
        }
    };

    // Step 5: Save Course
    const handleSaveCourse = async () => {
        if (!courseStructure) return;

        setLoading(true);


        try {
            // Get current user and profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('يرجى تسجيل الدخول');

            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            const instructorName = profile?.name || 'مدرب الذكاء الاصطناعي';

            if (generationId) {
                // Save cover image to settings for persistence/auto-fill
                if (coverImage) {
                    await aiCourseStorage.updateGenerationProgress(generationId, {
                        settings: { ...courseSettings, coverImage } as any
                    });
                }

                // 1. Complete Generation Job
                await aiCourseStorage.completeGeneration(generationId);

                // 2. Publish to Courses Table (Draft)
                const result = await aiCourseStorage.publishCourse(
                    generationId,
                    user.id,
                    instructorName,
                    500, // Default Price
                    coverImage
                );

                if (!result.success) throw new Error(result.error);

                sendNotification('admin', 'تم الحفظ ✅', `تم حفظ الكورس "${courseStructure.title}" وربطه بسجل التوليد`, 'success');
            } else {
                // Fallback for legacy state
                addCourse({
                    title: courseStructure.title,
                    description: courseStructure.description,
                    price: 500,
                    instructor: instructorName,
                    lessons: (Array.from(generatedLessons.values()) as EnhancedLesson[]).map(l => ({
                        id: l.id,
                        title: l.title,
                        duration: l.duration,
                        type: l.type as 'video' | 'quiz' | 'reading',
                        isFree: false,
                        script: l.script,
                        quizData: l.quizData,
                        videoUrl: l.videoUrl,
                    })),
                    status: 'draft',
                    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000',
                    level: 'intermediate',
                    category: 'تطوير الذات',
                    reviews: []
                });
                sendNotification('admin', 'تم الحفظ ✅', `تم حفظ الكورس "${courseStructure.title}" بنجاح`, 'success');
            }

            // Reset wizard
            setStep(1);
            setTrainingBagContent('');
            setParsedData(null);
            setCourseStructure(null);
            setGeneratedLessons(new Map());
            setVoiceProgress({ current: '', completed: [] });
        } catch (err: any) {
            sendNotification('admin', 'خطأ ❌', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Wizard Steps
    const steps = [
        { num: 1, label: 'الحقيبة', icon: Upload },
        { num: 2, label: 'الهيكل', icon: Layers },
        { num: 3, label: 'المحتوى', icon: FileText },
        { num: 4, label: 'المراجعة', icon: Edit3 },
        { num: 5, label: 'الوسائط', icon: Mic },
        { num: 6, label: 'الحفظ', icon: CheckCircle2 },
    ];

    return (
        <div className="min-h-[700px] flex flex-col items-center justify-start pt-10 pb-20 relative">
            {/* Wizard Progress */}
            <div className="w-full max-w-4xl mb-12">
                <div className="flex justify-between items-center relative z-10 px-6">
                    {/* Progress Line */}
                    <div className="absolute top-6 left-12 right-12 h-1 bg-[#1e293b] rounded-full">
                        <motion.div
                            className="h-full bg-gradient-to-r from-brand-gold to-yellow-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    {steps.map((s) => (
                        <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 border-4 ${step >= s.num
                                ? 'bg-brand-gold text-brand-navy border-brand-gold shadow-[0_0_20px_rgba(198,165,104,0.4)]'
                                : 'bg-[#0f2344] text-gray-500 border-[#1e293b]'
                                }`}>
                                <s.icon size={24} />
                            </div>
                            <span className={`text-sm font-bold ${step >= s.num ? 'text-brand-gold' : 'text-gray-600'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <motion.div
                className={`w-full bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[600px] transition-all duration-500 ease-in-out ${step === 5 ? 'max-w-[95%]' : 'max-w-5xl'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50" />

                {/* Error Display */}
                {error && (
                    <div className="mx-8 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="mr-auto">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* AI Monitor Panel - Shows during generation */}
                <div className="px-6 pt-4">
                    <AIMonitorPanel
                        status={aiSystemStatus}
                        isVisible={loading || progress.phase !== 'idle'}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TrainingBagInput
                                content={trainingBagContent}
                                setContent={setTrainingBagContent}
                                settings={courseSettings}
                                setSettings={setCourseSettings}
                                uploadedFile={uploadedFile}
                                setUploadedFile={setUploadedFile}
                                sourceFileUrl={sourceFileUrl}
                                setSourceFileUrl={setSourceFileUrl}
                                onParse={handleParseTrainingBag}
                                loading={loading}
                                setLoading={setLoading}
                                setError={setError}
                                apiStatus={apiStatus}
                            />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CourseStructureReview
                                parsedData={parsedData}
                                courseStructure={courseStructure}
                                onGenerateStructure={handleGenerateStructure}
                                onProceed={() => setStep(3)}
                                onBack={() => setStep(1)}
                                loading={loading}
                                error={error}
                                progress={progress}
                                onGenerateContent={handleGenerateContent}
                            />
                        </motion.div>
                    )}

                    {step === 3 && courseStructure && (
                        <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ContentGeneration
                                courseStructure={courseStructure}
                                progress={progress}
                                generatedLessons={generatedLessons}
                                onGenerateContent={handleGenerateContent}
                                onProceed={() => setStep(4)}
                                onBack={() => setStep(2)}
                                isGenerating={loading}
                            />
                        </motion.div>
                    )}

                    {step === 4 && courseStructure && (
                        <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ContentReview
                                generatedLessons={generatedLessons}
                                setGeneratedLessons={setGeneratedLessons}
                                onProceed={() => setStep(5)}
                                onBack={() => setStep(3)}
                                loading={loading}
                                setLoading={setLoading}
                                generationId={generationId}
                                courseStructure={courseStructure}
                                sendNotification={sendNotification}
                            />
                        </motion.div>
                    )}

                    {step === 5 && courseStructure && (
                        <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <MediaGeneration
                                courseStructure={courseStructure}
                                generatedLessons={generatedLessons}
                                onGenerateVoice={handleGenerateVoice}
                                onGenerateAllVoice={handleGenerateAllVoice}
                                onGenerateImage={handleGenerateImage}
                                onGenerateVideo={handleGenerateVideo}
                                onProceed={() => setStep(6)}
                                onBack={() => setStep(4)}
                                isGenerating={loading}
                                voiceProgress={voiceProgress}
                            />
                        </motion.div>
                    )}

                    {step === 6 && courseStructure && (
                        <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ReviewAndSave
                                courseStructure={courseStructure}
                                generatedLessons={generatedLessons}
                                onSave={handleSaveCourse}
                                onBack={() => setStep(5)}
                                loading={loading}
                                coverImage={coverImage}
                                onGenerateCover={handleGenerateCover}
                                onGenerateContent={handleGenerateContent}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AICourseCreator;
