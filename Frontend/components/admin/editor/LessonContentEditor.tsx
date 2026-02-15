import React, { useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../../../services/canvasStore';
import {
    Type, Image as ImageIcon, Video, Mic, Plus, Trash2, GripVertical,
    MoreVertical, Save, HelpCircle, MessageSquare, Play, Pause, Maximize2,
    User, Zap, Lightbulb, Target, Eye, X, Volume2
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { motion } from 'framer-motion';

import { LessonSegment, BlockType, Lesson } from '../../../types/store';
import LessonViewer from '../../dashboard/components/LessonViewer';

// Use the shared type
type ContentBlock = LessonSegment;

import { storage } from '../../../lib/supabase';

export const LessonContentEditor = () => {
    const { elements, selectedElementId, updateElement, setDirty } = useCanvasStore();
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const selectedLesson = elements.find(el => el.id === selectedElementId);

    // Initialize Blocks from Lesson Data
    useEffect(() => {
        if (!selectedLesson) return;

        if (selectedLesson.segments && Array.isArray(selectedLesson.segments) && selectedLesson.segments.length > 0) {
            // CAST: Ensure types match (store might be loose)
            let loadedBlocks = [...selectedLesson.segments] as ContentBlock[];

            // 1. Check for missing Quiz Block
            const hasQuizBlock = loadedBlocks.some(b => b.type === 'quiz');
            if (!hasQuizBlock && selectedLesson.quizData && selectedLesson.quizData.length > 0) {
                loadedBlocks.push({
                    id: 'init-quiz',
                    type: 'quiz',
                    content: 'اختبار تفاعلي',
                    order: loadedBlocks.length,
                    metadata: { questions: selectedLesson.quizData }
                });
            }

            // 2. Check for missing Scenario Block
            const hasScenarioBlock = loadedBlocks.some(b => b.type === 'scenario');
            if (!hasScenarioBlock && selectedLesson.trainingScenarios && selectedLesson.trainingScenarios.length > 0) {
                loadedBlocks.push({
                    id: 'init-scenario',
                    type: 'scenario',
                    content: 'سيناريو تدريبي',
                    order: loadedBlocks.length,
                    metadata: { scenarios: selectedLesson.trainingScenarios }
                });
            }

            setBlocks(loadedBlocks);
        } else {
            // Migration: Create blocks from legacy fields
            // COMBINE legacy content into cohesive blocks instead of splitting them
            const newBlocks: ContentBlock[] = [];
            const hasLegacyContent = selectedLesson.script || selectedLesson.voiceUrl || selectedLesson.videoUrl || (selectedLesson.images && selectedLesson.images.length > 0);

            if (hasLegacyContent) {
                // Create a single "Master" content block for the legacy lesson
                newBlocks.push({
                    id: 'main-content',
                    type: 'text', // Default to text/content type
                    content: selectedLesson.script || '',
                    text: selectedLesson.script || '',
                    order: 0,
                    // Attach media to this block
                    audioUrl: selectedLesson.voiceUrl,
                    videoUrl: selectedLesson.videoUrl,
                    imageUrl: selectedLesson.images?.[0] // Use first image as main image
                });
            }

            // 5. Quiz (New) - Keep as separate block
            if (selectedLesson.quizData && selectedLesson.quizData.length > 0) {
                newBlocks.push({
                    id: 'init-quiz',
                    type: 'quiz',
                    content: 'اختبار تفاعلي', // Placeholder content
                    order: newBlocks.length,
                    metadata: { questions: selectedLesson.quizData } // Store actual data
                });
            }

            // 6. Scenarios (New) - Keep as separate block
            if (selectedLesson.trainingScenarios && selectedLesson.trainingScenarios.length > 0) {
                newBlocks.push({
                    id: 'init-scenario',
                    type: 'scenario',
                    content: 'سيناريو تدريبي', // Placeholder content
                    order: newBlocks.length,
                    metadata: { scenarios: selectedLesson.trainingScenarios }
                });
            }

            setBlocks(newBlocks);
        }
    }, [selectedLesson?.id]);

    // Save changes to store (debounced ideally, but direct for now)
    const saveBlocks = useCallback((newBlocks: ContentBlock[]) => {
        setBlocks(newBlocks);
        if (selectedLesson) {
            updateElement(selectedLesson.id, {
                segments: newBlocks,
                // Update script proxy?
                script: newBlocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n')
            });
            setDirty(true); // Mark as dirty on block change
        }
    }, [selectedLesson, updateElement, setDirty]);

    const addBlock = (type: BlockType) => {
        const newBlock: ContentBlock = {
            id: `block-${Date.now()}`,
            type,
            content: type === 'quiz' ? 'اختبار تفاعلي'
                : type === 'scenario' ? 'سيناريو تدريبي'
                    : '',
            order: blocks.length, // Assign order
            // metadata initialization based on type
            metadata: type === 'quiz'
                ? { questions: [{ question: 'سؤال جديد', options: ['خيار 1', 'خيار 2'], answer: 'خيار 1', type: 'mcq' }] }
                : type === 'scenario'
                    ? { scenarios: [{ title: 'موقف جديد', context: '', roleDescription: '', challenge: '', solution: '', discussionPoints: [] }] }
                    : undefined,
        };
        const newBlocks = [...blocks, newBlock];
        saveBlocks(newBlocks);
        setActiveBlockId(newBlock.id);
    };

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
        saveBlocks(newBlocks);
    };

    const removeBlock = (id: string) => {
        const newBlocks = blocks.filter(b => b.id !== id);
        saveBlocks(newBlocks);
    };

    if (!selectedLesson) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#06152e]">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Type size={32} />
                </div>
                <p>اختر درساً من القائمة لبدء التعديل</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#06152e] overflow-hidden">
            {/* Toolbar / Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#06152e] z-10 w-full">
                <div className="relative w-full max-w-3xl">
                    <input
                        value={selectedLesson.title}
                        onChange={(e) => {
                            updateElement(selectedLesson.id, { title: e.target.value });
                            setDirty(true);
                        }}
                        className="bg-[#06152e] text-xl font-bold text-white outline-none placeholder-gray-500 w-full border-b border-transparent focus:border-brand-gold/30 transition-colors py-2"
                        style={{ backgroundColor: '#06152e', color: '#ffffff' }}
                        placeholder="عنوان الدرس"
                        dir="auto"
                    />
                </div>
                <div className="flex gap-2 text-sm text-gray-400 items-center">
                    <span>{blocks.length} كتل</span>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                    >
                        <Eye size={16} /> معاينة
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-5xl mx-auto space-y-8 pb-12">
                    <Reorder.Group axis="y" values={blocks} onReorder={saveBlocks} className="space-y-6">
                        {blocks.map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                isActive={activeBlockId === block.id}
                                onActivate={() => setActiveBlockId(block.id)}
                                onUpdate={(content: string, metadata?: any) => {
                                    // Handle legacy simple string update + metadata
                                    updateBlock(block.id, { content, text: content, metadata });
                                }}
                                onUpdateFields={(updates: any) => updateBlock(block.id, updates)}
                                onDelete={() => removeBlock(block.id)}
                                isEditing={editingBlockId === block.id}
                                onToggleEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                                lessonId={selectedLesson?.id}
                            />
                        ))}
                    </Reorder.Group>

                    {/* Add Block Area */}
                    <div className="relative pt-8 pb-12">
                        <div className="absolute inset-x-0 top-8 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center mb-6">
                            <span className="bg-[#06152e] px-4 text-sm text-gray-500 font-medium">إضافة محتوى جديد</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <AddBlockButton icon={<Type />} label="نص" description="فقرة نصية" onClick={() => addBlock('text')} />
                            <AddBlockButton icon={<ImageIcon />} label="صورة" description="صورة توضيحية" onClick={() => addBlock('image')} />
                            <AddBlockButton icon={<Video />} label="فيديو" description="مقطع فيديو" onClick={() => addBlock('video')} />
                            <AddBlockButton icon={<Mic />} label="صوت" description="تسجيل صوتي" onClick={() => addBlock('audio')} />
                            <AddBlockButton icon={<HelpCircle />} label="سؤال" description="سؤال تفاعلي" onClick={() => addBlock('quiz')} />
                            <AddBlockButton icon={<MessageSquare />} label="سيناريو" description="محاكاة تدريب" onClick={() => addBlock('scenario')} />
                        </div>
                    </div>
                </div>
            </div>


            {/* Preview Modal */}
            {
                showPreview && selectedLesson && (
                    <div className="fixed inset-0 z-50 bg-[#06152e] flex flex-col animate-fade-in">
                        {/* Modal Header */}
                        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f172a]">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Eye size={18} className="text-brand-gold" />
                                معاينة الدرس: <span className="text-gray-400">{selectedLesson.title}</span>
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f172a] p-6">
                            <LessonViewer
                                lesson={{
                                    id: selectedLesson.id, // Use actual ID
                                    title: selectedLesson.title || 'معاينة',
                                    duration: selectedLesson.duration || '0 دقيقة',
                                    type: 'reading', // Force reading view for blocks
                                    content_segments: blocks, // Pass current editor blocks!
                                    // Legacy/Fallback data
                                    script: selectedLesson.script,
                                    voiceUrl: selectedLesson.voiceUrl,
                                    imageUrl: selectedLesson.images?.[0],
                                    quizData: selectedLesson.quizData,
                                    trainingScenarios: selectedLesson.trainingScenarios
                                } as Lesson}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const AddBlockButton = ({ icon, label, description, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-brand-gold/5 hover:border-brand-gold/30 hover:scale-[1.02] transition-all group"
    >
        <div className="p-3 mb-3 rounded-full bg-white/5 text-gray-400 group-hover:text-brand-gold group-hover:bg-brand-gold/10 transition-colors">
            {React.cloneElement(icon, { size: 22 })}
        </div>
        <span className="text-sm font-bold text-gray-300 group-hover:text-white mb-1">{label}</span>
        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">{description}</span>
    </button>
);

// Allowed MIME types per media category (security whitelist)
const ALLOWED_MIME_TYPES: Record<'image' | 'video' | 'audio', string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
};

interface BlockRendererProps {
    block: ContentBlock;
    isActive: boolean;
    onActivate: () => void;
    onUpdate: (content: string, metadata?: any) => void;
    onUpdateFields: (updates: Partial<ContentBlock>) => void;
    onDelete: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
    lessonId: string;
}

const BlockRenderer = ({ block, isActive, onActivate, onUpdate, onUpdateFields, onDelete, isEditing, onToggleEdit, lessonId }: BlockRendererProps) => {
    const controls = useDragControls();
    const [isUploading, setIsUploading] = useState(false);

    // Determine layout type based on block type
    const isQuiz = block.type === 'quiz';
    const isScenario = block.type === 'scenario';
    const isImage = block.type === 'image';
    const isVideo = block.type === 'video';
    const isAudio = block.type === 'audio';
    const isText = block.type === 'text' || (!isQuiz && !isScenario && !isImage && !isVideo && !isAudio); // Default/Legacy fallback

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video' | 'audio') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // 1. MIME type validation (security whitelist)
        if (!ALLOWED_MIME_TYPES[fileType].includes(file.type)) {
            alert('نوع الملف غير مدعوم. يرجى اختيار ملف بصيغة صحيحة.');
            return;
        }

        // 2. File size validation (50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('حجم الملف كبير جداً. الحد الأقصى هو 50 ميجابايت.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${lessonId}/${block.id}/${Date.now()}.${fileExt}`;
            const { data, error } = await storage.upload('lesson-media', fileName, file);

            if (error) throw error;

            const publicUrl = storage.getPublicUrl('lesson-media', fileName);

            // Update block with URL
            const urlField = fileType === 'image' ? 'imageUrl' : fileType === 'video' ? 'videoUrl' : 'audioUrl';
            onUpdateFields({ [urlField]: publicUrl });

        } catch (err: any) {
            // Error is already shown to user via alert below
            alert(`فشل رفع الملف: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Clean up old file from Supabase Storage when removing media
    const handleRemoveMedia = async (urlField: string, currentUrl: string) => {
        if (currentUrl) {
            try {
                const pathMatch = currentUrl.split('/lesson-media/');
                if (pathMatch[1]) {
                    await storage.delete('lesson-media', [decodeURIComponent(pathMatch[1])]);
                }
            } catch { /* Non-blocking: old file cleanup is best-effort */ }
        }
        onUpdateFields({ [urlField]: '' });
    };

    return (
        <Reorder.Item value={block} dragListener={false} dragControls={controls}>
            <div
                onClick={onActivate}
                className={`relative group transition-all duration-300 ${isActive
                    ? 'ring-1 ring-brand-gold/30'
                    : 'hover:ring-1 hover:ring-white/10'
                    }`}
            >
                {/* Drag Handle & Actions (Absolute positioned) */}
                <div className={`absolute -right-12 top-2 flex flex-col gap-1 transition-opacity z-20 ${isActive || 'group-hover:opacity-100 opacity-0'}`}>
                    <div
                        onPointerDown={(e) => controls.start(e)}
                        className="p-2 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing text-gray-500"
                    >
                        <GripVertical size={16} />
                    </div>
                    <button onClick={onDelete} className="p-2 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                        <Trash2 size={16} />
                    </button>
                </div>

                {/* --- RENDERER FOR TEXT BLOCKS --- */}
                {isText && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <Type size={14} /> نص
                        </div>
                        <textarea
                            value={block.content || block.text || ''}
                            onChange={(e) => {
                                onUpdateFields({ content: e.target.value, text: e.target.value });
                                e.target.style.height = 'inherit';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onFocus={(e) => {
                                e.target.style.height = 'inherit';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="اكتب المحتوى النصي هنا..."
                            className="w-full bg-transparent text-gray-200 resize-none outline-none min-h-[100px] leading-relaxed text-lg placeholder-gray-600 border-none p-0 focus:ring-0"
                            dir="auto"
                            style={{ height: 'auto', minHeight: '100px' }}
                        />

                        {/* --- ATTACHED MEDIA PREVIEW SECTION --- */}
                        {(block.audioUrl || block.imageUrl || block.videoUrl) && (
                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4 animate-fade-in">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                                    الوسائط المرفقة
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Audio Preview */}
                                    {block.audioUrl && (
                                        <div className="col-span-full bg-[#0f172a] border border-white/10 rounded-xl p-4 flex items-center gap-4 relative group/audio hover:border-brand-gold/30 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                                                <Volume2 size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-gray-400">تسجيل صوتي</span>
                                                </div>
                                                <audio src={block.audioUrl} controls className="w-full h-8" />
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveMedia('audioUrl', block.audioUrl!);
                                                }}
                                                className="absolute top-2 left-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/audio:opacity-100 transition-all"
                                                title="حذف الصوت"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image Preview */}
                                    {block.imageUrl && (
                                        <div className="relative group/image rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video">
                                            <img src={block.imageUrl} alt="attached" className="w-full h-full object-cover opacity-80 group-hover/image:opacity-100 transition-opacity" />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center gap-2">
                                                <ImageIcon size={14} className="text-white/70" />
                                                <span className="text-xs text-white/90 font-medium">صورة توضيحية</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMedia('imageUrl', block.imageUrl!);
                                                    }}
                                                    className="mr-auto p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-500/80 hover:text-white transition-colors"
                                                    title="حذف الصورة"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Preview */}
                                    {block.videoUrl && (
                                        <div className="relative group/video rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video">
                                            <video src={block.videoUrl} className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                                                    <Play size={18} fill="currentColor" />
                                                </div>
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center gap-2 pointer-events-auto">
                                                <Video size={14} className="text-white/70" />
                                                <span className="text-xs text-white/90 font-medium">مقطع فيديو</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMedia('videoUrl', block.videoUrl!);
                                                    }}
                                                    className="mr-auto p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-500/80 hover:text-white transition-colors"
                                                    title="حذف الفيديو"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- RENDERER FOR IMAGE BLOCKS --- */}
                {isImage && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <ImageIcon size={14} /> صورة
                        </div>
                        {block.imageUrl ? (
                            <div className="relative group/media rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                <img src={block.imageUrl} alt="Lesson Media" className="w-full h-auto max-h-[500px] object-contain" />
                                <button
                                    onClick={() => handleRemoveMedia('imageUrl', block.imageUrl)}
                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-lg opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-red-500/80"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all text-gray-500 hover:text-brand-gold">
                                <ImageIcon size={48} className="opacity-50" />
                                <div className="text-center">
                                    <p className="font-bold">ارفع صورة</p>
                                    <p className="text-xs opacity-70">PNG, JPG, WEBP (Max 50MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                    disabled={isUploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {isUploading && <div className="text-xs text-brand-gold animate-pulse">جاري الرفع...</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* --- RENDERER FOR VIDEO BLOCKS --- */}
                {isVideo && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <Video size={14} /> فيديو
                        </div>
                        {block.videoUrl ? (
                            <div className="relative group/media rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                <video src={block.videoUrl} controls className="w-full h-auto max-h-[500px]" />
                                <button
                                    onClick={() => handleRemoveMedia('videoUrl', block.videoUrl)}
                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-lg opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-red-500/80 z-10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all text-gray-500 hover:text-brand-gold">
                                <Video size={48} className="opacity-50" />
                                <div className="text-center">
                                    <p className="font-bold">ارفع فيديو</p>
                                    <p className="text-xs opacity-70">MP4, WEBM (Max 50MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileUpload(e, 'video')}
                                    disabled={isUploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {isUploading && <div className="text-xs text-brand-gold animate-pulse">جاري الرفع...</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* --- RENDERER FOR AUDIO BLOCKS --- */}
                {isAudio && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <Mic size={14} /> صوت
                        </div>
                        {block.audioUrl ? (
                            <div className="relative group/media bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                                    <Play size={18} fill="currentColor" />
                                </div>
                                <audio src={block.audioUrl} controls className="flex-1 h-8" />
                                <button
                                    onClick={() => handleRemoveMedia('audioUrl', block.audioUrl)}
                                    className="p-2 text-red-400/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all text-gray-500 hover:text-brand-gold">
                                <Mic size={48} className="opacity-50" />
                                <div className="text-center">
                                    <p className="font-bold">ارفع ملف صوتي</p>
                                    <p className="text-xs opacity-70">MP3, WAV (Max 50MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleFileUpload(e, 'audio')}
                                    disabled={isUploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {isUploading && <div className="text-xs text-brand-gold animate-pulse">جاري الرفع...</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* --- RENDERER FOR QUIZ BLOCKS (Separate Card Style) --- */}
                {isQuiz && (
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 flex flex-col gap-4 group/quiz hover:border-indigo-500/30 transition-colors">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-indigo-100">اختبار الوحدة</h4>
                                    <p className="text-sm text-indigo-400/60">
                                        {block.metadata?.questions?.length || 0} أسئلة لاختبار الفهم
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleEdit();
                                }}
                                className="px-5 py-2.5 text-sm font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                            >
                                {isEditing ? 'إنهاء التعديل' : 'تعديل الأسئلة'}
                            </button>
                        </div>

                        {/* Questions Preview (Collapsed) */}
                        {!isEditing && (
                            <div className="space-y-2 opacity-60">
                                {(block.metadata?.questions || []).slice(0, 2).map((q: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-indigo-200">
                                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">{i + 1}</span>
                                        <span className="truncate">{q.question}</span>
                                    </div>
                                ))}
                                {(block.metadata?.questions?.length || 0) > 2 && (
                                    <p className="text-xs text-indigo-400 px-8">... والمزيد</p>
                                )}
                            </div>
                        )}

                        {/* Inline Editor */}
                        {isEditing && (
                            <div className="mt-2 space-y-6 animate-fade-in">
                                {(block.metadata?.questions || []).map((q: any, qIdx: number) => (
                                    <div key={qIdx} className="p-5 bg-black/20 rounded-xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">السؤال {qIdx + 1}</label>
                                            <button
                                                onClick={() => {
                                                    const newQuestions = [...(block.metadata?.questions || [])];
                                                    newQuestions.splice(qIdx, 1);
                                                    onUpdateFields({ metadata: { ...block.metadata, questions: newQuestions } });
                                                }}
                                                className="text-red-400/50 hover:text-red-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <input
                                            value={q.question}
                                            onChange={(e) => {
                                                const newQuestions = [...(block.metadata?.questions || [])];
                                                newQuestions[qIdx].question = e.target.value;
                                                onUpdateFields({ metadata: { ...block.metadata, questions: newQuestions } });
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500/50 outline-none transition-colors"
                                            placeholder="نص السؤال..."
                                        />

                                        <div className="space-y-2 mt-3">
                                            {q.options?.map((opt: string, oIdx: number) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${opt === q.answer ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newQuestions = [...(block.metadata?.questions || [])];
                                                            newQuestions[qIdx].options[oIdx] = e.target.value;
                                                            onUpdateFields({ metadata: { ...block.metadata, questions: newQuestions } });
                                                        }}
                                                        className={`flex-1 bg-black/40 border rounded-lg p-2 text-xs text-gray-300 focus:border-indigo-500/50 outline-none ${opt === q.answer ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-white/10'}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newQuestion = { question: 'سؤال جديد', options: ['خيار 1', 'خيار 2'], answer: 'خيار 1', type: 'mcq' };
                                        const newQuestions = [...(block.metadata?.questions || []), newQuestion];
                                        onUpdateFields({ metadata: { ...block.metadata, questions: newQuestions } });
                                    }}
                                    className="w-full py-3 text-sm font-medium border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> إضافة سؤال جديد
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- RENDERER FOR SCENARIO BLOCKS --- */}
                {isScenario && (
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10 flex flex-col gap-4 group/scenario hover:border-orange-500/30 transition-colors">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-orange-500/10 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-orange-100">سيناريو عملي</h4>
                                    <p className="text-sm text-orange-400/60">
                                        {(block.metadata?.scenarios || []).length} مواقف تدريبية
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleEdit();
                                }}
                                className="px-5 py-2.5 text-sm font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                            >
                                {isEditing ? 'إنهاء التعديل' : 'تعديل السيناريو'}
                            </button>
                        </div>

                        {/* Inline Editor */}
                        {/* Enhanced Scenario Editor with Auto-resize fields */}
                        {isEditing && (
                            <div className="mt-4 space-y-6 pt-4 animate-fade-in">
                                {(block.metadata?.scenarios || []).map((s: any, sIdx: number) => (
                                    <div key={sIdx} className="space-y-5 p-5 bg-black/20 rounded-xl border border-white/5 relative group/item">

                                        {/* Delete Scenario Button */}
                                        <button
                                            onClick={() => {
                                                const newScenarios = [...(block.metadata?.scenarios || [])];
                                                newScenarios.splice(sIdx, 1);
                                                onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                            }}
                                            className="absolute top-4 left-4 p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                                            title="حذف السيناريو"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        {/* 1. Title */}
                                        <div>
                                            <label className="text-xs font-bold text-orange-400 mb-2 block flex items-center gap-2"><MessageSquare size={14} /> عنوان الموقف</label>
                                            <input
                                                value={s.title || ''}
                                                onChange={(e) => {
                                                    const newScenarios = [...(block.metadata?.scenarios || [])];
                                                    newScenarios[sIdx].title = e.target.value;
                                                    onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all focus:bg-black/60"
                                                placeholder="عنوان السيناريو..."
                                            />
                                        </div>

                                        {/* 2. Context */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 mb-2 block flex items-center gap-2"><Type size={14} /> السياق (Context)</label>
                                            <textarea
                                                value={s.context || ''}
                                                rows={3}
                                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                                                onChange={(e) => {
                                                    const newScenarios = [...(block.metadata?.scenarios || [])];
                                                    newScenarios[sIdx].context = e.target.value;
                                                    onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none focus:border-orange-500/30 outline-none transition-all focus:bg-black/60"
                                                placeholder="وصف سياق الموقف..."
                                            />
                                        </div>

                                        {/* 3. Role Description */}
                                        <div>
                                            <label className="text-xs font-bold text-blue-400 mb-2 block flex items-center gap-2"><User size={14} /> دورك (Role)</label>
                                            <textarea
                                                value={s.roleDescription || ''}
                                                rows={2}
                                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                                                onChange={(e) => {
                                                    const newScenarios = [...(block.metadata?.scenarios || [])];
                                                    newScenarios[sIdx].roleDescription = e.target.value;
                                                    onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                }}
                                                className="w-full bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-sm text-gray-200 resize-none focus:border-blue-500/30 outline-none transition-all focus:bg-blue-500/10"
                                                placeholder="ما هو دور المتدرب في هذا السيناريو؟"
                                            />
                                        </div>

                                        {/* 4. Challenge */}
                                        <div>
                                            <label className="text-xs font-bold text-red-400 mb-2 block flex items-center gap-2"><Zap size={14} /> التحدي (Challenge)</label>
                                            <textarea
                                                value={s.challenge || ''}
                                                rows={2}
                                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                                                onChange={(e) => {
                                                    const newScenarios = [...(block.metadata?.scenarios || [])];
                                                    newScenarios[sIdx].challenge = e.target.value;
                                                    onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                }}
                                                className="w-full bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-sm text-gray-200 resize-none focus:border-red-500/30 outline-none transition-all focus:bg-red-500/10"
                                                placeholder="ما هي المشكلة أو التحدي الرئيسي؟"
                                            />
                                        </div>

                                        {/* 5. Solution */}
                                        <div>
                                            <label className="text-xs font-bold text-green-400 mb-2 block flex items-center gap-2"><Lightbulb size={14} /> الحل المقترح (Solution)</label>
                                            <textarea
                                                value={s.solution || ''}
                                                rows={3}
                                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                                                onChange={(e) => {
                                                    const newScenarios = [...(block.metadata?.scenarios || [])];
                                                    newScenarios[sIdx].solution = e.target.value;
                                                    onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                }}
                                                className="w-full bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-sm text-gray-200 resize-none focus:border-green-500/30 outline-none transition-all focus:bg-green-500/10"
                                                placeholder="ما هو الحل الأمثل لهذا الموقف؟"
                                            />
                                        </div>

                                        {/* 6. Discussion Points (Dynamic List) */}
                                        <div>
                                            <label className="text-xs font-bold text-purple-400 mb-2 block flex items-center gap-2"><MessageSquare size={14} /> نقاط للنقاش (Discussion Points)</label>
                                            <div className="space-y-2">
                                                {(s.discussionPoints || []).map((point: string, pIdx: number) => (
                                                    <div key={pIdx} className="flex gap-2">
                                                        <textarea
                                                            value={point}
                                                            rows={1}
                                                            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                            onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                                                            onChange={(e) => {
                                                                const newScenarios = [...(block.metadata?.scenarios || [])];
                                                                const newPoints = [...(newScenarios[sIdx].discussionPoints || [])];
                                                                newPoints[pIdx] = e.target.value;
                                                                newScenarios[sIdx].discussionPoints = newPoints;
                                                                onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                            }}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-gray-300 resize-none focus:border-purple-500/30 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newScenarios = [...(block.metadata?.scenarios || [])];
                                                                const newPoints = [...(newScenarios[sIdx].discussionPoints || [])];
                                                                newPoints.splice(pIdx, 1);
                                                                newScenarios[sIdx].discussionPoints = newPoints;
                                                                onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                            }}
                                                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-white/5 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newScenarios = [...(block.metadata?.scenarios || [])];
                                                        const newPoints = [...(newScenarios[sIdx].discussionPoints || []), ''];
                                                        newScenarios[sIdx].discussionPoints = newPoints;
                                                        onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                                    }}
                                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                                                >
                                                    <Plus size={12} /> إضافة نقطة نقاش
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                ))}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newScenario = {
                                            title: 'موقف جديد',
                                            context: '',
                                            roleDescription: '',
                                            challenge: '',
                                            solution: '',
                                            discussionPoints: ['']
                                        };
                                        const newScenarios = [...(block.metadata?.scenarios || []), newScenario];
                                        onUpdateFields({ metadata: { ...block.metadata, scenarios: newScenarios } });
                                    }}
                                    className="w-full py-3 text-sm font-medium border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> إضافة سيناريو جديد
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Reorder.Item>
    );
};
