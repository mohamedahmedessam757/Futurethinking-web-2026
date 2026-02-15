// TypeScript types generated from Supabase schema
// Location: Frontend/lib/database.types.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    email: string
                    role: 'admin' | 'student' | 'consultant'
                    subscription_tier: 'free' | 'pro' | 'enterprise'
                    avatar: string | null
                    bio: string | null
                    title: string | null
                    join_date: string
                    status: 'active' | 'inactive'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    email: string
                    role: 'admin' | 'student' | 'consultant'
                    subscription_tier?: 'free' | 'pro' | 'enterprise'
                    avatar?: string | null
                    bio?: string | null
                    title?: string | null
                    join_date?: string
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    role?: 'admin' | 'student' | 'consultant'
                    subscription_tier?: 'free' | 'pro' | 'enterprise'
                    avatar?: string | null
                    bio?: string | null
                    title?: string | null
                    join_date?: string
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
            }
            consultant_profiles: {
                Row: {
                    id: string
                    user_id: string
                    specialization: string
                    hourly_rate: number
                    intro_video_url: string | null
                    rating_average: number
                    reviews_count: number
                    is_verified: boolean
                    available_slots: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    specialization: string
                    hourly_rate?: number
                    intro_video_url?: string | null
                    rating_average?: number
                    reviews_count?: number
                    is_verified?: boolean
                    available_slots?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    specialization?: string
                    hourly_rate?: number
                    intro_video_url?: string | null
                    rating_average?: number
                    reviews_count?: number
                    is_verified?: boolean
                    available_slots?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            consultation_services: {
                Row: {
                    id: string
                    consultant_id: string
                    title: string
                    description: string | null
                    price: number
                    duration: number
                    status: 'pending' | 'active' | 'draft' | 'rejected'
                    rejection_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    consultant_id: string
                    title: string
                    description?: string | null
                    price: number
                    duration: number
                    status?: 'pending' | 'active' | 'draft' | 'rejected'
                    rejection_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    consultant_id?: string
                    title?: string
                    description?: string | null
                    price?: number
                    duration?: number
                    status?: 'pending' | 'active' | 'draft' | 'rejected'
                    rejection_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            courses: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    instructor_id: string
                    instructor_name: string
                    price: number
                    status: 'active' | 'draft' | 'archived'
                    image: string | null
                    promo_video_url: string | null
                    level: 'beginner' | 'intermediate' | 'advanced'
                    category: string | null
                    revenue: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    instructor_id: string
                    instructor_name: string
                    price?: number
                    status?: 'active' | 'draft' | 'archived'
                    image?: string | null
                    promo_video_url?: string | null
                    level?: 'beginner' | 'intermediate' | 'advanced'
                    category?: string | null
                    revenue?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    instructor_id?: string
                    instructor_name?: string
                    price?: number
                    status?: 'active' | 'draft' | 'archived'
                    image?: string | null
                    promo_video_url?: string | null
                    level?: 'beginner' | 'intermediate' | 'advanced'
                    category?: string | null
                    revenue?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            lessons: {
                Row: {
                    id: string
                    course_id: string
                    title: string
                    duration: string | null
                    type: 'video' | 'quiz' | 'reading'
                    is_free: boolean
                    video_url: string | null
                    sort_order: number
                    objectives: Json
                    script: string | null
                    slides: Json
                    quiz_data: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    title: string
                    duration?: string | null
                    type: 'video' | 'quiz' | 'reading'
                    is_free?: boolean
                    video_url?: string | null
                    sort_order?: number
                    objectives?: Json
                    script?: string | null
                    slides?: Json
                    quiz_data?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    title?: string
                    duration?: string | null
                    type?: 'video' | 'quiz' | 'reading'
                    is_free?: boolean
                    video_url?: string | null
                    sort_order?: number
                    objectives?: Json
                    script?: string | null
                    slides?: Json
                    quiz_data?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            course_enrollments: {
                Row: {
                    id: string
                    course_id: string
                    student_id: string
                    progress: number
                    enrolled_at: string
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    course_id: string
                    student_id: string
                    progress?: number
                    enrolled_at?: string
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    course_id?: string
                    student_id?: string
                    progress?: number
                    enrolled_at?: string
                    completed_at?: string | null
                }
            }
            books: {
                Row: {
                    id: string
                    title: string
                    author: string
                    description: string | null
                    price: number
                    cover_image: string | null
                    file_url: string | null
                    preview_url: string | null
                    category: string | null
                    pages: number
                    publish_year: string | null
                    status: 'active' | 'draft'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    author: string
                    description?: string | null
                    price: number
                    cover_image?: string | null
                    file_url?: string | null
                    preview_url?: string | null
                    category?: string | null
                    pages?: number
                    publish_year?: string | null
                    status?: 'active' | 'draft'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    author?: string
                    description?: string | null
                    price?: number
                    cover_image?: string | null
                    file_url?: string | null
                    preview_url?: string | null
                    category?: string | null
                    pages?: number
                    publish_year?: string | null
                    status?: 'active' | 'draft'
                    created_at?: string
                    updated_at?: string
                }
            }
            book_purchases: {
                Row: {
                    id: string
                    book_id: string
                    user_id: string
                    purchased_at: string
                }
                Insert: {
                    id?: string
                    book_id: string
                    user_id: string
                    purchased_at?: string
                }
                Update: {
                    id?: string
                    book_id?: string
                    user_id?: string
                    purchased_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    user_id: string
                    user_name: string
                    user_avatar: string | null
                    rating: number
                    comment: string | null
                    admin_reply: string | null
                    target_type: 'course' | 'book' | 'consultant'
                    target_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    user_name: string
                    user_avatar?: string | null
                    rating: number
                    comment?: string | null
                    admin_reply?: string | null
                    target_type: 'course' | 'book' | 'consultant'
                    target_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    user_name?: string
                    user_avatar?: string | null
                    rating?: number
                    comment?: string | null
                    admin_reply?: string | null
                    target_type?: 'course' | 'book' | 'consultant'
                    target_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            appointments: {
                Row: {
                    id: string
                    student_id: string
                    student_name: string
                    consultant_id: string
                    consultant_name: string
                    service_id: string | null
                    title: string
                    date: string
                    time: string
                    type: 'video' | 'chat'
                    status: 'confirmed' | 'completed' | 'cancelled'
                    preferred_platform: 'zoom' | 'google_meet' | 'teams' | 'discord' | null
                    meeting_link: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    student_name: string
                    consultant_id: string
                    consultant_name: string
                    service_id?: string | null
                    title: string
                    date: string
                    time: string
                    type: 'video' | 'chat'
                    status?: 'confirmed' | 'completed' | 'cancelled'
                    preferred_platform?: 'zoom' | 'google_meet' | 'teams' | 'discord' | null
                    meeting_link?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    student_name?: string
                    consultant_id?: string
                    consultant_name?: string
                    service_id?: string | null
                    title?: string
                    date?: string
                    time?: string
                    type?: 'video' | 'chat'
                    status?: 'confirmed' | 'completed' | 'cancelled'
                    preferred_platform?: 'zoom' | 'google_meet' | 'teams' | 'discord' | null
                    meeting_link?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    user_name: string
                    item_type: 'course' | 'book' | 'consultation' | 'subscription'
                    item_id: string | null
                    item_name: string
                    amount: number
                    currency: string
                    status: 'paid' | 'pending' | 'failed' | 'refunded'
                    payment_method: 'Visa' | 'Mastercard' | 'ApplePay' | 'Bank Transfer' | 'System' | null
                    moyasar_payment_id: string | null
                    moyasar_invoice_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    user_name: string
                    item_type: 'course' | 'book' | 'consultation' | 'subscription'
                    item_id?: string | null
                    item_name: string
                    amount: number
                    currency?: string
                    status?: 'paid' | 'pending' | 'failed' | 'refunded'
                    payment_method?: 'Visa' | 'Mastercard' | 'ApplePay' | 'Bank Transfer' | 'System' | null
                    moyasar_payment_id?: string | null
                    moyasar_invoice_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    user_name?: string
                    item_type?: 'course' | 'book' | 'consultation' | 'subscription'
                    item_id?: string | null
                    item_name?: string
                    amount?: number
                    currency?: string
                    status?: 'paid' | 'pending' | 'failed' | 'refunded'
                    payment_method?: 'Visa' | 'Mastercard' | 'ApplePay' | 'Bank Transfer' | 'System' | null
                    moyasar_payment_id?: string | null
                    moyasar_invoice_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    target_user_id: string | null
                    target_role: string | null
                    title: string
                    message: string
                    type: 'success' | 'info' | 'warning' | 'error'
                    link: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    target_user_id?: string | null
                    target_role?: string | null
                    title: string
                    message: string
                    type?: 'success' | 'info' | 'warning' | 'error'
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    target_user_id?: string | null
                    target_role?: string | null
                    title?: string
                    message?: string
                    type?: 'success' | 'info' | 'warning' | 'error'
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            certificates: {
                Row: {
                    id: string
                    student_id: string
                    student_name: string
                    course_id: string
                    course_title: string
                    instructor_name: string
                    serial_number: string
                    issue_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    student_name: string
                    course_id: string
                    course_title: string
                    instructor_name: string
                    serial_number: string
                    issue_date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    student_name?: string
                    course_id?: string
                    course_title?: string
                    instructor_name?: string
                    serial_number?: string
                    issue_date?: string
                    created_at?: string
                }
            }
            ai_drafts: {
                Row: {
                    id: string
                    consultant_id: string
                    type: 'syllabus' | 'script' | 'quiz' | 'resources'
                    title: string
                    content: string
                    tokens_used: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    consultant_id: string
                    type: 'syllabus' | 'script' | 'quiz' | 'resources'
                    title: string
                    content: string
                    tokens_used?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    consultant_id?: string
                    type?: 'syllabus' | 'script' | 'quiz' | 'resources'
                    title?: string
                    content?: string
                    tokens_used?: number
                    created_at?: string
                }
            }
            system_settings: {
                Row: {
                    id: number
                    site_name: string
                    maintenance_mode: boolean
                    support_email: string
                    allow_registration: boolean
                    total_platform_tokens: number
                    updated_at: string
                }
                Insert: {
                    id?: number
                    site_name?: string
                    maintenance_mode?: boolean
                    support_email?: string
                    allow_registration?: boolean
                    total_platform_tokens?: number
                    updated_at?: string
                }
                Update: {
                    id?: number
                    site_name?: string
                    maintenance_mode?: boolean
                    support_email?: string
                    allow_registration?: boolean
                    total_platform_tokens?: number
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_user_role: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
