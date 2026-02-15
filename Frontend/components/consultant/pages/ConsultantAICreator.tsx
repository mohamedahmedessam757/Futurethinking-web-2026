
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, FileText, List, HelpCircle, BookOpen,
    Copy, Save, RefreshCw, Edit3, Check, Wand2,
    MessageSquare, AlertCircle, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useConsultant } from '../ConsultantContext';
import { wavespeedService } from '../../../services/wavespeed';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

type GenerationType = 'syllabus' | 'script' | 'quiz' | 'resources';

interface GeneratedResult {
    type: GenerationType;
    content: string;
    title: string;
    tokensUsed?: number;
}

const ConsultantAICreator = () => {
    const { saveAiDraft, sendNotification } = useConsultant();
    const [loading, setLoading] = useState(false);

    // Persisted State
    const [topic, setTopic] = useLocalStorage<string>('consultant_ai_topic', '');
    const [selectedType, setSelectedType] = useLocalStorage<GenerationType>('consultant_ai_type', 'syllabus');
    const [audience, setAudience] = useLocalStorage<string>('consultant_ai_audience', '');
    const [result, setResult] = useLocalStorage<GeneratedResult | null>('consultant_ai_result', null);

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useLocalStorage<string>('consultant_ai_edited_content', '');

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const taskOptions = [
        { id: 'syllabus', label: 'خطة منهجية تفصيلية', icon: <List size={18} />, desc: 'هيكلة كاملة لمحاور الدورة والأهداف' },
        { id: 'script', label: 'سيناريو درس/فيديو', icon: <FileText size={18} />, desc: 'نص تفصيلي جاهز للإلقاء أو التسجيل' },
        { id: 'quiz', label: 'بنك أسئلة واختبارات', icon: <HelpCircle size={18} />, desc: 'أسئلة دقيقة لقياس الفهم مع الإجابات' },
        { id: 'resources', label: 'مصادر ومراجع علمية', icon: <BookOpen size={18} />, desc: 'قائمة بمراجع وكتب ودراسات حقيقية' },
    ];

    const getPromptForType = (type: GenerationType, topicText: string, audienceText: string) => {
        const baseContext = `أنت خبير استشاري ومحاضر جامعي في المملكة العربية السعودية.
الموضوع: "${topicText}"
الفئة المستهدفة: ${audienceText || 'المهنيين بشكل عام'}

`;
        switch (type) {
            case 'syllabus':
                return baseContext + `قم بإعداد خطة منهجية تفصيلية (Syllabus) لدورة تدريبية احترافية.
قسّم الدورة إلى وحدات (Modules) ودروس (Lessons).
لكل درس، اكتب وصفاً موجزاً ومخرجات التعلم.
اجعل الأسلوب أكاديمياً وعملياً في نفس الوقت.
اكتب المحتوى بتنسيق Markdown مع عناوين ونقاط واضحة.`;
            case 'script':
                return baseContext + `اكتب سيناريو (Script) تفصيلي لدرس تعليمي مدته 10 دقائق.
ابدأ بمقدمة جذابة، ثم اشرح المفاهيم بعمق مع أمثلة واقعية من بيئة الأعمال السعودية، واختم بملخص.
اكتبه بأسلوب المتحدث (Speaker Notes).
اكتب المحتوى بتنسيق Markdown.`;
            case 'quiz':
                return baseContext + `قم بإعداد 5 أسئلة اختيار من متعدد (MCQ) وسؤالين مقاليين.
يجب أن تكون الأسئلة ذكية وتقيس الفهم العميق وليس الحفظ.
أرفق الإجابة الصحيحة مع شرح مقتضب لكل سؤال.
اكتب المحتوى بتنسيق Markdown.`;
            case 'resources':
                return baseContext + `اقترح قائمة بـ 5-7 مصادر موثوقة (كتب، أوراق بحثية، تقارير رسمية) تتعلق بالموضوع.
يفضل المصادر الحديثة والتي لها علاقة برؤية المملكة 2030 أو المعايير العالمية.
اكتب نبذة مختصرة عن فائدة كل مصدر.
اكتب المحتوى بتنسيق Markdown.`;
            default:
                return baseContext;
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const prompt = getPromptForType(selectedType, topic, audience);

            // NEW: Use Wavespeed Service
            const messages = [
                { role: 'system', content: 'You are an expert consultant assisting a user.' },
                { role: 'user', content: prompt }
            ];

            const generatedText = await wavespeedService.generateText(messages, 4000, { model_tier: 'fast' });

            // Estimate tokens (roughly 4 chars per token)
            let tokensUsed = Math.ceil((prompt.length + generatedText.length) / 4);

            if (generatedText) {
                setResult({
                    type: selectedType,
                    title: topic,
                    content: generatedText,
                    tokensUsed: tokensUsed
                });
                setEditedContent(generatedText);

                sendNotification(
                    'اكتملت المهمة 🤖',
                    `تم توليد محتوى "${taskOptions.find(t => t.id === selectedType)?.label}" بنجاح. (${tokensUsed} Token)`,
                    'success'
                );
            } else {
                throw new Error('لم يتم استلام أي بيانات من AI');
            }

        } catch (err: any) {
            console.error("AI Generation Error:", err);
            setError(err.message || "حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.");
            sendNotification('فشل العملية ❌', 'لم نتمكن من توليد المحتوى. يرجى المحاولة لاحقاً.', 'warning');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(editedContent);
        showSuccess("تم نسخ النص للحافظة");
    };

    const handleSaveToDrafts = async () => {
        if (result) {
            setSaving(true);
            try {
                // Race between save and 30s timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Save request timed out')), 30000)
                );

                await Promise.race([
                    saveAiDraft({
                        type: result.type,
                        title: result.title,
                        content: editedContent,
                        tokensUsed: result.tokensUsed
                    }),
                    timeoutPromise
                ]);

                // Success is handled in Context
            } catch (error) {
                console.error('Error saving draft:', error);
                // Also set error state to show in UI if needed
                if (error instanceof Error && error.message === 'Save request timed out') {
                    // Context might not show notification if it timed out here
                    sendNotification('تنبيه حفظ ⚠️', 'انتهت مهلة الحفظ. يرجى التحقق من الاتصال.', 'warning');
                }
            } finally {
                setSaving(false);
            }
        }
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-start pt-8 pb-20 relative">

            <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-8">

                {/* Sidebar: Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-xl sticky top-24"
                    >
                        <div className="mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Sparkles className="text-brand-gold" size={24} /> مساعد المستشار
                            </h2>
                            <p className="text-gray-400 text-sm">أداتك لإعداد محتوى استشاري وتدريبي عميق.</p>
                        </div>

                        <div className="space-y-5">
                            {/* Type Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">ماذا تريد أن تُعد اليوم؟</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {taskOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelectedType(opt.id as GenerationType)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${selectedType === opt.id ? 'bg-brand-gold text-brand-navy border-brand-gold shadow-md' : 'bg-[#06152e] border-white/5 text-gray-400 hover:border-white/20'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${selectedType === opt.id ? 'bg-white/20' : 'bg-white/5'}`}>{opt.icon}</div>
                                            <div>
                                                <span className="block font-bold text-sm">{opt.label}</span>
                                                <span className={`block text-[10px] ${selectedType === opt.id ? 'text-brand-navy/70' : 'text-gray-500'}`}>{opt.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-bold text-gray-300 mb-1 block">موضوع الاستشارة / الدورة</label>
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="مثال: إدارة المخاطر في سلاسل الإمداد..."
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-gold h-24 resize-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-300 mb-1 block">الفئة المستهدفة (اختياري)</label>
                                    <input
                                        type="text"
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        placeholder="مثال: المدراء التنفيذيين، طلاب الجامعات..."
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-gold text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!topic || loading}
                                className="w-full bg-gradient-to-r from-brand-gold to-[#d4b67d] text-brand-navy font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? <><RefreshCw className="animate-spin" /> جاري التحليل والإعداد...</> : <><Wand2 size={20} /> توليد المحتوى</>}
                            </button>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-xs flex items-center justify-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Content Area: Results */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col"
                            >
                                {/* Toolbar */}
                                <div className="bg-[#06152e] p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-brand-gold/10 text-brand-gold p-2 rounded-lg">
                                            {taskOptions.find(t => t.id === result.type)?.icon}
                                        </div>
                                        <span className="font-bold text-white text-sm md:text-base">{result.title}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className={`p-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isEditing ? 'bg-brand-gold text-brand-navy' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                        >
                                            <Edit3 size={16} /> {isEditing ? 'إنهاء التعديل' : 'تعديل'}
                                        </button>
                                        <button onClick={handleCopy} className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors" title="نسخ">
                                            <Copy size={18} />
                                        </button>
                                        <button
                                            onClick={handleSaveToDrafts}
                                            disabled={saving}
                                            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg ${saving ? 'opacity-50 cursor-wait' : ''}`}
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {saving ? 'جاري الحفظ...' : 'حفظ في المسودات'}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Editor/Viewer */}
                                <div className="flex-1 bg-[#0f172a] p-6 relative">
                                    {isEditing ? (
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full h-full min-h-[500px] bg-transparent text-gray-300 leading-relaxed outline-none resize-none font-mono text-sm border border-white/5 p-4 rounded-xl focus:border-brand-gold/30"
                                        />
                                    ) : (
                                        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-brand-gold prose-strong:text-white prose-a:text-brand-gold max-w-none leading-relaxed">
                                            <ReactMarkdown>{editedContent}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Success Toast inside card */}
                                <AnimatePresence>
                                    {successMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold z-20"
                                        >
                                            <Check size={18} /> {successMsg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        ) : (
                            /* Empty State / Placeholder */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[2rem] bg-[#0f172a]/30"
                            >
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Sparkles className="text-brand-gold opacity-50" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">المساحة الإبداعية</h3>
                                <p className="text-gray-500 max-w-md">
                                    اختر نوع المحتوى من القائمة الجانبية، وسيقوم مساعد المستشار بإعداد مسودة احترافية يمكنك تعديلها وحفظها.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ConsultantAICreator;
