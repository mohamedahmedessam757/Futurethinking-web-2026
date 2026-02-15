
import React, { useState, useEffect } from 'react';
import { useConsultant } from '../ConsultantContext';
import { useGlobal } from '../../GlobalContext';
import { supabase } from '../../../lib/supabase';
import { Save, DollarSign, CheckCircle2, Camera, Upload, Briefcase, Loader2 } from 'lucide-react';

const ConsultantSettings = () => {
    const { consultant, updateProfile, sendNotification } = useConsultant();
    const { consultantProfiles, updateConsultantProfile } = useGlobal();

    // Find the specific profile data
    const profile = consultantProfiles.find(p => p.userId === consultant.id) || {
        specialization: '',
        hourlyRate: 0,
        introVideoUrl: ''
    };

    // Local state
    const [formData, setFormData] = useState({
        name: consultant.name,
        title: consultant.title || 'استشاري',
        hourlyRate: profile.hourlyRate,
        specialization: profile.specialization,
        bio: consultant.bio || '',
        avatar: consultant.avatar
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const initialized = React.useRef(false);

    // Initialize form data ONLY once when component mounts
    useEffect(() => {
        if (!initialized.current && consultant?.id) {
            setFormData({
                name: consultant.name,
                title: consultant.title || '',
                hourlyRate: profile.hourlyRate || 0,
                specialization: profile.specialization || '',
                bio: consultant.bio || '',
                avatar: consultant.avatar
            });
            initialized.current = true;
        }
    }, [consultant, profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update Basic User Data (profiles table)
            await updateProfile({
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                avatar: formData.avatar
            });

            // Update Consultant Specific Data (consultant_profiles table)
            await updateConsultantProfile(consultant.id, {
                hourlyRate: Number(formData.hourlyRate),
                specialization: formData.specialization
            });

            // Send notification
            sendNotification('تم تحديث الإعدادات ✅', 'تم حفظ إعدادات ملفك المهني بنجاح وتظهر الآن للجميع.', 'success');

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            sendNotification('خطأ ❌', 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.', 'warning');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            sendNotification('خطأ ❌', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت.', 'warning');
            return;
        }

        setUploading(true);
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${consultant.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Fallback to base64 if storage not configured
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                    sendNotification('تم رفع الصورة 📷', 'تم تحميل الصورة محلياً. اضغط حفظ لتطبيق التغييرات.', 'success');
                };
                reader.readAsDataURL(file);
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar: publicUrl }));
            sendNotification('تم رفع الصورة 📷', 'تم تحميل الصورة بنجاح. اضغط حفظ لتطبيق التغييرات.', 'success');

        } catch (error) {
            console.error('Upload error:', error);
            // Fallback to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">إعدادات الملف المهني</h2>
                <p className="text-gray-400">تحكم في كيفية ظهورك للعملاء، سعرك، وتخصصك.</p>
            </div>

            <div className="bg-[#0f2344]/60 border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl">

                {/* Avatar Section */}
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full border-4 border-[#06152e] relative shadow-xl overflow-hidden bg-[#06152e]">
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-[#06152e]">
                                    <Loader2 className="text-brand-gold animate-spin" size={32} />
                                </div>
                            ) : (
                                <>
                                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover transition-opacity group-hover:opacity-75" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <Camera className="text-white" />
                                    </div>
                                </>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-brand-gold text-brand-navy p-2 rounded-full border border-[#06152e] shadow-sm cursor-pointer hover:bg-white transition-colors">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">الاسم الكامل</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">المسمى الوظيفي</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">سعر الاستشارة (للساعة)</label>
                        <div className="relative">
                            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="number"
                                value={formData.hourlyRate}
                                onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pr-10 text-white focus:border-brand-gold outline-none transition-colors"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">ر.س</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">التخصص الدقيق</label>
                        <div className="relative">
                            <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={formData.specialization}
                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 pr-10 text-white focus:border-brand-gold outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400">نبذة تعريفية (تظهر للعملاء)</label>
                    <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-[#06152e] border border-white/10 rounded-xl p-3 text-white focus:border-brand-gold outline-none resize-none transition-colors"
                        placeholder="اكتب نبذة مختصرة عن خبراتك ومؤهلاتك..."
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 ${saved ? 'bg-green-500 text-white' : 'bg-brand-gold text-brand-navy hover:bg-white'}`}
                >
                    {saving ? (
                        <><Loader2 size={18} className="animate-spin" /> جاري الحفظ...</>
                    ) : saved ? (
                        <><CheckCircle2 size={18} /> تم تحديث الملف بنجاح</>
                    ) : (
                        <><Save size={18} /> حفظ التغييرات</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConsultantSettings;