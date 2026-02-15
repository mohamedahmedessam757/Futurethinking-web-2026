
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ShieldCheck, Clock, CheckCircle2, Calendar, Video, MessageSquare, Lock, Monitor, Briefcase, DollarSign } from 'lucide-react';
import { useGlobal } from '../../GlobalContext';
import { useDashboard } from '../DashboardContext';
import PaymentModal from '../../PaymentModal';

interface ConsultantDetailsPageProps {
    consultantId: string | null;
    onBack: () => void;
}

import { useConsultants } from '../../../hooks/useConsultants';
import { useConsultationServices } from '../../../hooks/useConsultationServices';
import { useEffect } from 'react';

// ... (props interface)

const ConsultantDetailsPage = ({ consultantId, onBack }: ConsultantDetailsPageProps) => {
    const { users, consultantReviews, appointments, addAppointment, addTransaction, addConsultantReview } = useGlobal();
    const { user } = useDashboard();

    // Use specific hooks for data
    const { consultants, fetchConsultants } = useConsultants();
    const { services, fetchServices } = useConsultationServices();

    useEffect(() => {
        fetchConsultants();
        fetchServices();
    }, [fetchConsultants, fetchServices]);

    const consultant = consultants.find(c => c.userId === consultantId);

    const consultantUser = consultant ? {
        id: consultant.userId,
        name: consultant.name,
        avatar: consultant.avatar,
        title: consultant.title,
        bio: consultant.bio,
        role: consultant.role || 'consultant',
        email: consultant.email || '',
        subscriptionTier: 'free', // defaults/irrelevant here
        joinDate: '',
        status: 'active'
    } : null;

    const profile = consultant ? {
        userId: consultant.userId,
        specialization: consultant.specialization,
        hourlyRate: consultant.hourlyRate,
        isVerified: consultant.isVerified,
        introVideoUrl: consultant.introVideoUrl,
        ratingAverage: consultant.ratingAverage,
        reviewsCount: consultant.reviewsCount,
        availableSlots: consultant.availableSlots
    } : null;

    // Fetch Services for this consultant from hook data
    const activeServices = services.filter(s => s.consultantId === consultantId && s.status === 'active');

    const reviews = consultantReviews.filter(r => r.targetId === consultantId);
    const reviewsCount = reviews.length; // Use context reviews or hook reviews? Context is probably fine for reviews if they are global, 
    // but typically reviews might also need a hook. For now, trusting context for reviews as they might be less critical or handled differently.
    // Actually, useConsultants returns rating/count, which is good enough for header.
    // The list of reviews is displayed below. If GlobalContext doesn't have them, they won't show.
    // Ideally we should have useReviews hook, but let's fix the crash first.

    const ratingAverage = consultant ? consultant.ratingAverage : 'جديد';

    // Booking State
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<'zoom' | 'google_meet' | 'teams' | 'discord'>('google_meet');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Review State
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Check if student has completed an appointment with this consultant (can review)
    const canReview = useMemo(() => {
        return appointments.some(
            appt => appt.studentId === user.id &&
                appt.expertId === consultantId &&
                appt.status === 'completed'
        );
    }, [appointments, user.id, consultantId]);

    // Check if student has already reviewed this consultant
    const hasReviewed = useMemo(() => {
        return reviews.some(r => r.userId === user.id);
    }, [reviews, user.id]);

    // Handle review submission
    const handleSubmitReview = async () => {
        if (reviewRating === 0) return;

        setSubmittingReview(true);
        try {
            await addConsultantReview(consultantId!, {
                userId: user.id,
                userName: user.name,
                rating: reviewRating,
                comment: reviewComment || 'تقييم بدون تعليق'
            });
            setReviewRating(0);
            setReviewComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setSubmittingReview(false);
        }
    };

    const isFreeTier = user.subscriptionTier === 'free';
    const isEnterpriseTier = user.subscriptionTier === 'enterprise';

    // Find selected service object
    const serviceObj = activeServices.find(s => s.id === selectedService);
    // Calculate price: Enterprise gets it free, otherwise service price, fallback to hourly rate
    const bookingPrice = isEnterpriseTier ? 0 : (serviceObj ? serviceObj.price : profile?.hourlyRate || 0);

    if (!consultantUser || !profile) return <div className="text-center py-20 text-white">لم يتم العثور على المستشار</div>;

    const platforms = [
        { id: 'google_meet', name: 'Google Meet', color: 'text-green-500 border-green-500/30' },
        { id: 'zoom', name: 'Zoom', color: 'text-blue-500 border-blue-500/30' },
        { id: 'teams', name: 'MS Teams', color: 'text-purple-500 border-purple-500/30' },
        { id: 'discord', name: 'Discord', color: 'text-indigo-500 border-indigo-500/30' },
    ];

    const handleBookingConfirm = async () => {
        // Logic handled by backend webhook after payment.
        // If free (amount 0), manually book because no webhook will fire
        if (bookingPrice === 0) {
            const dateObj = new Date();
            if (selectedDate) dateObj.setDate(selectedDate);

            const title = serviceObj ? `استشارة: ${serviceObj.title}` : `استشارة: ${profile.specialization}`;

            const apptData = {
                studentId: user.id || 'current',
                studentName: user.name,
                expertId: consultantUser.id,
                expertName: consultantUser.name,
                title: title,
                date: dateObj.toISOString(),
                time: selectedTime,
                type: 'video' as const,
                preferredPlatform: selectedPlatform,
                status: 'confirmed' as const
            };

            addAppointment({ ...apptData, id: Date.now() });

            addTransaction({
                id: `INV-CNS-${Date.now()}`,
                userId: user.id || 'current',
                userName: user.name,
                item: title,
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                status: 'paid',
                method: 'System'
            });
        }

        setShowSuccess(true);
    };

    const activeDateObj = new Date();
    if (selectedDate) activeDateObj.setDate(selectedDate);

    const appointmentMetadata = {
        student_id: user.id || 'current', // Webhook will verify
        student_name: user.name,
        expert_id: consultantUser.id,
        expert_name: consultantUser.name,
        title: serviceObj ? `استشارة: ${serviceObj.title}` : `استشارة: ${profile.specialization}`,
        date: activeDateObj.toISOString(),
        time: selectedTime,
        type: 'video',
        preferred_platform: selectedPlatform,
        service_id: selectedService
    };

    const handleBookingClick = () => {
        if (isFreeTier) {
            if (confirm("خدمة حجز الاستشارات متاحة فقط للمشتركين. هل ترغب بترقية باقتك؟")) {
                window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: { view: 'payments' } }));
            }
            return;
        }
        setShowPaymentModal(true);
    }

    return (
        <div className="animate-fade-in space-y-8 relative pb-20">

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handleBookingConfirm}
                amount={bookingPrice}
                itemName={serviceObj ? `خدمة: ${serviceObj.title}` : `حجز استشارة مع ${consultantUser.name}`}
                itemType="consultation"
                itemId={serviceObj ? serviceObj.id : `consultant_${consultantId}`}
                metadata={appointmentMetadata}
            />

            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-4">
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                العودة للمستشارين
            </button>

            {/* Hero Profile */}
            <div className="bg-[#0f2344]/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative shrink-0 mx-auto md:mx-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#06152e] shadow-2xl overflow-hidden">
                            <img src={consultantUser.avatar} alt={consultantUser.name} className="w-full h-full object-cover" />
                        </div>
                        {profile.isVerified && (
                            <div className="absolute bottom-0 right-0 bg-brand-gold text-brand-navy px-3 py-1 rounded-full text-xs font-bold border-2 border-[#06152e] flex items-center gap-1">
                                <ShieldCheck size={14} /> موثق
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-right">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{consultantUser.name}</h1>
                        <p className="text-brand-gold text-lg font-medium mb-4">{consultantUser.title} | {profile.specialization}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-300 text-sm">
                                <Star className="text-yellow-400 fill-current" size={16} />
                                <span className="font-bold text-white">{ratingAverage}</span> ({reviewsCount} تقييم)
                            </div>
                            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-300 text-sm">
                                <Clock className="text-brand-gold" size={16} />
                                <span>رد سريع (ساعة واحدة)</span>
                            </div>
                        </div>

                        <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto md:mx-0">
                            {consultantUser.bio || 'خبير متخصص يساعد الأفراد والشركات على تحقيق أهدافهم من خلال استراتيجيات مدروسة وحلول عملية.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* --- NEW SECTION: Available Services --- */}
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                            <Briefcase className="text-brand-gold" /> الخدمات المتاحة
                        </h3>

                        {activeServices.length > 0 ? (
                            <div className="grid gap-4">
                                {activeServices.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => setSelectedService(service.id)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group
                                    ${selectedService === service.id
                                                ? 'bg-brand-gold/10 border-brand-gold ring-1 ring-brand-gold'
                                                : 'bg-[#06152e] border-white/5 hover:border-brand-gold/50'}`
                                        }
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedService === service.id ? 'border-brand-gold' : 'border-gray-500'}`}>
                                                    {selectedService === service.id && <div className="w-2 h-2 rounded-full bg-brand-gold"></div>}
                                                </div>
                                                <h4 className="font-bold text-white text-lg">{service.title}</h4>
                                            </div>
                                            <p className="text-gray-400 text-sm pr-7">{service.description}</p>
                                            <span className="text-xs text-brand-gold mt-2 block pr-7 font-bold flex items-center gap-1">
                                                <Clock size={12} /> {service.duration} دقيقة
                                            </span>
                                        </div>
                                        <div className="text-left shrink-0">
                                            <span className="block text-xl font-bold text-white dir-ltr">{service.price} ر.س</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-4">لم يقم المستشار بإضافة خدمات محددة بعد. يمكنك الحجز بالساعة.</p>
                        )}
                    </div>

                    {/* Reviews */}
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="text-brand-gold" /> آراء العملاء
                        </h3>

                        {/* Add Review Form - Only show if student has a completed appointment with this consultant */}
                        {canReview && !hasReviewed && (
                            <div className="mb-8 p-6 bg-[#06152e] rounded-2xl border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4">أضف تقييمك</h4>

                                {/* Star Rating */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm text-gray-400 ml-4">تقييمك:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={28}
                                                    className={star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-white font-bold mr-2">{reviewRating}/5</span>
                                </div>

                                {/* Comment */}
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="اكتب تعليقك عن تجربتك مع هذا المستشار..."
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none resize-none mb-4"
                                    rows={3}
                                />

                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview || reviewRating === 0}
                                    className="bg-brand-gold text-brand-navy font-bold py-3 px-8 rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submittingReview ? (
                                        <>جاري الإرسال...</>
                                    ) : (
                                        <><Star size={16} /> إرسال التقييم</>
                                    )}
                                </button>
                            </div>
                        )}

                        {hasReviewed && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
                                <CheckCircle2 size={18} /> لقد قمت بتقييم هذا المستشار مسبقاً
                            </div>
                        )}

                        {!canReview && !hasReviewed && (
                            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                                <Lock size={18} /> يمكنك التقييم بعد إتمام استشارة مع هذا المستشار
                            </div>
                        )}

                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map(review => (
                                    <div key={review.id} className="border-b border-white/5 pb-6 last:border-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-navy border border-white/10 flex items-center justify-center text-white font-bold">
                                                    {review.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm">{review.userName}</h4>
                                                    <div className="flex text-yellow-400 text-xs">
                                                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">{review.date}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed pr-14">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">لا توجد تقييمات بعد</div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Booking Widget */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 sticky top-24 shadow-2xl relative overflow-hidden">

                        {isFreeTier && !showSuccess && (
                            <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 border-2 border-brand-gold/10 rounded-3xl">
                                <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-4 border border-brand-gold/30">
                                    <Lock className="text-brand-gold" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">ميزة حصرية</h3>
                                <p className="text-sm text-gray-400 mb-6">حجز الاستشارات متاح فقط للمشتركين.</p>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: { view: 'payments' } }))}
                                    className="bg-brand-gold text-brand-navy font-bold py-3 px-8 rounded-xl hover:bg-white transition-all shadow-lg w-full"
                                >
                                    ترقية الباقة الآن
                                </button>
                            </div>
                        )}

                        {showSuccess ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">تم الحجز بنجاح!</h3>
                                <p className="text-gray-400 text-sm mb-6">تم إرسال إشعار للمستشار وسيصلك الرابط قريباً.</p>
                                <button onClick={() => onBack()} className="bg-brand-gold text-brand-navy px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors">تم</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
                                    <span className="text-gray-400">الإجمالي</span>
                                    <div>
                                        {isEnterpriseTier ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-bold text-green-400">مجاناً</span>
                                                <span className="text-[10px] text-gray-500 line-through">{bookingPrice} ر.س</span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-bold text-white">{bookingPrice} <span className="text-sm font-medium text-brand-gold">ر.س</span></span>
                                        )}
                                    </div>
                                </div>

                                {/* If no service selected and services exist, prompt selection */}
                                {activeServices.length > 0 && !selectedService && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                        <Clock size={14} /> يرجى اختيار نوع الخدمة من القائمة أولاً.
                                    </div>
                                )}

                                <div className={`space-y-6 transition-opacity ${activeServices.length > 0 && !selectedService ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    {/* Date Picker */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-300 mb-2 block flex items-center gap-2"><Calendar size={16} /> اختر اليوم</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[...Array(10)].map((_, i) => {
                                                const day = new Date();
                                                day.setDate(day.getDate() + i);
                                                const isSelected = selectedDate === day.getDate();
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDate(day.getDate())}
                                                        className={`py-2 rounded-xl text-center transition-all border ${isSelected ? 'bg-brand-gold text-brand-navy border-brand-gold' : 'bg-[#06152e] border-white/5 text-gray-400 hover:border-white/20'}`}
                                                    >
                                                        <span className="block text-[10px] font-bold">{day.toLocaleString('en-US', { weekday: 'short' })}</span>
                                                        <span className="block text-sm font-bold">{day.getDate()}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Time Picker & Platform */}
                                    <AnimatePresence>
                                        {selectedDate && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-6">
                                                <div>
                                                    <label className="text-sm font-bold text-gray-300 mb-2 block flex items-center gap-2"><Clock size={16} /> اختر الوقت</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['10:00 AM', '02:00 PM', '04:00 PM', '08:00 PM'].map(time => (
                                                            <button
                                                                key={time}
                                                                onClick={() => setSelectedTime(time)}
                                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${selectedTime === time ? 'bg-brand-navy text-brand-gold border-brand-gold' : 'bg-[#06152e] text-gray-400 border-white/5 hover:bg-white/5'}`}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-bold text-gray-300 mb-2 block flex items-center gap-2"><Monitor size={16} /> منصة الاجتماع</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {platforms.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => setSelectedPlatform(p.id as any)}
                                                                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${selectedPlatform === p.id ? `bg-[#06152e] ${p.color}` : 'bg-[#06152e] border-white/5 text-gray-400 opacity-60 hover:opacity-100'}`}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={handleBookingClick}
                                        disabled={!selectedDate || !selectedTime || (activeServices.length > 0 && !selectedService)}
                                        className="w-full bg-gradient-to-r from-brand-gold to-[#d4b67d] text-brand-navy font-bold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Video size={18} /> {isEnterpriseTier ? 'تأكيد الحجز المجاني' : 'الدفع وتأكيد الحجز'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultantDetailsPage;
