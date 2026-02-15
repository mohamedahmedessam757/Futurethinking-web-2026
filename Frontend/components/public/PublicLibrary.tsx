
import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Star, BookOpen, Lock, ArrowRight, Check } from 'lucide-react';
import { useGlobal } from '../GlobalContext';
import { useBooks } from '../../hooks/useBooks';
import { useBookDetails } from '../../hooks/useBookDetails';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicLibraryProps {
    onNavigate: (page: string, id?: string) => void;
    selectedId?: string | null;
}

const PublicLibrary = ({ onNavigate, selectedId }: PublicLibraryProps) => {
    const { currentUser } = useGlobal(); // Keep auth
    const { books: listBooks, isLoading: isListLoading, fetchBooks } = useBooks();
    const { book: detailedBook, isLoading: isDetailsLoading } = useBookDetails(selectedId);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredBooks = listBooks.filter(b =>
        b.status === 'active' && (
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const selectedBook = selectedId ? detailedBook : null;

    const handleAction = (book: any) => {
        if (currentUser) {
            onNavigate('dashboard-library', String(book.id));
        } else {
            onNavigate('auth', `redirect=public-library&id=${book.id}`);
        }
    };

    if (selectedId) {
        if (isDetailsLoading) {
            return (
                <div className="container mx-auto px-4 py-32 text-center animate-pulse" dir="rtl">
                    <div className="w-24 h-32 bg-gray-200 rounded mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري تحميل تفاصيل الكتاب...</p>
                </div>
            );
        }

        if (!selectedBook) {
            return (
                <div className="container mx-auto px-4 py-32 text-center" dir="rtl">
                    <p className="text-red-400">عذراً، لم يتم العثور على الكتاب المطلوب.</p>
                    <button onClick={() => onNavigate('public-library')} className="mt-4 text-brand-navy underline">العودة للمكتبة</button>
                </div>
            );
        }

        const reviewsCount = selectedBook.reviews ? selectedBook.reviews.length : 0;
        const avgRating = reviewsCount > 0
            ? (selectedBook.reviews.reduce((a, b) => a + b.rating, 0) / reviewsCount).toFixed(1)
            : 'جديد';

        return (
            <div className="container mx-auto px-4 py-8 animate-fade-in pb-24 text-right" dir="rtl">
                <button onClick={() => onNavigate('public-library')} className="flex items-center gap-2 text-gray-500 hover:text-brand-navy transition-colors mb-6 group font-bold">
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    العودة للمكتبة
                </button>

                <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-xl flex flex-col md:flex-row gap-12 items-start">
                    <div className="w-full md:w-1/3 max-w-sm mx-auto shadow-2xl rounded-2xl overflow-hidden relative group">
                        <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div>
                            <span className="bg-brand-gold/10 text-brand-navy px-3 py-1 rounded-full text-xs font-bold border border-brand-gold/20 mb-3 inline-block">{selectedBook.category}</span>
                            <h1 className="text-4xl font-bold text-brand-navy mb-2">{selectedBook.title}</h1>
                            <p className="text-xl text-gray-500">تأليف: {selectedBook.author}</p>
                        </div>

                        <div className="flex gap-6 py-6 border-y border-gray-100">
                            <div>
                                <p className="text-sm text-gray-400">عدد الصفحات</p>
                                <p className="font-bold text-brand-navy">{selectedBook.pages}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">سنة النشر</p>
                                <p className="font-bold text-brand-navy">{selectedBook.publishYear}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">التقييم</p>
                                <div className="flex text-yellow-500"><Star size={16} fill="currentColor" /> {avgRating}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-brand-navy mb-2">نبذة عن الكتاب</h3>
                            <p className="text-gray-600 leading-relaxed text-lg">{selectedBook.description}</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between mt-8">
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">سعر النسخة الرقمية</span>
                                <span className="text-3xl font-bold text-brand-navy">{selectedBook.price} <span className="text-lg font-normal text-gray-400">ر.س</span></span>
                            </div>
                            <button onClick={() => handleAction(selectedBook)} className="bg-brand-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-lg flex items-center gap-2">
                                شراء وتحميل <ShoppingBag size={20} />
                            </button>
                        </div>

                        {!currentUser && (
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Lock size={14} /> يجب عليك تسجيل الدخول لإتمام عملية الشراء.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-32 pb-12 animate-fade-in text-right" dir="rtl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-navy mb-4">متجر الكتب الرقمي</h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">تصفح واقتنِ أحدث الكتب والمراجع في مجال الإدارة والقيادة.</p>
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto relative mb-12">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="عنوان الكتاب أو المؤلف..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-brand-navy focus:outline-none focus:border-brand-gold shadow-sm"
                />
            </div>

            {isListLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[2/3] bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <AnimatePresence>
                        {filteredBooks.length > 0 ? (
                            filteredBooks.map((book, idx) => (
                                <motion.div
                                    key={book.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-gold/50 transition-all group flex flex-col hover:shadow-xl cursor-pointer"
                                    onClick={() => onNavigate('public-library', String(book.id))}
                                >
                                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative shadow-md">
                                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>

                                    <div className="text-xs text-brand-gold mb-1 font-bold">{book.category}</div>
                                    <h3 className="font-bold text-brand-navy mb-1 line-clamp-1 text-lg group-hover:text-brand-gold transition-colors">{book.title}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{book.author}</p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                        <span className="font-bold text-brand-navy text-lg flex items-center gap-1">
                                            {book.price === 0 ? 'مجاني' : <>{book.price} <span className="text-xs font-normal text-gray-400">ر.س</span></>}
                                        </span>

                                        <button className="text-sm bg-brand-navy/5 text-brand-navy px-4 py-2 rounded-lg transition-colors font-bold group-hover:bg-brand-navy group-hover:text-white flex items-center gap-2">
                                            التفاصيل <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500">لا توجد كتب مطابقة للبحث.</div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PublicLibrary;
