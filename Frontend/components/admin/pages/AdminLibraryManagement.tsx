
import React, { useState, useMemo, useCallback } from 'react';
import { Edit2, Trash, Plus, Search, BookOpen, Save, Upload, X, FileText, Eye, EyeOff, LayoutGrid, List as ListIcon, CheckCircle2, MessageSquare, Star, MessageCircle, Loader2, Sparkles, Wand2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin, AdminBook } from '../AdminContext';
import { useAdminBooks } from '../../../hooks/useAdminBooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, useGlobal } from '../../GlobalContext';
import { storage, supabase } from '../../../lib/supabase';
import aiService from '../../../services/ai';
import fileParserService from '../../../services/fileParser';
import videoService from '../../../services/video';

const AdminLibraryManagement = () => {
    const { addBook, updateBook, deleteBook } = useAdmin(); // Removed books, refreshBooks
    const { sendNotification } = useGlobal();

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');

    // Modal Internal Tab State
    const [modalTab, setModalTab] = useState<'details' | 'reviews'>('details');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Use Scalable Hook
    const { books, loading, totalCount, totalPages, refresh } = useAdminBooks({
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus,
        search: searchTerm
    });

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = React.useRef(false); // Ref for immediate lock
    const [uploadingCover, setUploadingCover] = useState(false);

    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadingPreview, setUploadingPreview] = useState(false);

    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [aiCoverPrompt, setAiCoverPrompt] = useState('');
    const [isDeleting, setIsDeleting] = useState(false); // Added isDeleting state

    const initialForm = {
        id: '',
        title: '',
        author: 'فكر المستقبل',
        description: '',
        price: 0,
        coverImage: '', // Start Empty
        fileUrl: '',
        previewUrl: '', // New Preview URL
        category: 'الإدارة',
        pages: 100,
        publishYear: new Date().getFullYear().toString(),
        status: 'draft' as 'active' | 'draft',
        reviews: [] as Review[]
    };
    const [formData, setFormData] = useState(initialForm);

    // --- Handlers ---

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        // Note: AdminContext doesn't have updateBookStatus, but updateBook works
        // But we want to use async DB call directly or invoke AdminContext action
        // AdminContext updateBook is async now.
        await updateBook(id, { status: newStatus as any });
        await refresh();
    };

    const handleOpenAdd = () => {
        setFormData(initialForm);
        setLocalPdfFile(null); // Reset local file
        setIsEditing(false);
        setModalTab('details');
        setShowModal(true);
    };

    const handleOpenEdit = (book: AdminBook) => {
        setFormData({
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description,
            price: book.price,
            coverImage: book.coverImage,
            fileUrl: book.fileUrl || '',
            previewUrl: book.previewUrl || '',
            category: book.category,
            pages: book.pages,
            publishYear: book.publishYear,
            status: book.status,
            reviews: book.reviews || []
        });
        setIsEditing(true);
        setModalTab('details');
        setShowModal(true);
    };

    const [localPdfFile, setLocalPdfFile] = useState<File | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'fileUrl' | 'previewUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = field === 'coverImage';
        const bucket = isImage ? 'book-covers' : 'book-files';

        let setUploading;
        if (field === 'coverImage') setUploading = setUploadingCover;
        else if (field === 'fileUrl') setUploading = setUploadingFile;
        else setUploading = setUploadingPreview;

        // Store local PDF for analysis
        if (!isImage) {
            setLocalPdfFile(file);
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `book_${Date.now()}.${fileExt}`;

            const { data, error } = await storage.upload(bucket, fileName, file);

            if (error) {
                console.error('Upload error:', error);
                // Fallback to base64 for images
                if (isImage) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }

            const publicUrl = storage.getPublicUrl(bucket, fileName);
            // Wait a moment for propagation if needed? No, standard URL should work if public.
            setFormData(prev => ({ ...prev, [field]: publicUrl }));
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isSubmittingRef.current) return; // double check

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            // Skip base64 images - use default instead
            let coverImage = formData.coverImage;
            if (coverImage.startsWith('data:')) {
                coverImage = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f';
            }

            // 1. Prepare Payload for Supabase (snake_case)
            const supabasePayload = {
                title: formData.title,
                author: formData.author,
                description: formData.description,
                price: Number(formData.price),
                cover_image: coverImage,
                file_url: formData.fileUrl.startsWith('data:') ? '' : formData.fileUrl,
                preview_url: formData.previewUrl, // Map to DB column
                category: formData.category,
                pages: Number(formData.pages),
                publish_year: formData.publishYear,
                status: formData.status
            };

            // 2. Local Payload (camelCase) - maintained for local state
            const bookPayload = {
                title: formData.title,
                author: formData.author,
                description: formData.description,
                price: Number(formData.price),
                coverImage: coverImage,
                fileUrl: formData.fileUrl.startsWith('data:') ? '' : formData.fileUrl,
                previewUrl: formData.previewUrl,
                category: formData.category,
                pages: Number(formData.pages),
                publishYear: formData.publishYear,
                status: formData.status,
                reviews: formData.reviews
            };

            // If empty image, use placeholder ONLY on save if still empty? No, keep it empty or use AI generated one.
            // User requested empty placeholder.

            if (isEditing && formData.id) {
                // Direct Supabase Update
                const { error } = await supabase
                    .from('books')
                    .update(supabasePayload)
                    .eq('id', formData.id);

                if (error) throw error;

                // Update List
                await refresh();

            } else {
                // Direct Supabase Insert
                const { data, error } = await supabase
                    .from('books')
                    .insert([{
                        ...supabasePayload,
                        // owners: [], // Exclude owners from DB insert
                        // reviews: [] // Exclude reviews from DB insert
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // Update List
                if (data) {
                    await refresh();
                }
            }

            sendNotification('admin', 'تم الحفظ ✅', `تم ${isEditing ? 'تحديث' : 'إضافة'} الكتاب بنجاح`, 'success');
            setShowModal(false);
        } catch (error) {
            console.error('Error saving book:', error);
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const confirmDelete = async () => {
        if (deleteId) {
            setIsDeleting(true);
            try {
                // deleteBook is async now
                await deleteBook(deleteId);
                await refresh();
                sendNotification('admin', 'تم الحذف 🗑️', 'تم حذف الكتاب بنجاح', 'success');
                setDeleteId(null);
            } catch (error) {
                console.error('Delete error:', error);
                sendNotification('admin', 'خطأ ⚠️', 'فشل حذف الكتاب', 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };


    // AI Handlers
    const handleAnalyzeBook = async () => {
        if (!formData.fileUrl) {
            sendNotification('admin', 'خطأ ⚠️', 'يرجى رفع ملف الكتاب أولاً', 'error');
            return;
        }

        setIsAnalyzing(true);
        try {
            let fileToParse: File | null = localPdfFile;

            // Strategy:
            // 1. Use localPdfFile if available (Best for new uploads)
            // 2. If not, try to fetch from URL as Blob (Works if public)
            // 3. If Fetch fails/returns XML (Private bucket), try storage.download

            if (!fileToParse && formData.fileUrl) {
                try {
                    const response = await fetch(formData.fileUrl);

                    if (response.ok) {
                        const blob = await response.blob();
                        // Verify blob is not xml error
                        if (blob.type === 'application/pdf' || blob.size > 1000) {
                            fileToParse = new File([blob], "book_remote.pdf", { type: 'application/pdf' });
                        }
                    }

                    // Fallback: If fetch failed or returned tiny XML error
                    if (!fileToParse) {
                        // Extract path from URL (naive check)
                        // Structure: .../storage/v1/object/public/book-files/filename.pdf
                        const urlParts = formData.fileUrl.split('/book-files/');
                        if (urlParts[1]) {
                            const { data, error } = await storage.download('book-files', urlParts[1]);
                            if (data) {
                                fileToParse = new File([data], "book_downloaded.pdf", { type: 'application/pdf' });
                            }
                        }
                    }

                } catch (e) {
                    console.warn('Failed to fetch remote PDF directly:', e);
                }
            }

            if (!fileToParse) {
                throw new Error('فشل في الوصول إلى ملف الكتاب للتحليل. يرجى إعادة رفع الملف.');
            }

            // 2. Parse text
            const parseResult = await fileParserService.parseFile(fileToParse);
            if (!parseResult.success || !parseResult.content) {
                console.error('Parse Result Error:', parseResult);
                throw new Error('فشل في قراءة محتوى الملف (قد يكون الملف تالفاً أو محمياً)');
            }

            // 3. AI Analysis
            const aiResult = await aiService.analyzeBook(parseResult.content);
            if (!aiResult.success || !aiResult.content) {
                throw new Error(aiResult.error || 'فشل في تحليل الكتاب');
            }

            const data = aiResult.content;

            // 4. Update Form
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                author: data.author || prev.author,
                description: data.description || prev.description,
                category: data.category || prev.category,
                pages: data.pages || parseResult.metadata?.pageCount || prev.pages,
                publishYear: data.publishYear || prev.publishYear
            }));

            if (data.suggestedCoverPrompt) {
                setAiCoverPrompt(data.suggestedCoverPrompt);
            }

            sendNotification('admin', 'تم التحليل 🧠', 'تم استخراج بيانات الكتاب بنجاح', 'success');

        } catch (error: any) {
            console.error('Analysis failed:', error);
            sendNotification('admin', 'خطأ ⚠️', error.message || 'حدث خطأ أثناء التحليل', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateCover = async () => {
        // Updated Prompt: Requesting Arabic Calligraphy for Title + High Quality Aesthetic
        const basePrompt = `Book cover design for "${formData.title}". The title text must be in Arabic Calligraphy. Theme: ${formData.category}. Visual style: Cinematic, 8k resolution, highly detailed, premium aesthetic. luxurious and modern design.`;
        const prompt = aiCoverPrompt ? `${aiCoverPrompt} (Ensure Arabic Calligraphy for title)` : basePrompt;

        setIsGeneratingCover(true);
        try {
            // 1. Generate Image
            const result = await videoService.generateImages([prompt], 'illustration');

            if (result.success && result.imageBlobs?.[0]) {
                // 2. Upload to Storage
                const blob = result.imageBlobs[0];
                const fileName = `cover_ai_${Date.now()}.png`;
                // Force MIME type to 'image/png' to avoid 'binary/octet-stream' error
                const fileToUpload = new File([blob], fileName, { type: 'image/png' });

                const { data, error } = await storage.upload('book-covers', fileName, fileToUpload, {
                    contentType: 'image/png',
                    upsert: true
                });

                if (error) throw error;

                const publicUrl = storage.getPublicUrl('book-covers', fileName);

                // 3. Update Form
                setFormData(prev => ({ ...prev, coverImage: publicUrl }));
                sendNotification('admin', 'تم التوليد ✨', 'تم إنشاء غلاف الكتاب بنجاح', 'success');
            } else {
                throw new Error(result.error || 'فشل في توليد الغلاف');
            }
        } catch (error: any) {
            console.error('Cover gen failed:', error);
            sendNotification('admin', 'خطأ ⚠️', error.message, 'error');
        } finally {
            setIsGeneratingCover(false);
        }
    };

    // Reviews Logic
    const handleReplyReview = (reviewId: string, reply: string) => {
        const updatedReviews = formData.reviews.map(r => r.id === reviewId ? { ...r, adminReply: reply } : r);
        setFormData(prev => ({ ...prev, reviews: updatedReviews }));
    };

    const handleDeleteReview = (reviewId: string) => {
        const updatedReviews = formData.reviews.filter(r => r.id !== reviewId);
        setFormData(prev => ({ ...prev, reviews: updatedReviews }));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#0f172a] p-6 rounded-3xl border border-white/5">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">المكتبة الرقمية</h1>
                    <p className="text-gray-400 text-sm">إدارة الكتب والمراجع الإلكترونية ({totalCount} كتاب).</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-brand-gold text-brand-navy px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-brand-gold/10 hover:bg-white transition-all flex-1 md:flex-none w-full md:w-auto"
                >
                    <Plus size={20} /> إضافة كتاب
                </button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="ابحث عن كتاب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-brand-gold/50 outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-white/10">
                        {['all', 'active', 'draft'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s as any)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? 'bg-brand-navy text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                {s === 'all' ? 'الكل' : s === 'active' ? 'منشور' : 'مسودة'}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-white/10">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-navy text-white' : 'text-gray-400 hover:text-white'}`}>
                            <LayoutGrid size={20} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-navy text-white' : 'text-gray-400 hover:text-white'}`}>
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Mode Switching */}
            {viewMode === 'grid' ? (
                // --- GRID VIEW ---
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <AnimatePresence>
                        {books.map(book => (
                            <motion.div
                                key={book.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-gold/30 transition-all shadow-lg hover:shadow-xl flex flex-col"
                            >
                                {/* Cover */}
                                <div className="aspect-[2/3] relative overflow-hidden bg-black/50">
                                    <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={book.title} />
                                    {/* Quick Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => handleOpenEdit(book)} className="p-2 bg-white text-black rounded-full hover:bg-brand-gold transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => setDeleteId(book.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><Trash size={16} /></button>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-2 left-2">
                                        <button
                                            onClick={() => handleStatusToggle(book.id, book.status)}
                                            className={`text-[10px] px-2 py-1 rounded font-bold border flex items-center gap-1 shadow-sm backdrop-blur-md cursor-pointer hover:scale-105 transition-transform ${book.status === 'active' ? 'bg-green-500/80 text-white border-green-400' : 'bg-yellow-500/80 text-white border-yellow-400'}`}
                                        >
                                            {book.status === 'active' ? <><Eye size={10} /> منشور</> : <><EyeOff size={10} /> مسودة</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-white text-sm line-clamp-1 mb-1" title={book.title}>{book.title}</h3>
                                    <p className="text-xs text-gray-400 mb-3">{book.author}</p>

                                    <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-3">
                                        <span className="font-mono text-sm font-bold text-brand-gold dir-ltr">{book.price} ر.س</span>
                                        <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                                            <MessageCircle size={10} /> {book.reviews?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                // --- LIST VIEW ---
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[800px]">
                            <thead className="bg-[#06152e] text-xs text-gray-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">الكتاب</th>
                                    <th className="px-6 py-4">المؤلف</th>
                                    <th className="px-6 py-4">التصنيف</th>
                                    <th className="px-6 py-4">السعر</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {books.map(book => (
                                    <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-14 rounded bg-black border border-white/10 overflow-hidden shrink-0">
                                                    <img src={book.coverImage} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-bold text-white">{book.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{book.author}</td>
                                        <td className="px-6 py-4"><span className="bg-white/5 text-gray-300 px-2 py-1 rounded text-xs">{book.category}</span></td>
                                        <td className="px-6 py-4 text-brand-gold font-mono">{book.price} ر.س</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleStatusToggle(book.id, book.status)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit transition-all hover:scale-105 ${book.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}
                                            >
                                                {book.status === 'active' ? <><CheckCircle2 size={12} /> منشور</> : <><EyeOff size={12} /> مسودة</>}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenEdit(book)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                <button onClick={() => setDeleteId(book.id)} className="p-2 bg-red-500/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"><Trash size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {books.length === 0 && (
                <div className="text-center py-20 bg-[#0f172a] border border-white/5 rounded-3xl">
                    <p className="text-gray-500">لا توجد كتب مطابقة للبحث.</p>
                </div>
            )}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#06152e] rounded-3xl mt-4">
                <span className="text-xs text-gray-500">عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalCount)} من أصل {totalCount}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-[#0f172a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div className="flex items-center px-4 bg-[#0f172a] rounded-lg border border-white/10 text-sm font-bold text-brand-gold">
                        {currentPage} / {totalPages || 1}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 rounded-lg bg-[#0f172a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>
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
                            <h3 className="text-xl font-bold text-white mb-2">حذف الكتاب؟</h3>
                            <p className="text-gray-400 text-sm mb-6">سيتم إزالة الكتاب نهائياً من المكتبة.</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button" // EXPLICIT TYPE
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash size={18} />}
                                    <span>{isDeleting ? 'جاري الحذف...' : 'حذف'}</span>
                                </button>
                                <button type="button" onClick={() => setDeleteId(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit/Add Modal - Professional Redesign */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            {/* Glass Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#06152e] to-[#0f2344] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{isEditing ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h3>
                                        <p className="text-xs text-gray-400">أدخل تفاصيل الكتاب أو استخدم الذكاء الاصطناعي</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors"><X size={20} /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/10 bg-[#0f172a] px-6">
                                <button
                                    onClick={() => setModalTab('details')}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${modalTab === 'details' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                                >
                                    <BookOpen size={16} /> تفاصيل الكتاب
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={() => setModalTab('reviews')}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${modalTab === 'reviews' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                                    >
                                        <MessageSquare size={16} /> التقييمات ({formData.reviews.length})
                                    </button>
                                )}
                            </div>

                            {modalTab === 'details' ? (
                                <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">

                                    {/* AI File Analysis Section */}
                                    {!isEditing && (
                                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                            <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-bold flex items-center gap-2 mb-2">
                                                        <Sparkles className="text-blue-400" size={18} />
                                                        تعبئة تلقائية بالذكاء الاصطناعي
                                                    </h4>
                                                    <p className="text-gray-400 text-sm">ارفع ملف الكتاب (PDF) ودع الذكاء الاصطناعي يستخرج العنوان، الوصف، والمؤلف تلقائياً.</p>
                                                </div>

                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <div className="relative flex-1 md:flex-none">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={formData.fileUrl ? 'تم تحديد الملف' : ''}
                                                            placeholder="اختر ملف PDF..."
                                                            className="w-full md:w-48 bg-[#06152e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-green-400 placeholder:text-gray-600 focus:outline-none"
                                                        />
                                                        {formData.fileUrl && <CheckCircle2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />}
                                                    </div>

                                                    <label className={`bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 ${uploadingFile || isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                        <span>رفع الملف</span>
                                                        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'fileUrl')} />
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={handleAnalyzeBook}
                                                        disabled={!formData.fileUrl || isAnalyzing}
                                                        className={`bg-brand-gold text-brand-navy px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-gold/20 flex items-center gap-2 ${(!formData.fileUrl || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}`}
                                                    >
                                                        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                                        <span>تحليل</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Cover Upload Column */}
                                        <div className="w-full lg:w-1/3 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-bold text-gray-400">غلاف الكتاب</label>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateCover}
                                                    disabled={isGeneratingCover || !formData.title}
                                                    className={`text-xs flex items-center gap-1 text-brand-gold hover:text-white transition-colors ${isGeneratingCover ? 'opacity-50' : ''}`}
                                                >
                                                    {isGeneratingCover ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    توليد بالذكاء الاصطناعي
                                                </button>
                                            </div>

                                            <div className="aspect-[2/3] bg-[#06152e] rounded-2xl overflow-hidden border-2 border-dashed border-white/10 relative group hover:border-brand-gold/50 transition-colors">
                                                {formData.coverImage ? (
                                                    <img src={formData.coverImage} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                                        <BookOpen size={48} className="mb-2 opacity-20" />
                                                        <span className="text-xs">لا يوجد غلاف</span>
                                                    </div>
                                                )}

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-gold transition-colors flex items-center gap-2">
                                                        <Upload size={16} /> رفع صورة
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'coverImage')} />
                                                    </label>
                                                    <button
                                                        type="button" // EXPLICIT TYPE: Prevent form submit
                                                        onClick={(e) => { e.preventDefault(); handleGenerateCover(); }}
                                                        className="cursor-pointer bg-brand-navy border border-brand-gold/30 text-brand-gold px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors flex items-center gap-2"
                                                    >
                                                        <Sparkles size={16} /> توليد غلاف
                                                    </button>
                                                </div>

                                                {/* Loading State */}
                                                {(uploadingCover || isGeneratingCover) && (
                                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                                                        <Loader2 className="text-brand-gold w-10 h-10 mb-3 animate-spin" />
                                                        <span className="text-white text-xs font-bold">{isGeneratingCover ? 'جاري التوليد...' : 'جاري الرفع...'}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Prompt Debug (Optional, can hide) */}
                                            {aiCoverPrompt && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <label className="text-[10px] text-gray-500 block mb-1">وصف الغلاف (من التحليل)</label>
                                                    <p className="text-xs text-gray-300 line-clamp-3">{aiCoverPrompt}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Form Fields Column */}
                                        <div className="flex-1 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">عنوان الكتاب</label>
                                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none transition-all focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]" placeholder="عنوان الكتاب..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">المؤلف</label>
                                                    <input required type="text" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none transition-all" placeholder="اسم المؤلف" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400">نبذة عن الكتاب</label>
                                                <textarea rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none resize-none transition-all leading-relaxed" placeholder="اكتب وصفاً جذاباً للكتاب..." />
                                                <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
                                                    <span>{formData.description.length} حرف</span>
                                                    <span className="text-brand-gold">AI Ready ✨</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">السعر (ر.س)</label>
                                                    <div className="relative">
                                                        <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none font-mono" />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs text-bold">$</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">الصفحات</label>
                                                    <input type="number" value={formData.pages} onChange={e => setFormData({ ...formData, pages: Number(e.target.value) })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none font-mono" />
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-xs font-bold text-gray-400">سنة النشر</label>
                                                    <input type="text" value={formData.publishYear} onChange={e => setFormData({ ...formData, publishYear: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none font-mono" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400">التصنيف</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 pl-10 text-white focus:border-brand-gold outline-none"
                                                        placeholder="الإدارة، التقنية..."
                                                    />
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                </div>
                                            </div>

                                            {/* File Uploads Section */}
                                            <div className="pt-4 border-t border-white/5 space-y-4">
                                                {/* Main Book File */}
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block">ملف الكتاب الكامل (PDF)</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 bg-[#06152e] border border-white/10 rounded-xl p-3 text-sm text-gray-400 flex items-center gap-2">
                                                            <FileText size={16} />
                                                            <span className="truncate dir-ltr">{formData.fileUrl ? formData.fileUrl.split('/').pop() : 'لم يتم رفع ملف'}</span>
                                                        </div>
                                                        <label className={`bg-white/5 hover:bg-white/10 border border-white/10 px-4 rounded-xl text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                            {formData.fileUrl ? 'تغيير' : 'رفع'}
                                                            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'fileUrl')} disabled={uploadingFile} />
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Preview File */}
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block flex items-center gap-2">
                                                        <span>ملف العينة المجانية (PDF)</span>
                                                        <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">معاينة للطلاب</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 bg-[#06152e] border border-white/10 rounded-xl p-3 text-sm text-gray-400 flex items-center gap-2">
                                                            <Eye size={16} />
                                                            <span className="truncate dir-ltr">{formData.previewUrl ? formData.previewUrl.split('/').pop() : 'لم يتم رفع عينة'}</span>
                                                        </div>
                                                        <label className={`bg-white/5 hover:bg-white/10 border border-white/10 px-4 rounded-xl text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${uploadingPreview ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingPreview ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                            {formData.previewUrl ? 'تغيير' : 'رفع'}
                                                            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'previewUrl')} disabled={uploadingPreview} />
                                                        </label>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 mt-1">يفضل رفع فصل واحد فقط أو صفحات مختارة كعينة (لا ترفع الكتاب كاملاً هنا).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 flex gap-3 border-t border-white/10 mt-8">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3.5 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">إلغاء</button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || uploadingCover || uploadingFile || isAnalyzing}
                                            className={`flex-1 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-gold/20 hover:scale-[1.02] ${isSubmitting ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-brand-gold text-brand-navy hover:bg-white'}`}
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الكتاب'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                    {formData.reviews.length > 0 ? (
                                        formData.reviews.map((review) => (
                                            <div key={review.id} className="bg-[#06152e] border border-white/5 rounded-2xl p-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold border border-white/10">
                                                            {review.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-white text-sm">{review.userName}</h5>
                                                            <div className="flex text-yellow-400 text-xs">
                                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReview(review.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                                        title="حذف التقييم"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>

                                                <p className="text-gray-300 text-sm bg-[#0f172a] p-3 rounded-xl mb-4 border border-white/5">"{review.comment}"</p>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={review.adminReply || ''}
                                                            onChange={(e) => handleReplyReview(review.id, e.target.value)}
                                                            placeholder="اكتب رداً على هذا التقييم..."
                                                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-4 text-white text-xs focus:border-brand-gold outline-none"
                                                        />
                                                    </div>
                                                    {review.adminReply && <CheckCircle2 size={16} className="text-green-400" />}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                                            <MessageCircle size={48} className="opacity-20" />
                                            <p>لا توجد تقييمات لهذا الكتاب بعد.</p>
                                        </div>
                                    )}

                                    {/* Save Changes for Reviews (Separate from form submit) */}
                                    <div className="pt-4 border-t border-white/10 flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            className="bg-brand-navy text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors border border-white/10 hover:border-brand-gold"
                                        >
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    );
};

export default AdminLibraryManagement;
