import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Save, Trash2, Edit3, FileText, Mic, Video, Image as ImageIcon,
    RefreshCw, Volume2, Clock, Check, AlertCircle, Layers, BrainCircuit, PlusCircle, MinusCircle,
    HelpCircle, Briefcase, ChevronDown, ChevronUp, Plus, Play, Pause
} from 'lucide-react';
import { CanvasElement, useCanvasStore } from '../../../services/canvasStore';

interface PropertiesPanelProps {
    element: CanvasElement | null;
    onSave?: (element: CanvasElement) => void;
    onDelete?: (elementId: string) => void;
    onRegenerateVoice?: (elementId: string, segmentId?: string) => void;
    onRegenerateVideo?: (elementId: string, segmentId?: string) => void;
    onRegenerateImage?: (elementId: string, segmentId?: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    element,
    onSave,
    onDelete,
    onRegenerateVoice,
    onRegenerateVideo,
    onRegenerateImage
}) => {
    const { selectElement, updateElement } = useCanvasStore();
    const [editedElement, setEditedElement] = useState<CanvasElement | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'quiz' | 'scenarios' | 'segments'>('content');
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Update local state when element changes
    useEffect(() => {
        if (element) {
            setEditedElement({ ...element });
            setHasChanges(false);
        } else {
            setEditedElement(null);
        }
    }, [element]);

    // Handle field changes
    const handleChange = (field: keyof CanvasElement, value: any) => {
        if (!editedElement) return;

        let updates: any = { [field]: value };

        // Dynamic Duration Calculation
        if (field === 'script') {
            const words = (value as string).trim().split(/\s+/).length;
            const minutes = Math.ceil(words / 130);
            updates.duration = `${minutes} دقيقة`;
        }

        setEditedElement({ ...editedElement, ...updates });
        setHasChanges(true);
    };

    // Handle segment changes
    const handleSegmentChange = (segmentId: string, field: string, value: any) => {
        if (!editedElement || !editedElement.segments) return;
        const newSegments = editedElement.segments.map(s =>
            s.id === segmentId ? { ...s, [field]: value } : s
        );
        handleChange('segments', newSegments);
    };

    // Save changes
    const handleSave = () => {
        if (!editedElement) return;
        updateElement(editedElement.id, editedElement);
        if (onSave) onSave(editedElement);
        setHasChanges(false);
    };

    // Close panel
    const handleClose = () => {
        selectElement(null);
    };

    if (!element || !editedElement) {
        return (
            <div className="w-80 bg-[#0f172a] border-l border-white/10 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Edit3 className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-gray-400 font-bold mb-2">لا يوجد عنصر محدد</h3>
                <p className="text-gray-600 text-sm">اختر درساً من القائمة لتعديله</p>
            </div>
        );
    }

    return (
        <div className="w-80 bg-[#0f172a] border-l border-white/10 flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#06152e]">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate">{editedElement.title}</h3>
                    <span className="text-xs text-gray-500">وحدة {editedElement.unitNumber} • درس {editedElement.lessonNumber}</span>
                </div>
                <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X size={18} className="text-gray-400" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {[
                    { id: 'content', label: 'المحتوى', icon: FileText },
                    { id: 'media', label: 'الوسائط', icon: Video },
                    { id: 'segments', label: 'الأجزاء', icon: Layers },
                    { id: 'quiz', label: 'الاختبار', icon: HelpCircle },
                    { id: 'scenarios', label: 'سيناريو', icon: BrainCircuit },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 px-2 text-xs flex items-center justify-center gap-1 transition-colors ${activeTab === tab.id
                            ? 'text-brand-gold border-b-2 border-brand-gold bg-brand-gold/5'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Title */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">عنوان الدرس</label>
                                <input
                                    type="text"
                                    value={editedElement.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full bg-[#06152e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-gold/50 outline-none"
                                    dir="rtl"
                                />
                            </div>

                            {/* Script */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    السكريبت <span className="text-gray-600">({editedElement.script?.length || 0} حرف)</span>
                                </label>
                                <textarea
                                    value={editedElement.script || ''}
                                    onChange={(e) => handleChange('script', e.target.value)}
                                    className="w-full h-40 bg-[#06152e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-gold/50 outline-none resize-none custom-scrollbar"
                                    dir="rtl"
                                    placeholder="محتوى الدرس..."
                                />
                            </div>

                            {/* Script Summary */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ملخص الدرس</label>
                                <textarea
                                    value={editedElement.scriptSummary || ''}
                                    onChange={(e) => handleChange('scriptSummary', e.target.value)}
                                    className="w-full h-20 bg-[#06152e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-gold/50 outline-none resize-none custom-scrollbar"
                                    dir="rtl"
                                    placeholder="ملخص قصير..."
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">المدة</label>
                                <input
                                    type="text"
                                    value={editedElement.duration || ''}
                                    onChange={(e) => handleChange('duration', e.target.value)}
                                    className="w-full bg-[#06152e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-gold/50 outline-none"
                                    placeholder="مثال: 15 دقيقة"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Voice */}
                            <div className="bg-[#06152e] border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Mic size={16} className="text-green-400" />
                                    <span className="text-white font-bold text-sm">التسجيل الصوتي</span>
                                </div>

                                {editedElement.voiceUrl ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30"
                                            >
                                                {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                                            </button>
                                            <div className="flex-1 h-1 bg-white/10 rounded-full">
                                                <div className="h-full w-1/3 bg-green-500 rounded-full"></div>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {editedElement.voiceDuration || '0:00'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => onRegenerateVoice?.(editedElement.id)}
                                            className="w-full py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={12} /> إعادة التوليد
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Volume2 size={24} className="text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-xs">لا يوجد تسجيل صوتي</p>
                                        <button
                                            onClick={() => onRegenerateVoice?.(editedElement.id)}
                                            className="mt-2 px-4 py-1.5 text-xs text-brand-gold border border-brand-gold/30 rounded-lg hover:bg-brand-gold/10"
                                        >
                                            توليد صوت
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Video */}
                            <div className="bg-[#06152e] border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Video size={16} className="text-red-400" />
                                    <span className="text-white font-bold text-sm">الفيديو</span>
                                </div>

                                {editedElement.videoUrl ? (
                                    <div className="space-y-3">
                                        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden">
                                            <video
                                                src={editedElement.videoUrl}
                                                className="w-full h-full object-cover"
                                                controls
                                            />
                                        </div>
                                        <button
                                            onClick={() => onRegenerateVideo?.(editedElement.id)}
                                            className="w-full py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={12} /> إعادة التوليد
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Video size={24} className="text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-xs">لا يوجد فيديو</p>
                                    </div>
                                )}
                            </div>

                            {/* Images */}
                            <div className="bg-[#06152e] border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon size={16} className="text-blue-400" />
                                    <span className="text-white font-bold text-sm">الصور</span>
                                </div>

                                {editedElement.images && editedElement.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {editedElement.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <ImageIcon size={24} className="text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-xs">لا توجد صور</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Quiz Tab */}
                    {activeTab === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Quiz Header */}
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-white">أسئلة الاختبار</h4>
                                <button
                                    onClick={() => {
                                        const newQuiz = [...(editedElement.quizData || []), { question: 'سؤال جديد', options: ['إجابة 1', 'إجابة 2'], correctAnswer: 0 }];
                                        handleChange('quizData', newQuiz);
                                    }}
                                    className="text-xs text-brand-gold flex items-center gap-1 hover:underline"
                                >
                                    <PlusCircle size={12} /> إضافة سؤال
                                </button>
                            </div>

                            {editedElement.quizData && editedElement.quizData.length > 0 ? (
                                editedElement.quizData.map((question, qIdx) => (
                                    <div key={qIdx} className="bg-[#06152e] border border-white/10 rounded-xl p-4 relative group">
                                        <button
                                            onClick={() => {
                                                const newQuiz = editedElement.quizData?.filter((_, i) => i !== qIdx);
                                                handleChange('quizData', newQuiz);
                                            }}
                                            className="absolute top-2 left-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>

                                        <div className="flex items-start gap-2 mb-3">
                                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {qIdx + 1}
                                            </span>
                                            <textarea
                                                value={question.question}
                                                onChange={(e) => {
                                                    const newQuiz = [...(editedElement.quizData || [])];
                                                    newQuiz[qIdx].question = e.target.value;
                                                    handleChange('quizData', newQuiz);
                                                }}
                                                className="w-full bg-transparent border-b border-white/10 text-white text-sm focus:border-brand-gold outline-none resize-none h-12"
                                                dir="rtl"
                                            />
                                        </div>
                                        <div className="space-y-2 pl-8">
                                            {question.options?.map((option: string, oIdx: number) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={oIdx === question.correctAnswer}
                                                        onChange={() => {
                                                            const newQuiz = [...(editedElement.quizData || [])];
                                                            newQuiz[qIdx].correctAnswer = oIdx;
                                                            handleChange('quizData', newQuiz);
                                                        }}
                                                        className="accent-brand-gold"
                                                    />
                                                    <input
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newQuiz = [...(editedElement.quizData || [])];
                                                            newQuiz[qIdx].options[oIdx] = e.target.value;
                                                            handleChange('quizData', newQuiz);
                                                        }}
                                                        className={`flex-1 text-xs p-2 rounded-lg bg-white/5 text-gray-300 outline-none focus:bg-white/10 ${oIdx === question.correctAnswer ? 'text-green-400' : ''}`}
                                                        dir="rtl"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <HelpCircle size={32} className="text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm mb-2">لا توجد أسئلة اختبار</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Scenarios Tab */}
                    {activeTab === 'scenarios' && (
                        <motion.div
                            key="scenarios"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Scenarios Header */}
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-white">السيناريوهات التدريبية</h4>
                                <button
                                    onClick={() => {
                                        const newScenarios = [...(editedElement.trainingScenarios || []), { title: 'سيناريو جديد', situation: 'وصف الموقف...', options: ['خيار 1', 'خيار 2'] }];
                                        handleChange('trainingScenarios', newScenarios);
                                    }}
                                    className="text-xs text-brand-gold flex items-center gap-1 hover:underline"
                                >
                                    <PlusCircle size={12} /> إضافة سيناريو
                                </button>
                            </div>

                            {editedElement.trainingScenarios && editedElement.trainingScenarios.length > 0 ? (
                                editedElement.trainingScenarios.map((scenario: any, sIdx: number) => (
                                    <div key={sIdx} className="bg-[#06152e] border border-white/10 rounded-xl p-4 relative group space-y-3">
                                        <button
                                            onClick={() => {
                                                const newScenarios = editedElement.trainingScenarios?.filter((_: any, i: number) => i !== sIdx);
                                                handleChange('trainingScenarios', newScenarios);
                                            }}
                                            className="absolute top-2 left-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>

                                        <input
                                            value={scenario.title}
                                            onChange={(e) => {
                                                const newScenarios = [...(editedElement.trainingScenarios || [])];
                                                newScenarios[sIdx].title = e.target.value;
                                                handleChange('trainingScenarios', newScenarios);
                                            }}
                                            className="w-full bg-transparent font-bold text-brand-gold text-sm focus:border-b border-brand-gold/50 outline-none"
                                            dir="rtl"
                                        />

                                        <textarea
                                            value={scenario.situation}
                                            onChange={(e) => {
                                                const newScenarios = [...(editedElement.trainingScenarios || [])];
                                                newScenarios[sIdx].situation = e.target.value;
                                                handleChange('trainingScenarios', newScenarios);
                                            }}
                                            className="w-full h-20 bg-white/5 rounded-lg p-2 text-xs text-gray-300 resize-none outline-none focus:bg-white/10"
                                            dir="rtl"
                                            placeholder="وصف السيناريو..."
                                        />

                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500">الخيارات المتاحة:</label>
                                            {scenario.options?.map((opt: string, oIdx: number) => (
                                                <div key={oIdx} className="flex gap-2">
                                                    <span className="text-gray-500 text-xs">•</span>
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newScenarios = [...(editedElement.trainingScenarios || [])];
                                                            newScenarios[sIdx].options[oIdx] = e.target.value;
                                                            handleChange('trainingScenarios', newScenarios);
                                                        }}
                                                        className="flex-1 bg-transparent border-b border-white/5 text-xs text-gray-400 focus:border-white/20 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <BrainCircuit size={32} className="text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm mb-2">لا توجد سيناريوهات</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Segments Tab */}
                    {activeTab === 'segments' && (
                        <motion.div
                            key="segments"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {editedElement.segments && editedElement.segments.length > 0 ? (
                                editedElement.segments.map((segment, idx) => (
                                    <div key={segment.id} className="bg-[#06152e] border border-white/10 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-brand-gold bg-brand-gold/10 px-2 py-1 rounded font-bold">جزء {idx + 1}</span>
                                            <div className="flex gap-1">
                                                {segment.audioUrl && <Mic size={12} className="text-green-400" />}
                                                {segment.imageUrl && <ImageIcon size={12} className="text-blue-400" />}
                                                {segment.videoUrl && <Video size={12} className="text-red-400" />}
                                            </div>
                                        </div>

                                        <textarea
                                            value={segment.text}
                                            onChange={(e) => handleSegmentChange(segment.id, 'text', e.target.value)}
                                            className="w-full h-24 bg-[#0f172a] border border-white/10 rounded-lg p-2 text-xs text-white resize-none focus:border-brand-gold/50 outline-none custom-scrollbar"
                                            dir="rtl"
                                            placeholder="نص الجزء..."
                                        />

                                        <div className="flex gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => onRegenerateVoice?.(editedElement.id, segment.id)}
                                                className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 text-xs transition-colors ${segment.audioUrl ? 'border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10' : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                title="توليد صوت"
                                            >
                                                <Mic size={14} /> {segment.audioUrl ? 'تحديث' : 'صوت'}
                                            </button>

                                            <button
                                                onClick={() => onRegenerateImage?.(editedElement.id, segment.id)}
                                                className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 text-xs transition-colors ${segment.imageUrl ? 'border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10' : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                title="توليد صورة"
                                            >
                                                <ImageIcon size={14} /> {segment.imageUrl ? 'تحديث' : 'صورة'}
                                            </button>

                                            <button
                                                onClick={() => onRegenerateVideo?.(editedElement.id, segment.id)}
                                                className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 text-xs transition-colors ${segment.videoUrl ? 'border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10' : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                title="توليد فيديو"
                                            >
                                                <Video size={14} /> {segment.videoUrl ? 'تحديث' : 'فيديو'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                                    <Layers size={32} className="text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 text-xs">لا توجد أجزاء لهذا الدرس.</p>
                                    <p className="text-gray-600 text-[10px] mt-1">يمكنك تقسيم الدرس في مرحلة الإنشاء.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#06152e] flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${hasChanges
                        ? 'bg-brand-gold text-brand-navy hover:bg-white'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <Save size={16} /> حفظ التغييرات
                </button>
                <button
                    onClick={() => onDelete?.(editedElement.id)}
                    className="p-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default PropertiesPanel;
