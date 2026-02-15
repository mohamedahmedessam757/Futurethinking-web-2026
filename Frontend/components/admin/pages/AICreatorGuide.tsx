import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, BrainCircuit, Target, FileText,
    Upload, HelpCircle, Lightbulb, Zap, ShieldCheck
} from 'lucide-react';

interface AICreatorGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AICreatorGuide: React.FC<AICreatorGuideProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-hidden"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#0f2344] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">

                            {/* Header */}
                            <div className="p-6 border-b border-white/10 bg-[#06152e] flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-gold to-yellow-600 flex items-center justify-center shadow-lg shadow-brand-gold/20">
                                        <Sparkles className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">دليل احتراف منشئ الدورات</h2>
                                        <p className="text-sm text-gray-400">كيف تحصل على أفضل النتائج من الذكاء الاصطناعي</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                                {/* Section 1: The Golden Rules */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                                            <Target className="text-purple-400 w-5 h-5" />
                                        </div>
                                        <h3 className="text-white font-bold mb-2">الدقة في المدخلات</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            كلما كان المحتوى المرفق دقيقاً ومنظماً (حقيبة تدريبية بصيغة PDF أو نص واضح)، كلما فهم النظام هيكل الدورة، ونمط التفكير، والمخرجات المطلوبة بدقة أعلى.
                                        </p>
                                    </div>

                                    <div className="p-5 bg-gradient-to-br from-brand-gold/10 to-orange-500/10 border border-white/10 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center mb-4">
                                            <BrainCircuit className="text-brand-gold w-5 h-5" />
                                        </div>
                                        <h3 className="text-white font-bold mb-2">أنماط التفكير</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            النظام يقوم تلقائياً باستخراج "أنماط التفكير" من ملفاتك. تأكد أن الملف يحتوي على منهجية واضحة (مثل: لماذا، ماذا، كيف، ماذا لو) للحصول على تسلسل دراسي منطقي.
                                        </p>
                                    </div>

                                    <div className="p-5 bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-white/10 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                            <FileText className="text-green-400 w-5 h-5" />
                                        </div>
                                        <h3 className="text-white font-bold mb-2">هيكل الملف</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            يفضل استخدام ملفات تحتوي على عناوين واضحة (Headings) ونقاط (Bullet Points). النصوص الطويلة جداً والمتصلة قد تقلل من دقة استخراج الوحدات.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2: Pro Tips */}
                                <div className="bg-[#06152e] border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Lightbulb className="text-yellow-400" /> نصائح لنتائج احترافية
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-blue-400 font-bold text-sm">1</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">تحديد الفئة المستهدفة بدقة</h4>
                                                <p className="text-gray-400 text-sm">
                                                    إذا كتبت "للمبتدئين"، سيستخدم النظام لغة مبسطة وأمثلة سهلة. أما إذا حددت "للمدراء التنفيذيين"، فسيستخدم لغة مهنية وسيناريوهات استشرافية. تأكد من وجود هذا الوصف في ملفك.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-blue-400 font-bold text-sm">2</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">التحكم في الإعدادات</h4>
                                                <p className="text-gray-400 text-sm">
                                                    لا تترك الإعدادات الافتراضية دائماً. إذا كان الكورس تطبيقياً، قم بزيادة "السيناريوهات". وإذا كان نظرياً، ركز على "السكريبت" و"الاختبارات".
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-blue-400 font-bold text-sm">3</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">المراجعة قبل التوليد الكامل</h4>
                                                <p className="text-gray-400 text-sm">
                                                    في خطوة "هيكل الدورة"، يمكنك فتح الوحدات وقراءة عناوين الدروس. إذا وجدت عنواناً غير مناسب، فهذا هو الوقت الأفضل لتعديل الملف الأصلي وإعادة التحليل، بدلاً من تعديل المحتوى الكامل لاحقاً.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: AI Capabilities */}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">قدرات النظام الذكية</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                            <ShieldCheck className="text-green-400 shrink-0" />
                                            <div>
                                                <strong className="text-white block text-sm">AI Guard Validation</strong>
                                                <span className="text-gray-500 text-xs">يتحقق من جودة المحتوى تلقائياً ويضمن عدم وجود هلوسة (Hallucinations).</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                            <Zap className="text-yellow-400 shrink-0" />
                                            <div>
                                                <strong className="text-white block text-sm">Dynamic Scenarios</strong>
                                                <span className="text-gray-500 text-xs">يولد سيناريوهات بمسارات متعددة لتعزيز التفكير النقدي.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                            <Upload className="text-blue-400 shrink-0" />
                                            <div>
                                                <strong className="text-white block text-sm">Smart File Parser</strong>
                                                <span className="text-gray-500 text-xs">يدعم PDF, DOCX, TXT ويستخرج الهيكل بذكاء.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                            <Sparkles className="text-purple-400 shrink-0" />
                                            <div>
                                                <strong className="text-white block text-sm">Context Awareness</strong>
                                                <span className="text-gray-500 text-xs">كل درس "يعرف" سياق الوحدة الكاملة لضمان التسلسل المنطقي.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
