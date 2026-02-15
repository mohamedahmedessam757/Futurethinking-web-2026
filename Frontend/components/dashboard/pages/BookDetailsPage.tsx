
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ShoppingBag, BookOpen, Download, AlertCircle, CheckCircle2, User, MessageSquare, Send, Eye } from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { useBookDetails } from '../../../hooks/useBookDetails'; // New hook
import PaymentModal from '../../PaymentModal';

interface BookDetailsPageProps {
    bookId: string | null;
    onBack: () => void;
}

const BookDetailsPage = ({ bookId, onBack }: BookDetailsPageProps) => {
    // 1. Fetch Details using scalable hook
    const { book, isLoading: bookingLoading, error } = useBookDetails(bookId);

    // 2. Access Dashboard Context for User Actions & Ownership Check
    const { user, buyBook, addBookReview, addTransaction, sendNotification, books: ownedBooks } = useDashboard();

    // 3. Check Ownership via Dashboard's ownedBooks list (which is fetched per user)
    const isOwned = ownedBooks.some(b => b.id === bookId);

    const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
    const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Review State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    if (bookingLoading) return <div className="text-white text-center py-20 animate-pulse">جاري تحميل تفاصيل الكتاب...</div>;
    if (error || !book) return <div className="text-white text-center py-20">عذراً، لم يتم العثور على الكتاب المطلوب.</div>;

    const reviewsCount = book.reviews ? book.reviews.length : 0;
    const avgRating = reviewsCount > 0
        ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
        : 'جديد';

    const handleConfirmPurchase = async () => {
        // Logic handled via Backend/Webhook usually, but here we simulate success or rely on dashboard refresh
        setShowPurchaseSuccess(true);
        // Additional trigger to refresh owned books might be needed if not auto-handled
    };

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (reviewText.trim()) {
            addBookReview(book.id, reviewRating, reviewText);
            setReviewText('');
            // Optimistic update could happen here or forcing a refetch in useBookDetails
            // For now, we rely on the context action.
        }
    };

    const handleReadNow = () => {
        if (book.fileUrl) {
            window.open(book.fileUrl, '_blank');
        } else {
            sendNotification('قراءة الكتاب 📖', 'عذراً، ملف القراءة غير متوفر حالياً لهذا الكتاب.', 'warning');
        }
    };

    const handleDownload = () => {
        if (book.fileUrl) {
            const link = document.createElement('a');
            link.href = book.fileUrl;
            link.target = '_blank';
            link.download = `${book.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            sendNotification('تحميل الكتاب 📥', 'عذراً، ملف التحميل غير متوفر حالياً.', 'warning');
        }
    };

    return (
        <div className="animate-fade-in space-y-8 relative pb-20">

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handleConfirmPurchase}
                amount={book.price}
                itemName={`كتاب: ${book.title}`}
                itemType="book"
                itemId={book.id}
            />

            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-4">
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                العودة للمكتبة
            </button>

            <div className="grid lg:grid-cols-3 gap-8 md:gap-12">

                {/* Left Column: Cover & Action */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticky top-24"
                    >
                        {/* 3D Book Effect */}
                        <div className="relative group w-3/4 mx-auto lg:w-full perspective-1000 mb-8">
                            <div className="relative transform transition-transform duration-500 hover:rotate-y-[-10deg] preserve-3d">
                                <img
                                    src={book.coverImage}
                                    alt={book.title}
                                    className="w-full rounded-r-lg shadow-2xl z-10 relative border-l-4 border-white/10"
                                />
                                {/* Book Spine Effect */}
                                <div className="absolute top-1 left-0 w-4 h-[98%] bg-white/10 -translate-x-full origin-right transform rotate-y-[-90deg] rounded-l-sm"></div>
                                {/* Shadow */}
                                <div className="absolute top-4 left-4 w-full h-full bg-black/50 blur-xl -z-10 rounded-lg transform translate-y-4"></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-[#0f2344]/50 border border-white/5 rounded-2xl p-6 text-center space-y-4">
                            {isOwned ? (
                                <>
                                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-2 rounded-lg text-sm font-bold mb-2 flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} /> هذا الكتاب مملوك لك
                                    </div>
                                    <button
                                        onClick={handleReadNow}
                                        className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                    >
                                        <BookOpen size={20} /> اقرأ الآن
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        <Download size={20} /> تحميل PDF
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-white mb-2">
                                        {book.price === 0 ? 'مجاني' : <>{book.price} <span className="text-sm font-medium text-brand-gold">ر.س</span></>}
                                    </div>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full bg-brand-gold text-brand-navy font-bold py-3 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20"
                                    >
                                        <ShoppingBag size={20} /> اشترِ الآن
                                    </button>
                                    {book.previewUrl && (
                                        <button onClick={() => window.open(book.previewUrl, '_blank')} className="w-full text-brand-gold text-sm font-bold hover:text-white transition-colors flex items-center justify-center gap-1 mt-2">
                                            <Eye size={16} /> تصفح عينة مجانية
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Details & Reviews */}
                <div className="lg:col-span-2">
                    <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] overflow-hidden min-h-[600px]">
                        {/* Info Header */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-[#06152e] to-[#0f172a]">
                            <div className="flex gap-2 mb-4">
                                <span className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-xs font-bold">{book.category}</span>
                                <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">{book.publishYear}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{book.title}</h1>
                            <p className="text-lg text-gray-400 mb-6">المؤلف: <span className="text-white">{book.author}</span></p>

                            {/* Meta Stats (Dynamic) */}
                            <div className="flex gap-8 text-sm text-gray-400 border-t border-white/5 pt-6">
                                <div className="flex items-center gap-2">
                                    <Star className="text-yellow-400 fill-current" size={18} />
                                    <span className="font-bold text-white">{avgRating}</span>
                                    <span>({reviewsCount} تقييم)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} />
                                    <span>{book.pages} صفحة</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/5 bg-[#0f172a]">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'details' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                نبذة عن الكتاب
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                التقييمات والمراجعات
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-8">
                            {activeTab === 'details' && (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 leading-relaxed text-lg">
                                        {book.description || 'لا يوجد وصف متاح لهذا الكتاب حالياً.'}
                                    </p>
                                    <div className="mt-8 bg-[#06152e] p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-white font-bold mb-4">ماذا ستتعلم من هذا الكتاب؟</h3>
                                        <ul className="space-y-3">
                                            {['فهم عميق للمفاهيم الأساسية.', 'تطبيقات عملية وأمثلة واقعية.', 'استراتيجيات حديثة قابلة للتنفيذ.'].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-400">
                                                    <CheckCircle2 size={18} className="text-brand-gold" /> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8">
                                    {/* Add Review */}
                                    {isOwned ? (
                                        <div className="bg-[#06152e] p-6 rounded-2xl border border-white/5">
                                            <h3 className="text-white font-bold mb-4">أضف تقييمك</h3>
                                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                                <div className="flex gap-2 mb-2">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <button type="button" key={s} onClick={() => setReviewRating(s)}>
                                                            <Star size={24} className={s <= reviewRating ? "text-yellow-400 fill-current" : "text-gray-600"} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="relative">
                                                    <textarea
                                                        value={reviewText}
                                                        onChange={(e) => setReviewText(e.target.value)}
                                                        placeholder="اكتب رأيك هنا..."
                                                        className="w-full bg-[#0f2344] border border-white/10 rounded-xl p-4 text-white focus:border-brand-gold outline-none h-24 resize-none"
                                                    />
                                                    <button type="submit" className="absolute bottom-3 left-3 p-2 bg-brand-gold text-brand-navy rounded-lg hover:bg-white transition-colors">
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 bg-white/5 rounded-xl text-gray-400 text-sm border border-dashed border-white/10">
                                            <AlertCircle size={16} className="inline mx-1" /> يجب شراء الكتاب لتتمكن من التقييم.
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    <div className="space-y-6">
                                        {book.reviews.length === 0 ? (
                                            <div className="text-center text-gray-500 py-10">لا توجد مراجعات بعد. كن أول من يقييم!</div>
                                        ) : (
                                            book.reviews.map(review => (
                                                <div key={review.id} className="border-b border-white/5 pb-6 last:border-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-brand-navy border border-white/10 flex items-center justify-center text-white font-bold">
                                                                {review.userName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-white font-bold text-sm">{review.userName}</h4>
                                                                <div className="flex text-yellow-400 text-xs">
                                                                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{review.date}</span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm leading-relaxed pr-14">{review.comment}</p>

                                                    {/* Admin Reply */}
                                                    {review.adminReply && (
                                                        <div className="mr-14 mt-4 bg-[#06152e] p-3 rounded-lg border-r-2 border-brand-gold">
                                                            <p className="text-xs text-brand-gold font-bold mb-1">رد المشرف:</p>
                                                            <p className="text-xs text-gray-400">{review.adminReply}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showPurchaseSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50 font-bold border border-green-400"
                    >
                        <CheckCircle2 size={24} /> تم شراء الكتاب وإضافته لمكتبتك بنجاح!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookDetailsPage;
