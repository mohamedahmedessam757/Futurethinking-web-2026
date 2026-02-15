
import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useGlobal, User, Course as GlobalCourse, Appointment, Transaction as GlobalTransaction, Certificate, Review, Book as GlobalBook } from '../GlobalContext';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useOwnedBooks } from '../../hooks/useOwnedBooks';
import { useAppointments } from '../../hooks/useAppointments';
import { useTransactions } from '../../hooks/useTransactions';
import { useCertificates } from '../../hooks/useCertificates';

// --- Mapped Types for Student Dashboard ---
export interface Course {
    id: string; // Changed from number to string to match Global ID type (e.g., 'crs-101')
    title: string;
    instructor: string;
    progress: number;
    image: string;
    completed: boolean;
    category: 'active' | 'completed';
    completedAt?: string;
    enrolledAt?: string;
    lessons?: any[]; // Added for stats calculation
}

export interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    price: number;
    coverImage: string;
    category: string;
    rating: number;
    owned: boolean;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    read: boolean;
    time: string;
    link?: string;
}

export interface Transaction {
    id: string;
    desc: string;
    date: string;
    amount: string;
    status: 'paid' | 'pending';
}

export interface UserProfile {
    id: string;
    name: string;
    title: string;
    email: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    avatar: string;
    bio: string;
    address?: string;
    skills?: string[];
    joinDate?: string;
    role?: 'admin' | 'student' | 'instructor' | 'consultant';
}

interface DashboardContextType {
    user: UserProfile;
    updateUser: (u: Partial<UserProfile>) => void;
    upgradeSubscription: (tier: 'free' | 'pro' | 'enterprise') => void;
    courses: Course[];
    books: Book[];
    appointments: Appointment[];
    certificates: Certificate[];
    addAppointment: (appt: Omit<Appointment, 'id' | 'studentId' | 'studentName' | 'status'>) => void;
    notifications: Notification[];
    markAllRead: () => void;
    markNotificationRead: (id: number) => void;
    transactions: Transaction[];
    addTransaction: (tx: Omit<Transaction, 'id'>) => void;
    addReview: (courseId: string, rating: number, comment: string) => void;

