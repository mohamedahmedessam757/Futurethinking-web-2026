import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Course } from '../components/GlobalContext';

interface UseAdminCoursesOptions {
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'draft';
    search?: string;
}

interface UseAdminCoursesResult {
    courses: Course[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    totalPages: number;
    refresh: () => Promise<void>;
    updateLocalCourse: (id: string, data: Partial<Course>) => void;
}

export const useAdminCourses = ({ page = 1, limit = 10, status = 'all', search = '' }: UseAdminCoursesOptions) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('courses')
                .select('*, course_enrollments(count), lessons(*)', { count: 'exact' });

            // Apply Filters
            if (status !== 'all') {
                query = query.eq('status', status);
            }

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            const coursesWithStats = data?.map((course: any) => ({
                ...course,
                // Create dummy array to satisfy .length property used in UI
                studentsEnrolled: new Array(course.course_enrollments?.[0]?.count || 0).fill('dummy'),
                reviews: [] // Populate if needed
            })) || [];

            setCourses(coursesWithStats as any);
            setTotalCount(count || 0);

        } catch (err: any) {
            console.error('[useAdminCourses] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, status, search]);

    // Initial Fetch
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-courses-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'courses' },
                () => {
                    fetchCourses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchCourses]);

    const updateLocalCourse = (id: string, data: Partial<Course>) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };

    return {
        courses,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        refresh: fetchCourses,
        updateLocalCourse
    };
};
