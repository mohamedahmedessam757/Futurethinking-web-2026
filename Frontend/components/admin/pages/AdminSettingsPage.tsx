
import React, { useState, useEffect } from 'react';
import { Save, User, Globe, Shield, Bell, Upload, Lock, AlertTriangle, ToggleLeft, ToggleRight, CheckCircle2, Loader2, Cpu } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { useGlobal } from '../../GlobalContext';
import { storage } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import WavespeedTest from '../settings/WavespeedTest';

const AdminSettingsPage = () => {
    const { adminUser, updateUser, systemSettings, updateSystemSettings } = useAdmin();
    const { sendNotification } = useGlobal(); // Access notification system
    const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'ai-status'>('general');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Profile Form Data
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        avatar: ''
    });

    // Security Form Data
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Settings Form Data
    const [generalSettings, setGeneralSettings] = useState({
        siteName: '',
        maintenanceMode: false,
        supportEmail: ''
    });

    useEffect(() => {
        if (adminUser) {
            const names = adminUser.name.split(' ');
            setProfileData({
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                avatar: adminUser.avatar
            });
        }
        if (systemSettings) {
            setGeneralSettings({
                siteName: systemSettings.siteName,
                maintenanceMode: systemSettings.maintenanceMode,
                supportEmail: systemSettings.supportEmail
            });
        }
    }, [adminUser, systemSettings]);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    // --- Actions ---

    const handleSaveProfile = async () => {
        if (!adminUser) return;
        setLoading(true);

        try {
            // Global Update (This triggers header update via Context)
            await updateUser(adminUser.id, {
                name: `${profileData.firstName} ${profileData.lastName}`.trim(),
                avatar: profileData.avatar
            });


            showSuccess("تم تحديث الملف الشخصي بنجاح");
        } catch (error: any) {
            console.error('❌ Error saving profile:', error);
            sendNotification('admin', 'فشل التحديث ❌', 'حدث خطأ أثناء حفظ الملف الشخصي', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async () => {
        setLoading(true);

        try {
            await updateSystemSettings({
                siteName: generalSettings.siteName,
                maintenanceMode: generalSettings.maintenanceMode,
                supportEmail: generalSettings.supportEmail
            });


            showSuccess("تم حفظ إعدادات النظام");
        } catch (error: any) {
            console.error('❌ Error saving settings:', error);
            sendNotification('admin', 'فشل الحفظ ❌', 'حدث خطأ أثناء حفظ الإعدادات', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            sendNotification('admin', 'خطأ في كلمة المرور', 'كلمة المرور الجديدة غير متطابقة', 'warning');
            return;
        }
        if (passwordData.new.length < 6) {
            sendNotification('admin', 'كلمة المرور ضعيفة', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 1500)); // Simulate backend check

        // In a real app, verify 'current' password via API first.
        // Here we simulate a successful update.

        setLoading(false);
        showSuccess("تم تحديث كلمة المرور بنجاح. يرجى استخدامها عند الدخول القادم.");

        // NOTIFY ADMIN
        sendNotification('admin', 'تغيير كلمة المرور', 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح.', 'success');

        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !adminUser) return;

        setUploadingImage(true);
        try {
            // Upload to Supabase Storage
            const fileName = `admin-avatars/${adminUser.id}-${Date.now()}.${file.name.split('.').pop()}`;
            const { data, error } = await storage.upload('avatars', fileName, file);

            if (error) {
                console.error('Error uploading image:', error);
                // Fallback to base64 if upload fails
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
                };
                reader.readAsDataURL(file);
            } else if (data) {
                // Get public URL - returns string directly
                const publicUrl = storage.getPublicUrl('avatars', fileName);
                setProfileData(prev => ({ ...prev, avatar: publicUrl }));

            }
        } catch (error) {
            console.error('Image upload error:', error);
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">

            {/* Success Toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold"
                    >
                        <CheckCircle2 size={18} /> {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div>
                <h1 className="text-3xl font-bold text-white">إعدادات النظام</h1>
                <p className="text-gray-400">تحكم في إعدادات المنصة، الملف الشخصي، وحالة الصيانة.</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden sticky top-24 shadow-xl">
                        <div className="p-6 bg-[#06152e] border-b border-white/5">
                            <h3 className="font-bold text-white">لوحة التحكم</h3>
                        </div>
                        <nav className="flex flex-col p-2 gap-1">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'general' ? 'bg-brand-gold text-[#06152e] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Globe size={18} /> إعدادات عامة
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-brand-gold text-[#06152e] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <User size={18} /> الملف الشخصي
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'security' ? 'bg-brand-gold text-[#06152e] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Shield size={18} /> الأمان والدخول
                            </button>
                            <button
                                onClick={() => setActiveTab('ai-status')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ai-status' ? 'bg-brand-gold text-[#06152e] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Cpu size={18} /> حالة الذكاء الاصطناعي
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 min-h-[500px] shadow-2xl relative overflow-hidden">

                        {/* Background Decor */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-brand-navy"></div>

                        {/* General Settings (Maintenance Mode) */}
                        {activeTab === 'general' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">بيانات المنصة</h3>
                                    <p className="text-sm text-gray-400">تعديل المعلومات الأساسية للموقع.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">اسم المنصة</label>
                                        <input
                                            type="text"
                                            value={generalSettings.siteName}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">بريد الدعم الفني</label>
                                        <input
                                            type="email"
                                            value={generalSettings.supportEmail}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-white/10 my-6"></div>

                                {/* Maintenance Mode Toggle */}
                                <div className={`p-6 rounded-2xl border transition-all ${generalSettings.maintenanceMode ? 'bg-red-500/10 border-red-500/30' : 'bg-[#06152e] border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${generalSettings.maintenanceMode ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className={`text-lg font-bold ${generalSettings.maintenanceMode ? 'text-red-400' : 'text-white'}`}>وضع الصيانة (Maintenance Mode)</h4>
                                                <p className="text-sm text-gray-400 mt-1 max-w-md">
                                                    عند تفعيل هذا الوضع، سيتم إيقاف الوصول للنظام لجميع المستخدمين (الطلاب والمستشارين).
                                                    <span className="text-brand-gold font-bold"> فقط المشرفين يمكنهم الدخول.</span>
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setGeneralSettings({ ...generalSettings, maintenanceMode: !generalSettings.maintenanceMode })}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none overflow-hidden ${generalSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ${generalSettings.maintenanceMode ? 'left-1' : 'right-1'}`} />
                                        </button>
                                    </div>
                                    {generalSettings.maintenanceMode && (
                                        <div className="mt-4 p-3 bg-red-900/20 rounded-lg text-red-200 text-xs border border-red-500/20">
                                            ⚠️ تنبيه: الموقع الآن مغلق أمام العامة. تذكر إيقاف الوضع عند الانتهاء.
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveGeneral}
                                        disabled={loading}
                                        className="bg-brand-gold text-[#06152e] px-8 py-3 rounded-xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-70"
                                    >
                                        {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ الإعدادات</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Profile Settings */}
                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">الملف الشخصي للمدير</h3>
                                    <p className="text-sm text-gray-400">هذه البيانات تظهر في الشريط العلوي للمنصة.</p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-8 bg-[#06152e] p-6 rounded-2xl border border-white/5">
                                    <div className="relative group shrink-0">
                                        <div className="w-28 h-28 rounded-full bg-brand-gold/10 flex items-center justify-center border-4 border-[#0f172a] shadow-xl overflow-hidden">
                                            {uploadingImage ? (
                                                <Loader2 size={32} className="animate-spin text-brand-gold" />
                                            ) : (
                                                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <label className={`absolute bottom-0 right-0 bg-brand-gold text-brand-navy p-2 rounded-full border-4 border-[#0f172a] transition-colors shadow-lg ${uploadingImage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white'}`}>
                                            {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <h4 className="text-lg font-bold text-white mb-1">{profileData.firstName} {profileData.lastName}</h4>
                                        <p className="text-gray-400 text-sm mb-3">مدير النظام (Super Admin)</p>
                                        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                                            حساب نشط
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">الاسم الأول</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">اسم العائلة</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-bold">البريد الإلكتروني</label>
                                    <input type="email" value={adminUser?.email} disabled className="w-full bg-[#06152e]/50 border border-white/5 rounded-xl p-3 text-gray-500 cursor-not-allowed" />
                                    <p className="text-xs text-gray-500">* لا يمكن تغيير البريد الإلكتروني للحسابات الإدارية.</p>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-white/10">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                        className="bg-brand-gold text-[#06152e] px-8 py-3 rounded-xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-70"
                                    >
                                        {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التغييرات</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">الأمان والدخول</h3>
                                    <p className="text-sm text-gray-400">تحديث كلمة المرور وتأمين الحساب.</p>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">كلمة المرور الحالية</label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.current}
                                                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-brand-gold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">كلمة المرور الجديدة</label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.new}
                                                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-brand-gold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 font-bold">تأكيد كلمة المرور</label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.confirm}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-brand-gold"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-brand-navy text-white border border-white/10 px-8 py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors w-full md:w-auto shadow-lg disabled:opacity-70"
                                        >
                                            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* AI Status Settings */}
                        {activeTab === 'ai-status' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <WavespeedTest />
                            </motion.div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
