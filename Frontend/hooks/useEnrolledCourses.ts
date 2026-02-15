import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Course } from '../types/store';

export const useEnrolledCourses = (userId: string | undefined) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchEnrolledCourses = useCallback(async (force = false) => {
        if (!userId || (hasLoaded && !force)) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch enrollments with course details and lessons (for duration calculation)
            const { data, error } = await supabase
                .from('course_enrollments')
                .select(`
                    *,
                    course:courses (
                        *,
                        lessons (duration)
                    )
                `)
                .eq('student_id', userId);

            if (error) throw error;

            const mappedCourses: any[] = (data || []).map((enrollment: any) => {
                const c = enrollment.course;
                if (!c) return null;

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
                    studentsEnrolled: [], // We don't need the full list here
                    progressMap: { [userId]: enrollment.progress || 0 }, // Map current user progress
                    lessons: c.lessons || [], // Include lessons mainly for stats/duration
                    reviews: [], // Not fetching reviews here
                    lessonsCount: c.lessons?.length || 0,
                    completed: enrollment.progress === 100, // Derived from enrollment
                    progress: enrollment.progress || 0,
                    completedAt: enrollment.completed_at,
                    enrolledAt: enrollment.created_at
                };
            }).filter(Boolean);

            setCourses(mappedCourses);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching enrolled courses:', err);
            setError(err.message || 'Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    }, [userId, hasLoaded]);

    return {
        courses,
        isLoading,
        error,
        fetchCourses: fetchEnrolledCourses,
        refetch: () => fetchEnrolledCourses(true)
    };
};
