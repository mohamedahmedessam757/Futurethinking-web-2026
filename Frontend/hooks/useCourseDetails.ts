import { useState, useEffect } from 'react';
import { supabase, db } from '../lib/supabase';
import { Course } from '../types/store';

export const useCourseDetails = (courseId: string | null | undefined) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) {
            setCourse(null);
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data: c, error: courseError } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('id', courseId)
                    .single();

                if (courseError) throw courseError;
                if (!c) throw new Error('Course not found');

                // Fetch lessons
                const { data: lessons, error: lessonsError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('course_id', courseId)
                    .order('created_at', { ascending: true });

                if (lessonsError) throw lessonsError;

                // Fetch reviews
                const { data: reviews, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('target_id', courseId)
                    .eq('target_type', 'course');

                if (reviewsError) throw reviewsError;

                // Fetch Enrollments (to get student IDs)
                const { data: enrollments, error: enrollError } = await supabase
                    .from('course_enrollments')
                    .select('student_id, progress')
                    .eq('course_id', courseId);

                if (enrollError) throw enrollError;


                const fullCourse: Course = {
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
                    lessons: (lessons || []).map((l: any) => ({
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
                        content_segments: l.content_segments || [],
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

                setCourse(fullCourse);
            } catch (err: any) {
                console.error('Error fetching course details:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [courseId]);

    return { course, isLoading, error };
};
