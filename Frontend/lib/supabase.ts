// Supabase Client with Realtime Support
// Location: Frontend/lib/supabase.ts

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// ============================================================
// AUTH HELPERS
// ============================================================

export const auth = {
    signUp: async (email: string, password: string, metadata: { name: string; role: 'student' | 'consultant' }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
        })
        return { data, error }
    },

    signInWithOAuth: async (provider: 'google', options?: any) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options
        })
        return { data, error }
    },

    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { data, error }
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    },

    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    },

    updateUser: async (attributes: any) => {
        const { data, error } = await supabase.auth.updateUser(attributes)
        return { data, error }
    },

    resetPassword: async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { data, error }
    },

    updatePassword: async (newPassword: string) => {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword })
        return { data, error }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return supabase.auth.onAuthStateChange(callback)
    },
}

// ============================================================
// DATABASE HELPERS
// ============================================================

export const db = {
    // Profiles
    profiles: {
        get: (id: string) => supabase.from('profiles').select('*').eq('id', id).single(),
        getByEmail: (email: string) => supabase.from('profiles').select('*').eq('email', email).single(),
        update: (id: string, data: any) => supabase.from('profiles').update(data).eq('id', id),
        getAll: () => supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        create: (data: any) => supabase.from('profiles').insert(data),
    },

    // Consultant Profiles
    consultantProfiles: {
        getAll: () => supabase.from('consultant_profiles').select('*, profiles(*)'),
        get: (userId: string) => supabase.from('consultant_profiles').select('*, profiles(*)').eq('user_id', userId).single(),
        update: (userId: string, data: any) => supabase.from('consultant_profiles').update(data).eq('user_id', userId),
        upsert: (data: any) => supabase.from('consultant_profiles').upsert(data),
    },

    // Courses
    courses: {
        getAll: () => supabase.from('courses').select('*').order('created_at', { ascending: false }),
        getActive: () => supabase.from('courses').select('*').eq('status', 'active'),
        get: (id: string) => supabase.from('courses').select('*, lessons(*)').eq('id', id).single(),
        create: async (data: any) => {

            try {
                // Get token from localStorage (supabase stores it there)
                const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
                const storedSession = localStorage.getItem(storageKey);
                let token = supabaseAnonKey;

                if (storedSession) {
                    try {
                        const parsed = JSON.parse(storedSession);
                        token = parsed.access_token || supabaseAnonKey;

                    } catch (e) {

                    }
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/courses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('📝 Error:', errText);
                    return { data: null, error: { message: errText } };
                }

                const createdData = await response.json();
                // Return the first created item (since we send one item)
                return { data: createdData && createdData.length > 0 ? createdData[0] : { success: true }, error: null };
            } catch (err: any) {
                console.error('📝 Exception:', err?.message || err);
                return { data: null, error: err };
            }
        },
        update: (id: string, data: any) => supabase.from('courses').update(data).eq('id', id),
        delete: (id: string) => supabase.from('courses').delete().eq('id', id),
    },

    // Lessons
    lessons: {
        getByCourse: (courseId: string) => supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order'),
        create: (data: any) => supabase.from('lessons').insert(data).select().single(),
        update: (id: string, data: any) => supabase.from('lessons').update(data).eq('id', id),
        delete: (id: string) => supabase.from('lessons').delete().eq('id', id),
    },

    // Enrollments
    enrollments: {
        getByStudent: (studentId: string) => supabase.from('course_enrollments').select('*, courses(*)').eq('student_id', studentId),
        getByCourse: (courseId: string) => supabase.from('course_enrollments').select('*, profiles(*)').eq('course_id', courseId),
        enroll: (courseId: string, studentId: string) => supabase.from('course_enrollments').insert({ course_id: courseId, student_id: studentId }),
        updateProgress: (courseId: string, studentId: string, progress: number) =>
            supabase.from('course_enrollments')
                .update({ progress, completed_at: progress === 100 ? new Date().toISOString() : null })
                .eq('course_id', courseId).eq('student_id', studentId),
        check: (courseId: string, studentId: string) =>
            supabase.from('course_enrollments').select('id, progress').eq('course_id', courseId).eq('student_id', studentId).single(),
    },

    // Books
    books: {
        getAll: () => supabase.from('books').select('*').order('created_at', { ascending: false }),
        getActive: () => supabase.from('books').select('*').eq('status', 'active'),
        get: (id: string) => supabase.from('books').select('*').eq('id', id).single(),
        create: async (data: any) => {
            try {
                // Get token from localStorage
                const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
                const storedSession = localStorage.getItem(storageKey);
                let token = supabaseAnonKey;

                if (storedSession) {
                    try {
                        const parsed = JSON.parse(storedSession);
                        token = parsed.access_token || supabaseAnonKey;
                    } catch (e) { /* use anon key */ }
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Book creation failed:', errText);
                    return { data: null, error: { message: errText } };
                }

                return { data: { success: true }, error: null };
            } catch (err: any) {
                console.error('Book creation error:', err?.message);
                return { data: null, error: err };
            }
        },
        update: (id: string, data: any) => supabase.from('books').update(data).eq('id', id),
        delete: (id: string) => supabase.from('books').delete().eq('id', id),
    },

    // Book Purchases
    bookPurchases: {
        getByUser: (userId: string) => supabase.from('book_purchases').select('*, books(*)').eq('user_id', userId),
        check: (bookId: string, userId: string) => supabase.from('book_purchases').select('id').eq('book_id', bookId).eq('user_id', userId).single(),
        create: (bookId: string, userId: string) => supabase.from('book_purchases').insert({ book_id: bookId, user_id: userId }),
    },

    // Reviews
    reviews: {
        getByTarget: (targetType: string, targetId: string) =>
            supabase.from('reviews').select('*').eq('target_type', targetType).eq('target_id', targetId).order('created_at', { ascending: false }),
        create: (data: any) => supabase.from('reviews').insert(data).select().single(),
        update: (id: string, data: any) => supabase.from('reviews').update(data).eq('id', id),
        getAll: () => supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    },

    // Appointments
    appointments: {
        getAll: () => supabase.from('appointments').select('*').order('date', { ascending: true }),
        getByStudent: (studentId: string) => supabase.from('appointments').select('*').eq('student_id', studentId),
        getByConsultant: (consultantId: string) => supabase.from('appointments').select('*').eq('consultant_id', consultantId),
        create: (data: any) => supabase.from('appointments').insert(data).select().single(),
        update: (id: string, data: any) => supabase.from('appointments').update(data).eq('id', id),
    },

    // Transactions
    transactions: {
        getAll: () => supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        getByUser: (userId: string) => supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        create: (data: any) => supabase.from('transactions').insert(data).select().single(),
        update: (id: string, data: any) => supabase.from('transactions').update(data).eq('id', id),
    },

    // Notifications
    notifications: {
        getByUser: (userId: string) => supabase.from('notifications').select('*').eq('target_user_id', userId).order('created_at', { ascending: false }),
        getForAdmin: () => supabase.from('notifications').select('*').eq('target_role', 'admin').order('created_at', { ascending: false }),
        markRead: (id: string) => supabase.from('notifications').update({ is_read: true }).eq('id', id),
        markAllRead: (userId: string) => supabase.from('notifications').update({ is_read: true }).eq('target_user_id', userId),
        create: (data: any) => supabase.from('notifications').insert(data),
    },

    // Certificates
    certificates: {
        getByStudent: (studentId: string) => supabase.from('certificates').select('*').eq('student_id', studentId),
        get: (serialNumber: string) => supabase.from('certificates').select('*').eq('serial_number', serialNumber).single(),
        create: (data: any) => supabase.from('certificates').insert(data).select().single(),
    },

    // Consultation Services
    consultationServices: {
        getAll: () => supabase.from('consultation_services').select('*'),
        getActive: () => supabase.from('consultation_services').select('*, profiles(*)').eq('status', 'active'),
        getByConsultant: (consultantId: string) => supabase.from('consultation_services').select('*').eq('consultant_id', consultantId),
        create: (data: any) => supabase.from('consultation_services').insert(data).select().single(),
        update: (id: string, data: any) => supabase.from('consultation_services').update(data).eq('id', id),
        delete: (id: string) => supabase.from('consultation_services').delete().eq('id', id),
    },

    // AI Drafts
    aiDrafts: {
        getByConsultant: (consultantId: string) => supabase.from('ai_drafts').select('*').eq('consultant_id', consultantId),
        create: (data: any) => supabase.from('ai_drafts').insert(data).select(),
        update: (id: string, data: any) => supabase.from('ai_drafts').update(data).eq('id', id),
        delete: (id: string) => supabase.from('ai_drafts').delete().eq('id', id),
    },

    // System Settings
    settings: {
        get: () => supabase.from('system_settings').select('*').single(),
        update: (data: any) => supabase.from('system_settings').update(data).eq('id', 1),
    },

    // Withdrawal Requests
    withdrawalRequests: {
        getByConsultant: (consultantId: string) => supabase.from('withdrawal_requests').select('*').eq('consultant_id', consultantId).order('created_at', { ascending: false }),
        getAll: () => supabase.from('withdrawal_requests').select('*, profiles(name, email)').order('created_at', { ascending: false }),
        create: (data: any) => supabase.from('withdrawal_requests').insert(data),
        update: (id: string, data: any) => supabase.from('withdrawal_requests').update(data).eq('id', id),
        getPending: () => supabase.from('withdrawal_requests').select('*, profiles(name, email)').eq('status', 'pending').order('created_at', { ascending: true }),
    },
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export const realtime = {
    /**
     * Subscribe to notifications for a user
     */
    subscribeToNotifications: (
        userId: string,
        role: string,
        onInsert: (notification: any) => void,
        onUpdate?: (notification: any) => void
    ): RealtimeChannel => {
        const channel = supabase.channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: role === 'admin' ? `target_role=eq.admin` : `target_user_id=eq.${userId}`,
                },
                (payload) => {

                    onInsert(payload.new)
                }
            )

        if (onUpdate) {
            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: role === 'admin' ? `target_role=eq.admin` : `target_user_id=eq.${userId}`,
                },
                (payload) => onUpdate(payload.new)
            )
        }

        channel.subscribe((status) => {

        })

        return channel
    },

    /**
     * Subscribe to appointments for a user (student or consultant)
     */
    subscribeToAppointments: (
        userId: string,
        role: string,
        onChange: (appointment: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
    ): RealtimeChannel => {
        const filterColumn = role === 'consultant' ? 'consultant_id' : 'student_id'

        const channel = supabase.channel(`appointments:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `${filterColumn}=eq.${userId}`,
                },
                (payload) => {

                    onChange(payload.new || payload.old, payload.eventType as any)
                }
            )
            .subscribe((status) => {

            })

        return channel
    },

    /**
     * Subscribe to course enrollments for an instructor
     */
    subscribeToCourseEnrollments: (
        instructorId: string,
        onEnrollment: (enrollment: any) => void
    ): RealtimeChannel => {
        const channel = supabase.channel(`enrollments:${instructorId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'course_enrollments',
                },
                async (payload) => {
                    // Check if this enrollment is for instructor's course
                    const { data: course } = await supabase.from('courses')
                        .select('instructor_id')
                        .eq('id', payload.new.course_id)
                        .single()

                    if (course?.instructor_id === instructorId) {
                        onEnrollment(payload.new)
                    }
                }
            )
            .subscribe()

        return channel
    },

    /**
     * Subscribe to transactions (for admin)
     */
    subscribeToTransactions: (
        onTransaction: (transaction: any) => void
    ): RealtimeChannel => {
        const channel = supabase.channel('transactions:admin')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transactions',
                },
                (payload) => {

                    onTransaction(payload.new)
                }
            )
            .subscribe()

        return channel
    },

    /**
     * Unsubscribe from a channel
     */
    unsubscribe: (channel: RealtimeChannel) => {
        supabase.removeChannel(channel)
    },

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll: () => {
        supabase.removeAllChannels()
    },
}

