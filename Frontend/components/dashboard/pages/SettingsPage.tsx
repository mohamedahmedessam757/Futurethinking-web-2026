
import React, { useState } from 'react';
import { User, Lock, Save, Upload, Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { storage, auth } from '../../../lib/supabase';

const SettingsPage = () => {
    const { user, updateUser, sendNotification } = useDashboard();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [isUploading, setIsUploading] = useState(false);

    // Profile State
    const [isSaved, setIsSaved] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        bio: user.bio,
        email: user.email
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // --- Profile Handlers ---
    const handleSaveProfile = () => {
        updateUser({
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            bio: formData.bio
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user.id) return;

        setIsUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { data, error } = await storage.upload('avatars', filePath, file);

            if (error) {
                console.error('Upload error:', error);
                sendNotification('فشل الرفع ❌', 'حدث خطأ أثناء رفع الصورة', 'error');
                return;
            }

            // Get public URL
            const publicUrl = storage.getPublicUrl('avatars', filePath);

            // Update user profile with new avatar URL
            updateUser({ avatar: publicUrl });
        } catch (err) {
            console.error('Upload error:', err);
            sendNotification('فشل الرفع ❌', 'حدث خطأ أثناء رفع الصورة', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // --- Password Handlers ---
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus({ type: null, message: '' });

        // 1. Basic Validation
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            setPasswordStatus({ type: 'error', message: 'يرجى ملء جميع الحقول المطلوبة.' });
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            setPasswordStatus({ type: 'error', message: 'كلمة المرور الجديدة غير متطابقة مع التأكيد.' });
            return;
        }

        if (passwordData.new.length < 8) {
            setPasswordStatus({ type: 'error', message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
            return;
        }

        // 2. Real API Call via Supabase Auth
        setIsPasswordLoading(true);

        try {
            const { error } = await auth.updateUser({ password: passwordData.new });

            if (error) throw error;

            setPasswordStatus({ type: 'success', message: 'تم تحديث كلمة المرور بنجاح.' });

            // Notify User
            await sendNotification(
                user.id,
                'تم تغيير كلمة المرور 🔐',
                'تم تحديث كلمة المرور الخاصة بك بنجاح.',
                'success',
                '/dashboard/settings'
            );

            // Clear fields
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error('Password update error:', error);
            setPasswordStatus({ type: 'error', message: error.message || 'فشل تحديث كلمة المرور.' });
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
                <div className="bg-[#0f2344]/30 border border-white/5 rounded-2xl overflow-hidden sticky top-24">
                    <div className="p-4 bg-[#0f2344]">
                        <h2 className="text-xl font-bold text-white">الإعدادات</h2>
                    </div>
                    <nav className="p-2 space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-brand-gold text-[#06152e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <User size={18} /> الملف الشخصي
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-brand-gold text-[#06152e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Lock size={18} /> الأمان وكلمة المرور
                        </button>
                        {/* Removed Privacy Tab Button */}
                    </nav>
                </div>
            </div>

            {/* Main Settings Content */}
            <div className="lg:col-span-3 space-y-8">

                {/* 1. Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-[#0f2344]/30 border border-white/5 rounded-3xl p-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white">الملف الشخصي</h3>
                        </div>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-[#06152e] border-2 border-brand-gold overflow-hidden">
                                    <img
                                        src={user.avatar}
                                        className="w-full h-full object-cover"
                                        alt="Avatar"
                                    />
                                </div>
                                <label className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity cursor-pointer text-white ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-1">{user.name}</h4>
                                <p className="text-gray-400 text-sm mb-3">طالب</p>
                                <label className={`bg-[#06152e] text-white text-sm px-4 py-2 rounded-lg border border-white/10 hover:border-brand-gold transition-colors cursor-pointer flex items-center gap-2 w-fit ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {isUploading ? 'جاري الرفع...' : 'رفع صورة'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            </div>
                        </div>

                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">الاسم الأول</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">الاسم الأخير</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">البريد الإلكتروني</label>
                                <input type="email" defaultValue={user.email} disabled className="w-full bg-[#06152e]/50 border border-white/5 rounded-xl p-3 text-gray-500 cursor-not-allowed" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">نبذة تعريفية</label>
                                <textarea
                                    rows={4}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold resize-none transition-colors"
                                ></textarea>
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    className="bg-brand-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Save size={18} /> حفظ التغييرات
                                </button>
                                {isSaved && <span className="text-green-400 text-sm font-bold animate-pulse">تم الحفظ بنجاح!</span>}
                            </div>
                        </form>
                    </div>
                )}

                {/* 2. Security Tab */}
                {activeTab === 'security' && (
                    <div className="bg-[#0f2344]/30 border border-white/5 rounded-3xl p-8 animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">الأمان وكلمة المرور</h3>

                        <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">كلمة المرور الحالية</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={passwordData.current}
                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={passwordData.new}
                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={passwordData.confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Removed 2FA Section as requested */}

                            {/* Feedback Message */}
                            {passwordStatus.message && (
                                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${passwordStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {passwordStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {passwordStatus.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isPasswordLoading}
                                className="bg-brand-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isPasswordLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Removed Privacy Tab Content Block completely */}

            </div>
        </div>
    );
};

export default SettingsPage;
