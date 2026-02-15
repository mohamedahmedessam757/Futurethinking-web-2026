
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Filter, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Clock, MoreHorizontal, FileText, ArrowRight, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAdmin, AdminTransaction } from '../AdminContext';
import { useAdminTransactions } from '../../../hooks/useAdminTransactions';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminFinancePageProps {
    initialSearch?: string;
}

const ITEMS_PER_PAGE = 15;

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        paid: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: <CheckCircle2 size={12} />, label: 'مدفوع' },
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: <Clock size={12} />, label: 'معلق' },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <XCircle size={12} />, label: 'فاشل' },
        refunded: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: <AlertCircle size={12} />, label: 'مسترجع' }
    };
    const style = config[status as keyof typeof config] || config.pending;

    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 w-fit ${style.bg} ${style.text} ${style.border}`}>
            {style.icon} {style.label}
        </span>
    );
};

const TypeIcon = ({ desc }: { desc: string }) => {
    if (desc.includes('استشارة')) return <span className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20" title="استشارة">📞</span>;
    if (desc.includes('كتاب')) return <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20" title="كتاب">📚</span>;
    if (desc.includes('دورة') || desc.includes('اشتراك')) return <span className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center border border-brand-gold/20" title="دورة">🎓</span>;
    return <span className="w-8 h-8 rounded-full bg-gray-500/10 text-gray-400 flex items-center justify-center border border-gray-500/20">💸</span>;
};

const AdminFinancePage = ({ initialSearch }: AdminFinancePageProps) => {
    const { exportData, updateTransactionStatus } = useAdmin();
    const {
        transactions,
        loading,
        stats,
        totalCount,
        totalPages,
        currentPage,
        setCurrentPage,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        refresh
    } = useAdminTransactions();

    const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null); // For Modal

    // Handle Deep Link
    useEffect(() => {
        if (initialSearch) setSearchTerm(initialSearch);
    }, [initialSearch]);

    const setSearchTerm = (term: string) => {
        setSearch(term);
        setCurrentPage(1);
    };

    // --- Actions ---
    const handleStatusChange = async (newStatus: AdminTransaction['status']) => {
        if (selectedTx) {
            await updateTransactionStatus(selectedTx.id, newStatus);
            await refresh(); // Refresh list to show updated status
            setSelectedTx(null); // Close modal
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* Top Header & Stats */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">المعاملات المالية</h1>
                        <p className="text-gray-400 text-sm">سجل شامل لجميع المدفوعات والعمليات المالية ({stats.total} عملية).</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={refresh}
                            className="p-2.5 bg-[#0f2344] hover:bg-[#162e52] border border-white/10 text-white rounded-xl transition-colors shadow-lg"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => exportData('finance')}
                            className="bg-[#0f2344] hover:bg-[#162e52] border border-white/10 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <Download size={18} /> تصدير السجل (CSV)
                        </button>
                    </div>
                </div>

                {/* Financial KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400"><CheckCircle2 size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1">إجمالي الإيرادات (المدفوعة)</p>
                            <h3 className="text-2xl font-bold text-white dir-ltr">{stats.revenue.toLocaleString()} ر.س</h3>
                        </div>
                    </div>
                    <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400"><Clock size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1">عمليات معلقة</p>
                            <h3 className="text-2xl font-bold text-white">{stats.pending}</h3>
                        </div>
                    </div>
                    <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-brand-gold/10 text-brand-gold"><FileText size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1">عدد المعاملات</p>
                            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
                        </div>
                    </div>
                    <div className="bg-[#0f172a] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-400"><AlertCircle size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1">مسترجعة / فاشلة</p>
                            <h3 className="text-2xl font-bold text-white">{stats.failed_refunded}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col min-h-[600px]">

                {/* Toolbar */}
                <div className="p-5 border-b border-white/5 flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#06152e]">
                    {/* Search */}
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث برقم العملية، اسم العميل، أو الخدمة..."
                            className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white text-sm focus:border-brand-gold/50 outline-none transition-all"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        {['all', 'paid', 'pending', 'failed', 'refunded'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status as any); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${statusFilter === status
                                    ? 'bg-brand-navy border-brand-gold/50 text-white shadow-md'
                                    : 'bg-[#0f172a] border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {status === 'all' ? 'الكل' : status === 'paid' ? 'ناجحة' : status === 'pending' ? 'معلقة' : status === 'failed' ? 'فاشلة' : 'مسترجعة'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-[#0f2344]/50 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">المعاملة</th>
                                <th className="px-6 py-4">العميل</th>
                                <th className="px-6 py-4">الخدمة / المنتج</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <Loader2 size={40} className="animate-spin text-brand-gold mx-auto" />
                                    </td>
                                </tr>
                            ) : transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <TypeIcon desc={tx.item} />
                                                <div>
                                                    <span className="block font-mono text-brand-gold text-xs font-bold">{tx.id}</span>
                                                    <span className="text-[10px] text-gray-500">{tx.method}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{tx.userName}</td>
                                        <td className="px-6 py-4 text-gray-300 max-w-[200px] truncate" title={tx.item}>{tx.item}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.date}</td>
                                        <td className="px-6 py-4 font-bold text-white dir-ltr">{tx.amount.toLocaleString()} ر.س</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedTx(tx)}
                                                className="p-2 bg-white/5 hover:bg-brand-navy hover:text-brand-gold text-gray-400 rounded-lg transition-colors border border-transparent hover:border-brand-gold/30"
                                                title="إدارة المعاملة"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-20 text-gray-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                <Search size={32} className="opacity-20" />
                                            </div>
                                            <p>لا توجد معاملات مطابقة لبحثك.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalCount > 0 && (
                    <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#06152e]">
                        <span className="text-xs text-gray-500">عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} إلى {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} من أصل {totalCount}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#0f172a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowRight size={16} className="rotate-180" /> {/* RTL Fix */}
                            </button>
                            <div className="flex items-center px-4 bg-[#0f172a] rounded-lg border border-white/10 text-sm font-bold text-brand-gold">
                                {currentPage} / {totalPages || 1}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg bg-[#0f172a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowLeft size={16} className="rotate-180" /> {/* RTL Fix */}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Action Modal */}
            <AnimatePresence>
                {selectedTx && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedTx(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 bg-[#06152e] border-b border-white/10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">تفاصيل المعاملة</h3>
                                    <p className="font-mono text-xs text-brand-gold">{selectedTx.id}</p>
                                </div>
                                <StatusBadge status={selectedTx.status} />
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">المنتج / الخدمة</p>
                                    <p className="text-white font-bold text-sm">{selectedTx.item}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">المبلغ</p>
                                        <p className="text-brand-gold font-bold text-lg dir-ltr">{selectedTx.amount} ر.س</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">طريقة الدفع</p>
                                        <p className="text-white font-bold text-sm">{selectedTx.method}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">بيانات العميل</p>
                                    <p className="text-white font-bold text-sm">{selectedTx.userName}</p>
                                    <p className="text-gray-500 text-xs mt-1">User ID: {selectedTx.userId}</p>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-xs font-bold mb-3">إجراءات إدارية</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedTx.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusChange('paid')}
                                                className="bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-bold text-sm transition-colors"
                                            >
                                                تأكيد الدفع
                                            </button>
                                        )}
                                        {selectedTx.status === 'paid' && (
                                            <button
                                                onClick={() => handleStatusChange('refunded')}
                                                className="bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-500 hover:text-white py-2.5 rounded-xl font-bold text-sm transition-colors"
                                            >
                                                استرجاع المبلغ (Refund)
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedTx(null)}
                                            className="bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm transition-colors"
                                        >
                                            إغلاق
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminFinancePage;