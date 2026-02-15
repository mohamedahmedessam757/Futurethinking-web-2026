
import React, { useState } from 'react';
import { Search, UserPlus, Filter, Download, Trash2, CheckCircle2, Edit2, X, AlertTriangle, Shield, ChevronLeft, ChevronRight, MoreHorizontal, Mail } from 'lucide-react';
import { useAdmin, AdminUser } from '../AdminContext';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import { motion, AnimatePresence } from 'framer-motion';

// --- Role Badge Component ---
const RoleBadge = ({ role }: { role: string }) => {
    const config = {
        admin: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'مشرف' },
        consultant: { bg: 'bg-brand-gold/10', text: 'text-brand-gold', border: 'border-brand-gold/20', label: 'مستشار' },
        instructor: { bg: 'bg-brand-gold/10', text: 'text-brand-gold', border: 'border-brand-gold/20', label: 'مدرب' }, // Fallback alias
        student: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'طالب' }
    };

    // Normalize role string (handle potential 'instructor' vs 'consultant' confusion)
    const normalizedRole = role === 'instructor' ? 'consultant' : role;
    const style = config[normalizedRole as keyof typeof config] || config.student;

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 w-fit ${style.bg} ${style.text} ${style.border}`}>
            {role === 'admin' ? <Shield size={12} /> : null}
            {style.label}
        </span>
    );
};

// --- Status Badge Component ---
const StatusBadge = ({ status }: { status: string }) => {
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit ${status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {status === 'active' ? 'نشط' : 'محظور'}
        </span>
    );
};

const AdminUsersPage = () => {
    const { addUser, updateUser, deleteUser, exportData } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'student' | 'consultant'>('all');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // User Form State
    const initialFormState: {
        id: string;
        name: string;
        email: string;
        role: AdminUser['role'];
        status: AdminUser['status'];
        password?: string; // Optional for updates
    } = { id: '', name: '', email: '', role: 'student', status: 'active' };

    const [formData, setFormData] = useState(initialFormState);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Use Scalable Hook
    const { users, loading, totalCount, totalPages, refresh } = useAdminUsers({
        page: currentPage,
        limit: itemsPerPage,
        role: filterRole,
        search: searchTerm
    });

    const handleOpenAdd = () => {
        setFormData({ ...initialFormState });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleOpenEdit = (user: AdminUser) => {
        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'instructor' ? 'consultant' : user.role, // Normalize for UI
            status: user.status
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure strict typing for the role being passed back
        const roleToSave = formData.role as any;

        if (isEditing && formData.id) {
            await updateUser(formData.id, {
                name: formData.name,
                email: formData.email,
                role: roleToSave,
                status: formData.status
            });
        } else {
            await addUser({
                name: formData.name,
                email: formData.email,
                role: roleToSave,
                status: formData.status,
                subscriptionTier: 'free',
                bio: 'تمت إضافته بواسطة المشرف',
                title: roleToSave === 'consultant' ? 'مستشار' : 'طالب'
            });
        }
        await refresh();
        setShowModal(false);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteUser(deleteId);
            await refresh();
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 relative animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0f172a] p-6 rounded-3xl border border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة المستخدمين</h1>
                    <p className="text-gray-400 text-sm">التحكم الكامل في حسابات وصلاحيات الأعضاء ({totalCount} مستخدم).</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => exportData('users')}
                        className="bg-[#0f2344] border border-white/10 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 flex-1 md:flex-none transition-colors"
                    >
                        <Download size={18} /> تصدير
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="bg-brand-gold text-brand-navy px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-white transition-all shadow-lg flex-1 md:flex-none"
                    >
                        <UserPlus size={18} /> إضافة مستخدم
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">

                {/* Toolbar */}
                <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#06152e]">
                    {/* Search */}
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="بحث بالاسم، البريد، أو المعرف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white text-sm focus:border-brand-gold/50 outline-none transition-all shadow-inner"
                        />
                    </div>

                    {/* Role Filter Tabs */}
                    <div className="flex bg-[#0f172a] p-1.5 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
                        {['all', 'admin', 'consultant', 'student'].map(role => (
                            <button
                                key={role}
                                onClick={() => { setFilterRole(role as any); setCurrentPage(1); }}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterRole === role ? 'bg-brand-navy text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {role === 'all' ? 'الجميع' : role === 'admin' ? 'المشرفين' : role === 'consultant' ? 'المستشارين' : 'الطلاب'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-right min-w-[900px]">
                        <thead className="bg-[#0f2344]/50 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">المستخدم</th>
                                <th className="px-6 py-4">الدور الوظيفي</th>
                                <th className="px-6 py-4">تاريخ الانضمام</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-[#06152e] shadow-sm" alt={user.name} />
                                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#06152e] ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{user.name}</p>
                                                    <p className="text-gray-500 text-xs flex items-center gap-1 font-mono mt-0.5"><Mail size={10} /> {user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                            {new Date(user.joinDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 bg-white/5 hover:bg-brand-navy hover:text-brand-gold text-gray-400 rounded-lg transition-colors border border-transparent hover:border-brand-gold/30"
                                                    title="تعديل البيانات"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(user.id)}
                                                    className="p-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                                    title="حذف الحساب"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                <Search size={32} className="opacity-20" />
                                            </div>
                                            <p>لا توجد نتائج مطابقة لبحثك.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#06152e]">
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
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-500/20">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">حذف المستخدم نهائياً؟</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    سيؤدي هذا الإجراء إلى إزالة جميع بيانات المستخدم بما في ذلك الكورسات المسجلة والشهادات. لا يمكن التراجع عن هذا.
                                </p>
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        حذف الحساب
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="flex-1 bg-[#06152e] hover:bg-[#0f2344] text-white border border-white/10 font-bold py-3 rounded-xl transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Improved Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#06152e]">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{isEditing ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h3>
                                    <p className="text-xs text-gray-400 mt-1">يرجى التحقق من صحة البيانات قبل الحفظ.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">الاسم الكامل</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none transition-colors" placeholder="مثال: محمد أحمد" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">البريد الإلكتروني</label>
                                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none transition-colors" placeholder="email@example.com" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-300">الدور الوظيفي</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                                    className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none appearance-none"
                                                >
                                                    <option value="student">طالب</option>
                                                    <option value="consultant">مستشار / مدرب</option>
                                                    <option value="admin">مدير النظام</option>
                                                </select>
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <ChevronLeft size={16} className="-rotate-90" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {formData.role === 'consultant' ? 'يملك صلاحيات إنشاء الكورسات وإدارة الاستشارات.' : formData.role === 'admin' ? 'صلاحيات كاملة للتحكم في النظام.' : 'حساب محدود للتعلم فقط.'}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-300">حالة الحساب</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                                    className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-gold outline-none appearance-none"
                                                >
                                                    <option value="active">نشط</option>
                                                    <option value="inactive">محظور / غير نشط</option>
                                                </select>
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <ChevronLeft size={16} className="-rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-300">كلمة المرور الافتراضية</label>
                                            <input type="text" disabled value="ChangeMe123!" className="w-full bg-[#06152e]/50 border border-white/5 rounded-xl p-3.5 text-gray-500 cursor-not-allowed" />
                                            <p className="text-xs text-gray-500">سيتمكن المستخدم من تغييرها لاحقاً.</p>
                                        </div>
                                    )}

                                    <div className="pt-6 flex gap-4">
                                        <button type="submit" className="flex-1 bg-brand-gold text-brand-navy font-bold py-3.5 rounded-xl hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18} /> {isEditing ? 'حفظ التغييرات' : 'إضافة المستخدم'}
                                        </button>
                                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3.5 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsersPage;
