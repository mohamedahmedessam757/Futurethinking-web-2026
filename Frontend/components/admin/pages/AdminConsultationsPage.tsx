
import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, AlertCircle, Clock, Eye, Filter, Trash2, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGlobal } from '../../GlobalContext';
import { useAdminConsultations } from '../../../hooks/useAdminConsultations';
import { motion, AnimatePresence } from 'framer-motion';

const AdminConsultationsPage = () => {
    // We only need actions from GlobalContext, not the heavy data
    const { updateConsultationService, deleteConsultationService, sendNotification } = useGlobal();

    // Use new scalable hook
    const {
        consultations,
        loading,
        totalCount,
        totalPages,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        refresh
    } = useAdminConsultations();

    // Modal States
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; serviceId: string | null }>({ isOpen: false, serviceId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const [draftModal, setDraftModal] = useState<{ isOpen: boolean; serviceId: string | null }>({ isOpen: false, serviceId: null });
    const [draftReason, setDraftReason] = useState('');

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceTitle: string }>({ isOpen: false, serviceId: null, serviceTitle: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    // Helper to get consultant name (now from joined data)
    const getConsultantName = (service: any) => {
        return service.consultant?.name || service.profiles?.name || 'مستشار غير معروف';
    };

    // --- Direct Actions (Backend-like) ---

    const handleRepublish = async (id: string) => {
        // Clear the reason and set to active
        await updateConsultationService(id, {
            status: 'active',
            rejectionReason: undefined
        });

        const service = consultations.find(s => s.id === id);
        if (service) {
            await sendNotification(
                service.consultantId,
                'إعادة نشر استشارتك',
                `تم إعادة نشر خدمة "${service.title}" بنجاح.`,
                'success'
            );
        }
        await refresh();
    };

    const handleApprove = async (id: string) => {
        await updateConsultationService(id, { status: 'active' });
        await refresh();
    };

    const handleRejectSubmit = async () => {
        if (rejectModal.serviceId && rejectionReason) {
            await updateConsultationService(rejectModal.serviceId, { status: 'rejected', rejectionReason });
            await refresh();
            setRejectModal({ isOpen: false, serviceId: null });
            setRejectionReason('');
        }
    };

    const handleDraftSubmit = async () => {
        if (draftModal.serviceId && draftReason) {
            const service = consultations.find(s => s.id === draftModal.serviceId);
            const timestamp = new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
            const reasonWithTimestamp = `[${timestamp}] ${draftReason}`;

            await updateConsultationService(draftModal.serviceId, {
                status: 'draft',
                rejectionReason: reasonWithTimestamp
            });

            // Notify consultant
            if (service) {
                await sendNotification(
                    service.consultantId,
                    'تحويل استشارة لمسودة',
                    `تم تحويل خدمة "${service.title}" إلى مسودة. السبب: ${draftReason}`,
                    'warning'
                );
            }

            await refresh();
            setDraftModal({ isOpen: false, serviceId: null });
            setDraftReason('');
        }
    };

    // Delete consultation with notifications
    const handleDeleteSubmit = async () => {
        if (deleteModal.serviceId) {
            setIsDeleting(true);
            try {
                const service = consultations.find(s => s.id === deleteModal.serviceId);

                // Delete from database
                await deleteConsultationService(deleteModal.serviceId);

                // Notify admin - Is this needed? Admin is deleting it.
                // kept for consistency with original code
                await sendNotification(
                    'admin',
                    'حذف استشارة',
                    `تم حذف خدمة "${deleteModal.serviceTitle}" من النظام.`,
                    'info'
                );

                // Notify consultant
                if (service) {
                    await sendNotification(
                        service.consultantId,
                        'حذف استشارتك',
                        `تم حذف خدمتك "${service.title}" من قبل إدارة المنصة.`,
                        'warning'
                    );
                }

                await refresh();
                setDeleteModal({ isOpen: false, serviceId: null, serviceTitle: '' });
            } catch (error) {
                console.error('Error deleting consultation:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#0f172a] p-6 rounded-3xl border border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة الاستشارات</h1>
                    <p className="text-gray-400 text-sm">مراجعة والتحكم في الخدمات الاستشارية ({totalCount}).</p>
                </div>
                <button
                    onClick={refresh}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                    title="تحديث البيانات"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="بحث..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-brand-gold/50 outline-none"
                    />
                </div>

                <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'pending', label: 'قيد المراجعة' },
                        { id: 'active', label: 'نشطة' },
                        { id: 'draft', label: 'مسودة' },
                        { id: 'rejected', label: 'مرفوضة' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => { setStatusFilter(filter.id as any); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-2 ${statusFilter === filter.id ? 'bg-brand-navy text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Services List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 size={40} className="animate-spin text-brand-gold" />
                    </div>
                ) : (
                    <AnimatePresence>
                        {consultations.length > 0 ? (
                            consultations.map(service => (
                                <motion.div
                                    key={service.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 group hover:border-brand-gold/30 transition-all"
                                >
                                    {/* Info Side */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white group-hover:text-brand-gold transition-colors">{service.title}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${service.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                service.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    service.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {service.status === 'active' ? 'منشور' :
                                                    service.status === 'pending' ? 'بانتظار الموافقة' :
                                                        service.status === 'rejected' ? 'مرفوض' : 'مسودة'}
                                            </span>
                                        </div>

                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description}</p>

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <div className="bg-[#06152e] px-3 py-1.5 rounded-lg border border-white/5">
                                                <span className="font-bold text-gray-300">المستشار:</span> {getConsultantName(service)}
                                            </div>
                                            <div className="bg-[#06152e] px-3 py-1.5 rounded-lg border border-white/5">
                                                <span className="font-bold text-gray-300">السعر:</span> {service.price} ر.س
                                            </div>
                                        </div>

                                        {service.rejectionReason && (
                                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-start gap-2">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-bold block mb-1">سبب الرفض / التحويل لمسودة:</span>
                                                    {service.rejectionReason}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Side - Completely Separated Logic */}
                                    <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-r border-white/5 pt-4 md:pt-0 md:pr-6 shrink-0">

                                        {/* 1. Pending Actions */}
                                        {service.status === 'pending' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(service.id)}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <CheckCircle2 size={16} /> موافقة
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRejectModal({ isOpen: true, serviceId: service.id })}
                                                    className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} /> رفض
                                                </button>
                                            </>
                                        )}

                                        {/* 2. Active Actions */}
                                        {service.status === 'active' && (
                                            <button
                                                type="button"
                                                onClick={() => setDraftModal({ isOpen: true, serviceId: service.id })}
                                                className="bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-600/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                                            >
                                                <Eye size={16} /> تحويل لمسودة
                                            </button>
                                        )}

                                        {/* 3. Draft/Rejected Actions (Republish) */}
                                        {(service.status === 'draft' || service.status === 'rejected') && (
                                            <button
                                                type="button"
                                                onClick={() => handleRepublish(service.id)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <CheckCircle2 size={16} /> إعادة نشر
                                            </button>
                                        )}

                                        {/* 4. Delete Button - Available for all statuses */}
                                        <button
                                            type="button"
                                            onClick={() => setDeleteModal({ isOpen: true, serviceId: service.id, serviceTitle: service.title })}
                                            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} /> حذف
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-[#0f172a] border border-white/5 rounded-3xl">
                                <p className="text-gray-500">لا توجد نتائج.</p>
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Pagination Footer */}
            {totalCount > 0 && (
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
            )}

            {/* Modals */}
            <AnimatePresence>
                {(rejectModal.isOpen || draftModal.isOpen) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {rejectModal.isOpen ? 'سبب الرفض' : 'تحويل لمسودة'}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {rejectModal.isOpen ? 'يرجى توضيح سبب الرفض للمستشار.' : 'سيتم إخفاء الخدمة عن العملاء.'}
                            </p>
                            <textarea
                                value={rejectModal.isOpen ? rejectionReason : draftReason}
                                onChange={(e) => rejectModal.isOpen ? setRejectionReason(e.target.value) : setDraftReason(e.target.value)}
                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none min-h-[100px] mb-6"
                                placeholder="اكتب السبب هنا..."
                            ></textarea>
                            <div className="flex gap-3">
                                <button
                                    onClick={rejectModal.isOpen ? handleRejectSubmit : handleDraftSubmit}
                                    disabled={rejectModal.isOpen ? !rejectionReason : !draftReason}
                                    className={`flex-1 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 ${rejectModal.isOpen ? 'bg-red-600 hover:bg-red-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                                >
                                    تأكيد
                                </button>
                                <button
                                    onClick={() => { setRejectModal({ isOpen: false, serviceId: null }); setDraftModal({ isOpen: false, serviceId: null }); }}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">حذف الاستشارة؟</h3>
                            <p className="text-gray-400 text-sm mb-2">"{deleteModal.serviceTitle}"</p>
                            <p className="text-red-400 text-xs mb-6">⚠️ سيتم إرسال إشعار للمستشار بالحذف</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleDeleteSubmit}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {isDeleting ? 'جاري الحذف...' : 'حذف'}
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, serviceId: null, serviceTitle: '' })}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminConsultationsPage;
