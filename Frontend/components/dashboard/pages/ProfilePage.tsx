import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, Calendar, CheckCircle2, Award, BookOpen, Share2, Edit, Clock, Save, X, Plus } from 'lucide-react';
import { DashboardView } from '../StudentDashboard';
import { useDashboard } from '../DashboardContext';

interface ProfilePageProps {
   onNavigate: (view: DashboardView) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
   const { user, updateUser, stats, certificates } = useDashboard();

   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({
      name: '',
      title: '',
      bio: '',
      address: '',
      skills: [] as string[]
   });
   const [newSkill, setNewSkill] = useState('');

   // Sync state with user data when not editing
   useEffect(() => {
      if (!isEditing && user) {
         setFormData({
            name: user.name || '',
            title: user.title || '',
            bio: user.bio || '',
            address: user.address || '',
            skills: user.skills || []
         });
      }
   }, [user, isEditing]);

   const handleSave = async () => {
      try {
         await updateUser({
            name: formData.name,
            title: formData.title,
            bio: formData.bio,
            address: formData.address,
            skills: formData.skills
         });
         setIsEditing(false);
      } catch (error) {
         console.error("Failed to update profile", error);
         // Optional: Add toast notification here
      }
   };

   const handleAddSkill = () => {
      if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
         setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
         setNewSkill('');
      }
   };

   const handleRemoveSkill = (skillToRemove: string) => {
      setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
   };

   return (
      <div className="space-y-8">
         {/* Hero / Cover */}
         <div className="relative">
            <div className="h-64 w-full rounded-[2rem] overflow-hidden bg-brand-navy relative">
               <div className="absolute inset-0 bg-gradient-to-r from-brand-navy to-brand-navy/50 z-10"></div>
               <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                  alt="Cover"
                  className="w-full h-full object-cover opacity-60"
               />
            </div>

            {/* Profile Card Overlay */}
            <div className="relative -mt-20 px-6 sm:px-10 flex flex-col md:flex-row items-end md:items-center gap-6 z-20">
               {/* Avatar */}
               <div className="w-40 h-40 rounded-full border-4 border-[#06152e] bg-[#06152e] p-1 shadow-2xl shrink-0">
                  <img
                     src={user.avatar}
                     alt={user.name}
                     className="w-full h-full rounded-full object-cover"
                  />
               </div>

               {/* Basic Info */}
               <div className="flex-1 pb-4 w-full">
                  {isEditing ? (
                     <div className="space-y-1">
                        {/* Name & Title are READ-ONLY during edit as per requirements */}
                        <h1 className="text-4xl font-bold text-white mb-2">{user.name}</h1>
                        <p className="text-gray-300 font-medium">{user.title || 'طالب جديد'}</p>
                        <p className="text-xs text-brand-gold mt-1">* الاسم والمسمى الوظيفي لا يمكن تعديلهما</p>
                     </div>
                  ) : (
                     <>
                        <h1 className="text-4xl font-bold text-white mb-2">{user.name}</h1>
                        <p className="text-gray-300 font-medium">{user.title || 'طالب جديد'}</p>
                     </>
                  )}
               </div>

               {/* Actions */}
               <div className="flex gap-3 pb-4">
                  {isEditing ? (
                     <>
                        <button
                           onClick={() => setIsEditing(false)}
                           className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
                        >
                           <X size={18} /> إلغاء
                        </button>
                        <button
                           onClick={handleSave}
                           className="bg-brand-gold text-brand-navy px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-lg shadow-brand-gold/20"
                        >
                           <Save size={18} /> حفظ
                        </button>
                     </>
                  ) : (
                     <button
                        onClick={() => setIsEditing(true)}
                        className="bg-brand-navy border border-white/10 hover:bg-brand-gold hover:text-brand-navy text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
                     >
                        <Edit size={18} />
                        تعديل الملف
                     </button>
                  )}
               </div>
            </div>
         </div>

         <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: About & Details */}
            <div className="lg:col-span-1 space-y-6">
               {/* About Box */}
               <div className="bg-[#0f2344]/50 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">نبذة عني</h3>
                  {isEditing ? (
                     <div className="space-y-4">
                        <textarea
                           value={formData.bio}
                           onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                           className="w-full h-32 bg-[#06152e] border border-white/10 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-brand-gold resize-none"
                           placeholder="اكتب نبذة مختصرة عن نفسك..."
                        />
                        <div className="space-y-2">
                           <label className="text-xs text-gray-400">العنوان</label>
                           <div className="relative">
                              <MapPin className="absolute right-3 top-3 text-gray-500 w-4 h-4" />
                              <input
                                 type="text"
                                 value={formData.address}
                                 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                 className="w-full bg-[#06152e] border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-gray-300 focus:outline-none focus:border-brand-gold text-sm"
                                 placeholder="المدينة، الدولة"
                              />
                           </div>
                        </div>
                     </div>
                  ) : (
                     <>
                        <p className="text-gray-400 leading-relaxed text-sm mb-6 min-h-[60px]">
                           {user.bio || 'لم يتم إضافة نبذة تعريفية بعد.'}
                        </p>
                        <div className="space-y-3 text-sm">
                           <div className="flex items-center gap-3 text-gray-300">
                              <MapPin className="text-brand-gold w-5 h-5" />
                              {user.address || 'العنوان غير محدد'}
                           </div>
                           <div className="flex items-center gap-3 text-gray-300">
                              <Briefcase className="text-brand-gold w-5 h-5" />
                              {user.role === 'student' ? 'حساب طالب' : user.subscriptionTier === 'enterprise' ? 'حساب شركات' : user.subscriptionTier === 'pro' ? 'حساب محترف' : 'عضوية مجانية'}
                           </div>
                           <div className="flex items-center gap-3 text-gray-300">
                              <Calendar className="text-brand-gold w-5 h-5" />
                              تاريخ الانضمام: {user.joinDate}
                           </div>
                        </div>
                     </>
                  )}
               </div>

               {/* Skills */}
               <div className="bg-[#0f2344]/50 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">المهارات المكتسبة</h3>

                  {isEditing && (
                     <div className="flex gap-2 mb-4">
                        <input
                           type="text"
                           value={newSkill}
                           onChange={(e) => setNewSkill(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                           className="flex-1 bg-[#06152e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                           placeholder="أضف مهارة..."
                        />
                        <button
                           onClick={handleAddSkill}
                           className="bg-brand-gold text-brand-navy p-2 rounded-lg hover:bg-white transition-colors"
                        >
                           <Plus size={18} />
                        </button>
                     </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                     {(isEditing ? formData.skills : (user.skills || [])).length > 0 ? (
                        (isEditing ? formData.skills : (user.skills || [])).map((skill, idx) => (
                           <span key={`${skill}-${idx}`} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 flex items-center gap-2 group">
                              {skill}
                              {isEditing && (
                                 <button onClick={() => handleRemoveSkill(skill)} className="text-red-400 hover:text-red-300">
                                    <X size={12} />
                                 </button>
                              )}
                           </span>
                        ))
                     ) : (
                        <span className="text-gray-500 text-sm">لا توجد مهارات مضافة بعد.</span>
                     )}
                  </div>
               </div>
            </div>

            {/* Right Column: Stats & Activity */}
            <div className="lg:col-span-2 space-y-6">
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0f2344] border border-white/5 p-6 rounded-2xl text-center">
                     <h4 className="text-3xl font-bold text-white mb-1">{stats.completedCourses}</h4>
                     <span className="text-xs text-gray-400">دورات مكتملة</span>
                  </div>
                  <div className="bg-[#0f2344] border border-white/5 p-6 rounded-2xl text-center">
                     <h4 className="text-3xl font-bold text-white mb-1">{certificates.length}</h4>
                     <span className="text-xs text-gray-400">شهادة معتمدة</span>
                  </div>
                  {/* Updated Stat */}
                  <div className="bg-[#0f2344] border border-white/5 p-6 rounded-2xl text-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-brand-gold/5 group-hover:bg-brand-gold/10 transition-colors"></div>
                     <h4 className="text-3xl font-bold text-brand-gold mb-1" dir="ltr">{stats.trainingHours}</h4>
                     <span className="text-xs text-gray-400">ساعة تدريبية</span>
                  </div>
               </div>

               {/* Recent Activity */}
               <div className="bg-[#0f2344]/40 border border-white/5 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">النشاط الأخير</h3>
                  <div className="space-y-8 relative before:absolute before:top-0 before:right-2.5 before:h-full before:w-0.5 before:bg-white/5">
                     {/* dynamic activity feed */}
                     {(() => {
                        // 1. Gather activities
                        const activities = [
                           // Certificates
                           ...certificates.map(c => ({
                              type: 'certificate',
                              title: `حصلت على شهادة "${c.courseTitle}"`,
                              date: c.issueDate,
                              rawDate: new Date(c.issueDate),
                              icon: <Award size={16} />,
                              color: 'bg-brand-gold'
                           })),
                           // Course Completions
                           ...(useDashboard().courses || [])
                              .filter(c => c.completed && c.completedAt)
                              .map(c => ({
                                 type: 'completion',
                                 title: `أكملت دورة "${c.title}"`,
                                 date: new Date(c.completedAt!).toLocaleDateString('ar-SA'),
                                 rawDate: new Date(c.completedAt!),
                                 icon: <CheckCircle2 size={16} />,
                                 color: 'bg-green-500'
                              })),
                           // Enrollments (last 30 days)
                           ...(useDashboard().courses || [])
                              .filter(c => c.enrolledAt && !c.completed)
                              .map(c => ({
                                 type: 'enrollment',
                                 title: `بدأت تعلم "${c.title}"`,
                                 date: new Date(c.enrolledAt!).toLocaleDateString('ar-SA'),
                                 rawDate: new Date(c.enrolledAt!),
                                 icon: <BookOpen size={16} />,
                                 color: 'bg-blue-500'
                              }))
                        ]
                           .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
                           .slice(0, 5);

                        if (activities.length === 0) {
                           return <div className="text-gray-400 text-sm text-center">لا يوجد نشاط حديث.</div>;
                        }

                        return activities.map((item, idx) => (
                           <div key={idx} className="relative pr-10">
                              <div className={`absolute right-0 top-1 w-6 h-6 rounded-full ${item.color}/20 border border-${item.color} flex items-center justify-center text-${item.color}`}>
                                 {React.cloneElement(item.icon, { className: `text-${item.color.replace('bg-', '')}` })}
                              </div>
                              <h4 className="font-bold text-white">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                           </div>
                        ));
                     })()}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProfilePage;
