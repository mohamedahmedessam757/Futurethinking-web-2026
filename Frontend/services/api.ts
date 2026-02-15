// Supabase API Service - Real backend calls
// Replaces mock API with Supabase queries

import { supabase, db } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['profiles']['Row'];
type ConsultantProfile = Database['public']['Tables']['consultant_profiles']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];
type Book = Database['public']['Tables']['books']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Certificate = Database['public']['Tables']['certificates']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];

export const api = {
    // Users
    getUsers: async (): Promise<User[]> => {
        const { data, error } = await db.profiles.getAll();
        if (error) throw error;
        return data || [];
    },

    // Consultants
    getConsultantProfiles: async (): Promise<ConsultantProfile[]> => {
        const { data, error } = await db.consultantProfiles.getAll();
        if (error) throw error;
        return data || [];
    },

    // Courses
    getCourses: async (): Promise<Course[]> => {
        const { data, error } = await db.courses.getAll();
        if (error) throw error;
        return data || [];
    },

    getCourse: async (id: string): Promise<Course | null> => {
        const { data, error } = await db.courses.get(id);
        if (error) throw error;
        return data;
    },

    // Books
    getBooks: async (): Promise<Book[]> => {
        const { data, error } = await db.books.getAll();
        if (error) throw error;
        return data || [];
    },

    getBook: async (id: string): Promise<Book | null> => {
        const { data, error } = await db.books.get(id);
        if (error) throw error;
        return data;
    },

    // Transactions
    getTransactions: async (): Promise<Transaction[]> => {
        const { data, error } = await db.transactions.getAll();
        if (error) throw error;
        return data || [];
    },

    getUserTransactions: async (userId: string): Promise<Transaction[]> => {
        const { data, error } = await db.transactions.getByUser(userId);
        if (error) throw error;
        return data || [];
    },

    // Notifications
    getNotifications: async (): Promise<Notification[]> => {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    getUserNotifications: async (userId: string): Promise<Notification[]> => {
        const { data, error } = await db.notifications.getByUser(userId);
        if (error) throw error;
        return data || [];
    },

    // Appointments
    getAppointments: async (): Promise<Appointment[]> => {
        const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    getUserAppointments: async (userId: string): Promise<Appointment[]> => {
        const { data, error } = await db.appointments.getByStudent(userId);
        if (error) throw error;
        return data || [];
    },

    getConsultantAppointments: async (consultantId: string): Promise<Appointment[]> => {
        const { data, error } = await db.appointments.getByConsultant(consultantId);
        if (error) throw error;
        return data || [];
    },

    // Certificates
    getCertificates: async (): Promise<Certificate[]> => {
        const { data, error } = await supabase.from('certificates').select('*');
        if (error) throw error;
        return data || [];
    },

    getUserCertificates: async (studentId: string): Promise<Certificate[]> => {
        const { data, error } = await db.certificates.getByStudent(studentId);
        if (error) throw error;
        return data || [];
    },

    verifyCertificate: async (serialNumber: string): Promise<Certificate | null> => {
        const { data, error } = await db.certificates.get(serialNumber);
        if (error) return null;
        return data;
    },

    // Reviews
    getReviews: async (): Promise<Review[]> => {
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    getCourseReviews: async (courseId: string): Promise<Review[]> => {
        const { data, error } = await db.reviews.getByTarget('course', courseId);
        if (error) throw error;
        return data || [];
    },

    getConsultantReviews: async (consultantId: string): Promise<Review[]> => {
        const { data, error } = await db.reviews.getByTarget('consultant', consultantId);
        if (error) throw error;
        return data || [];
    },

    // Course Enrollments
    getEnrollments: async (studentId: string) => {
        const { data, error } = await db.enrollments.getByStudent(studentId);
        if (error) throw error;
        return data || [];
    },

    checkEnrollment: async (courseId: string, studentId: string): Promise<boolean> => {
        const { data } = await supabase.from('course_enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('student_id', studentId)
            .single();
        return !!data;
    },

    // Book Purchases
    checkBookOwnership: async (bookId: string, userId: string): Promise<boolean> => {
        const { data } = await db.bookPurchases.check(bookId, userId);
        return !!data;
    },

    // System Settings
    getSettings: async () => {
        const { data, error } = await db.settings.get();
        if (error) throw error;
        return data;
    },

    // Consultation Services
    getConsultationServices: async () => {
        const { data, error } = await supabase.from('consultation_services').select('*');
        if (error) throw error;
        return data || [];
    },

    getActiveServices: async () => {
        const { data, error } = await supabase.from('consultation_services')
            .select('*, profiles(*)')
            .eq('status', 'active');
        if (error) throw error;
        return data || [];
    },
};
