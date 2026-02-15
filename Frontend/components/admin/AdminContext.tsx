
import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useGlobal, User, Course, Transaction, Notification, Book, SystemSettings } from '../GlobalContext';

// Re-export types for compatibility
export type AdminUser = User;
export type AdminCourse = Course;
export type AdminTransaction = Transaction;
export type AdminNotification = Notification;
export type AdminBook = Book;

interface DashboardStats {
    revenue: number;
    revenueGrowth: number; // Percentage vs last month
    usersCount: number;
    usersGrowth: number; // Percentage vs last month
    coursesCount: number;
    coursesGrowth: number;
    transactionsCount: number;
    booksCount: number; // New
    totalTokens: number; // New
}

interface AdminContextType {
    // Data
    users: AdminUser[];
    courses: AdminCourse[];
    books: AdminBook[];
    transactions: AdminTransaction[];
    notifications: AdminNotification[];
    adminUser: User | null;
    systemSettings: SystemSettings;

    // Stats
    stats: DashboardStats;

    // Actions
    // Actions
    addUser: (user: Omit<AdminUser, 'id' | 'joinDate' | 'avatar'>) => Promise<void>;
    updateUser: (id: string, data: Partial<AdminUser>) => Promise<void>;
    deleteUser: (id: string) => void;

    addCourse: (course: Omit<AdminCourse, 'id' | 'studentsEnrolled' | 'revenue'>) => Promise<string | null>;
    updateCourse: (id: string, data: Partial<AdminCourse>) => Promise<void>;
    deleteCourse: (id: string) => void;
    updateCourseStatus: (id: string, status: AdminCourse['status']) => Promise<void>;
    refreshCourses: () => Promise<void>;

    addBook: (book: Omit<AdminBook, 'id' | 'owners' | 'reviews'>) => Promise<void>;
    updateBook: (id: string, data: Partial<AdminBook>) => Promise<void>;
    deleteBook: (id: string) => void;

    // Finance Actions
    updateTransactionStatus: (id: string, status: AdminTransaction['status']) => Promise<void>;

    // System Actions
    updateSystemSettings: (settings: Partial<SystemSettings>) => void;

    trackAiUsage: (tokens: number) => void;

    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;
    exportData: (type: 'users' | 'finance' | 'courses') => void;
    refreshBooks: () => Promise<void>;
    sendNotification: (targetRole: 'admin' | 'user' | 'consultant' | string, title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', link?: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children?: ReactNode }) => {
    const {
        users, courses, books, transactions: globalTransactions, notifications, currentUser, systemSettings,
        addUser: globalAddUser, deleteUser, updateUser: globalUpdateUser,
        addCourse: globalAddCourse, updateCourse: globalUpdateCourse, deleteCourse,
        addBook: globalAddBook, updateBook: globalUpdateBook, deleteBook,
        markNotificationRead, markAllNotificationsRead: globalMarkAllRead,
        totalPlatformTokens, trackAiUsage: globalTrackAi, updateSystemSettings, sendNotification,
        updateTransaction: globalUpdateTransaction, refreshData
    } = useGlobal();

    // Filter notifications for admin only (check both target and target_role)
    const adminNotifications = useMemo(() => {

        const filtered = notifications.filter(n => n.target === 'admin' || (n as any).targetRole === 'admin');

        return filtered;
    }, [notifications]);

    // --- Actions Wrapper ---
    const addUser = useCallback(async (userData: Omit<AdminUser, 'id' | 'joinDate' | 'avatar'>) => {
        await globalAddUser({
            ...userData,
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            joinDate: new Date().toISOString().split('T')[0],
            status: userData.status,
            avatar: `https://ui-avatars.com/api/?name=${userData.name}&background=c6a568&color=fff`,
            role: userData.role as any
        });
    }, [globalAddUser]);

    const updateUser = useCallback(async (id: string, data: Partial<AdminUser>) => {
        await globalUpdateUser(id, data);
    }, [globalUpdateUser]);

    const addCourse = useCallback(async (courseData: Omit<AdminCourse, 'id' | 'studentsEnrolled' | 'revenue'>) => {
        try {
            const newId = await globalAddCourse({
                ...courseData,
                id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Temporary ID, overwritten by DB
                studentsEnrolled: [],
                revenue: 0,
                image: courseData.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
            });
            return newId;

        } catch (error) {
            console.error('❌ Error adding course:', error);
            throw error;
        }
    }, [globalAddCourse]);

    const updateCourse = useCallback(async (id: string, data: Partial<AdminCourse>) => {
        await globalUpdateCourse(id, data);
    }, [globalUpdateCourse]);

    const updateCourseStatus = useCallback(async (id: string, status: AdminCourse['status']) => {
        await globalUpdateCourse(id, { status });
    }, [globalUpdateCourse]);

    const addBook = useCallback(async (bookData: Omit<AdminBook, 'id' | 'owners' | 'reviews'>) => {
        try {
            await globalAddBook({
                ...bookData,
                id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                owners: [],
                reviews: []
            });
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        }
    }, [globalAddBook]);

    const updateBook = useCallback(async (id: string, data: Partial<AdminBook>) => {
        await globalUpdateBook(id, data);
    }, [globalUpdateBook]);

    const markAllNotificationsRead = useCallback(() => globalMarkAllRead('admin'), [globalMarkAllRead]);

    const trackAiUsage = useCallback((tokens: number) => {
        globalTrackAi(tokens);
    }, [globalTrackAi]);

    // --- Financial Actions ---
    const updateTransactionStatus = useCallback(async (id: string, status: AdminTransaction['status']) => {
        // Use GlobalContext updateTransaction which updates DB and local state immediately
        // No page reload needed - real-time update via context state
        await globalUpdateTransaction(id, status);
    }, [globalUpdateTransaction]);

    // Generic Export
    const exportData = useCallback((type: 'users' | 'finance' | 'courses') => {
        let data: any[] = [];
        let filename = '';
        let reportName = '';

        if (type === 'users') { data = users; filename = 'users_report.csv'; reportName = 'تقرير المستخدمين'; }
        if (type === 'finance') { data = globalTransactions; filename = 'finance_report.csv'; reportName = 'التقرير المالي'; }
        if (type === 'courses') { data = courses; filename = 'courses_report.csv'; reportName = 'تقرير الدورات'; }

        if (data.length === 0) return;

        // BOM for Arabic Excel support
        const BOM = "\uFEFF";
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + BOM + [headers, ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // NOTIFY ADMIN
        sendNotification('admin', 'تصدير بيانات', `تم تصدير ملف ${reportName} بنجاح.`, 'success');

    }, [users, globalTransactions, courses, sendNotification]);

    // --- Real-time Stats & Growth Calculation ---
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const getRevenueForMonth = (month: number, year: number) => {
            return globalTransactions
                .filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === month && d.getFullYear() === year && t.status === 'paid';
                })
                .reduce((sum, t) => sum + t.amount, 0);
        };

