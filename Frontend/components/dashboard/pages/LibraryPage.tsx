
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, Star, Check, BookOpen } from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { useBooks } from '../../../hooks/useBooks';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardView } from '../StudentDashboard';

interface LibraryPageProps {
    onNavigate?: (view: DashboardView, id?: string) => void;
}

const LibraryPage = ({ onNavigate }: LibraryPageProps) => {
    // Get owned books from DashboardContext
    const { books: ownedBooks } = useDashboard();

    // Get all books from Store Catalog
    const { books: catalogBooks, fetchBooks, isLoading } = useBooks();

    // Fetch catalog on mount
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const [searchQuery, setSearchQuery] = useState('');

    // Merge ownership status
    const displayedBooks = useMemo(() => {
        const ownedIds = new Set(ownedBooks.map(b => b.id));

        return catalogBooks.map(book => ({
            ...book,
            owned: ownedIds.has(book.id),
            rating: book.rating || (book.reviews && book.reviews.length > 0
                ? (book.reviews.reduce((a: any, b: any) => a + b.rating, 0) / book.reviews.length)
                : 0)
        })).filter(b => {
            return b.title.includes(searchQuery) || b.category.includes(searchQuery);
        });
    }, [catalogBooks, ownedBooks, searchQuery]);

    return (
        <div className="space-y-8 animate-fade-in relative">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f2344] to-[#06152e] rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-white/5 shadow-2xl">
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full text-xs font-bold mb-3 border border-brand-gold/30">
                                <ShoppingBag size={14} /> الإصدارات الجديدة
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">متجر الكتب <span className="text-brand-gold">الرقمي</span></h1>
                            <p className="text-gray-300 text-lg">تصفح واقتنِ أحدث الكتب والمراجع في مجال الإدارة والقيادة.</p>
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="relative w-full">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="عنوان الكتاب أو المؤلف..."
                                className="w-full bg-[#06152e] border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
                            />
                        </div>
                    </div>
                </div>
                {/* Decor */}
                <BookOpen className="absolute -bottom-10 -right-10 text-white/5 w-80 h-80 rotate-12 pointer-events-none" />
            </div>

            {/* Books Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                    {isLoading ? (
                        <div className="col-span-full text-center py-20 text-gray-400">جاري تحميل المكتبة...</div>
                    ) : displayedBooks.length > 0 ? (
                        displayedBooks.map((book, idx) => (
                            <motion.div
                                key={book.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#0f2344]/30 border border-white/5 rounded-2xl p-4 hover:border-brand-gold/30 transition-all group flex flex-col hover:bg-[#0f2344]/60 cursor-pointer"
                                onClick={() => onNavigate && onNavigate('book-details', book.id)}
                            >
                                <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative shadow-lg">
                                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {book.owned && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-white text-brand-navy px-4 py-2 rounded-lg font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                <BookOpen size={16} /> اقرأ الآن
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-yellow-400 flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> {typeof book.rating === 'number' ? book.rating.toFixed(1) : 'جديد'}
                                    </div>
                                </div>

                                <div className="text-xs text-brand-gold mb-1 font-bold">{book.category}</div>
                                <h3 className="font-bold text-white mb-1 line-clamp-1 text-lg">{book.title}</h3>
                                <p className="text-xs text-gray-500 mb-4">{book.author}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <span className="font-bold text-white text-lg flex items-center gap-1">
                                        {book.price === 0 ? 'مجاني' : <>{book.price} <span className="text-xs font-normal text-gray-400">ر.س</span></>}
                                    </span>

                                    <button className={`text-sm px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-2 ${book.owned ? 'bg-green-500/10 text-green-400 cursor-default' : 'bg-brand-gold text-brand-navy hover:bg-white'}`}>
                                        {book.owned ? (
                                            <>مملوك <Check size={14} /></>
                                        ) : (
                                            <>تفاصيل <ShoppingBag size={14} /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))) : (
                        <div className="col-span-full text-center py-20 text-gray-500">لا توجد كتب مطابقة للبحث.</div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LibraryPage;
