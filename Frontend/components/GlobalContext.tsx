// GlobalContext.tsx - Supabase Backend Integration with Realtime
// Maintains the same interface as the original for backwards compatibility

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { supabase, auth, db, realtime } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
    User, ConsultantProfile, Course, Book, Appointment, Transaction, Notification, Certificate, Review, Lesson, AIDraft, ConsultationService, QuizQuestion, SystemSettings
} from '../types/store';

export type { User, ConsultantProfile, Course, Book, Appointment, Transaction, Notification, Certificate, Review, Lesson, AIDraft, ConsultationService, QuizQuestion, SystemSettings };

interface GlobalContextType {
    isLoading: boolean;
    users: User[];
    consultantProfiles: ConsultantProfile[];
    courses: Course[];
    books: Book[];
    transactions: Transaction[];
    notifications: Notification[];
    appointments: Appointment[];
    certificates: Certificate[];
    currentUser: User | null;
    consultantReviews: Review[];
    consultationServices: ConsultationService[];
    totalPlatformTokens: number;
    systemSettings: SystemSettings;

    // Global fetch for settings (public)
    fetchSystemSettings: () => Promise<void>;

    // Actions
    login: (email: string, password: string, intendedRole: string) => Promise<void>;
    logout: () => void;
    registerUser: (user: Omit<User, 'id' | 'joinDate' | 'avatar' | 'status'>) => void;

    addUser: (user: User) => void;
    deleteUser: (id: string) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    upgradeSubscription: (userId: string, tier: 'free' | 'pro' | 'enterprise') => void;

    updateConsultantProfile: (userId: string, data: Partial<ConsultantProfile>) => void;
    addConsultantReview: (consultantId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => void;

    addConsultationService: (service: Omit<ConsultationService, 'status'>) => void;
    updateConsultationService: (id: string, data: Partial<ConsultationService>) => void;
    deleteConsultationService: (id: string) => void;

    addCourse: (course: Course) => Promise<string | null>;
    updateCourse: (id: string, data: Partial<Course>) => void;
    deleteCourse: (id: string) => void;
    enrollStudent: (courseId: string, userId: string) => void;
    updateCourseProgress: (courseId: string, userId: string, progress: number) => void;

    addReview: (courseId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => void;
    replyToReview: (courseId: string, reviewId: string, reply: string) => void;

    addBook: (book: Book) => void;
    updateBook: (id: string, data: Partial<Book>) => void;
    deleteBook: (id: string) => void;
    buyBook: (bookId: string, userId: string) => void;
    addBookReview: (bookId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => void;
    replyToBookReview: (bookId: string, reviewId: string, reply: string) => void;

    addAppointment: (appt: Appointment) => void;
    updateAppointment: (id: number, data: Partial<Appointment>) => void;

    addTransaction: (tx: Transaction) => void;
    updateTransaction: (id: string, status: Transaction['status']) => void;
    initiatePayment: (amount: number, description: string, itemType: string, itemId: string) => Promise<any>;

    trackAiUsage: (tokens: number) => void;
    updateSystemSettings: (settings: Partial<SystemSettings>) => void;

    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: (target: string) => void;
    sendNotification: (target: string, title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', link?: string) => void;
    refreshData: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SystemSettings = {
    siteName: 'منصة فكر المستقبل',
    maintenanceMode: false,
    supportEmail: 'support@futurethinking.sa',
    allowRegistration: true
};

// Helper: Convert Supabase profile to User type
const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    subscriptionTier: profile.subscription_tier || 'free',
    avatar: profile.avatar,
    bio: profile.bio,
    title: profile.title,
    address: profile.address,
    skills: profile.skills,
    joinDate: profile.join_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: profile.status || 'active',
});

// Helper: Convert Supabase notification to Notification type
const mapNotification = (n: any): Notification => ({
    id: parseInt(n.id.replace(/-/g, '').slice(0, 8), 16) || Date.now(),
    target: n.target_user_id || n.target_role || 'admin',
    title: n.title,
    message: n.message,
    type: n.type || 'info',
    time: new Date(n.created_at).toLocaleString('ar-SA'),
    read: n.is_read,
    link: n.link,
});

// Helper: Convert Supabase appointment to Appointment type
const mapAppointment = (a: any): Appointment => ({
    id: parseInt(a.id.replace(/-/g, '').slice(0, 8), 16) || Date.now(),
    title: a.title,
    date: a.date,
    time: a.time,
    type: a.type,
    status: a.status,
    expertName: a.consultant_name,
    studentName: a.student_name,
    studentId: a.student_id,
    expertId: a.consultant_id,
    preferredPlatform: a.preferred_platform,
    meetingLink: a.meeting_link,
});

export const GlobalProvider = ({ children }: { children?: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);

    // State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [consultantProfiles, setConsultantProfiles] = useState<ConsultantProfile[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [consultantReviews, setConsultantReviews] = useState<Review[]>([]);
    const [consultationServices, setConsultationServices] = useState<ConsultationService[]>([]);

    const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [totalPlatformTokens, setTotalPlatformTokens] = useState(0);

    // Realtime channels ref
    const channelsRef = useRef<RealtimeChannel[]>([]);

    // Flag to prevent auth listener from setting user during login validation
    const isLoggingInRef = useRef(false);
    // Flag to prevent auth listener from restoring session during logout
    const isLoggingOutRef = useRef(false);
    // Flag to track if user has been loaded from auth (prevents fetchAllData from resetting loading)
    const userLoadedFromAuthRef = useRef(false);

    // --- Fetch System Settings (Public) ---
    const fetchSystemSettings = useCallback(async () => {
        try {
            const { data: settingsData, error } = await db.settings.get();
            if (error) console.error('Error fetching settings:', error);

            if (settingsData) {
                setSystemSettings({
                    siteName: settingsData.site_name,
                    maintenanceMode: settingsData.maintenance_mode,
                    supportEmail: settingsData.support_email,
                    allowRegistration: settingsData.allow_registration,
                });
                setTotalPlatformTokens(settingsData.total_platform_tokens || 0);
            }
        } catch (err) {
            console.error('Error fetching system settings:', err);
        }
    }, []);

    // --- Fetch All Data from Supabase (Restricted) ---
    // --- Fetch All Data from Supabase (Restricted) ---
    const fetchAllData = useCallback(async () => {
        // Only set loading if user hasn't been loaded from auth yet
        if (!userLoadedFromAuthRef.current) {
            setIsLoading(true);
        }
        try {
            // Timeout removed to prevent console noise. Network timeout will be handled by browser/Supabase client.

            // Batch fetch all data upfront (reduces N+1 queries)
            const allDataPromise = Promise.all([
                db.profiles.getAll(),
                db.consultantProfiles.getAll(),
                db.courses.getAll(),
                db.books.getAll(),
                db.transactions.getAll(),
                db.appointments.getAll(),
                supabase.from('certificates').select('*'),
                db.reviews.getAll(),
                db.consultationServices.getAll(),
                db.settings.get(),
                supabase.from('lessons').select('*'),     // Fetch ALL lessons at once
                supabase.from('course_enrollments').select('*'), // Fetch ALL enrollments at once
            ]);

            const [
                { data: profilesData, error: profilesError },
                { data: consultantData, error: consultantError },
                { data: coursesData, error: coursesError },
                { data: booksData, error: booksError },
                { data: transactionsData, error: transactionsError },
                { data: appointmentsData, error: appointmentsError },
                { data: certificatesData, error: certificatesError },
                { data: reviewsData, error: reviewsError },
                { data: servicesData, error: servicesError },
                // Settings are fetched separately now, but we keep it here for admin consistency or remove it.
                // Removing it from here to avoid redundancy, as fetchSystemSettings handles it.
                { data: allLessonsData, error: lessonsError },
                { data: allEnrollmentsData, error: enrollmentsError },
            ] = await Promise.all([
                db.profiles.getAll(),
                db.consultantProfiles.getAll(),
                db.courses.getAll(),
                db.books.getAll(),
                db.transactions.getAll(),
                db.appointments.getAll(),
                supabase.from('certificates').select('*'),
                db.reviews.getAll(),
                db.consultationServices.getAll(),
                // db.settings.get(), // Handled by fetchSystemSettings
                supabase.from('lessons').select('*'),
                supabase.from('course_enrollments').select('*'),
            ]) as any[];

            // Log any errors
            if (profilesError) console.error('profiles error:', profilesError);
            if (consultantError) console.error('consultant error:', consultantError);
            if (coursesError) console.error('courses error:', coursesError);
            if (booksError) console.error('books error:', booksError);
            if (transactionsError) console.error('transactions error:', transactionsError);
            if (appointmentsError) console.error('appointments error:', appointmentsError);
            if (certificatesError) console.error('certificates error:', certificatesError);
            if (reviewsError) console.error('reviews error:', reviewsError);
            if (servicesError) console.error('services error:', servicesError);
            // if (settingsError) console.error('settings error:', settingsError);
            if (lessonsError) console.error('lessons error:', lessonsError);
            if (enrollmentsError) console.error('enrollments error:', enrollmentsError);

            // Map profiles to User type
            const mappedUsers = (profilesData || []).map(mapProfileToUser);
            setUsers(mappedUsers);

            // Update current user if session exists (to reflect subscription changes etc)
            const { session } = await auth.getSession();
            if (session?.user) {
                const found = mappedUsers.find(u => u.id === session.user.id);
                if (found) setCurrentUser(found);
            }

            // Map consultant profiles
            setConsultantProfiles((consultantData || []).map((cp: any) => ({
                userId: cp.user_id,
                specialization: cp.specialization,
                hourlyRate: cp.hourly_rate || 0,
                introVideoUrl: cp.intro_video_url,
                ratingAverage: cp.rating_average || 0,
                reviewsCount: cp.reviews_count || 0,
                isVerified: cp.is_verified || false,
                availableSlots: cp.available_slots || [],
            })));

            // Map courses with lessons and reviews (using pre-fetched data - no N+1)
            const coursesWithData = (coursesData || []).map((c: any) => {
                // Filter lessons for this course from pre-fetched data
                const courseLessons = (allLessonsData || []).filter((l: any) => l.course_id === c.id);
                // Filter reviews for this course from pre-fetched data
                const courseReviews = (reviewsData || []).filter((r: any) => r.target_type === 'course' && r.target_id === c.id);
                // Filter enrollments for this course from pre-fetched data
                const courseEnrollments = (allEnrollmentsData || []).filter((e: any) => e.course_id === c.id);

                return {
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    instructor: c.instructor_name,
                    instructorId: c.instructor_id,
                    price: c.price,
                    status: c.status,
                    image: c.image,
                    promoVideoUrl: c.promo_video_url,
                    level: c.level,
                    category: c.category,
                    revenue: c.revenue || 0,
                    studentsEnrolled: courseEnrollments.map((e: any) => e.student_id),
                    progressMap: courseEnrollments.reduce((acc: any, e: any) => ({ ...acc, [e.student_id]: e.progress }), {}),
                    lessons: courseLessons.map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        duration: l.duration,
                        type: l.type,
                        isFree: l.is_free,
                        videoUrl: l.video_url,
                        objectives: l.objectives || [],
                        script: l.script,
                        slides: l.slides || [],
                        quizData: l.quiz_data || [],
                        trainingScenarios: l.training_scenarios || [],
                        voiceUrl: l.voice_url,
                        imageUrl: l.image_url,
                    })),
                    reviews: courseReviews.map((r: any) => ({
                        id: r.id,
                        userId: r.user_id,
                        userName: r.user_name,
                        userAvatar: r.user_avatar,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at?.split('T')[0],
                        adminReply: r.admin_reply,
                    })),
                };
            });
            setCourses(coursesWithData);

            // Map books with reviews (using pre-fetched data - no N+1)
            const booksWithReviews = (booksData || []).map((b: any) => {
                const bookReviews = (reviewsData || []).filter((r: any) => r.target_type === 'book' && r.target_id === b.id);

                return {
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    description: b.description,
                    price: b.price,
                    coverImage: b.cover_image,
                    fileUrl: b.file_url,
                    previewUrl: b.preview_url,
                    category: b.category,
                    pages: b.pages,
                    publishYear: b.publish_year,
                    status: b.status,
                    owners: [],
                    reviews: bookReviews.map((r: any) => ({
                        id: r.id,
                        userId: r.user_id,
                        userName: r.user_name,
                        userAvatar: r.user_avatar,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at?.split('T')[0],
                        adminReply: r.admin_reply,
                    })),
                };
            });
            setBooks(booksWithReviews);

            // Map transactions
            setTransactions((transactionsData || []).map((t: any) => ({
                id: t.id,
                userId: t.user_id,
                userName: t.user_name,
                item: t.item_name,
                itemType: t.item_type,
                amount: t.amount,
                status: t.status,
                date: t.created_at?.split('T')[0],
                method: t.payment_method,
            })));

            // Map appointments
            setAppointments((appointmentsData || []).map(mapAppointment));

            // Map certificates
            setCertificates((certificatesData || []).map((c: any) => ({
                id: c.id,
                studentId: c.student_id,
                studentName: c.student_name,
                courseId: c.course_id,
                courseTitle: c.course_title,
                instructor: c.instructor_name,
                issueDate: c.issue_date,
                serialNumber: c.serial_number,
            })));

            // Consultant reviews
            setConsultantReviews((reviewsData || []).filter((r: any) => r.target_type === 'consultant').map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                userAvatar: r.user_avatar,
                rating: r.rating,
                comment: r.comment,
                date: r.created_at?.split('T')[0],
                adminReply: r.admin_reply,
                targetId: r.target_id,
            })));