// ============================================================
// EDGE FUNCTIONS
// ============================================================

export const functions = {
    createPayment: async (data: {
        amount: number
        item_type: 'course' | 'book' | 'consultation' | 'subscription'
        item_id: string
        item_name: string
        callback_url: string
    }) => {
        const { data: result, error } = await supabase.functions.invoke('create-payment', { body: data })
        return { data: result, error }
    },

    applePayPayment: async (data: {
        token: string
        amount: number
        item_type: 'course' | 'book' | 'consultation' | 'subscription'
        item_id: string
        item_name: string
    }) => {
        const { data: result, error } = await supabase.functions.invoke('applepay-payment', { body: data })
        return { data: result, error }
    },

    generateAIContent: async (data: {
        type: 'syllabus' | 'script' | 'quiz' | 'resources' | 'slides'
        topic: string
        language?: 'ar' | 'en'
        lessonTitle?: string
        objectives?: string[]
        difficulty?: 'beginner' | 'intermediate' | 'advanced'
    }) => {
        const { data: result, error } = await supabase.functions.invoke('generate-ai-content', { body: data })
        return { data: result, error }
    },
}

// ============================================================
// STORAGE HELPERS
// ============================================================

export const storage = {
    upload: async (bucket: string, path: string, file: File, options?: any) => {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            ...options
        })
        return { data, error }
    },

    getPublicUrl: (bucket: string, path: string) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        return data.publicUrl
    },

    getSignedUrl: async (bucket: string, path: string, expiresIn = 3600) => {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
        return { data, error }
    },

    delete: async (bucket: string, paths: string[]) => {
        const { data, error } = await supabase.storage.from(bucket).remove(paths)
        return { data, error }
    },

    download: async (bucket: string, path: string) => {
        const { data, error } = await supabase.storage.from(bucket).download(path)
        return { data, error }
    },
}

export default supabase
