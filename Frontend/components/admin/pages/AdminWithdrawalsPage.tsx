import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, Search, Filter, CheckCircle2, XCircle,
    AlertCircle, Building, Loader2, ArrowUpRight, History
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useAdmin } from '../AdminContext';
import { WithdrawalRequest } from '../../../types/store';

const AdminWithdrawalsPage = () => {
    const { sendNotification } = useAdmin();
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Action Modal State
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await db.withdrawalRequests.getAll();
            if (error) throw error;
            if (data) {
                const mapped: WithdrawalRequest[] = data.map((r: any) => ({
                    id: r.id,
                    consultantId: r.consultant_id,
                    consultantName: r.profiles?.name || 'مستشار غير معروف',
                    consultantEmail: r.profiles?.email || '',
                    amount: r.amount,
                    currency: r.currency,
                    bankName: r.bank_name,
                    bankAccountHolder: r.bank_account_holder,
                    bankIban: r.bank_iban,
                    status: r.status,
                    rejectionReason: r.rejection_reason,
                    adminNotes: r.admin_notes,
                    createdAt: r.created_at,
                    processedAt: r.processed_at
                }));
                setRequests(mapped);
            }
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            sendNotification('خطأ', 'فشل تحميل طلبات السحب', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesSearch =
                req.id.includes(searchQuery) ||
                (req as any).consultantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.bankAccountHolder.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter = statusFilter === 'all' || req.status === statusFilter;

            return matchesSearch && matchesFilter;
        });
    }, [requests, searchQuery, statusFilter]);

    const handleAction = (request: WithdrawalRequest, type: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(type);
        setRejectionReason('');
        setAdminNotes('');
    };

    const submitAction = async () => {
        if (!selectedRequest || !actionType) return;

        // Ensure rejection has a reason
        if (actionType === 'reject' && !rejectionReason.trim()) {
            sendNotification('تنبيه', 'يجب كتابة سبب الرفض', 'warning');
            return;
        }

        setIsProcessing(true);
        try {
            const updates: any = {
                status: actionType === 'approve' ? 'approved' : 'rejected',
                processed_at: new Date().toISOString(),
                admin_notes: adminNotes
            };

            if (actionType === 'reject') {
                updates.rejection_reason = rejectionReason;
            }

            // Update Request Status
            const { error } = await db.withdrawalRequests.update(selectedRequest.id, updates);
            if (error) throw error;

            // If Approved, we need to update Consultant Profile balances
            if (actionType === 'approve') {
                // Fetch current profile first to be safe (though we could calculate in SQL function for better concurrency)
                const { data: profile } = await db.consultantProfiles.get(selectedRequest.consultantId);
                if (profile) {
                    const newAvailable = Math.max(0, (profile.available_balance || 0) - selectedRequest.amount);
                    const newWithdrawn = (profile.total_withdrawn || 0) + selectedRequest.amount;

                    await db.consultantProfiles.update(selectedRequest.consultantId, {
                        available_balance: newAvailable,
                        total_withdrawn: newWithdrawn
                    });
                }
            }

            // Success Updates
            sendNotification(
                'تم بنجاح',
                `تم ${actionType === 'approve' ? 'موافقة' : 'رفض'} الطلب بنجاح`,
                'success'
            );

            setRequests(prev => prev.map(r =>
                r.id === selectedRequest.id
                    ? { ...r, ...updates, status: actionType === 'approve' ? 'approved' : 'rejected' }
                    : r
            ));

            setSelectedRequest(null);
            setActionType(null);
        } catch (error) {
            console.error('Error processing request:', error);
            sendNotification('خطأ', 'حدث خطأ أثناء معالجة الطلب', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">طلبات السحب</h1>
                    <p className="text-gray-400">إدارة طلبات سحب الأرباح للمستشارين</p>
                </div>

                {/* Stats Summary */}
                <div className="flex gap-4">
                    <div className="bg-[#0f172a] border border-white/10 px-4 py-2 rounded-xl text-center">
                        <span className="block text-xs text-brand-gold uppercase font-bold tracking-wider">قيد الانتظار</span>
                        <span className="text-xl font-bold text-white">{requests.filter(r => r.status === 'pending').length}</span>
                    </div>
                    <div className="bg-[#0f172a] border border-white/10 px-4 py-2 rounded-xl text-center">
                        <span className="block text-xs text-emerald-500 uppercase font-bold tracking-wider">تم الموافقة</span>
                        <span className="text-xl font-bold text-white">{requests.filter(r => r.status === 'approved').length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#0f172a] border border-white/10 p-4 rounded-xl flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث برقم الطلب، اسم المستشار، أو اسم صاحب الحساب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#06152e] border border-white/10 rounded-lg pr-10 pl-4 py-2.5 text-white focus:border-brand-gold/50 outline-none transition-all"
                    />
                </div>

                <div className="flex bg-[#06152e] p-1 rounded-lg border border-white/10">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === filter
                                ? 'bg-brand-gold text-brand-navy shadow-sm'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {filter === 'all' ? 'الكل' :
                                filter === 'pending' ? 'قيد الانتظار' :
                                    filter === 'approved' ? 'مجاب' : 'مرفوض'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                        <Loader2 size={32} className="animate-spin mb-4 text-brand-gold" />
                        جاري تحميل الطلبات...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                        <Wallet size={48} className="opacity-20 mb-4" />
                        <p>لا توجد طلبات تطابق معايير البحث</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#06152e] text-gray-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-right">رقم الطلب</th>
                                    <th className="px-6 py-4 text-right">المستشار</th>
                                    <th className="px-6 py-4 text-right">المبلغ</th>
                                    <th className="px-6 py-4 text-right">بيانات البنك</th>
                                    <th className="px-6 py-4 text-right">التاريخ</th>
                                    <th className="px-6 py-4 text-right">الحالة</th>
                                    <th className="px-6 py-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">#{req.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-white text-base">{(req as any).consultantName}</p>
                                                <p className="text-xs text-gray-500">{(req as any).consultantEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-lg text-brand-gold font-mono">
                                                {req.amount.toLocaleString()} <span className="text-xs text-gray-500">ر.س</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Building size={14} />
                                                    {req.bankName}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono tracking-wide">{req.bankIban}</div>
                                                <div className="text-xs text-gray-500">{req.bankAccountHolder}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(req.createdAt).toLocaleDateString('ar-SA', {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5
                                                ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                {req.status === 'approved' && <CheckCircle2 size={12} />}
                                                {req.status === 'rejected' && <XCircle size={12} />}
                                                {req.status === 'pending' && <Loader2 size={12} className="animate-spin" />}
                                                {req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'pending' ? (
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleAction(req, 'approve')}
                                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all"
                                                        title="موافقة"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req, 'reject')}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                        title="رفض"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center text-xs text-gray-500">
                                                    تم اتخاذ الإجراء
                                                    <br />
                                                    {new Date(req.processedAt || '').toLocaleDateString('ar-SA')}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Popup */}
            <AnimatePresence>
                {selectedRequest && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => { setSelectedRequest(null); setActionType(null); }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className={`p-6 border-b border-white/10 flex justify-between items-center 
                                ${actionType === 'approve' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                <h3 className={`text-lg font-bold flex items-center gap-2
                                    ${actionType === 'approve' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {actionType === 'approve' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                    {actionType === 'approve' ? 'تأكيد الموافقة على السحب' : 'رفض طلب السحب'}
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-[#06152e] border border-white/5 p-4 rounded-xl">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-400">المبلغ:</span>
                                        <span className="text-white font-bold">{selectedRequest.amount} ر.س</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">المستشار:</span>
                                        <span className="text-brand-gold">{(selectedRequest as any).consultantName}</span>
                                    </div>
                                </div>

                                {actionType === 'reject' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">سبب الرفض <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white h-24 resize-none focus:border-red-500/50 outline-none"
                                            placeholder="يرجى توضيح سبب الرفض ليتم إرساله للمستشار..."
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">ملاحظات إدارية (اختياري)</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white h-20 resize-none focus:border-white/20 outline-none"
                                        placeholder="ملاحظات داخلية فقط..."
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => { setSelectedRequest(null); setActionType(null); }}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={submitAction}
                                        disabled={isProcessing}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                            ${actionType === 'approve'
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : 'تأكيد'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminWithdrawalsPage;