    buyBook: (bookId: string) => void;
    addBookReview: (bookId: string, rating: number, comment: string) => void;
    sendNotification: (target: string, title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', link?: string) => void;
    initiatePayment: (amount: number, description: string, itemType: string, itemId: string) => Promise<any>;
    refreshData: () => Promise<void>;
    updateCourseProgress: (courseId: string, userId: string, progress: number) => void;

    stats: {
        completedCourses: number;
        ownedBooks: number;
        trainingHours: number;
    };
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children?: ReactNode }) => {
    const {
        currentUser, updateUser: globalUpdateUser, upgradeSubscription: globalUpgradeSubscription,
        // Removed heavy data from here: courses, books, transactions, appointments, certificates
        addTransaction: globalAddTransaction, addAppointment: globalAddAppointment,
        notifications: globalNotifications, markAllNotificationsRead, markNotificationRead: globalMarkNotificationRead,
        addReview: globalAddReview,
        buyBook: globalBuyBook, addBookReview: globalAddBookReview,
        sendNotification: globalSendNotification,
        initiatePayment: globalInitiatePayment,
        refreshData: globalRefreshData,
        updateCourseProgress: globalUpdateCourseProgress
    } = useGlobal();

    // --- New Scalable Hooks ---
    const { courses: enrolledCourses, fetchCourses: fetchEnrolledCourses, refetch: refetchCourses } = useEnrolledCourses(currentUser?.id);
    const { books: ownedBooks, fetchBooks: fetchOwnedBooks, refetch: refetchBooks } = useOwnedBooks(currentUser?.id);
    const { appointments: myAppointments, fetchAppointments, refetch: refetchAppointments } = useAppointments(currentUser?.id, currentUser?.role);
    const { transactions: myTransactions, fetchTransactions, refetch: refetchTransactions } = useTransactions(currentUser?.id, currentUser?.role);
    const { certificates: myCertificates, fetchCertificates, refetch: refetchCertificates } = useCertificates(currentUser?.id);

    // Initial Fetch when user loads
    useEffect(() => {
        if (currentUser) {
            fetchEnrolledCourses();
            fetchOwnedBooks();
            fetchAppointments();
            fetchTransactions();
            fetchCertificates();
        }
    }, [currentUser, fetchEnrolledCourses, fetchOwnedBooks, fetchAppointments, fetchTransactions, fetchCertificates]);

    // Data Refresh Wrapper
    const refreshData = async () => {
        await Promise.all([
            refetchCourses(),
            refetchBooks(),
            refetchAppointments(),
            refetchTransactions(),
            refetchCertificates(),
            globalRefreshData() // Keep for notifications and user profile
        ]);
    };

    // Filter Appointments (Already filtered by hook but sorted here if needed)
    const appointments = useMemo(() => {
        if (!currentUser) return [];
        return myAppointments
            //.filter(a => a.studentId === currentUser.id) // Hook filters this
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [myAppointments, currentUser]);

    // Filter Certificates
    const certificates = useMemo(() => {
        if (!currentUser) return [];
        return myCertificates
            //.filter(c => c.studentId === currentUser.id) // Hook filters this
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [myCertificates, currentUser]);

    // User Profile
    const user: UserProfile = useMemo(() => ({
        id: currentUser?.id || '',
        name: currentUser?.name || 'زائر',
        title: currentUser?.title || 'طالب جديد',
        email: currentUser?.email || '',
        subscriptionTier: currentUser?.subscriptionTier || 'free',
        avatar: currentUser?.avatar || '',
        bio: currentUser?.bio || 'محب للتعلم والتطوير المستمر.',
        address: currentUser?.address || '',
        skills: currentUser?.skills || [],
        joinDate: currentUser?.joinDate,
        role: currentUser?.role
    }), [currentUser]);

    const updateUser = (data: Partial<UserProfile>) => {
        if (currentUser) globalUpdateUser(currentUser.id, data);
    };

    const upgradeSubscription = (tier: 'free' | 'pro' | 'enterprise') => {
        if (currentUser) globalUpgradeSubscription(currentUser.id, tier);
    }

    // Map Enrolled Courses to Dashboard Course Interface
    const courses: Course[] = useMemo(() => {
        if (!currentUser) return [];
        return enrolledCourses
            .map(c => {
                // Progress is already in c.progress from useEnrolledCourses hook
                const progress = c.progress || 0;
                return {
                    id: c.id,
                    title: c.title,
                    instructor: c.instructor, // Handle varied naming
                    progress: progress,
                    image: c.image,
                    completed: progress === 100, // Or use c.completed
                    category: progress === 100 ? 'completed' : 'active',
                    lessons: c.lessons // include lessons for usage in stats if they are needed by consumers.
                };
            });
    }, [enrolledCourses, currentUser]);

    // Map Books
    const books: Book[] = useMemo(() => {
        if (!currentUser) return [];
        return ownedBooks
            .map(b => {
                // b includes rating from hook
                return {
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    description: b.description,
                    price: b.price,
                    coverImage: b.coverImage, // Handle varied naming if any
                    category: b.category,
                    rating: b.rating || 0,
                    owned: true // Since we fetched owned books
                }
            });
    }, [ownedBooks, currentUser]);

    // Transactions
    const transactions: Transaction[] = useMemo(() => {
        if (!currentUser) return [];
        // mapped in hook is already Transaction[], but let's ensure it matches Dashboard Transaction
        return myTransactions.map(t => ({
            id: t.id,
            desc: t.item || 'Transaction', // Hook uses item/item_name
            date: t.date,
            amount: typeof t.amount === 'number' ? `${t.amount} ر.س` : t.amount,
            status: t.status === 'paid' ? 'paid' : 'pending'
        }));
    }, [myTransactions, currentUser]);

    const addTransaction = (tx: Omit<Transaction, 'id'>) => {
        if (!currentUser) return;
        globalAddTransaction({
            id: `INV-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            item: tx.desc,
            amount: parseInt(tx.amount.replace(/\D/g, '')) || 0,
            date: tx.date,
            status: 'paid',
            method: 'Visa'
        });
        // Optimistically update or refetch?
        setTimeout(() => refetchTransactions(), 1000);
    };

    const addAppointment = (appt: Omit<Appointment, 'id' | 'studentId' | 'studentName' | 'status'>) => {
        if (!currentUser) return;
        globalAddAppointment({
            ...appt,
            id: Date.now(), // Supabase might handle ID, but globalAddAppointment expects it?
            studentId: currentUser.id,
            studentName: currentUser.name,
            status: 'confirmed'
        });
        setTimeout(() => refetchAppointments(), 1000);
    };

    const addReview = (courseId: string, rating: number, comment: string) => {
        if (!currentUser) return;
        globalAddReview(courseId, {
            userId: currentUser.id,
            userName: currentUser.name,
            rating,
            comment
        });
        // Refetch courses? Probably not needed for review unless it updates rating display
    };

    const buyBook = (bookId: string) => {
        if (!currentUser) return;
        globalBuyBook(bookId, currentUser.id);
        setTimeout(() => refetchBooks(), 1000);
    };

    const addBookReview = (bookId: string, rating: number, comment: string) => {
        if (!currentUser) return;
        globalAddBookReview(bookId, {
            userId: currentUser.id,
            userName: currentUser.name,
            rating,
            comment
        });
    };

    const updateCourseProgress = async (courseId: string, userId: string, progress: number) => {
        if (currentUser) {
            await globalUpdateCourseProgress(courseId, userId, progress);
            // Refetch courses and certificates so new cert appears immediately
            setTimeout(() => {
                refetchCourses();
                refetchCertificates();
            }, 1000);
        }
    };

    // Notifications (Kept from Global for now)
    const notifications: Notification[] = useMemo(() => {
        if (!currentUser) return [];
        const filtered = globalNotifications.filter(n => {
            const matches = n.target === currentUser.id || n.target === 'all' || n.target === currentUser.role;
            return matches;
        });

        return filtered.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: n.time,
            read: n.read,
            link: n.link
        }));
    }, [globalNotifications, currentUser]);

    const markAllRead = () => {
        if (currentUser) markAllNotificationsRead(currentUser.id);
    };

    const markNotificationRead = (id: number) => {
        globalMarkNotificationRead(id);
    };

    const parseDurationToHours = (duration: string): number => {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        let minutes = 0;
        if (parts.length === 2) {
            minutes = parts[0] + (parts[1] / 60);
        } else if (parts.length === 3) {
            minutes = (parts[0] * 60) + parts[1] + (parts[2] / 60);
        } else {
            minutes = parseInt(duration) || 0;
        }
        return minutes / 60;
    };

    const stats = useMemo(() => {
        if (!currentUser) return { completedCourses: 0, ownedBooks: 0, trainingHours: 0 };

        // Calculate hours from enrolled courses (lessons populated by hook)
        let totalHours = 0;
        enrolledCourses.forEach(course => {
            if (course.lessons) {
                const courseTotalHours = course.lessons.reduce((acc: number, lesson: any) => acc + parseDurationToHours(lesson.duration), 0);
                const userProgress = course.progress || 0;
                if (courseTotalHours > 0) {
                    totalHours += courseTotalHours * (userProgress / 100);
                }
            }
        });

        const formattedHours = Math.round(totalHours * 10) / 10;

        return {
            completedCourses: enrolledCourses.filter(c => c.completed).length,
            ownedBooks: ownedBooks.length,
            trainingHours: formattedHours
        };
    }, [enrolledCourses, ownedBooks, currentUser]);

    const value = useMemo(() => ({
        user, updateUser, upgradeSubscription, courses, books, appointments, certificates, addAppointment,
        notifications, markAllRead, markNotificationRead, transactions, addTransaction, addReview, buyBook, addBookReview, sendNotification: globalSendNotification, initiatePayment: globalInitiatePayment, stats,
        refreshData, updateCourseProgress
    }), [user, courses, books, appointments, certificates, notifications, transactions, stats, globalSendNotification, globalInitiatePayment, refreshData, globalUpdateCourseProgress]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard must be used within DashboardProvider");
    return context;
};
