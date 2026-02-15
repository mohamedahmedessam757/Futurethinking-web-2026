import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, MoreVertical, Trash2, Edit3,
    FileText, CheckCircle, Clock, AlertCircle, LayoutGrid, List as ListIcon,
    ArrowRight, Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { aiCourseStorage } from '../../../services/aiCourseStorage';
import { useCanvasStore } from '../../../services/canvasStore';
// import AICanvasEditor from './AICanvasEditor'; // Moved to standalone page
import { useGlobal } from '../../GlobalContext';

// Types
interface AIDraft {
    id: string;
    title: string;
    status: 'generating' | 'completed' | 'failed' | 'published';
    created_at: string;
    ai_generated_lessons: { count: number }[]; // From the join
}

// Skeleton Component
const DraftCardSkeleton = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="flex gap-2">
                <div className="w-16 h-6 rounded bg-white/10 animate-pulse" />
                <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
            </div>
        </div>
        <div className="h-6 w-3/4 bg-white/10 rounded mb-2 animate-pulse" />
        <div className="flex gap-4 mb-6">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex justify-between pt-4 border-t border-white/5">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
        </div>
    </div>
);

const AdminAIDraftsPage = () => {
    // State
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<AIDraft[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'generating' | 'completed' | 'published'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // Hooks
    const { setGenerationId } = useCanvasStore();
    const { sendNotification } = useGlobal();

    // Fetch Drafts
    const fetchDrafts = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const result = await aiCourseStorage.getGenerations(user.id);
            if (result.success && result.data) {
                setDrafts(result.data);
            }
        } catch (error) {
            console.error('Error fetching drafts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check URL for draftId
        const params = new URLSearchParams(window.location.search);
        const urlDraftId = params.get('draftId');

        if (urlDraftId) {
            handleEditDraft(urlDraftId);
        } else if (viewMode === 'list') {
            fetchDrafts();
        }
    }, [viewMode]);

    // Handlers
    const handleEditDraft = (id: string) => {
        // Use App's navigation to switch to standalone editor page
        if ((window as any).navigateApp) {
            (window as any).navigateApp('admin-editor', id);
        }
    };

    const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('هل أنت متأكد من حذف هذه المسودة؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            const result = await aiCourseStorage.deleteGeneration(id);
            if (result.success) {
                setDrafts(prev => prev.filter(d => d.id !== id));
                sendNotification('admin', 'تم الحذف', 'تم حذف المسودة بنجاح', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            sendNotification('admin', 'خطأ', 'فشل حذف المسودة', 'error');
        }
    };

    const handleBackToList = () => {
        setGenerationId(''); // Clear store
        setSelectedDraftId(null);
        setViewMode('list');
        // Clear URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('draftId');
        window.history.pushState({}, '', newUrl.toString());
    };

    // Derived State
    const filteredDrafts = drafts.filter(draft => {
        const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || draft.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Render Editor View
    // Render List View
    // Editor view is now handled by standalone page
    // if (viewMode === 'editor' && selectedDraftId) { ... } removed

    // Render List View
    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">مسودات الذكاء الاصطناعي</h1>
                    <p className="text-gray-400 text-sm">إدارة وتعديل الكورسات التي تم إنشاؤها بواسطة AI</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="بحث في المسودات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0f172a] border border-white/10 text-white pr-10 pl-4 py-2.5 rounded-xl text-sm focus:border-brand-gold/50 outline-none w-64"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`bg-[#0f172a] border border-white/10 text-white p-2.5 rounded-xl hover:bg-white/5 transition-colors ${showFilterMenu ? 'border-brand-gold/50 text-brand-gold' : ''}`}
                        >
                            <Filter size={18} />
                        </button>

                        <AnimatePresence>
                            {showFilterMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-0 top-full mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                >
                                    {[
                                        { id: 'all', label: 'الكل' },
                                        { id: 'generating', label: 'جاري التوليد' },
                                        { id: 'completed', label: 'مكتمل' },
                                        { id: 'published', label: 'منشور' }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setStatusFilter(option.id as any);
                                                setShowFilterMenu(false);
                                            }}
                                            className={`w-full text-right px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${statusFilter === option.id ? 'text-brand-gold bg-brand-gold/5' : 'text-gray-300'}`}
                                        >
                                            {option.label}
                                            {statusFilter === option.id && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <DraftCardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredDrafts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredDrafts.map((draft) => (
                            <motion.div
                                key={draft.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => handleEditDraft(draft.id)}
                                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-gold/50 hover:bg-white/[0.07] transition-all cursor-pointer relative"
                            >
                                {/* Card Glow Effect */}
                                <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="p-6 relative">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                                            <FileText size={20} />
                                        </div>

                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(draft.status)}`}>
                                                {getStatusLabel(draft.status)}
                                            </span>

                                            <button
                                                onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors z-10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{draft.title}</h3>

                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{new Date(draft.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <LayoutGrid size={12} />
                                            <span>{draft.ai_generated_lessons?.[0]?.count || 0} دروس</span>
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <span className="text-xs text-gray-500 group-hover:text-brand-gold transition-colors">
                                            انقر للتعديل
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-gold group-hover:text-black transition-colors">
                                            <Edit3 size={12} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <FileText size={32} className="text-gray-600" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">لا توجد مسودات</h3>
                    <p className="text-gray-400 text-sm max-w-sm text-center mb-6">
                        لم تقم بإنشاء أي مسودات للكورسات بعد. يمكنك البدء بإنشاء كورس جديد من صفحة "منشئ الدورات".
                    </p>
                </div>
            )}
        </div>
    );
};

// Helpers
const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'published': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'generating': return 'bg-brand-gold/10 text-brand-gold border-brand-gold/20';
        case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'completed': return 'مكتمل';
        case 'published': return 'منشور';
        case 'generating': return 'جاري التوليد';
        case 'failed': return 'فشل';
        default: return status;
    }
};

export default AdminAIDraftsPage;
