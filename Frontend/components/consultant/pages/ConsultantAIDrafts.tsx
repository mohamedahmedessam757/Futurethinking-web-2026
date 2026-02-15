
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, List, HelpCircle, BookOpen,
    Trash2, Eye, Copy, Calendar, Sparkles, AlertCircle
} from 'lucide-react';
import { useConsultant } from '../ConsultantContext';
import ReactMarkdown from 'react-markdown';

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    syllabus: { label: 'خطة منهجية', icon: <List size={16} />, color: 'bg-blue-500/20 text-blue-400' },
    script: { label: 'سيناريو', icon: <FileText size={16} />, color: 'bg-purple-500/20 text-purple-400' },
    quiz: { label: 'أسئلة واختبارات', icon: <HelpCircle size={16} />, color: 'bg-green-500/20 text-green-400' },
    resources: { label: 'مصادر ومراجع', icon: <BookOpen size={16} />, color: 'bg-orange-500/20 text-orange-400' },
};

const ConsultantAIDrafts = () => {
    const { aiDrafts, deleteAiDraft, updateAiDraft, sendNotification } = useConsultant();
    const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const filteredDrafts = filter === 'all'
        ? aiDrafts
        : aiDrafts.filter(d => d.type === filter);

    const currentDraft = aiDrafts.find(d => d.id === selectedDraft);

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        sendNotification('نسخ 📋', 'تم نسخ المحتوى للحافظة', 'success');
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`هل أنت متأكد من حذف "${title}"؟`)) {
            await deleteAiDraft(id);
            if (selectedDraft === id) {
                setSelectedDraft(null);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-[80vh] space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-brand-gold" size={28} />
                        المسودات المحفوظة
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">جميع المحتوى الذي تم إنشاؤه بواسطة مساعد المستشار</p>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-brand-gold text-brand-navy' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        الكل ({aiDrafts.length})
                    </button>
                    {Object.entries(typeLabels).map(([key, { label }]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === key ? 'bg-brand-gold text-brand-navy' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {aiDrafts.length === 0 ? (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f172a] border border-white/10 rounded-3xl p-12 text-center"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-gray-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد مسودات محفوظة</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        استخدم مساعد المستشار لإنشاء محتوى جديد ثم احفظه هنا للرجوع إليه لاحقاً.
                    </p>
                </motion.div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Drafts List */}
                    <div className="lg:col-span-4 space-y-3">
                        <AnimatePresence>
                            {filteredDrafts.map((draft, index) => {
                                const typeInfo = typeLabels[draft.type] || typeLabels.syllabus;
                                return (
                                    <motion.div
                                        key={draft.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedDraft(draft.id)}
                                        className={`bg-[#0f172a] border rounded-2xl p-4 cursor-pointer transition-all hover:border-brand-gold/50 ${selectedDraft === draft.id ? 'border-brand-gold shadow-lg shadow-brand-gold/10' : 'border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold mb-2 ${typeInfo.color}`}>
                                                    {typeInfo.icon}
                                                    {typeInfo.label}
                                                </div>
                                                <h3 className="font-bold text-white truncate">{draft.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                                    <Calendar size={12} />
                                                    {formatDate(draft.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Content Viewer */}
                    <div className="lg:col-span-8">
                        {currentDraft ? (
                            <motion.div
                                key={currentDraft.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden sticky top-24"
                            >
                                {/* Header */}
                                <div className="bg-[#06152e] p-4 border-b border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold mb-1 ${typeLabels[currentDraft.type]?.color || ''}`}>
                                            {typeLabels[currentDraft.type]?.icon}
                                            {typeLabels[currentDraft.type]?.label}
                                        </div>
                                        <h2 className="font-bold text-white text-lg">{currentDraft.title}</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                // 1. Advanced Deep Cleaning (Remove ALL Markdown Artifacts)
                                                let cleanText = currentDraft.content
                                                    // Remove horizontal rules
                                                    .replace(/^[-*_]{3,}\s*$/gm, '')
                                                    // Remove Headers (# Header)
                                                    .replace(/^#+\s+(.*)$/gm, '$1')
                                                    // Remove Images (![alt](url))
                                                    .replace(/!\[.*?\]\(.*?\)/g, '')
                                                    // Remove Links ([text](url)) -> keep text
                                                    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
                                                    // Remove Bold/Italic (**text**, *text*, __text__, _text_)
                                                    .replace(/(\*\*|__)(.*?)\1/g, '$2')
                                                    .replace(/(\*|_)(.*?)\1/g, '$2')
                                                    // Remove Code Blocks (```...```)
                                                    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ''))
                                                    // Remove Inline Code (`code`)
                                                    .replace(/`([^`]+)`/g, '$1')
                                                    // Remove Blockquotes (> text)
                                                    .replace(/^>\s+(.*)$/gm, '$1')
                                                    // Remove Lists (-, *, +, 1.)
                                                    .replace(/^[\s-]*[-*+]\s+(.*)$/gm, '$1')
                                                    .replace(/^\s*\d+\.\s+(.*)$/gm, '$1')
                                                    // Remove HTML tags
                                                    .replace(/<[^>]*>/g, '')
                                                    // Collapse multiple spaces
                                                    .replace(/[ \t]+/g, ' ')
                                                    .trim();

                                                // 2. Process Lines: Bold Each Paragraph + Enforce Double Spacing
                                                const lines = cleanText.split('\n');
                                                const formattedLines = lines
                                                    .map(line => line.trim())
                                                    .filter(line => line.length > 0) // Remove empty lines
                                                    .map(line => `**${line}**`); // Bold each valid line

                                                const newContent = formattedLines.join('\n\n'); // Join with double newline

                                                // 3. Auto Save
                                                if (newContent) {
                                                    updateAiDraft(currentDraft.id, newContent);
                                                }
                                            }}
                                            className="p-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-xl transition-colors font-bold flex items-center gap-2 text-xs"
                                            title="تنظيف وتضخيم وتنسيق النص"
                                        >
                                            <Sparkles size={16} /> تنظيف وتنسيق
                                        </button>
                                        <button
                                            onClick={() => handleCopy(currentDraft.content)}
                                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                                            title="نسخ"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(currentDraft.id, currentDraft.title)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 max-h-[600px] overflow-y-auto">
                                    <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-brand-gold prose-strong:text-white prose-a:text-brand-gold max-w-none leading-relaxed">
                                        <ReactMarkdown>{currentDraft.content}</ReactMarkdown>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-[#06152e] px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                                    <span>الرموز المستخدمة: {currentDraft.tokensUsed || 0} Token</span>
                                    <span>{formatDate(currentDraft.createdAt)}</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-[#0f172a]/50 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center h-full min-h-[400px] flex flex-col items-center justify-center">
                                <Eye className="text-gray-600 mb-4" size={48} />
                                <p className="text-gray-500">اختر مسودة من القائمة لعرض محتواها</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantAIDrafts;
