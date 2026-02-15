
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Briefcase, Clock, DollarSign, CheckCircle2, AlertCircle, Loader2, EyeOff, Check } from 'lucide-react';
import { useConsultant } from '../ConsultantContext';
import { ConsultationService } from '../../../types/store';

const ConsultantServicesPage = () => {
    const { myServices, createService, editService, removeService } = useConsultant();
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteToast, setDeleteToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

    const initialForm = { id: '', title: '', description: '', price: 0, duration: 60 };
    const [formData, setFormData] = useState(initialForm);

    const handleOpenAdd = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleOpenEdit = (service: ConsultationService) => {
        setFormData({
            id: service.id,
            title: service.title,
            description: service.description,
            price: service.price,
            duration: service.duration
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            title: formData.title,
            description: formData.description,
            price: Number(formData.price),
            duration: Number(formData.duration)
        };

        if (isEditing && formData.id) {
            editService(formData.id, payload);
        } else {
            await createService(payload);
        }
        setShowModal(false);
    };

    const handleDelete = (id: string, title: string) => {
        if (confirm(`هل أنت متأكد من رغبتك في حذف خدمة "${title}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
            removeService(id);
            // Show visual feedback toast immediately
            setDeleteToast({ show: true, msg: `تم حذف خدمة "${title}" بنجاح` });
            setTimeout(() => setDeleteToast({ show: false, msg: '' }), 3000);
        }
    }

    return (
        <div className="space-y-8 animate-fade-in relative pb-10">

            {/* Delete Feedback Toast */}
            <AnimatePresence>
                {deleteToast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold"
                    >
                        <Check size={18} /> {deleteToast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        إدارة خدماتي <Briefcase className="text-brand-gold" size={24} />
                    </h1>
                    <p className="text-gray-400">قم بتعريف أنواع الاستشارات التي تقدمها للعملاء. ستتم مراجعة الخدمات الجديدة من قبل الإدارة قبل النشر.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-brand-gold text-brand-navy px-6 py-3 rounded-xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus size={20} /> إضافة خدمة جديدة
                </button>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {myServices.length > 0 ? (
                        myServices.map((service, idx) => (
                            <motion.div
                                key={service.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`relative bg-[#0f2344]/40 border rounded-[2rem] p-6 transition-all group hover:bg-[#0f2344]/60 
                        ${service.status === 'active' ? 'border-brand-gold/30' :
                                        service.status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                                            'border-white/5 opacity-90'}`}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${service.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        service.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                            service.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {service.status === 'active' && <><CheckCircle2 size={10} /> منشورة</>}
                                        {service.status === 'pending' && <><Loader2 size={10} className="animate-spin" /> قيد المراجعة</>}
                                        {service.status === 'rejected' && <><X size={10} /> مرفوضة</>}
                                        {service.status === 'draft' && <><EyeOff size={10} /> مسودة (مخفية)</>}
                                    </span>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${service.status === 'active' ? 'bg-brand-gold text-brand-navy' : 'bg-white/10 text-gray-400'}`}>
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-8 md:mt-0"> {/* Pushed down by absolute badge */}
                                        <button onClick={() => handleOpenEdit(service)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="تعديل">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id, service.title)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="حذف">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4 h-10 line-clamp-2">{service.description}</p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <span className="flex items-center gap-1"><Clock size={14} className="text-brand-gold" /> {service.duration} دقيقة</span>
                                        <span className="flex items-center gap-1 font-bold"><DollarSign size={14} className="text-brand-gold" /> {service.price} ر.س</span>
                                    </div>
                                </div>

                                {/* Rejection Message */}
                                {service.status === 'rejected' && service.rejectionReason && (
                                    <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-300 text-xs flex items-start gap-2">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span><span className="font-bold">سبب الرفض:</span> {service.rejectionReason}</span>
                                    </div>
                                )}
                                {service.status === 'draft' && service.rejectionReason && (
                                    <div className="mt-4 bg-gray-500/10 border border-gray-500/20 p-3 rounded-xl text-gray-300 text-xs flex items-start gap-2">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span><span className="font-bold">ملاحظة الإدارة:</span> {service.rejectionReason}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-[#0f2344]/20 rounded-[2rem] border border-white/5 border-dashed">
                            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">لا توجد خدمات مضافة</h3>
                            <p className="text-gray-400 mb-6">قم بإضافة أنواع الاستشارات التي تقدمها ليتمكن الطلاب من حجزها.</p>
                            <button onClick={handleOpenAdd} className="text-brand-gold font-bold hover:underline">إضافة خدمة الآن</button>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-6 bg-[#06152e] border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">{isEditing ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
                                <button onClick={() => setShowModal(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">عنوان الخدمة</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="مثال: استشارة مالية للشركات الناشئة"
                                        className="w-full bg-[#0f2344] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">وصف الخدمة</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="اشرح ماذا ستقدم للعميل في هذه الجلسة..."
                                        className="w-full bg-[#0f2344] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">السعر (ر.س)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-[#0f2344] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">المدة (دقيقة)</label>
                                        <select
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                            className="w-full bg-[#0f2344] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none"
                                        >
                                            <option value={30}>30 دقيقة</option>
                                            <option value={45}>45 دقيقة</option>
                                            <option value={60}>60 دقيقة (ساعة)</option>
                                            <option value={90}>90 دقيقة</option>
                                            <option value={120}>120 دقيقة (ساعتين)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-brand-gold text-brand-navy font-bold py-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg">
                                        <CheckCircle2 size={18} /> {isEditing ? 'حفظ التعديلات' : 'إرسال للمراجعة'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold">
                                        إلغاء
                                    </button>
                                </div>
                                {!isEditing && <p className="text-xs text-center text-gray-500">ستتم مراجعة الخدمة من قبل الإدارة قبل ظهورها للعملاء.</p>}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConsultantServicesPage;
