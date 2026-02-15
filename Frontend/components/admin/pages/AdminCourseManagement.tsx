
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Edit2, Trash, Plus, Search, FileText, Video, MessageCircle, Upload, Save, X, Eye, EyeOff, Filter, MoreVertical, CheckCircle2, Image as ImageIcon, HelpCircle, BookOpen, AlertCircle, ChevronDown, ChevronUp, Loader2, Sparkles, Wand2, ArrowLeft, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAdmin, AdminCourse } from '../AdminContext';
import { useGlobal, Lesson, Review } from '../../GlobalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../../../lib/supabase';
import { supabase } from '../../../lib/supabase';
import { aiCourseStorage } from '../../../services/aiCourseStorage';
import { useAdminCourses } from '../../../hooks/useAdminCourses'; // Import new hook

const AdminCourseManagement = () => {
    const { deleteCourse, addCourse, updateCourse, updateCourseStatus } = useAdmin();
    const { sendNotification } = useGlobal();

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Use Scalable Hook
    const {
        courses: filteredCourses,
        loading: isLoadingCourses,
        totalCount,
        totalPages,
        refresh: refreshCourses
    } = useAdminCourses({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: filterStatus,
        search: searchTerm
    });

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'users' | 'reviews'>('info');

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Save State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = React.useRef(false);
    const [uploadingImage, setUploadingImage] = useState(false);



    // Course Form State
    const initialForm = {
        id: '',
        title: '',
        description: '',
        instructor: '',
        status: 'draft' as 'draft' | 'active',
        price: 0,
        image: '',
        videoUrl: '',
        level: 'beginner',
        lessons: [] as Lesson[],
        reviews: [] as Review[]
    };
    const [formData, setFormData] = useState(initialForm);

    // --- Handlers ---

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        updateCourseStatus(id, newStatus);

        // Optimistic update locally? Or better wait for refresh
        // For better UX, we can just wait for refresh or trust the hook to re-fetch
        await refreshCourses();
        const statusText = newStatus === 'active' ? 'نشر' : 'إخفاء';
        sendNotification('admin', `تم ${statusText} الدورة`, 'تم تحديث حالة الدورة بنجاح', 'info');
    };

    const handleOpenAdd = () => {
        setFormData({ ...initialForm, instructor: 'Admin', image: '' });
        setIsEditing(false);
        setActiveTab('info');
        setShowModal(true);
        // Pre-fetch drafts

    };

    const handleOpenEdit = (course: AdminCourse) => {
        setFormData({
            id: course.id,
            title: course.title,
            description: course.description || '',
            instructor: course.instructor,
            status: course.status as any,
            price: course.price,
            image: course.image,
            videoUrl: course.promoVideoUrl || '',
            level: course.level || 'beginner',
            lessons: course.lessons || [],
            reviews: course.reviews || []
        });
        setIsEditing(true);
        setActiveTab('info');
        setShowModal(true);
        // Pre-fetch drafts to allow syncing updates
    };

    // --- Image Upload ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `course_${Date.now()}.${fileExt}`;

            const uploadPromise = storage.upload('course-images', fileName, file);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout')), 30000)
            );

            const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

            if (error) throw error;

            const publicUrl = storage.getPublicUrl('course-images', fileName);
            sendNotification('admin', 'تم رفع الصورة 🖼️', 'تم رفع صورة الدورة بنجاح', 'success');
            setFormData(prev => ({ ...prev, image: publicUrl }));
        } catch (err: any) {
            console.error('❌ Upload failed:', err?.message || err);
            sendNotification('admin', 'فشل الرفع ❌', 'لم نتمكن من رفع الصورة، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    // --- Save Logic ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isSubmittingRef.current) return;

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            const courseData = {
                title: formData.title,
                description: formData.description,
                instructor: formData.instructor,
                status: formData.status,
                price: formData.price,
                image: formData.image,
                promoVideoUrl: formData.videoUrl,
                level: formData.level as any,
                lessons: formData.lessons,
                reviews: formData.reviews
            };

            let savePromise;
            if (isEditing && formData.id) {
                savePromise = updateCourse(formData.id, courseData);
            } else {
                savePromise = addCourse(courseData);
            }

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Save timeout after 30s')), 30000)
            );

            const result = await Promise.race([savePromise, timeoutPromise]);

            if (!isEditing && typeof result === 'string') {
                setFormData(prev => ({ ...prev, id: result }));
                setIsEditing(true);
            } else {
                setShowModal(false);
            }

            await refreshCourses();
            sendNotification('admin', 'تم الحفظ ✅', `تم ${isEditing ? 'تحديث' : 'إنشاء'} الدورة بنجاح`, 'success');
        } catch (error: any) {
            console.error('❌ Error saving course:', error?.message || error);
            sendNotification('admin', 'خطأ في الحفظ ❌', error?.message || 'فشل حفظ بيانات الدورة', 'error');
            setShowModal(false);
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const confirmDelete = async () => {
        if (deleteId) {
            setIsDeleting(true);
            try {
                await deleteCourse(deleteId);
                await refreshCourses();
                sendNotification('admin', 'تم الحذف 🗑️', 'تم حذف الدورة بنجاح', 'warning');
                setDeleteId(null);
            } catch (error) {
                console.error('Delete error:', error);
                sendNotification('admin', 'خطأ ⚠️', 'فشل حذف الدورة', 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };




    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#0f172a] p-6 rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-navy/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 w-full md:w-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة الدورات التدريبية</h1>
                    <p className="text-gray-400 text-sm">التحكم الكامل في المحتوى التعليمي وحالة النشر.</p>
                </div>

                <div className="relative z-10 flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleOpenAdd}
                        className="bg-brand-gold text-brand-navy px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-brand-gold/10 hover:bg-white transition-all flex-1 md:flex-none"
                    >
                        <Plus size={20} /> إضافة دورة
                    </button>
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-brand-gold/5 rounded-2xl blur-xl group-hover:bg-brand-gold/10 transition-colors opacity-0 group-hover:opacity-100" />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-brand-gold transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ابحث باسم الدورة أو المدرب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-brand-gold/50 outline-none transition-all shadow-sm relative z-10"
                    />
                </div>

                <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 shrink-0">
                    {['all', 'active', 'draft'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s as any)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? 'bg-brand-navy text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            {s === 'all' ? 'الكل' : s === 'active' ? 'المنشورة' : 'المسودات'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Professional Table List */}
            <div className="grid gap-4">
                <AnimatePresence>
                    {(filteredCourses || []).length > 0 ? (
                        (filteredCourses || []).map((course) => (
                            <motion.div
                                key={course.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-gold/30 transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-right w-full">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-gold transition-colors">{course.title}</h3>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><FileText size={12} /> {course.lessons?.length || 0} درس</span>
                                        <span className="flex items-center gap-1"><MessageCircle size={12} /> {course.reviews?.length || 0} تقييم</span>
                                        <span className="font-bold text-gray-300">{course.instructor}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-8 md:border-r md:border-l border-white/5 px-6 shrink-0 justify-center w-full md:w-auto">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">السعر</p>
                                        <p className="text-white font-bold dir-ltr">{course.price} ر.س</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الطلاب</p>
                                        <p className="text-white font-bold">{course.studentsEnrolled?.length || 0}</p>
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="shrink-0 flex items-center justify-center w-full md:w-auto">
                                    <button
                                        onClick={() => handleStatusToggle(course.id, course.status)}
                                        className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border
                                    ${course.status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'}
                                  `}
                                        title={course.status === 'active' ? 'اضغط لإخفاء الدورة (مسودة)' : 'اضغط لنشر الدورة'}
                                    >
                                        {course.status === 'active' ? <><Eye size={14} /> منشور</> : <><EyeOff size={14} /> مسودة</>}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0 w-full md:w-auto justify-center">
                                    <button
                                        onClick={() => handleOpenEdit(course)}
                                        className="p-2.5 bg-white/5 hover:bg-brand-navy hover:text-brand-gold text-gray-400 rounded-xl transition-colors border border-transparent hover:border-brand-gold/30"
                                        title="تعديل المحتوى"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(course.id)}
                                        className="p-2.5 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-500/30"
                                        title="حذف نهائي"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-[#0f172a] border border-white/5 rounded-3xl">
                            <p className="text-gray-500">لا توجد دورات مطابقة للبحث.</p>
                        </div>
                    )}
                </AnimatePresence>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ArrowRight size={20} />
                        </button>
                        <span className="text-white font-bold">
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <Trash size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">حذف الدورة؟</h3>
                            <p className="text-gray-400 text-sm mb-6">سيتم إزالة الدورة وجميع محتوياتها نهائياً من النظام ولا يمكن التراجع عن ذلك.</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                                </button>
                                <button type="button" onClick={() => setDeleteId(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Editor Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-7xl shadow-2xl flex flex-col md:flex-row h-[90vh] overflow-hidden relative"
                        >
                            {/* --- LEFT SIDEBAR (Media & Status) --- */}
                            <div className="w-full md:w-80 lg:w-96 bg-[#06152e]/50 border-b md:border-b-0 md:border-l border-white/10 flex flex-col overflow-y-auto p-6 space-y-6 shrink-0 custom-scrollbar">

                                <div className="md:hidden flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">{isEditing ? 'تعديل الدورة' : 'إضافة دورة'}</h3>
                                    <button onClick={() => setShowModal(false)} className="bg-white/5 p-2 rounded-full text-white"><X size={20} /></button>
                                </div>

                                {/* Cover Image */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 block">صورة الغلاف</label>
                                    <div className="relative group rounded-2xl overflow-hidden bg-black aspect-video border-2 border-dashed border-white/10 hover:border-brand-gold/50 transition-all shadow-lg">
                                        {formData.image ? (
                                            <img src={formData.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                                <ImageIcon size={32} className="mb-2 opacity-30" />
                                                <span className="text-[10px]">لا توجد صورة</span>
                                            </div>
                                        )}
                                        <label className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer`}>
                                            {uploadingImage ? (
                                                <div className="flex flex-col items-center">
                                                    <Loader2 className="text-brand-gold w-8 h-8 mb-2 animate-spin" />
                                                    <span className="text-xs text-white font-bold">جاري الرفع...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="text-white w-8 h-8 mb-2" />
                                                    <span className="text-xs text-white font-bold">تغيير الصورة</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                                        </label>
                                    </div>
                                </div>

                                {/* Status & Quick Info */}
                                <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 space-y-5 shadow-inner">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">حالة النشر</label>
                                        <div className="flex bg-[#06152e] p-1 rounded-xl border border-white/5">
                                            <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${formData.status === 'active' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                                                <Eye size={12} /> منشور
                                            </button>
                                            <button type="button" onClick={() => setFormData({ ...formData, status: 'draft' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${formData.status === 'draft' ? 'bg-yellow-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                                                <EyeOff size={12} /> مسودة
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">السعر (ر.س)</label>
                                        <div className="relative">
                                            <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none font-mono text-center font-bold text-lg" />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">المستوى</label>
                                        <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none text-sm cursor-pointer hover:bg-[#0a1f3d] transition-colors">
                                            <option value="beginner">مبتدئ 🔥</option>
                                            <option value="intermediate">متوسط 🚀</option>
                                            <option value="advanced">متقدم 💎</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Promo Video Preview */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 block">فيديو ترويجي</label>
                                    <div className="relative">
                                        <input type="text" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pl-10 text-white text-xs focus:border-brand-gold outline-none dir-ltr truncate" placeholder="Video URL..." />
                                        <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>
                                    {formData.videoUrl && (
                                        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#06152e]">
                                                <Video size={32} className="text-white/20" />
                                                <span className="text-[10px] text-gray-500 mt-2 absolute bottom-2">Video Preview</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- RIGHT CONTENT (Tabs & Form) --- */}
                            <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
                                {/* Modal Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#06152e] to-[#0f2344] shrink-0">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            {isEditing ? <Edit2 size={20} className="text-brand-gold" /> : <Plus size={20} className="text-brand-gold" />}
                                            {isEditing ? `تعديل: ${formData.title}` : 'إضافة دورة جديدة'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">{isEditing ? 'تعديل المحتوى والدروس' : 'قم بملء البيانات الأساسية أولاً'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowModal(false)} type="button" className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors"><X size={20} /></button>
                                    </div>
                                </div>



                                {/* Tabs */}
                                <div className="flex border-b border-white/10 bg-[#0f172a] px-6">
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                                    >
                                        <FileText size={16} /> المعلومات الأساسية
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                                    >
                                        <MessageCircle size={16} /> التقييمات
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                    <form id="courseForm" onSubmit={handleSubmit} className="space-y-8">

                                        {/* TAB 1: BASIC INFO */}
                                        {activeTab === 'info' && (
                                            <div className="space-y-8 animate-fade-in relative">



                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-gray-400 font-bold">عنوان الدورة</label>
                                                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-4 text-white focus:border-brand-gold outline-none transition-shadow focus:shadow-[0_0_20px_rgba(234,179,8,0.05)] placeholder:text-gray-600" placeholder="مثال: مقدمة في القيادة الاستراتيجية..." />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <label className="text-sm text-gray-400 font-bold">وصف الدورة</label>
                                                            <span className="text-[10px] text-gray-500">{formData.description.length} حرف</span>
                                                        </div>
                                                        <textarea rows={6} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-4 text-white focus:border-brand-gold outline-none resize-none leading-relaxed placeholder:text-gray-600" placeholder="اكتب وصفاً شاملاً للدورة وما سيتعلمه الطالب..." />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm text-gray-400 font-bold">اسم المدرب</label>
                                                        <input type="text" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-4 text-white focus:border-brand-gold outline-none" placeholder="د. أحمد..." />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-6 border-t border-white/10">
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="bg-brand-gold text-brand-navy px-8 py-4 rounded-xl font-bold hover:bg-white transition-all shadow-lg hover:shadow-brand-gold/20 flex items-center gap-2 text-lg"
                                                    >
                                                        {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                                        <span>{isEditing ? 'حفظ التغييرات' : 'إنشاء الدورة'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: REVIEWS (Only Visual Placeholder for now) */}
                                        {activeTab === 'reviews' && (
                                            <div className="space-y-4 animate-fade-in text-center py-20">
                                                <MessageCircle size={48} className="text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-white font-bold">لا توجد تقييمات بعد</h3>
                                                <p className="text-gray-500">ستظهر تقييمات الطلاب هنا.</p>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sync Confirmation Modal */}


        </div>
    );
};

export default AdminCourseManagement;
