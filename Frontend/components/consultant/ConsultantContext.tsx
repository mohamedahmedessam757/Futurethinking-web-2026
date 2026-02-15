
import React, { createContext, useContext, useMemo, ReactNode, useState, useCallback, useEffect } from 'react';
import { useGlobal, User, Course, Transaction, Notification, Appointment, AIDraft, ConsultationService } from '../GlobalContext';
import { WithdrawalRequest } from '../../types/store';
import { db } from '../../lib/supabase';

interface ConsultationPerformance {
    title: string;
    count: number;
    revenue: number;
    rating: number;
}

interface AnalyticsData {
    chartData: number[];
    chartLabels: string[];
    topServices: ConsultationPerformance[];
    totalSessions: number;
    avgSessionPrice: number;
}

interface ConsultantContextType {
    consultant: User;
    myRevenue: number;
    myTransactions: Transaction[];
    upcomingAppointments: Appointment[];
    notifications: Notification[];
    aiDrafts: AIDraft[];
    myServices: ConsultationService[];
    stats: {
        consultationsThisMonth: number;
        rating: number;
        totalReviews: number;
        aiTokensGenerated: number;
    };

    // Financials
    availableBalance: number;
    pendingBalance: number;
    totalWithdrawn: number;
    withdrawalRequests: WithdrawalRequest[];
    submitWithdrawalRequest: (data: { amount: number; bankName: string; bankAccountHolder: string; bankIban: string }) => Promise<void>;
    refreshFinancials: () => Promise<void>;

    analytics: AnalyticsData;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    searchResults: any[];
    timeRange: 'week' | 'month' | 'year';
    setTimeRange: (range: 'week' | 'month' | 'year') => void;

    createCourse: (courseData: any) => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updateAppointmentLink: (id: number, link: string) => void;
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;
    handleDownloadReport: () => void;
    handleShare: (title: string, text: string) => void;

    saveAiDraft: (draft: Omit<AIDraft, 'id' | 'consultantId' | 'createdAt'>) => void;
    updateAiDraft: (id: string, content: string) => void;
    deleteAiDraft: (id: string) => void;

    createService: (data: Omit<ConsultationService, 'id' | 'consultantId' | 'status'>) => void;
    editService: (id: string, data: Partial<ConsultationService>) => void;
    removeService: (id: string) => void;

    sendNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning', link?: string) => void;
}

const ConsultantContext = createContext<ConsultantContextType | undefined>(undefined);

