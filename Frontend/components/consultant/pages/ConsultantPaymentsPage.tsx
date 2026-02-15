import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsultant } from '../ConsultantContext';
import {
    Wallet, TrendingUp, ArrowUpRight, History,
    Building, CreditCard, AlertCircle, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

const ConsultantPaymentsPage = () => {
    const {
        availableBalance, pendingBalance, totalWithdrawn, withdrawalRequests,
        submitWithdrawalRequest, myRevenue
    } = useConsultant();

    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [holderName, setHolderName] = useState('');
    const [iban, setIban] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await submitWithdrawalRequest({
                amount: Number(amount),
                bankName,
                bankAccountHolder: holderName,
                bankIban: iban
            });
            setIsWithdrawModalOpen(false);
            setAmount('');
            // Reset other fields if needed, or keep for convenience
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">المدفوعات والسحب</h1>
                <p className="text-gray-400">تتبع أرباحك وقم بإدارة طلبات السحب الخاصة بك</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Available Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <Wallet size={24} />
                        </div>
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">متاح للسحب</span>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">الرصيد المتاح</h3>
                    <p className="text-3xl font-bold text-white">{availableBalance.toLocaleString()} <span className="text-sm text-emerald-400">ر.س</span></p>
                    <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        disabled={availableBalance <= 0}
                        className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        طلب سحب <ArrowUpRight size={16} />
                    </button>
                </motion.div>

                {/* Pending Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0f172a]/50 border border-white/5 p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-gold/20 rounded-xl text-brand-gold">
                            <History size={24} />
                        </div>
                        <span className="text-xs font-bold bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-lg">قيد المعالجة</span>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">الرصيد المعلق</h3>
                    <p className="text-2xl font-bold text-white">{pendingBalance.toLocaleString()} <span className="text-sm text-brand-gold">ر.س</span></p>
                </motion.div>

                {/* Total Revenue */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0f172a]/50 border border-white/5 p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">إجمالي الأرباح</h3>
                    <p className="text-2xl font-bold text-white">{myRevenue.toLocaleString()} <span className="text-sm text-blue-400">ر.س</span></p>
                </motion.div>

                {/* Total Withdrawn */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0f172a]/50 border border-white/5 p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <Building size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">تم سحبه</h3>
                    <p className="text-2xl font-bold text-white">{totalWithdrawn.toLocaleString()} <span className="text-sm text-purple-400">ر.س</span></p>
                </motion.div>
            </div>

            {/* Withdrawal History */}
            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <History size={20} className="text-brand-gold" />
                        سجل طلبات السحب
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="text-right p-4">رقم الطلب</th>
                                <th className="text-right p-4">المبلغ</th>
                                <th className="text-right p-4">البنك</th>
                                <th className="text-right p-4">تاريخ الطلب</th>
                                <th className="text-right p-4">الحالة</th>
                                <th className="text-right p-4">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {withdrawalRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        لا توجد طلبات سحب سابقة
                                    </td>
                                </tr>
                            ) : (
                                withdrawalRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-400">#{req.id.slice(0, 8)}</td>
                                        <td className="p-4 font-bold text-white">{req.amount.toLocaleString()} ر.س</td>
                                        <td className="p-4 text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Building size={14} className="text-gray-500" />
                                                <span>{req.bankName}</span>
                                                <span className="text-xs text-gray-500 font-mono">*{req.bankIban.slice(-4)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit
                                                ${req.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                    req.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-yellow-500/10 text-yellow-400'}`}>
                                                {req.status === 'approved' && <CheckCircle2 size={12} />}
                                                {req.status === 'rejected' && <XCircle size={12} />}
                                                {req.status === 'pending' && <Loader2 size={12} className="animate-spin" />}
                                                {req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {req.rejectionReason || req.adminNotes || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsWithdrawModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#06152e]">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CreditCard className="text-brand-gold" size={20} />
                                    طلب سحب أرباح
                                </h3>
                                <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="p-4 bg-brand-gold/5 border border-brand-gold/10 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-brand-gold shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm text-brand-gold/90 leading-relaxed">
                                        سيتم تحويل المبلغ إلى حسابك البنكي خلال 3-5 أيام عمل. تأكد من صحة بيانات الأيبان لتجنب رفض الطلب.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">المبلغ المطلوب (ر.س)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        max={availableBalance}
                                        min={100}
                                        required
                                        className="w-full bg-[#020b18] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 outline-none transition-all"
                                        placeholder={`الحد الأقصى: ${availableBalance}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">الحد الأدنى للسحب 100 ر.س</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">اسم البنك</label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        required
                                        className="w-full bg-[#020b18] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 outline-none transition-all"
                                        placeholder="مثال: مصرف الراجحي"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">اسم صاحب الحساب</label>
                                    <input
                                        type="text"
                                        value={holderName}
                                        onChange={(e) => setHolderName(e.target.value)}
                                        required
                                        className="w-full bg-[#020b18] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 outline-none transition-all"
                                        placeholder="الاسم الثلاثي كما في البنك"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">رقم الآيبان (IBAN)</label>
                                    <input
                                        type="text"
                                        value={iban}
                                        onChange={(e) => setIban(e.target.value)}
                                        required
                                        pattern="^SA[0-9]{22}$"
                                        className="w-full bg-[#020b18] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 outline-none transition-all font-mono"
                                        placeholder="SA0000000000000000000000"
                                        title="يجب أن يبدأ بـ SA ويتبعه 22 رقم"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || Number(amount) > availableBalance}
                                        className="flex-1 py-3 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد السحب'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConsultantPaymentsPage;