        const getUsersCountForMonth = (month: number, year: number) => {
            return users.filter(u => {
                const d = new Date(u.joinDate);
                return d.getMonth() === month && d.getFullYear() === year;
            }).length;
        };

        const currentMonthRevenue = getRevenueForMonth(currentMonth, currentYear);
        const lastMonthRevenue = getRevenueForMonth(lastMonth, lastMonthYear);
        const totalRevenue = globalTransactions.reduce((sum, t) => t.status === 'paid' ? sum + t.amount : sum, 0);

        const revenueGrowth = lastMonthRevenue === 0
            ? (currentMonthRevenue > 0 ? 100 : 0)
            : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        const currentMonthUsers = getUsersCountForMonth(currentMonth, currentYear);
        const lastMonthUsers = getUsersCountForMonth(lastMonth, lastMonthYear);

        const usersGrowth = lastMonthUsers === 0
            ? (currentMonthUsers > 0 ? 100 : 0)
            : ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;

        const activeCourses = courses.filter(c => c.status === 'active').length;

        return {
            revenue: totalRevenue,
            revenueGrowth: Math.round(revenueGrowth),
            usersCount: users.filter(u => u.status === 'active').length,
            usersGrowth: Math.round(usersGrowth),
            coursesCount: activeCourses,
            coursesGrowth: 0,
            transactionsCount: globalTransactions.length,
            booksCount: books.length,
            totalTokens: totalPlatformTokens
        };
    }, [globalTransactions, users, courses, books, totalPlatformTokens]);

    const value = useMemo(() => ({
        users, courses, books, transactions: globalTransactions, notifications: adminNotifications, adminUser: currentUser, systemSettings,
        addUser, updateUser, deleteUser,
        addCourse, updateCourse, deleteCourse, updateCourseStatus,
        addBook, updateBook, deleteBook,
        updateTransactionStatus, updateSystemSettings,
        trackAiUsage,
        markNotificationRead, markAllNotificationsRead, exportData,
        stats,
        refreshBooks: refreshData,
        refreshCourses: refreshData,
        sendNotification
    }), [
        users, courses, books, globalTransactions, adminNotifications, currentUser, systemSettings, stats,
        addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse, updateCourseStatus,
        addBook, updateBook, deleteBook, updateTransactionStatus, updateSystemSettings, trackAiUsage,
        markNotificationRead, markAllNotificationsRead, exportData
    ]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error("useAdmin must be used within AdminProvider");
    return context;
};