export const ConsultantProvider = ({ children }: { children?: ReactNode }) => {
    const {
        currentUser, transactions, notifications: globalNotifications, appointments, consultantReviews, consultationServices,
        addCourse, updateUser, updateAppointment, markNotificationRead: globalMarkRead, markAllNotificationsRead: globalMarkAllRead,
        addConsultationService, updateConsultationService, deleteConsultationService, sendNotification: globalSendNotification,
        trackAiUsage: globalTrackAi
    } = useGlobal();

    const [searchQuery, setSearchQuery] = useState('');
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('year');
    const [aiDrafts, setAiDrafts] = useState<AIDraft[]>([]);

    // Financial State
    const [availableBalance, setAvailableBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);



    // Local state for services - fetched directly from Supabase to avoid timing issues with GlobalContext
    const [localServices, setLocalServices] = useState<ConsultationService[]>([]);
    const [servicesLoaded, setServicesLoaded] = useState(false);

    const consultant = currentUser!;

    // Load drafts from Supabase
    useEffect(() => {
        const loadDrafts = async () => {
            if (consultant?.id) {
                try {
                    const { data, error } = await db.aiDrafts.getByConsultant(consultant.id);
                    if (error) {
                        console.error('Error loading drafts:', error);
                        return;
                    }
                    if (data) {
                        // Map database fields to frontend format
                        const mappedDrafts: AIDraft[] = data.map((d: any) => ({
                            id: d.id,
                            consultantId: d.consultant_id,
                            type: d.type,
                            title: d.title,
                            content: d.content,
                            tokensUsed: d.tokens_used,
                            createdAt: d.created_at
                        }));
                        setAiDrafts(mappedDrafts);
                    }
                } catch (err) {
                    console.error('Error loading drafts:', err);
                }
            }
        };
        loadDrafts();
    }, [consultant?.id]);

    // Load services directly from Supabase (fixes timing issue with GlobalContext)
    useEffect(() => {
        const loadServices = async () => {
            if (consultant?.id && !servicesLoaded) {
                try {

                    const { data, error } = await db.consultationServices.getByConsultant(consultant.id);

                    if (error) {
                        console.error('[ConsultantContext] Error loading services:', error);
                        return;
                    }

                    if (data) {

                        const mappedServices: ConsultationService[] = data.map((s: any) => ({
                            id: s.id,
                            consultantId: s.consultant_id,
                            title: s.title,
                            description: s.description,
                            price: s.price,
                            duration: s.duration,
                            status: s.status,
                            rejectionReason: s.rejection_reason,
                        }));
                        setLocalServices(mappedServices);
                        setServicesLoaded(true);
                    }
                } catch (err) {
                    console.error('[ConsultantContext] Error loading services:', err);
                }
            }
        };
        loadServices();
    }, [consultant?.id, servicesLoaded]);

    // Wrapper for sending notifications easily within Consultant views
    // Defined early so it can be used by other callbacks below
    const sendNotification = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info', link?: string) => {
        globalSendNotification(consultant.id, title, message, type, link);
    }, [globalSendNotification, consultant.id]);

    // Financials Logic
    const refreshFinancials = useCallback(async () => {
        if (!consultant?.id) return;
        try {
            // 1. Get Profile Balances
            const { data: profileData, error: profileError } = await db.consultantProfiles.get(consultant.id);
            if (!profileError && profileData) {
                setAvailableBalance(profileData.available_balance || 0);
                setPendingBalance(profileData.pending_balance || 0);
                setTotalWithdrawn(profileData.total_withdrawn || 0);
            }

            // 2. Get Withdrawal Requests
            const { data: requests, error: reqError } = await db.withdrawalRequests.getByConsultant(consultant.id);
            if (!reqError && requests) {
                // Map DB response to UI type
                const mappedRequests: WithdrawalRequest[] = requests.map((r: any) => ({
                    id: r.id,
                    consultantId: r.consultant_id,
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
                setWithdrawalRequests(mappedRequests);
            }
        } catch (err) {
            console.error('Error refreshing financials:', err);
        }
    }, [consultant?.id]);

    useEffect(() => {
        refreshFinancials();
    }, [refreshFinancials]);

    const submitWithdrawalRequest = useCallback(async (data: { amount: number; bankName: string; bankAccountHolder: string; bankIban: string }) => {
        if (!consultant?.id) return;

        // Validation
        if (data.amount > availableBalance) {
            sendNotification('خطأ في الطلب ❌', 'المبلغ المطلوب أكبر من الرصيد المتاح.', 'warning');
            return;
        }

        try {
            const { error } = await db.withdrawalRequests.create({
                consultant_id: consultant.id,
                amount: data.amount,
                bank_name: data.bankName,
                bank_account_holder: data.bankAccountHolder,
                bank_iban: data.bankIban,
                status: 'pending'
            });

            if (error) throw error;

            sendNotification('تم إرسال الطلب ✅', 'تم إرسال طلب السحب بنجاح للمراجعة.', 'success');
            refreshFinancials(); // Refresh list to show pending request and potentially lock balance logic if needed (though balance is manual)
        } catch (err: any) {
            console.error('Error submitting withdrawal:', err);
            sendNotification('خطأ ❌', 'فشل في إرسال طلب السحب.', 'warning');
        }
    }, [consultant?.id, availableBalance, refreshFinancials, sendNotification]);



    const myTransactions = useMemo(() => {
        if (!consultant) return [];
        return transactions.filter(t =>
            (t.item.includes('استشارة') || t.item.includes(consultant.name)) &&
            t.status === 'paid'
        );
    }, [transactions, consultant]);

    const notifications = useMemo(() => {
        if (!consultant) return [];
        return globalNotifications
            .filter(n => n.target === 'admin' || n.target === consultant.id)
            .sort((a, b) => b.id - a.id);
    }, [globalNotifications, consultant]);

    const upcomingAppointments = useMemo(() => {
        if (!consultant) return [];
        return appointments.filter(a => a.expertId === consultant.id);
    }, [appointments, consultant]);

    // Use locally fetched services (avoids timing issues with GlobalContext)
    // Falls back to GlobalContext consultationServices if localServices not yet loaded
    const myServices = useMemo(() => {
        if (!consultant) return [];

        // Use local services if loaded, otherwise fall back to GlobalContext (filtered)
        if (localServices.length > 0 || servicesLoaded) {

            return localServices;
        }

        // Fallback to GlobalContext filtering (for initial render before local fetch completes)
        const filtered = consultationServices.filter(s => s.consultantId === consultant.id);

        return filtered;
    }, [consultant, localServices, servicesLoaded, consultationServices]);

    const myRevenue = useMemo(() => {
        const now = new Date();
        let filtered = myTransactions;

        if (timeRange === 'month') {
            filtered = myTransactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (timeRange === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filtered = myTransactions.filter(t => new Date(t.date) >= oneWeekAgo);
        } else {
            filtered = myTransactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
        }
        return filtered.reduce((sum, t) => sum + t.amount, 0);
    }, [myTransactions, timeRange]);

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonthAppointments = appointments.filter(a => {
            const d = new Date(a.date);
            return a.expertId === consultant.id &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
        }).length;

        const myReviews = consultantReviews.filter(r => r.targetId === consultant.id);
        const ratingAvg = myReviews.length > 0
            ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length)
            : null; // Return null when no reviews exist

        // Calculate real token usage from saved drafts
        const totalTokens = aiDrafts.reduce((sum, d) => sum + (d.tokensUsed || 0), 0);

        return {
            consultationsThisMonth: currentMonthAppointments,
            rating: ratingAvg !== null ? Number(ratingAvg.toFixed(1)) : null,
            totalReviews: myReviews.length,
            aiTokensGenerated: totalTokens
        };
    }, [appointments, consultant.id, consultantReviews, aiDrafts]);

    // --- ANALYTICS ENGINE INTEGRATION ---
    const analytics = useMemo(() => {
        let labels: string[] = [];
        let data: number[] = [];

        const now = new Date();

        // Chart Data (Time Based)
        if (timeRange === 'year') {
            labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            data = new Array(12).fill(0);
            myTransactions.forEach(t => {
                const d = new Date(t.date);
                if (d.getFullYear() === now.getFullYear()) {
                    data[d.getMonth()] += t.amount;
                }
            });
        } else if (timeRange === 'month') {
            labels = ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
            data = new Array(4).fill(0);
            myTransactions.forEach(t => {
                const d = new Date(t.date);
                if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                    const day = d.getDate();
                    const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
                    data[weekIdx] += t.amount;
                }
            });
        } else {
            labels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
            data = new Array(7).fill(0);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            myTransactions.forEach(t => {
                const d = new Date(t.date);
                if (d >= oneWeekAgo) {
                    const dayIdx = d.getDay() === 6 ? 0 : d.getDay() + 1;
                    if (dayIdx < 7) data[dayIdx] += t.amount;
                }
            });
        }

        // --- INTEGRATION: Performance by Defined Services ---
        // Instead of grouping appointments by text, we map defined services to appointments/transactions
        const servicePerformance: ConsultationPerformance[] = myServices.map(service => {
            // Count appointments that match this service title
            const matchingAppointments = appointments.filter(a =>
                a.expertId === consultant.id &&
                a.title.includes(service.title)
            );

            // Calculate revenue from transactions matching service title
            const matchingTransactions = myTransactions.filter(t =>
                t.item.includes(service.title)
            );
            const revenue = matchingTransactions.reduce((sum, t) => sum + t.amount, 0);

            return {
                title: service.title,
                count: matchingAppointments.length,
                revenue: revenue,
                rating: stats.rating // Can be refined if reviews are linked to specific services later
            };
        });

        // Sort by Revenue desc
        const topServices = servicePerformance.sort((a, b) => b.revenue - a.revenue);

        const totalSessions = upcomingAppointments.length;
        const totalRev = myTransactions.reduce((sum, t) => sum + t.amount, 0);
        const avgSessionPrice = totalSessions > 0 ? Math.round(totalRev / totalSessions) : 0;

        return {
            chartData: data,
            chartLabels: labels,
            topServices, // This now reflects "Manage Services" data
            totalSessions,
            avgSessionPrice
        };
    }, [myTransactions, timeRange, appointments, consultant.id, stats.rating, myServices]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerQ = searchQuery.toLowerCase();
        const foundApps = upcomingAppointments.filter(a => a.studentName.toLowerCase().includes(lowerQ)).map(a => ({ type: 'appointment', ...a }));
        const foundTrans = myTransactions.filter(t => t.userName.toLowerCase().includes(lowerQ)).map(t => ({ type: 'transaction', ...t }));
        return [...foundApps, ...foundTrans];
    }, [searchQuery, upcomingAppointments, myTransactions]);

    const createCourse = useCallback((courseData: any) => {
        addCourse({
            id: Date.now().toString(),
            title: courseData.title,
            instructor: consultant.name,
            price: 500,
            status: 'draft',
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
            studentsEnrolled: [],
            revenue: 0,
            lessons: [],
            reviews: []
        });
    }, [addCourse, consultant.name]);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (consultant) await updateUser(consultant.id, data);
    }, [consultant, updateUser]);

    const updateAppointmentLink = useCallback((id: number, link: string) => {
        updateAppointment(id, { meetingLink: link });
    }, [updateAppointment]);

    const markNotificationRead = useCallback((id: number) => globalMarkRead(id), [globalMarkRead]);

    const markAllNotificationsRead = useCallback(() => globalMarkAllRead(consultant.id), [globalMarkAllRead, consultant.id]);

    const handleDownloadReport = useCallback(() => {
        const headers = ['رقم المعاملة', 'الخدمة/الاستشارة', 'اسم العميل', 'المبلغ (ر.س)', 'التاريخ', 'الحالة'];
        const rows = myTransactions.map(t => [
            t.id, `"${t.item}"`, `"${t.userName}"`, t.amount, t.date, t.status === 'paid' ? 'مدفوع' : 'معلق'
        ]);
        rows.push([]);
        rows.push(['', 'الإجمالي الكلي', '', myRevenue, '', '']);
        const BOM = "\uFEFF";
        const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Consultant_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Notification for successful report download
        sendNotification('تم تصدير التقرير 📊', 'تم تحميل ملف التحليلات المالية بنجاح.', 'success');
    }, [myTransactions, myRevenue, sendNotification]);

    const handleShare = useCallback((title: string, text: string) => {
        navigator.clipboard.writeText(`${title}\n${text}`);
        sendNotification('تم النسخ 📋', 'تم نسخ الرابط ومعلومات المشاركة.', 'success');
    }, [sendNotification]);

    const saveAiDraft = useCallback(async (draftData: Omit<AIDraft, 'id' | 'consultantId' | 'createdAt'>) => {



        try {
            if (!consultant.id) {
                console.error('❌ Consultant ID is missing!');
                sendNotification('خطأ ❗', 'لا يوجد معرف للمستشار.', 'warning');
                return;
            }

            const payload = {
                consultant_id: consultant.id,
                type: draftData.type,
                title: draftData.title,
                content: draftData.content,
                tokens_used: draftData.tokensUsed || 0
            };


            const { data, error } = await db.aiDrafts.create(payload);

            if (error) {
                console.error('❌ Supabase Error saving draft:', error);
                sendNotification('خطأ ❗', `فشل في حفظ المسودة: ${error.message}`, 'warning');
                return;
            }

            if (!data || data.length === 0) {
                console.error('❌ No data returned from insert (RLS might be blocking select)');
                // If we have no ID, we can't properly add to state with ID.
                // We could fetch latest? Or just warn.
                sendNotification('تنبيه ⚠️', 'تم الحفظ ولكن لم نتمكن من تأكيد البيانات (تحقق من المسودات).', 'warning');
                // Attempt to refresh all drafts
                const { data: allDrafts } = await db.aiDrafts.getByConsultant(consultant.id);
                if (allDrafts) setAiDrafts(allDrafts);
                return;
            }

            // data is an array now
            const savedDraft = data[0];


            // Add to local state
            const newDraft: AIDraft = {
                id: savedDraft.id,
                consultantId: savedDraft.consultant_id,
                type: savedDraft.type,
                title: savedDraft.title,
                content: savedDraft.content,
                tokensUsed: savedDraft.tokens_used,
                createdAt: savedDraft.created_at
            };
            setAiDrafts(prev => [newDraft, ...prev]);

            // Track tokens
            globalTrackAi(draftData.tokensUsed || 0);
            sendNotification('تم الحفظ ✅', `تم حفظ "${draftData.title}" (${draftData.tokensUsed || 0} Token).`, 'success', '/consultant/ai-drafts');
        } catch (err) {
            console.error('❌ Unexpected Error saving draft:', err);
            sendNotification('خطأ ❗', 'حدث خطأ غير متوقع أثناء الحفظ.', 'warning');
        }
    }, [consultant.id, sendNotification, globalTrackAi]);

    const deleteAiDraft = useCallback(async (id: string) => {
        try {
            const { error } = await db.aiDrafts.delete(id);
            if (error) {
                console.error('Error deleting draft:', error);
                return;
            }
            setAiDrafts(prev => prev.filter(d => d.id !== id));
            sendNotification('تم الحذف', 'تم حذف المسودة بنجاح.', 'success');
        } catch (err) {
            console.error('Error deleting draft:', err);
        }
    }, [sendNotification]);

    const updateAiDraft = useCallback(async (id: string, content: string) => {
        try {
            const { error } = await db.aiDrafts.update(id, { content });
            if (error) {
                console.error('Error updating draft:', error);
                sendNotification('خطأ ❗', 'فشل في تحديث المسودة.', 'warning');
                return;
            }

            setAiDrafts(prev => prev.map(d => d.id === id ? { ...d, content } : d));
            sendNotification('تم التحديث ✅', 'تم تحديث المسودة وحفظها بنجاح.', 'success');
        } catch (err) {
            console.error('Error updating draft:', err);
            sendNotification('خطأ ❗', 'حدث خطأ غير متوقع أثناء التحديث.', 'warning');
        }
    }, [sendNotification]);

    // --- Service Actions Implementation ---
    // Helper to refresh services from Supabase
    const refreshServices = useCallback(async () => {
        if (!consultant?.id) return;
        try {
            const { data, error } = await db.consultationServices.getByConsultant(consultant.id);
            if (error) {
                console.error('[ConsultantContext] Error refreshing services:', error);
                return;
            }
            if (data) {
                const mappedServices: ConsultationService[] = data.map((s: any) => ({
                    id: s.id,
                    consultantId: s.consultant_id,
                    title: s.title,
                    description: s.description,
                    price: s.price,
                    duration: s.duration,
                    status: s.status,
                    rejectionReason: s.rejection_reason,
                }));
                setLocalServices(mappedServices);
            }
        } catch (err) {
            console.error('[ConsultantContext] Error refreshing services:', err);
        }
    }, [consultant?.id]);

    const createService = useCallback(async (data: Omit<ConsultationService, 'id' | 'consultantId' | 'status'>) => {
        try {
            await addConsultationService({
                id: crypto.randomUUID(),
                ...data,
                consultantId: consultant.id,
            });
            // Refresh local services to show the new one
            await refreshServices();
            // Send notification to consultant about submission
            sendNotification('تم إرسال الخدمة 📝', `تم إرسال "${data.title}" للمراجعة من قبل الإدارة.`, 'success');
        } catch (error) {
            console.error('Error creating service:', error);
            sendNotification('خطأ ❌', 'فشل في إضافة الخدمة. يرجى المحاولة مرة أخرى.', 'warning');
        }
    }, [addConsultationService, consultant.id, sendNotification, refreshServices]);

    const editService = useCallback(async (id: string, data: Partial<ConsultationService>) => {
        updateConsultationService(id, data);
        // Update local state immediately
        setLocalServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
        sendNotification('تم تحديث الخدمة ✏️', 'تم حفظ التغييرات على الخدمة بنجاح.', 'success');
    }, [updateConsultationService, sendNotification]);

    // Updated Remove Service logic with Notification
    const removeService = useCallback((id: string) => {
        // 1. Find service BEFORE deletion to get title
        const serviceToDelete = localServices.find(s => s.id === id) || myServices.find(s => s.id === id);

        // 2. Perform Global Delete
        deleteConsultationService(id);

        // 3. Update local state immediately
        setLocalServices(prev => prev.filter(s => s.id !== id));

        // 4. Send success notification specifically to the consultant
        if (serviceToDelete) {
            sendNotification(
                'تم حذف الخدمة',
                `تم حذف خدمة "${serviceToDelete.title}" بنجاح من قائمتك.`,
                'success'
            );
        }
    }, [deleteConsultationService, localServices, myServices, sendNotification]);

    return (
        <ConsultantContext.Provider value={{
            consultant, myRevenue, myTransactions,
            stats, upcomingAppointments, notifications, analytics, aiDrafts, myServices,
            availableBalance, pendingBalance, totalWithdrawn, withdrawalRequests,
            submitWithdrawalRequest, refreshFinancials,

            searchQuery, setSearchQuery, searchResults,
            timeRange, setTimeRange,
            createCourse, updateProfile, updateAppointmentLink,
            markNotificationRead, markAllNotificationsRead,
            handleDownloadReport, handleShare,
            saveAiDraft, updateAiDraft, deleteAiDraft,
            createService, editService, removeService,
            sendNotification
        }}>
            {children}
        </ConsultantContext.Provider>
    );
};

export const useConsultant = () => {
    const context = useContext(ConsultantContext);
    if (!context) throw new Error("useConsultant must be used within ConsultantProvider");
    return context;
};
