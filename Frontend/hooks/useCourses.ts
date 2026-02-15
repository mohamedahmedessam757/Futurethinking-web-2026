import { useState, useCallback, useEffect } from 'react';
import { supabase, db } from '../lib/supabase';
import { Course } from '../types/store';

export const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Simple caching to avoid refetching if already loaded
    const [hasLoaded, setHasLoaded] = useState(false);

    // Fetch all courses (initially, then we can add pagination if needed)
    const fetchCourses = useCallback(async (force = false) => {
        if (hasLoaded && !force) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`
          *,
          lessons:lessons(count),
          enrollments:course_enrollments(count)
        `)
                .eq('status', 'active') // Filter only active courses for public view
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match Course type
            // Note: This is valid for the list view. 
            // Detailed view (with lessons/reviews) should be fetched individually in a separate hook `useCourseDetails(id)`
            const mappedCourses: any[] = (data || []).map(c => ({
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
                // For list view, we don't need full student list or progress map
                studentsEnrolled: [],
                progressMap: {},
                lessons: [], // Empty for list view to save memory
                reviews: [],
                lessonsCount: c.lessons?.[0]?.count || 0, // Extra field for UI
                enrollmentsCount: c.enrollments?.[0]?.count || 0
            }));

            setCourses(mappedCourses);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching courses:', err);
            setError(err.message || 'Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    }, [hasLoaded]);

    return {
        courses,
        isLoading,
        error,
        fetchCourses,
        refetch: () => fetchCourses(true)
    };
};
