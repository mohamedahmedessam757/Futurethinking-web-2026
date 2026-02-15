import React, { useEffect, useState, useRef } from 'react';
import { Save, Share2, UploadCloud, RefreshCw, LayoutTemplate, CheckCircle, ArrowLeft, Menu, X } from 'lucide-react';
import { useCanvasStore } from '../../../services/canvasStore';
import { realtimeService } from '../../../services/realtimeService';
import { aiCourseStorage, AIGeneratedLessonRecord } from '../../../services/aiCourseStorage';
// CanvasSidebar removed
import { CourseStructureSidebar } from '../editor/CourseStructureSidebar';
import { LessonContentEditor } from '../editor/LessonContentEditor';
import { useGlobal } from '../../GlobalContext';
import { supabase } from '../../../lib/supabase';

export const AICanvasEditor = ({ onBack }: { onBack?: () => void }) => {
    const {
        elements,
        generationId,
        setElements,
        setCourseStructure,
        isSaving,
        setSaving,
        isDirty,
        setDirty
    } = useCanvasStore();

    const { sendNotification } = useGlobal();
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Realtime Subscription
    useEffect(() => {
        if (!generationId) return;

        const channel = realtimeService.subscribeToLessons(generationId, (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const newRecord = payload.new as AIGeneratedLessonRecord;

                setElements(prev => {
                    const exists = prev.find(el => el.localId === newRecord.id);
                    if (exists) {
                        return prev.map(el => el.localId === newRecord.id ? {
                            ...el,
                            title: newRecord.title,
                            script: newRecord.script,
                            quizData: newRecord.quiz_data,
                            trainingScenarios: newRecord.training_scenarios,
                            voiceUrl: newRecord.voice_url,
                            voiceDuration: newRecord.voice_duration,
                            videoUrl: newRecord.video_url,
                            images: newRecord.image_urls,
                            segments: newRecord.content_segments,
                        } : el);
                    } else {
                        return prev;
                    }
                });
            }
        });

        return () => {
            realtimeService.unsubscribe(channel);
        };
    }, [generationId]);

    // Load Data on Mount (Migrated from Sidebar)
    useEffect(() => {
        if (!generationId) return;

        const loadSessionData = async () => {
            // If elements are already loaded for this ID, don't reload (optional optimization)
            // But for safety, let's reload to be fresh

            const result = await aiCourseStorage.getGeneration(generationId);
            if (result.success && result.data) {
                // Map DB lessons to Canvas Elements
                // Deduplicate logic
                const uniqueLessonsMap = new Map();
                (result.data.ai_generated_lessons || []).forEach((l: any) => {
                    // Check if lesson_id already exists to prevent duplicates from joins
                    if (!uniqueLessonsMap.has(l.lesson_id || l.id)) {
                        uniqueLessonsMap.set(l.lesson_id || l.id, l);
                    }
                });

                // Map DB lessons to Canvas Elements
                const lessons = Array.from(uniqueLessonsMap.values()).map((l: any) => ({
                    id: l.lesson_id || l.id,
                    type: 'reading' as const, // Default to reading for now, or infer based on content
                    localId: l.id, // DB primary key
                    title: l.title,
                    duration: l.duration,
                    unitNumber: l.unit_number,
                    lessonNumber: l.lesson_number,

                    // Content
                    script: l.script,
                    scriptSummary: l.script_summary,
                    quizData: l.quiz_data,
                    trainingScenarios: l.training_scenarios,

                    // Media
                    voiceUrl: l.voice_url,
                    voiceDuration: l.voice_duration,
                    videoUrl: l.video_url,
                    images: l.image_urls,
                    segments: l.content_segments,

                    // Metadata
                    isGenerated: l.is_generated
                }));

                // Sort by unit then lesson
                lessons.sort((a: any, b: any) => {
                    if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
                    return a.lessonNumber - b.lessonNumber;
                });

                // Set Course Structure for Sidebar (Unit Titles)
                if (result.data.course_structure) {
                    setCourseStructure(result.data.course_structure);
                } else if (result.data.parsed_data) {
                    // Fallback if structure is missing but parsed data exists
                    setCourseStructure({
                        units: Array.from({ length: result.data.settings?.unitsCount || 1 }).map((_, i) => ({
                            unitNumber: i + 1,
                            title: `الوحدة ${i + 1}`
                        }))
                    });
                }

                setElements(lessons);
            }
        };

        loadSessionData();
    }, [generationId]);

    // Smart Auto-Save Logic (Breaks the loop)
    useEffect(() => {
        if (!generationId || elements.length === 0 || !isDirty) return;

        const timeoutId = setTimeout(() => {
            handleSave();
        }, 5000); // Increased debounce to 5s for better UX

        return () => clearTimeout(timeoutId);
    }, [elements, generationId, isDirty]);

    const handleSave = async () => {
        if (!generationId) return;
        setSaving(true);

        try {
            const promises = elements.map((el) => {
                // Ensure segments are saved
                const payload = {
                    ...el,
                    id: el.id, // CRITICAL: Use the logical ID (lesson_id) for the WHERE clause, not the UUID
                    localId: el.localId, // Keep track of the UUID key if needed
                    content_segments: el.segments // Explicitly save segments
                };
                return aiCourseStorage.saveLesson(generationId, el.unitNumber, el.lessonNumber, payload as any);
            });

            await Promise.all(promises);
            // Silent Success
            setDirty(false); // Mark as clean
        } catch (error) {
            console.error(error);
            sendNotification('admin', 'خطأ', 'فشل حفظ التعديلات', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!generationId) return;
        if (!confirm('هل أنت متأكد من نشر هذا الكورس؟ سيتم نقله إلى صفحة الدورات.')) return;

        setIsPublishing(true);
        try {
            await handleSave();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const result = await aiCourseStorage.publishCourse(
                generationId,
                user.id,
                'Admin AI',
                500
            );

            if (result.success) {
                sendNotification('admin', 'تم النشر 🎉', 'تم نشر الكورس بنجاح!', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            sendNotification('admin', 'خطأ', 'فشل النشر: ' + error.message, 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!generationId) {
        return (
            <div className="flex h-screen overflow-hidden items-center justify-center bg-[#06152e] text-center p-8">
                <div className="max-w-md">
                    <div className="w-24 h-24 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <UploadCloud size={48} className="text-brand-gold" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">جاري تحميل المسودة...</h2>
                    <p className="text-gray-400">
                        يرجى الانتظار، يتم جلب البيانات...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#06152e] pt-6" dir="rtl">
            {/* 1. Course Structure (Right Sidebar) */}
            <div
                className={`transition-all duration-300 ease-in-out border-l border-white/10 ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
            >
                <CourseStructureSidebar />
            </div>

            {/* 2. Main Content Editor (Center) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#06152e] border-x border-white/10 relative">
                {/* Toolbar */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#06152e]">
                    <div className="flex-1 flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                            title={isSidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
                        >
                            {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
                        </button>

                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm"
                            >
                                <ArrowLeft size={16} />
                                <span>عودة للمسودات</span>
                            </button>
                        )}
                    </div> {/* Spacer for Editor Title which is inside Editor now */}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
                                ${isSaving
                                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                    : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                }
                            `}
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSaving ? 'جاري الحفظ...' : 'حفظ الدرس'}
                        </button>

                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="bg-brand-gold hover:brightness-110 text-brand-navy px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                        >
                            {isPublishing ? <RefreshCw className="animate-spin" size={16} /> : <Share2 size={16} />}
                            نشر
                        </button>
                    </div>
                </div>

                <LessonContentEditor />
            </div>


        </div>
    );
};

export default AICanvasEditor;