            // Consultation services
            setConsultationServices((servicesData || []).map((s: any) => ({
                id: s.id,
                consultantId: s.consultant_id,
                title: s.title,
                description: s.description,
                price: s.price,
                duration: s.duration,
                status: s.status,
                rejectionReason: s.rejection_reason,
            })));

            // System settings handled by fetchSystemSettings
            // if (settingsData) { ... }

        } catch (error) {
            console.error('[DEBUG] Error in fetchAllData:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Fetch Notifications ---
    const fetchNotifications = useCallback(async (userId: string, role: string) => {
        try {


            let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

            if (role === 'admin') {
                query = query.or(`target_user_id.eq.${userId},target_role.eq.admin`);
            } else {
                query = query.eq('target_user_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching notifications:', error);
                return;
            }


            setNotifications((data || []).map(mapNotification));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    // --- Setup Realtime Subscriptions ---
    const setupRealtimeSubscriptions = useCallback((userId: string, role: string) => {
        // Clear existing subscriptions
        channelsRef.current.forEach(channel => realtime.unsubscribe(channel));
        channelsRef.current = [];

        // Subscribe to notifications
        const notifChannel = realtime.subscribeToNotifications(
            userId,
            role,
            (newNotif) => {
                // Prevent duplicates - check if notification already exists
                setNotifications(prev => {
                    const exists = prev.some(n => n.title === newNotif.title && n.message === newNotif.message && Math.abs(new Date(newNotif.created_at).getTime() - Date.now()) < 5000);
                    if (exists) return prev;
                    return [mapNotification(newNotif), ...prev];
                });
            },
            (updatedNotif) => {
                setNotifications(prev => prev.map(n =>
                    n.id === updatedNotif.id ? mapNotification(updatedNotif) : n
                ));
            }
        );
        channelsRef.current.push(notifChannel);

        // Subscribe to appointments
        const apptChannel = realtime.subscribeToAppointments(
            userId,
            role,
            (appointment, eventType) => {
                if (eventType === 'INSERT') {
                    setAppointments(prev => [mapAppointment(appointment), ...prev]);
                } else if (eventType === 'UPDATE') {
                    setAppointments(prev => prev.map(a =>
                        a.id === appointment.id ? mapAppointment(appointment) : a
                    ));
                } else if (eventType === 'DELETE') {
                    setAppointments(prev => prev.filter(a => a.id !== appointment.id));
                }
            }
        );
        channelsRef.current.push(apptChannel);

        // Admin: Subscribe to transactions
        if (role === 'admin') {
            const txChannel = realtime.subscribeToTransactions((tx) => {
                setTransactions(prev => [{
                    id: tx.id,
                    userId: tx.user_id,
                    userName: tx.user_name,
                    item: tx.item_name,
                    itemType: tx.item_type,
                    amount: tx.amount,
                    status: tx.status,
                    date: tx.created_at?.split('T')[0],
                    method: tx.payment_method,
                }, ...prev]);
            });
            channelsRef.current.push(txChannel);
        }

        // Subscribe to Courses (INSERT/UPDATE/DELETE)
        const courseChannel = supabase.channel('public:courses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, async (payload) => {
                const eventType = payload.eventType;
                if (eventType === 'DELETE') {
                    const oldRecord = payload.old as any;
                    setCourses(prev => prev.filter(c => c.id !== oldRecord.id));
                } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    // Fetch full data (lessons, reviews, etc)
                    const newRecord = payload.new as any;
                    const newCourse = await fetchCourseById(newRecord.id);
                    if (newCourse) {
                        setCourses(prev => {
                            const exists = prev.some(c => c.id === newCourse.id);
                            if (exists) return prev.map(c => c.id === newCourse.id ? newCourse : c);
                            return [newCourse, ...prev];
                        });
                    }
                }
            })
            .subscribe();
        channelsRef.current.push(courseChannel);

        // Subscribe to Books (INSERT/UPDATE/DELETE)
        const bookChannel = supabase.channel('public:books')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, async (payload) => {
                const eventType = payload.eventType;
                if (eventType === 'DELETE') {
                    const oldRecord = payload.old as any;
                    setBooks(prev => prev.filter(b => b.id !== oldRecord.id));
                } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const newRecord = payload.new as any;
                    const newBook = await fetchBookById(newRecord.id);
                    if (newBook) {
                        setBooks(prev => {
                            const exists = prev.some(b => b.id === newBook.id);
                            if (exists) return prev.map(b => b.id === newBook.id ? newBook : b);
                            return [newBook, ...prev];
                        });
                    }
                }
            })
            .subscribe();
        channelsRef.current.push(bookChannel);

    }, []);

    // Helper: Fetch Single Course
    const fetchCourseById = async (id: string) => {
        const { data: c } = await db.courses.get(id); // Gets course + lessons
        if (!c) return null;

        const { data: reviews } = await db.reviews.getByTarget('course', id);
        const { data: enrollments } = await db.enrollments.getByCourse(id);
        // Note: db.courses.get includes lessons, but we need to map them to match our type
        // The fetchAllData structure manually fetches lessons via db.lessons.getByCourse, 
        // but db.courses.get result should be sufficient if it includes lessons.
        // Let's stick to consistent structure:

        let lessonsData = c.lessons;
        if (!lessonsData) {
            const { data: l } = await db.lessons.getByCourse(id);
            lessonsData = l || [];
        }

        return {
            id: c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor_name,
            instructorId: c.instructor_id,
            price: c.price,
            status: c.status,
            image: c.image,
            promoVideoUrl: c.promo_video_url,
            level: c.level,
            category: c.category,
            revenue: c.revenue || 0,
            studentsEnrolled: (enrollments || []).map((e: any) => e.student_id),
            progressMap: (enrollments || []).reduce((acc: any, e: any) => ({ ...acc, [e.student_id]: e.progress }), {}),
            lessons: (lessonsData || []).map((l: any) => ({
                id: l.id,
                title: l.title,
                duration: l.duration,
                type: l.type,
                isFree: l.is_free,
                videoUrl: l.video_url,
                objectives: l.objectives || [],
                script: l.script,
                slides: l.slides || [],
                quizData: l.quiz_data || [],
                trainingScenarios: l.training_scenarios || [],
                voiceUrl: l.voice_url,
                imageUrl: l.image_url,
            })),
            reviews: (reviews || []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                userAvatar: r.user_avatar,
                rating: r.rating,
                comment: r.comment,
                date: r.created_at?.split('T')[0],
                adminReply: r.admin_reply,
            })),
        };
    };

    // Helper: Fetch Single Book
    const fetchBookById = async (id: string) => {
        const { data: b } = await db.books.get(id);
        if (!b) return null;

        const { data: reviews } = await db.reviews.getByTarget('book', id);
        // We don't need purchases for public display mainly, but good to have consistency if possible.
        // fetchAllData fetches ALL purchases which is heavy. 
        // For a single book, we can't easily valid "owners" array without fetching all purchases for this book.
        // However, Supabase helper bookPurchases doesn't have "getByBook".
        // Let's defer owners for now or fetch if needed. 
        // Actually, the Book type has `owners: string[]`. 
        // I will leave it empty [] for now as it's mostly for admin stats or user check (which uses `bookPurchases.check`).

        return {
            id: b.id,
            title: b.title,
            author: b.author,
            description: b.description,
            price: b.price,
            coverImage: b.cover_image,
            fileUrl: b.file_url,
            previewUrl: b.preview_url,
            category: b.category,
            pages: b.pages,
            publishYear: b.publish_year,
            status: b.status,
            owners: [],
            reviews: (reviews || []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                userAvatar: r.user_avatar,
                rating: r.rating,
                comment: r.comment,
                date: r.created_at?.split('T')[0],
                adminReply: r.admin_reply,
            })),
        };
    };

    // --- Initialize Auth and Data ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { session } = await auth.getSession();

                if (session?.user) {
                    const { data: profile, error: profileError } = await db.profiles.get(session.user.id);

                    // Debug logging for profile fetch
                    if (profileError) {
                        console.error('[INIT AUTH] Profile fetch ERROR:', profileError);
                    }

                    if (profile) {
                        const user = mapProfileToUser(profile);
                        setCurrentUser(user);
                        userLoadedFromAuthRef.current = true;
                        setIsLoading(false);
                        fetchNotifications(user.id, user.role);
                        setupRealtimeSubscriptions(user.id, user.role);

                        // ONLY fetch data for Admin or Consultant
                        if (user.role === 'admin' || user.role === 'consultant') {
                            fetchAllData();
                        }
                    } else {
                        // Will wait for auth listener to create profile
                    }
                } else {
                    // No session, user not logged in
                    setIsLoading(false);
                }

                // Fetch all data
            } catch (err) {
                console.error('[Auth] Error in initAuth:', err);
                setIsLoading(false);
            }
        };

        initAuth();

        // Always fetch system settings on mount
        fetchSystemSettings();

        // Listen for auth changes
        // Listen for auth changes
        const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {

            if (event === 'SIGNED_IN' && session?.user) {
                // Skip if login is in progress (role validation pending)
                if (isLoggingInRef.current) {
                    return;
                }
                // Skip if logout is in progress
                if (isLoggingOutRef.current) {
                    return;
                }

                try {
                    // --- DIRECT FETCH TO TEST CONNECTION (Bypass Supabase Client) ---
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    const accessToken = session.access_token;

                    let profile = null;
                    let profileError = null;

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                        const response = await fetch(
                            `${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
                            {
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json'
                                },
                                signal: controller.signal
                            }
                        );
                        clearTimeout(timeoutId);

                        const data = await response.json();

                        if (response.ok && Array.isArray(data) && data.length > 0) {
                            profile = data[0];
                        } else if (!response.ok) {
                            profileError = data;
                        }
                    } catch (fetchErr) {
                        console.error('[AUTH STATE] Direct fetch ERROR:', fetchErr);
                        // Fallback to null profile will trigger creation logic
                    }

                    if (profile) {
                        const user = mapProfileToUser(profile);
                        setCurrentUser(user);
                        userLoadedFromAuthRef.current = true;
                        setIsLoading(false); // End loading immediately for existing users

                        // Make notifications fetch non-blocking so it doesn't stop data load
                        fetchNotifications(user.id, user.role).catch(err =>
                            console.error('[AUTH STATE] Notification fetch WARNING:', err)
                        );

                        setupRealtimeSubscriptions(user.id, user.role);

                        // ONLY fetch data for Admin or Consultant
                        if (user.role === 'admin' || user.role === 'consultant') {
                            fetchAllData();
                        }
                    } else {
                        // NEW OAUTH USER HANDLING

                        // Wait 2 seconds for DB trigger
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Check again (using direct fetch again for consistency)
                        try {
                            const res2 = await fetch(
                                `${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
                                {
                                    headers: {
                                        'apikey': supabaseKey,
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            const data2 = await res2.json();
                            if (res2.ok && Array.isArray(data2) && data2.length > 0) {
                                const profileAfterWait = data2[0];
                                const user = mapProfileToUser(profileAfterWait);
                                setCurrentUser(user);
                                userLoadedFromAuthRef.current = true;
                                setIsLoading(false);
                                await fetchNotifications(user.id, user.role);
                                setupRealtimeSubscriptions(user.id, user.role);
                                localStorage.removeItem('intended_role');
                                return; // Done
                            }
                        } catch (e) { console.error('Second fetch failed', e); }

                        // Still no profile? Create it manually.
                        const storedRole = localStorage.getItem('intended_role');
                        const role = (storedRole === 'student' || storedRole === 'consultant') ? storedRole : 'student';

                        const newName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'مستخدم جديد';
                        const newAvatar = session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=random`;

                        const { error: createError } = await supabase.from('profiles').upsert({
                            id: session.user.id,
                            email: session.user.email!,
                            name: newName,
                            role: role,
                            avatar: newAvatar,
                            title: role === 'consultant' ? 'مستشار' : 'طالب',
                            bio: 'مستخدم جديد',
                            status: 'active',
                            subscription_tier: 'free',
                            join_date: new Date().toISOString()
                        }, { onConflict: 'id' });

                        if (createError) console.error('[OAuth] Profile creation error:', createError);

                        // Final fetch
                        const { data: newProfile } = await db.profiles.get(session.user.id);
                        if (newProfile) {
                            const newUser = mapProfileToUser(newProfile);
                            setCurrentUser(newUser);
                            userLoadedFromAuthRef.current = true;
                            setIsLoading(false);
                            await fetchNotifications(newUser.id, newUser.role);
                            setupRealtimeSubscriptions(newUser.id, newUser.role);

                            if (newUser.role === 'consultant') fetchAllData();

                            // Welcome notification
                            await sendNotification(newUser.id, 'مرحباً بك!', 'تم إنشاء حسابك بنجاح', 'success', newUser.role === 'consultant' ? '/consultant' : '/dashboard');
                        }
                        localStorage.removeItem('intended_role');
                    }
                } catch (authError) {
                    console.error('[AUTH STATE] CRITICAL ERROR in profile handling:', authError);
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setNotifications([]);
                // Cleanup realtime
                if (channelsRef.current) {
                    channelsRef.current.forEach(channel => realtime.unsubscribe(channel));
                    channelsRef.current = [];
                }
            }
        });

        return () => {
            subscription.unsubscribe();
            realtime.unsubscribeAll();
        };
    }, [fetchAllData, fetchNotifications, setupRealtimeSubscriptions]);

    // ============================================================
    // NOTIFICATION ACTIONS
    // ============================================================

    const sendNotification = useCallback(async (target: string, title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', link?: string) => {
        const notificationData: any = {
            title,
            message,
            type,
            link,
            is_read: false,
        };

        if (target === 'admin') {
            notificationData.target_role = 'admin';
        } else {
            notificationData.target_user_id = target;
        }



        const { error } = await db.notifications.create(notificationData);

        if (error) {
            console.error('❌ Error creating notification:', error);
        } else {

            // Immediately add to local state for instant UI update
            const newNotif: Notification = {
                id: Date.now(),
                target: target,
                title,
                message,
                type,
                time: 'الآن',
                read: false,
                link,
            };
            setNotifications(prev => [newNotif, ...prev]);
        }
    }, []);

    const trackAiUsage = useCallback(async (tokens: number) => {
        const newTotal = totalPlatformTokens + tokens;
        setTotalPlatformTokens(newTotal);
        await db.settings.update({ total_platform_tokens: newTotal });
    }, [totalPlatformTokens]);

    const updateSystemSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
        const dbSettings: any = {};
        if (newSettings.siteName !== undefined) dbSettings.site_name = newSettings.siteName;
        if (newSettings.maintenanceMode !== undefined) dbSettings.maintenance_mode = newSettings.maintenanceMode;
        if (newSettings.supportEmail !== undefined) dbSettings.support_email = newSettings.supportEmail;
        if (newSettings.allowRegistration !== undefined) dbSettings.allow_registration = newSettings.allowRegistration;

        await db.settings.update(dbSettings);

        setSystemSettings(prev => {
            if (newSettings.maintenanceMode !== undefined && newSettings.maintenanceMode !== prev.maintenanceMode) {
                const status = newSettings.maintenanceMode ? 'تفعيل' : 'إيقاف';
                const notifType = newSettings.maintenanceMode ? 'warning' : 'success';
                setTimeout(() => sendNotification('admin', 'وضع الصيانة', `تم ${status} وضع الصيانة للنظام.`, notifType), 100);
            }
            return { ...prev, ...newSettings };
        });
    }, [sendNotification]);

    // Use a ref to track in-flight certificate generations to prevent race conditions
    const generatingCertificatesRef = useRef<Set<string>>(new Set());

    const updateCourseProgress = useCallback(async (courseId: string, userId: string, progress: number) => {
        const safeProgress = Math.min(100, Math.max(0, progress));
        await db.enrollments.updateProgress(courseId, userId, safeProgress);

        // Generate certificate when course is 100% complete
        if (safeProgress === 100) {
            const certKey = `${courseId}-${userId}`;
            // Prevent duplicate generation if already in progress
            if (generatingCertificatesRef.current.has(certKey)) {
                console.log('Certificate generation already in progress for:', certKey);
                return;
            }

            try {
                // Lock
                generatingCertificatesRef.current.add(certKey);

                const { data: existingCert } = await supabase.from('certificates')
                    .select('id')
                    .eq('course_id', courseId)
                    .eq('student_id', userId)
                    .single();

                if (!existingCert) {
                    // CRITICAL: Fetch course and student directly from Supabase
                    const { data: courseData } = await supabase.from('courses')
                        .select('title, instructor_name')
                        .eq('id', courseId)
                        .single();

                    const { data: studentData } = await supabase.from('profiles')
                        .select('name')
                        .eq('id', userId)
                        .single();

                    if (courseData && studentData) {
                        await db.certificates.create({
                            student_id: userId,
                            student_name: studentData.name,
                            course_id: courseId,
                            course_title: courseData.title,
                            instructor_name: courseData.instructor_name || 'فكر المستقبل',
                            serial_number: `FT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                        });

                        await sendNotification(userId, 'تهانينا! 🎉', `أتممت دورة "${courseData.title}" وحصلت على شهادة.`, 'success', '/dashboard/certificates');
                        await sendNotification('admin', 'إتمام دورة', `أتم الطالب ${studentData.name} دورة "${courseData.title}".`, 'success');
                    }
                }
            } catch (err) {
                console.error('Certificate generation error:', err);
            } finally {
                // Unlock
                generatingCertificatesRef.current.delete(certKey);
            }
        }

        // Refresh data if admin/consultant to reflect changes
        if (currentUser?.role === 'admin' || currentUser?.role === 'consultant') {
            await fetchAllData();
        }
    }, [sendNotification, fetchAllData, currentUser]);

    const addReview = useCallback(async (courseId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => {
        const user = users.find(u => u.id === review.userId);
        const course = courses.find(c => c.id === courseId);

        await db.reviews.create({
            user_id: review.userId,
            user_name: review.userName,
            user_avatar: user?.avatar || '',
            rating: review.rating,
            comment: review.comment,
            target_type: 'course',
            target_id: courseId,
        });

        await sendNotification('admin', 'تقييم جديد لدورة ⭐', `قام ${review.userName} بتقييم دورة "${course?.title || 'غير معروفة'}".`, 'success', '/admin/courses');

        await fetchAllData();
    }, [users, courses, sendNotification, fetchAllData]);

    const replyToReview = useCallback(async (courseId: string, reviewId: string, reply: string) => {
        await db.reviews.update(reviewId, { admin_reply: reply });

        // Notify the student
        const course = courses.find(c => c.id === courseId);
        const review = course?.reviews?.find(r => r.id === reviewId);

        if (review) {
            await sendNotification(review.userId, 'رد جديد على تعليقك 💬', `قام المسؤول بالرد على تعليقك في دورة "${course?.title}".`, 'info', `/course/${courseId}`);
        }

        await fetchAllData();
    }, [courses, sendNotification, fetchAllData]);

    // ============================================================
    // BOOK ACTIONS
    // ============================================================

    // ============================================================
    // AUTH ACTIONS
    // ============================================================

    const login = useCallback(async (email: string, password: string, intendedRole: string) => {
        // Set flag to prevent auth listener from setting user prematurely
        isLoggingInRef.current = true;

        try {
            // Check maintenance mode first
            if (systemSettings.maintenanceMode) {
                const { data: profile } = await db.profiles.getByEmail(email);
                if (profile?.role !== 'admin') {
                    throw new Error('النظام حالياً في وضع الصيانة. يرجى المحاولة لاحقاً.');
                }
            }

            const { data, error } = await auth.signIn(email, password);

            if (error) {
                if (error.message.includes('Invalid login')) {
                    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
                }
                throw new Error(error.message);
            }

            if (!data.user) throw new Error('فشل تسجيل الدخول.');

            // Enhanced profile fetch with retry and detailed error logging
            let profile = null;
            let fetchError = null;

            // Try fetching profile with retry (RLS might need a moment to recognize the session)
            for (let attempt = 1; attempt <= 3; attempt++) {
                const { data: profileData, error: profileError } = await db.profiles.get(data.user.id);

                if (profileError) {
                    console.error(`[LOGIN] Profile fetch attempt ${attempt} error:`, profileError);
                    fetchError = profileError;
                } else if (profileData) {
                    profile = profileData;
                    break;
                }

                // Wait before retry (increasing delay)
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 300));
                }
            }

            if (!profile) {
                console.error('[LOGIN] Profile not found after 3 attempts. User ID:', data.user.id);
                console.error('[LOGIN] Last error:', fetchError);
                throw new Error('لم يتم العثور على الملف الشخصي. تأكد من تفعيل حسابك أو تواصل مع الدعم.');
            }

            if (profile.status === 'inactive') {
                await auth.signOut();
                throw new Error('تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.');
            }

            const userRole = profile.role === 'instructor' ? 'consultant' : profile.role;
            const requestedRole = intendedRole === 'instructor' ? 'consultant' : intendedRole;

            if (userRole !== requestedRole) {
                setCurrentUser(null); // Clear immediately before logout to prevent flash
                await auth.signOut();
                const roleNames: Record<string, string> = { admin: 'مدير نظام', consultant: 'مستشار', student: 'طالب' };
                throw new Error(`عذراً، هذا الحساب مسجل بصلاحية "${roleNames[userRole]}". لا يمكنك الدخول من هذه البوابة.`);
            }

            const user = mapProfileToUser(profile);
            setCurrentUser(user);
            await fetchNotifications(user.id, user.role);
            setupRealtimeSubscriptions(user.id, user.role);

            // Send welcome notification
            const roleWelcome: Record<string, string> = {
                admin: 'مرحباً بك في لوحة الإدارة 🛡️',
                consultant: 'مرحباً بعودتك أيها المستشار 👋',
                student: 'مرحباً بك في منصة فكر 🎓'
            };
            setTimeout(() => {
                sendNotification(user.id, roleWelcome[user.role] || 'مرحباً بعودتك!', 'تم تسجيل دخولك بنجاح.', 'success');
            }, 500);
        } finally {
            // Always reset the flag
            isLoggingInRef.current = false;
        }
    }, [systemSettings.maintenanceMode, fetchNotifications, setupRealtimeSubscriptions, sendNotification]);

    const logout = useCallback(async () => {
        isLoggingOutRef.current = true;

        try {
            // Unsubscribe from realtime channels first
            channelsRef.current.forEach(channel => realtime.unsubscribe(channel));
            channelsRef.current = [];

            // Clear local state
            setCurrentUser(null);
            setNotifications([]);

            // Sign out from Supabase with global scope to clear all sessions
            await supabase.auth.signOut({ scope: 'global' });

            // Clear any cached session data in localStorage
            localStorage.removeItem('supabase.auth.token');

        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            isLoggingOutRef.current = false;
        }
    }, []);

    const registerUser = useCallback(async (userData: Omit<User, 'id' | 'joinDate' | 'avatar' | 'status'> & { password?: string }) => {
        if (systemSettings.maintenanceMode) {
            throw new Error('النظام حالياً في وضع الصيانة.');
        }
        if (!systemSettings.allowRegistration) {
            throw new Error('التسجيل معطل حالياً.');
        }

        if (!userData.password) {
            throw new Error('كلمة المرور مطلوبة.');
        }

        const { data, error } = await auth.signUp(userData.email, userData.password, {
            name: userData.name,
            role: userData.role as 'student' | 'consultant',
        });

        if (error) {
            // Handle specific Supabase errors
            if (error.message.includes('already registered')) {
                throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
            }
            throw new Error(error.message);
        }

        if (!data.user) throw new Error('فشل إنشاء الحساب.');

        // ROBUST TRIGGER LOGIC:
        // The DB trigger `handle_new_user` handles profile creation automatically.
        // We just wait for the auth listener to pick up the new session and fetch the profile.
        // The listener in useEffect will handle:
        // 1. Detecting the new session
        // 2. Fetching the profile (retrying if trigger is slow)
        // 3. Setting currentUser

        // We can manually trigger a faster update here just in case
        setTimeout(() => fetchAllData(), 1000);

        const roleName = userData.role === 'consultant' ? 'مستشار' : 'طالب';
        // Note: The notification might fail if the profile isn't ready yet, but that's acceptable as the trigger handles it too.

    }, [systemSettings, fetchAllData]);

    // ============================================================
    // USER ACTIONS
    // ============================================================

    const addUser = useCallback(async (user: User) => {
        // Note: Adding users requires admin Supabase action
        await sendNotification('admin', 'إضافة مستخدم', `تم إضافة المستخدم "${user.name}" يدوياً.`, 'info');
        await fetchAllData();
    }, [sendNotification, fetchAllData]);

    const deleteUser = useCallback(async (id: string) => {
        const user = users.find(u => u.id === id);
        await db.profiles.update(id, { status: 'inactive' });
        if (user) {
            await sendNotification('admin', 'حذف مستخدم', `تم تعطيل حساب "${user.name}".`, 'warning');
        }
        await fetchAllData();
    }, [users, sendNotification, fetchAllData]);

    const updateUser = useCallback(async (id: string, data: Partial<User>) => {
        const dbData: any = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.bio !== undefined) dbData.bio = data.bio;
        if (data.title !== undefined) dbData.title = data.title;
        if (data.avatar !== undefined) dbData.avatar = data.avatar;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.subscriptionTier !== undefined) dbData.subscription_tier = data.subscriptionTier;
        if (data.address !== undefined) dbData.address = data.address;
        if (data.skills !== undefined) dbData.skills = data.skills;

        try {
            const { error } = await db.profiles.update(id, dbData);
            if (error) throw error;
        } catch (err) {
            console.error('Error updating profile in Supabase:', err);
            // Re-throw or handle error appropriately
            throw err;
        }

        if (currentUser?.id === id) {
            setCurrentUser(prev => prev ? { ...prev, ...data } : null);
            // Notify the user about the update
            await sendNotification(
                id,
                'تحديث الملف الشخصي 👤',
                'تم تحديث بيانات ملفك الشخصي بنجاح.',
                'success',
                '/dashboard/settings'
            );
        }

        await fetchAllData();
    }, [currentUser, fetchAllData, sendNotification]);

    const upgradeSubscription = useCallback(async (userId: string, tier: 'free' | 'pro' | 'enterprise') => {
        await db.profiles.update(userId, { subscription_tier: tier });

        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
        }

        const user = users.find(u => u.id === userId);
        const tierName = tier === 'enterprise' ? 'باقة المؤسسات' : tier === 'pro' ? 'باقة المحترفين' : 'الباقة المجانية';
        if (user) {
            await sendNotification('admin', 'ترقية اشتراك', `قام ${user.name} بترقية حسابه إلى ${tierName}.`, 'success');
        }

        await fetchAllData();
    }, [currentUser, users, sendNotification, fetchAllData]);

    // ============================================================
    // CONSULTANT ACTIONS
    // ============================================================

    const updateConsultantProfile = useCallback(async (userId: string, data: Partial<ConsultantProfile>) => {
        const dbData: any = {};

        // Check for undefined (allow empty strings and zero values)
        if (data.specialization !== undefined) dbData.specialization = data.specialization;
        if (data.hourlyRate !== undefined) dbData.hourly_rate = data.hourlyRate;
        if (data.introVideoUrl !== undefined) dbData.intro_video_url = data.introVideoUrl;
        if (data.availableSlots !== undefined) dbData.available_slots = data.availableSlots;
        if (data.isVerified !== undefined) dbData.is_verified = data.isVerified;



        // Check if profile exists
        const { data: existing, error: getError } = await db.consultantProfiles.get(userId);

        if (existing && !getError) {
            const { error } = await db.consultantProfiles.update(userId, dbData);
            if (error) console.error('Error updating consultant profile:', error);
        } else {
            // Create new profile - specialization is required
            const upsertData = {
                user_id: userId,
                specialization: data.specialization || 'غير محدد',
                ...dbData
            };
            const { error } = await db.consultantProfiles.upsert(upsertData);
            if (error) console.error('Error upserting consultant profile:', error);
        }

        await fetchAllData();
    }, [fetchAllData]);

    const addConsultantReview = useCallback(async (consultantId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => {
        if (!currentUser) return;

        if (!currentUser) return;

        await db.reviews.create({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            rating: review.rating,
            comment: review.comment,
            target_type: 'consultant',
            target_id: consultantId,
        });

        // Update consultant rating
        const { data: allReviews } = await db.reviews.getByTarget('consultant', consultantId);
        if (allReviews && allReviews.length > 0) {
            const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
            await db.consultantProfiles.update(consultantId, {
                rating_average: Number(avgRating.toFixed(1)),
                reviews_count: allReviews.length,
            });
        }

        // Send notification to consultant about new review
        await sendNotification(
            consultantId,
            'تقييم جديد ⭐',
            `قام ${review.userName} بتقييمك ${review.rating}/5 نجوم.`,
            'success',
            '/consultant/analytics'
        );

        await fetchAllData();
    }, [users, fetchAllData, sendNotification]);

    // ============================================================
    // CONSULTATION SERVICES
    // ============================================================

    const addConsultationService = useCallback(async (serviceData: Omit<ConsultationService, 'status'>) => {
        const { data, error } = await db.consultationServices.create({
            consultant_id: serviceData.consultantId,
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            duration: serviceData.duration,
            status: 'pending',
        });

        if (error) {
            console.error('Error creating consultation service:', error);
            throw new Error(error.message);
        }


        await sendNotification('admin', 'طلب خدمة جديدة', `مستشار طلب إضافة خدمة: "${serviceData.title}"`, 'info', '/admin/consultations');
        await fetchAllData();
    }, [sendNotification, fetchAllData]);

    const updateConsultationService = useCallback(async (id: string, data: Partial<ConsultationService>) => {
        const oldService = consultationServices.find(s => s.id === id);

        const dbData: any = {};
        if (data.title) dbData.title = data.title;
        if (data.description) dbData.description = data.description;
        if (data.price !== undefined) dbData.price = data.price;
        if (data.duration !== undefined) dbData.duration = data.duration;
        if (data.status) dbData.status = data.status;
        if (data.rejectionReason) dbData.rejection_reason = data.rejectionReason;

        await db.consultationServices.update(id, dbData);

        if (oldService && data.status && data.status !== oldService.status) {
            if (data.status === 'active') {
                await sendNotification(oldService.consultantId, 'تمت الموافقة ✅', `تم نشر خدمتك "${oldService.title}" بنجاح.`, 'success');
            } else if (data.status === 'rejected') {
                await sendNotification(oldService.consultantId, 'تم الرفض ❌', `تم رفض خدمة "${oldService.title}".`, 'error');
            }
        }

        await fetchAllData();
    }, [consultationServices, sendNotification, fetchAllData]);

    const deleteConsultationService = useCallback(async (id: string) => {
        await db.consultationServices.delete(id);
        await fetchAllData();
    }, [fetchAllData]);

    // ============================================================
    // COURSE ACTIONS
    // ============================================================

    const addCourse = useCallback(async (course: Course) => {

        try {
            // Build data object, filtering out undefined values
            const courseData: any = {
                title: course.title,
                description: course.description || '',
                instructor_id: currentUser?.id,
                instructor_name: course.instructor || 'Unknown',
                price: course.price || 0,
                status: course.status || 'draft',
                level: course.level || 'beginner',
            };

            // Only add optional fields if they have values
            // IMPORTANT: Skip base64 images - they're too large and cause DB to hang
            if (course.image && !course.image.startsWith('data:')) {
                courseData.image = course.image;
            } else if (course.image?.startsWith('data:')) {
                console.warn('⚠️ Base64 image skipped - too large for DB');
                courseData.image = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'; // Default
            }
            if (course.promoVideoUrl) courseData.promo_video_url = course.promoVideoUrl;
            if (course.category) courseData.category = course.category;



            const { data, error } = await db.courses.create(courseData);

            if (error) {
                console.error('❌ DB Error:', error);
                throw error;
            }


            await sendNotification('admin', 'دورة جديدة', `تم إضافة دورة جديدة: "${course.title}"`, 'info');

            if (course.status === 'active') {
                await sendNotification('all', 'دورة جديدة متاحة 🎓', `تم نشر دورة جديدة: "${course.title}". تصفحها الآن!`, 'info', '/dashboard/courses');
            }


            await fetchAllData();

            return data?.id || null;

        } catch (err) {
            console.error('❌ addCourse error:', err);
            throw err;
        }
    }, [currentUser, sendNotification, fetchAllData]);

    const updateCourse = useCallback(async (id: string, data: Partial<Course>) => {
        const course = courses.find(c => c.id === id);
        const dbData: any = {};
        if (data.title) dbData.title = data.title;
        if (data.description) dbData.description = data.description;
        if (data.price !== undefined) dbData.price = data.price;
        if (data.status) dbData.status = data.status;
        if (data.image) dbData.image = data.image;
        if (data.level) dbData.level = data.level;
        if (data.category) dbData.category = data.category;

        await supabase.from('courses').update(dbData).eq('id', id);

        // Notify admin about course status changes
        if (course && data.status) {
            const statusText = data.status === 'draft' ? 'نقل للمسودة' : data.status === 'active' ? 'نشر' : 'أرشفة';
            await sendNotification('admin', 'تحديث دورة', `تم ${statusText} دورة "${course.title}".`, 'info');
        }

        await fetchAllData();
    }, [courses, sendNotification, fetchAllData]);

    const deleteCourse = useCallback(async (id: string) => {
        const course = courses.find(c => c.id === id);
        await db.courses.delete(id);
        if (course) {
            await sendNotification('admin', 'حذف دورة', `تم حذف دورة "${course.title}" نهائياً.`, 'warning');
        }
        await fetchAllData();
    }, [courses, sendNotification, fetchAllData]);

    const enrollStudent = useCallback(async (courseId: string, userId: string) => {
        await db.enrollments.enroll(courseId, userId);

        const course = courses.find(c => c.id === courseId);
        if (course) {
            await sendNotification(
                userId,
                'تم التسجيل في الدورة ✅',
                `تم تسجيلك بنجاح في دورة "${course.title}". ابدأ التعلم الآن!`,
                'success',
                '/dashboard/courses'
            );
        }

        await fetchAllData();
    }, [courses, sendNotification, fetchAllData]);

    // ... (updateCourseProgress omitted)

    // ...

    const addBook = useCallback(async (book: Book) => {
        await db.books.create({
            title: book.title,
            author: book.author,
            description: book.description,
            price: book.price,
            cover_image: book.coverImage,
            file_url: book.fileUrl,
            preview_url: book.previewUrl,
            category: book.category,
            pages: book.pages,
            publish_year: book.publishYear,
            status: book.status,
        });

        await sendNotification('admin', 'كتاب جديد', `تم إضافة كتاب "${book.title}" للمكتبة.`, 'info');

        if (book.status === 'active') {
            await sendNotification('all', 'كتاب جديد في المكتبة 📚', `تم إضافة كتاب "${book.title}". اقرأه الآن!`, 'info', '/dashboard/library');
        }

        await fetchAllData();
    }, [sendNotification, fetchAllData]);

    const updateBook = useCallback(async (id: string, data: Partial<Book>) => {
        const book = books.find(b => b.id === id);
        const dbData: any = {};
        if (data.title) dbData.title = data.title;
        if (data.author) dbData.author = data.author;
        if (data.description) dbData.description = data.description;
        if (data.price !== undefined) dbData.price = data.price;
        if (data.status) dbData.status = data.status;
        if (data.coverImage) dbData.cover_image = data.coverImage;

        await db.books.update(id, dbData);

        // Notify admin about book status changes
        if (book && data.status) {
            const statusText = data.status === 'draft' ? 'نقل للمسودة' : data.status === 'active' ? 'نشر' : 'أرشفة';
            await sendNotification('admin', 'تحديث كتاب', `تم ${statusText} كتاب "${book.title}".`, 'info');
        }

        await fetchAllData();
    }, [books, sendNotification, fetchAllData]);

    const deleteBook = useCallback(async (id: string) => {
        const book = books.find(b => b.id === id);
        await db.books.delete(id);
        if (book) {
            await sendNotification('admin', 'حذف كتاب', `تم حذف كتاب "${book.title}" من المكتبة.`, 'warning');
        }
        await fetchAllData();
    }, [books, sendNotification, fetchAllData]);

    const buyBook = useCallback(async (bookId: string, userId: string) => {
        await db.bookPurchases.create(bookId, userId);

        const book = books.find(b => b.id === bookId);
        if (book) {
            await sendNotification(
                userId,
                'شراء كتاب جديد 📚',
                `تم شراء كتاب "${book.title}" بنجاح. استمتع بالقراءة!`,
                'success',
                '/dashboard/library'
            );
            await sendNotification(
                'admin',
                'مبيعات 💰',
                `قام مستخدم بشراء كتاب "${book.title}".`,
                'success',
                '/admin/library'
            );
        }

        await fetchAllData();
    }, [books, sendNotification, fetchAllData]);



    const addBookReview = useCallback(async (bookId: string, review: Omit<Review, 'id' | 'date' | 'userAvatar'>) => {
        const user = users.find(u => u.id === review.userId);
        const book = books.find(b => b.id === bookId);

        await db.reviews.create({
            user_id: review.userId,
            user_name: review.userName,
            user_avatar: user?.avatar || '',
            rating: review.rating,
            comment: review.comment,
            target_type: 'book',
            target_id: bookId,
        });

        await sendNotification('admin', 'تقييم جديد لكتاب 📚', `قام ${review.userName} بتقييم كتاب "${book?.title || 'مجهول'}".`, 'success', '/admin/library');

        await fetchAllData();
    }, [users, books, sendNotification, fetchAllData]);

    const replyToBookReview = useCallback(async (bookId: string, reviewId: string, reply: string) => {
        await db.reviews.update(reviewId, { admin_reply: reply });

        // Notify the student
        const book = books.find(b => b.id === bookId);
        // Note: books state might not carry reviews deeply if not joined, but we can try
        // Assuming reviews are fetched or we just notify generically
        // For now, we don't have review.userId easily unless we fetch it.
        // We will just notify 'admin' or skip student notification if we can't get ID easily without extra fetch.
        // But better: User is usually undefined here if we don't know who wrote the review.
        // Let's assume we can trigger a generic notification if we had review object.
        // Since we don't have review object passed in, and didn't fetch it, we might skip student notification to avoid overhead,
        // OR we can do a quick check if we have it in state. book.reviews?
        // Let's rely on standard UI updates for now, or just notify admin execution.

        await fetchAllData();
    }, [books, fetchAllData]);

    // ============================================================
    // APPOINTMENT & TRANSACTION ACTIONS
    // ============================================================

    const addAppointment = useCallback(async (appt: Appointment) => {
        await db.appointments.create({
            student_id: appt.studentId,
            student_name: appt.studentName,
            consultant_id: appt.expertId,
            consultant_name: appt.expertName,
            title: appt.title,
            date: appt.date,
            time: appt.time,
            type: appt.type,
            status: appt.status || 'confirmed',
            preferred_platform: appt.preferredPlatform,
            meeting_link: appt.meetingLink,
            notes: appt.notes,
        });

        // Notify Student
        await sendNotification(
            appt.studentId,
            'تم حجز استشارة ✅',
            `تم حجز استشارتك مع ${appt.expertName} بنجاح يوم ${appt.date} الساعة ${appt.time}.`,
            'success',
            '/dashboard/appointments'
        );

        // Notify Consultant
        await sendNotification(
            appt.expertId,
            'طلب استشارة جديد 📅',
            `لديك موعد استشارة جديد مع ${appt.studentName} يوم ${appt.date}.`,
            'info',
            '/dashboard/appointments'
        );

        await fetchAllData();
    }, [sendNotification, fetchAllData]);

    const updateAppointment = useCallback(async (id: number, data: Partial<Appointment>) => {
        const dbData: any = {};
        if (data.status) dbData.status = data.status;
        if (data.meetingLink) dbData.meeting_link = data.meetingLink;

        // Find actual UUID from numeric ID
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            // We need to search by other fields since we converted ID
            await supabase.from('appointments')
                .update(dbData)
                .eq('student_id', appt.studentId)
                .eq('date', appt.date)
                .eq('time', appt.time);
        }
        await fetchAllData();
    }, [appointments, fetchAllData]);

    const initiatePayment = useCallback(async (amount: number, description: string, itemType: string, itemId: string) => {
        if (!currentUser) throw new Error('يجب تسجيل الدخول لإتمام الدفع');

        // Sanitize item_id (must be UUID or null)
        const validItemId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId) ? itemId : null;

        // Force get session to ensure we have a fresh token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session. Please log in again.');



        // Use direct fetch for full control over headers
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey
            },
            body: JSON.stringify({
                amount,
                description,
                item_type: itemType,
                item_id: validItemId,
                item_name: description,
                callback_url: window.location.href,
                create_db_only: true,
                user_id: currentUser.id,
                user_name: currentUser.name
            })
        });

        const data = await response.json();


        if (!response.ok) {
            const errorDetails = data.details ? JSON.stringify(data.details) : '';
            console.error("Initiate Payment Error Details:", { error: data.error, details: data.details });
            sendNotification(currentUser.id, 'فشل الدفع 💳', `خطأ من الخادم: ${data.error || 'غير معروف'}`, 'error');
            throw new Error(data.error || 'Payment failed');
        }

        if (!data.success) {
            const errorMsg = data.error || 'Failed to initiate payment';
            sendNotification(currentUser.id, 'فشل الدفع 💳', `خطأ في المعالجة: ${errorMsg}`, 'error');
            throw new Error(errorMsg);
        }

        // Return object with id to match expected interface
        return { id: data.transaction_id };
    }, [currentUser]);

    const addTransaction = useCallback(async (tx: Transaction) => {
        await db.transactions.create({
            user_id: tx.userId,
            user_name: tx.userName,
            item_type: 'course',
            item_name: tx.item,
            amount: tx.amount,
            status: tx.status,
            payment_method: tx.method,
        });

        if (tx.status === 'paid') {
            await sendNotification('admin', 'معاملة مالية جديدة', `عملية دفع ناجحة: ${tx.amount} ر.س من ${tx.userName}`, 'success', '/admin/finance');

            // Notify the user
            await sendNotification(
                tx.userId,
                'عملية دفع ناجحة 💳',
                `تمت عملية الدفع بمبلغ ${tx.amount} بنجاح.`,
                'success',
                '/dashboard/payments'
            );
        }

        await fetchAllData();
    }, [sendNotification, fetchAllData]);

    const updateTransaction = useCallback(async (id: string, status: Transaction['status']) => {
        // Find the transaction to get details
        const transaction = transactions.find(t => t.id === id);

        // Update local state optimistically
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, status } : t
        ));

        // Update in DB
        await db.transactions.update(id, { status });

        // If payment is confirmed, grant access to the purchased item
        if (status === 'paid' && transaction) {
            const itemType = transaction.itemType;
            const userId = transaction.userId;

            // Extract item ID from the transaction
            // Transaction item format is usually "كتاب: [title]" or "دورة: [title]" etc.
            if (itemType === 'book' || transaction.item?.includes('كتاب')) {
                // Find the book by matching the title in the transaction
                const bookTitle = transaction.item?.replace('كتاب: ', '').replace('شراء كتاب: ', '').trim();
                const book = books.find(b => b.title === bookTitle);

                if (book && userId) {
                    // Check if already purchased
                    const { data: existingPurchase } = await db.bookPurchases.check(book.id, userId);

                    if (!existingPurchase) {
                        await db.bookPurchases.create(book.id, userId);


                        // Notify user
                        await sendNotification(
                            userId,
                            'تم تفعيل الكتاب! 📚',
                            `تم تأكيد شراء كتاب "${book.title}" ويمكنك الآن قراءته.`,
                            'success',
                            '/dashboard/library'
                        );
                    }
                }
            } else if (itemType === 'course' || transaction.item?.includes('دورة')) {
                // Find the course by matching the title
                const courseTitle = transaction.item?.replace('دورة: ', '').replace('اشتراك في دورة: ', '').trim();
                const course = courses.find(c => c.title === courseTitle);

                if (course && userId) {
                    // Check if already enrolled
                    const isEnrolled = course.studentsEnrolled?.includes(userId);

                    if (!isEnrolled) {
                        await db.enrollments.enroll(course.id, userId);


                        // Notify user
                        await sendNotification(
                            userId,
                            'تم تفعيل الدورة! 🎓',
                            `تم تأكيد اشتراكك في دورة "${course.title}" ويمكنك البدء الآن.`,
                            'success',
                            `/dashboard/courses/${course.id}`
                        );
                    }
                }
            }

            // Refresh data to update UI
            await fetchAllData();
        }

        // Notify Admin
        let message = '';
        let type: 'success' | 'warning' | 'info' = 'info';

        if (status === 'paid') {
            message = `تم تأكيد دفع المعاملة رقم ${id} يدوياً.`;
            type = 'success';
        } else if (status === 'refunded') {
            message = `تم استرجاع مبلغ المعاملة رقم ${id}.`;
            type = 'warning';
        } else {
            message = `تم تحديث حالة المعاملة رقم ${id} إلى ${status}.`;
        }

        await sendNotification('admin', 'تحديث حالة معاملة', message, type, '/admin/finance');
    }, [transactions, books, courses, sendNotification, fetchAllData]);

    // ============================================================
    // NOTIFICATION MARK READ
    // ============================================================

    const markNotificationRead = useCallback(async (id: number) => {
        // Find notification with this numeric ID
        const notif = notifications.find(n => n.id === id);
        if (notif) {
            // Update local state immediately
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            // Update in database (we need to find by other criteria since ID is converted)
            await supabase.from('notifications')
                .update({ is_read: true })
                .eq('title', notif.title)
                .eq('message', notif.message);
        }
    }, [notifications]);

    const markAllNotificationsRead = useCallback(async (target: string) => {


        // Optimistically update local state FIRST for instant UI feedback
        setNotifications(prev => prev.map(n => {
            // For admin, check both target and targetRole
            if (target === 'admin') {
                return (n.target === 'admin' || (n as any).targetRole === 'admin') ? { ...n, read: true } : n;
            }
            // For regular users, check target matches
            return n.target === target ? { ...n, read: true } : n;
        }));

        try {
            if (target === 'admin') {
                // Admin notifications use target_role
                await supabase.from('notifications')
                    .update({ is_read: true })
                    .eq('target_role', 'admin');

            } else {
                // User notifications use target_user_id
                await db.notifications.markAllRead(target);

            }
        } catch (error) {
            console.error('❌ Error marking notifications as read:', error);
            // Revert optimistic update on error by refetching
            await fetchAllData();
        }
    }, [fetchAllData]);



    const value = {
        isLoading,
        users,
        consultantProfiles,
        courses,
        books,
        transactions,
        notifications,
        appointments,
        certificates,
        currentUser,
        consultantReviews,
        consultationServices,
        totalPlatformTokens,
        systemSettings,

        // Actions
        login,
        logout,
        registerUser,

        addUser,
        deleteUser,
        updateUser,
        upgradeSubscription,

        updateConsultantProfile,
        addConsultantReview,

        addConsultationService,
        updateConsultationService,
        deleteConsultationService,

        addCourse,
        updateCourse,
        deleteCourse,
        enrollStudent,
        updateCourseProgress,

        addReview,
        replyToReview,

        addBook,
        updateBook,
        deleteBook,
        buyBook,
        addBookReview,
        replyToBookReview,

        addAppointment,
        updateAppointment,

        addTransaction,
        updateTransaction,
        initiatePayment,

        trackAiUsage,
        updateSystemSettings,

        markNotificationRead,
        markAllNotificationsRead,
        sendNotification,
        refreshData: async () => {
            // Refresh logic: Settings always, Data only if permitted role
            await fetchSystemSettings();
            if (currentUser && ['admin', 'consultant'].includes(currentUser.role)) {
                await fetchAllData();
            }
        },
        fetchSystemSettings
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw new Error("useGlobal must be used within GlobalProvider");
    return context;
};
