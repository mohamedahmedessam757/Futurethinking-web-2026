// AI Course Storage Service
// Handles saving AI-generated courses to Supabase

import { supabase } from '../lib/supabase';
import { CourseSettings, TrainingCourse, EnhancedLesson } from '../types/store';

export interface AICourseGenerationRecord {
    id?: string;
    creator_id: string;
    title: string;
    description?: string;
    status: 'generating' | 'completed' | 'failed' | 'published';
    settings: CourseSettings;
    source_content?: string;
    source_file_url?: string;
    parsed_data?: any;
    extracted_style?: any;
    course_structure?: any;
    generation_progress?: any;
    published_course_id?: string;
}

export interface AIGeneratedLessonRecord {
    id?: string;
    generation_id: string;
    lesson_id: string;
    unit_number: number;
    lesson_number: number;
    title: string;
    duration?: string;
    script?: string;
    script_summary?: string;
    quiz_data?: any[];
    training_scenarios?: any[];
    voice_url?: string;
    voice_duration?: number;
    video_url?: string;
    image_urls?: string[];
    content_segments?: any; // JSONB
    tokens_used?: number;
    is_generated?: boolean;
}

// Helper for Supabase Timeouts
const supabaseWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 60000, operationName = 'Operation'): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Timeout: ${operationName} took longer than ${timeoutMs / 1000}s`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
};

export const aiCourseStorage = {
    /**
     * Create a new AI course generation job
     */
    createGeneration: async (
        creatorId: string,
        title: string,
        settings: CourseSettings,
        sourceContent?: string,
        sourceFileUrl?: string,
        parsedData?: any
    ): Promise<{ success: boolean; generationId?: string; error?: string }> => {

        try {
            // Using explicit type assertion for result
            const result = await supabaseWithTimeout(
                supabase
                    .from('ai_course_generations')
                    .insert({
                        creator_id: creatorId,
                        title,
                        status: 'generating',
                        settings,
                        source_content: sourceContent,
                        source_file_url: sourceFileUrl,
                        parsed_data: parsedData,
                        generation_progress: { phase: 'started', completedSteps: 0, totalSteps: 0 },
                    })
                    .select('id')
                    .single(),
                15000,
                'Database Insert Generation'
            );

            const { data, error } = result;

            if (error) throw error;


            return { success: true, generationId: data.id };
        } catch (err: any) {
            console.error('❌ [Storage] Error creating generation:', err);
            return { success: false, error: err.message || 'Database timeout' };
        }
    },

    /**
     * Update generation status and progress
     */
    updateGeneration: async (
        generationId: string,
        updates: Partial<AICourseGenerationRecord>
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('ai_course_generations')
                .update(updates)
                .eq('id', generationId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error updating generation:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Save course structure
     */
    saveCourseStructure: async (
        generationId: string,
        courseStructure: TrainingCourse
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('ai_course_generations')
                .update({
                    course_structure: courseStructure,
                    title: courseStructure.title,
                    description: courseStructure.description,
                })
                .eq('id', generationId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error saving structure:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Save a generated lesson
     */
    saveLesson: async (
        generationId: string,
        unitNumber: number,
        lessonNumber: number,
        lesson: EnhancedLesson
    ): Promise<{ success: boolean; error?: string }> => {
        if (!generationId) {
            return { success: false, error: 'No generationId provided' };
        }

        try {
            // 1. Check if lesson exists (use maybeSingle to avoid PGRST116)
            const { data: existing } = await supabase
                .from('ai_generated_lessons')
                .select('id')
                .eq('generation_id', generationId)
                .eq('lesson_id', lesson.id)
                .maybeSingle();

            // Build payload — CRITICAL: Do NOT include media fields when undefined
            // to prevent overwriting previously saved URLs with NULL
            const payload: Record<string, any> = {
                generation_id: generationId,
                lesson_id: lesson.id,
                unit_number: unitNumber,
                lesson_number: lessonNumber,
                title: lesson.title,
                duration: lesson.duration,
                script: lesson.script,
                script_summary: lesson.scriptSummary,
                quiz_data: lesson.quizData,
                training_scenarios: lesson.trainingScenarios,
                content_segments: lesson.segments,
                is_generated: lesson.isGenerated,
            };

            // Only include media fields when they have actual values
            // This prevents saveLesson() from erasing URLs saved by updateLessonMedia()
            if (lesson.voiceUrl !== undefined) payload.voice_url = lesson.voiceUrl;
            if (lesson.voiceDuration !== undefined) payload.voice_duration = lesson.voiceDuration;
            if (lesson.videoUrl !== undefined) payload.video_url = lesson.videoUrl;

            // Fix: image_urls — read from images[] (array) OR imageUrl (string)
            const resolvedImages = lesson.images?.length
                ? lesson.images
                : lesson.imageUrl
                    ? [lesson.imageUrl]
                    : undefined;
            if (resolvedImages !== undefined) payload.image_urls = resolvedImages;

            let error;
            if (existing) {
                // Update
                const result = await supabase
                    .from('ai_generated_lessons')
                    .update(payload)
                    .eq('id', existing.id);
                error = result.error;
            } else {
                // Insert
                const result = await supabase
                    .from('ai_generated_lessons')
                    .insert(payload);
                error = result.error;
            }

            if (error) {
                // Handle FK constraint error specifically
                if (error.code === '23503') {
                    console.warn('[saveLesson] Generation record not found in DB. generationId:', generationId);
                    return { success: false, error: 'سجل التوليد غير موجود في قاعدة البيانات. يرجى إعادة إنشاء الكورس.' };
                }
                throw error;
            }
            return { success: true };
        } catch (err: any) {
            console.error('Error saving lesson:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Update lesson with voice/media
     */
    updateLessonMedia: async (
        generationId: string,
        lessonId: string,
        updates: { voice_url?: string; voice_duration?: number; video_url?: string; image_urls?: string[]; content_segments?: any; tokens_used?: number }
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            // Clean undefined values
            const cleanUpdates: Record<string, any> = {};
            for (const [key, value] of Object.entries(updates)) {
                if (value !== undefined) cleanUpdates[key] = value;
            }

            if (Object.keys(cleanUpdates).length === 0) {
                console.warn('[updateLessonMedia] ⚠️ All values were undefined, nothing to update.', { generationId, lessonId });
                return { success: true };
            }

            console.log('[updateLessonMedia] 📝 Updating:', { generationId, lessonId, cleanUpdates });

            const { data, error } = await supabase
                .from('ai_generated_lessons')
                .update(cleanUpdates)
                .eq('generation_id', generationId)
                .eq('lesson_id', lessonId)
                .select('id'); // Select to verify update

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn('[updateLessonMedia] No rows matched for update:', { generationId, lessonId });
                // We return success: false but don't throw to avoid crashing UI, just warn
                return { success: false, error: 'لم يتم العثور على الدرس لتحديثه' };
            }
            console.log('[updateLessonMedia] ✅ Updated', data?.length, 'row(s)');
            return { success: true };
        } catch (err: any) {
            console.error('Error updating lesson media:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Mark generation as complete
     */
    completeGeneration: async (
        generationId: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('ai_course_generations')
                .update({
                    status: 'completed',
                    generation_progress: { phase: 'complete', completedSteps: 100, totalSteps: 100 },
                })
                .eq('id', generationId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error completing generation:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Publish course (create in courses table and link)
     */
    publishCourse: async (
        generationId: string,
        instructorId: string,
        instructorName: string,
        price: number = 0,
        imageUrl?: string
    ): Promise<{ success: boolean; courseId?: string; error?: string }> => {
        try {
            // Validate inputs
            if (!generationId) {
                return { success: false, error: 'لا يوجد معرف التوليد (generationId)' };
            }
            if (!instructorId) {
                return { success: false, error: 'لا يوجد معرف المدرب (instructorId)' };
            }

            // Step 1: Get generation data (use maybeSingle to avoid PGRST116)
            const { data: generation, error: genError } = await supabase
                .from('ai_course_generations')
                .select('*, ai_generated_lessons(*)')
                .eq('id', generationId)
                .maybeSingle();

            if (genError) {
                console.error('[Publish] Step 1 failed - generation fetch:', genError);
                throw new Error(`فشل في جلب بيانات التوليد: ${genError.message}`);
            }

            if (!generation) {
                return { success: false, error: `لم يتم العثور على سجل التوليد (${generationId}). يرجى إعادة إنشاء الكورس.` };
            }

            // Step 2: Create course (separate INSERT from SELECT to avoid RLS issues)
            const coursePayload = {
                title: generation.title || 'دورة تدريبية',
                description: generation.description || '',
                instructor_id: instructorId,
                instructor_name: instructorName || 'مدرب',
                price,
                status: 'draft' as const,
                level: 'intermediate' as const,
                image: imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000',
                category: 'AI Generated',
            };

            const { data: insertedCourses, error: courseError } = await supabase
                .from('courses')
                .insert(coursePayload)
                .select('id');

            if (courseError) {
                console.error('[Publish] Step 2 failed - course insert:', courseError);
                throw new Error(`فشل في إنشاء الكورس: ${courseError.message}`);
            }

            // Handle case where INSERT succeeds but SELECT returns empty (RLS)
            const course = insertedCourses?.[0];
            if (!course?.id) {
                console.error('[Publish] Step 2 - course inserted but not returned. RLS SELECT policy may be blocking.');
                return { success: false, error: 'تم إنشاء الكورس لكن فشل في جلب المعرف. تحقق من سياسات RLS على جدول courses.' };
            }

            // Step 3: Create lessons in courses table
            const lessonRecords = (generation.ai_generated_lessons || []).map((lesson: any, idx: number) => ({
                course_id: course.id,
                title: lesson.title,
                duration: lesson.duration,
                type: 'video',
                is_free: idx === 0,
                video_url: lesson.video_url,
                voice_url: lesson.voice_url,
                voice_duration: lesson.voice_duration,
                image_urls: lesson.image_urls,
                script: lesson.script,
                quiz_data: lesson.quiz_data,
                training_scenarios: lesson.training_scenarios,
                content_segments: lesson.content_segments,
                sort_order: lesson.unit_number * 100 + lesson.lesson_number,
            }));

            if (lessonRecords.length > 0) {
                const { error: lessonsError } = await supabase
                    .from('lessons')
                    .insert(lessonRecords);

                if (lessonsError) {
                    console.error('[Publish] Step 3 failed - lessons insert:', lessonsError);
                    // Non-blocking: course was created, lessons failed
                }
            }

            // Step 4: Update generation with published course ID
            const { error: updateGenError } = await supabase
                .from('ai_course_generations')
                .update({
                    status: 'published',
                    published_course_id: course.id,
                })
                .eq('id', generationId);

            if (updateGenError) {
                console.error('[Publish] Step 4 - generation update warning:', updateGenError);
                // Non-blocking: course was created
            }

            return { success: true, courseId: course.id };
        } catch (err: any) {
            console.error('Error publishing course:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get all generations for a user
     */
    getGenerations: async (
        creatorId: string
    ): Promise<{ success: boolean; data?: any[]; error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('ai_course_generations')
                .select('id, title, status, created_at, settings, description, script_summary, ai_generated_lessons(count)') // Added settings, description, summary
                .eq('creator_id', creatorId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (err: any) {
            console.error('Error fetching generations:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get single generation with lessons
     */
    getGeneration: async (
        generationId: string
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('ai_course_generations')
                .select('*, ai_generated_lessons(*)')
                .eq('id', generationId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (err: any) {
            console.error('Error fetching generation:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Upload file to Supabase Storage
     */
    uploadSourceFile: async (
        file: File,
        creatorId: string
    ): Promise<{ success: boolean; url?: string; error?: string }> => {

        try {
            // Sanitize filename to avoid "Invalid Key" errors with Arabic/Special chars
            const fileExt = file.name.split('.').pop() || 'file';
            const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const fileName = `${creatorId}/${safeFileName}`;

            const { data, error } = await supabaseWithTimeout(
                supabase.storage
                    .from('training-bags')
                    .upload(fileName, file),
                45000, // 45s timeout for uploads
                'File Upload'
            );

            if (error) throw error;

            // Get public URL (Sync operation, instant)
            const { data: urlData } = supabase.storage
                .from('training-bags')
                .getPublicUrl(fileName);


            return { success: true, url: urlData.publicUrl };
        } catch (err: any) {
            console.error('❌ [Storage] Error uploading file:', err);
            return { success: false, error: err.message || 'Upload timeout or error' };
        }
    },

    /**
     * Delete a generation and its lessons
     */
    deleteGeneration: async (
        generationId: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            // Lessons will cascade delete
            const { error } = await supabase
                .from('ai_course_generations')
                .delete()
                .eq('id', generationId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting generation:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Update generation progress and state
     */
    updateGenerationProgress: async (
        generationId: string,
        updates: {
            progress?: any;
            settings?: CourseSettings;
            sourceContent?: string;
            courseStructure?: any;
            status?: 'generating' | 'completed' | 'failed';
            sourceFileUrl?: string;
            parsedData?: any;
        }
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const dbUpdates: any = {};
            if (updates.progress) dbUpdates.generation_progress = updates.progress;
            if (updates.settings) dbUpdates.settings = updates.settings;
            if (updates.sourceContent) dbUpdates.source_content = updates.sourceContent;
            if (updates.courseStructure) dbUpdates.course_structure = updates.courseStructure;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.sourceFileUrl) dbUpdates.source_file_url = updates.sourceFileUrl;
            if (updates.parsedData) dbUpdates.parsed_data = updates.parsedData;

            const { error } = await supabase
                .from('ai_course_generations')
                .update(dbUpdates)
                .eq('id', generationId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error updating progress:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get the latest in-progress generation for a user
     */
    getLatestInProgressGeneration: async (
        creatorId: string
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('ai_course_generations')
                .select('*')
                .eq('creator_id', creatorId)
                .eq('status', 'generating')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
            return { success: true, data };
        } catch (err: any) {
            // 406 is acceptable if no rows found
            if (err.code === 'PGRST116') return { success: true, data: null };
            console.error('Error fetching latest generation:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get all generated lessons for a draft
     */
    getGenerationLessons: async (
        generationId: string
    ): Promise<AIGeneratedLessonRecord[]> => {
        try {
            const { data } = await supabase
                .from('ai_generated_lessons')
                .select('*')
                .eq('generation_id', generationId)
                .order('lesson_number', { ascending: true }); // naive ordering, usually safe

            return data || [];
        } catch (err: any) {
            console.error('Error fetching lessons:', err);
            return [];
        }
    },

    /**
     * Upload asset (Image/Video/Voice) to Supabase Storage
     */
    uploadAsset: async (
        file: Blob | File,
        type: 'voice' | 'image' | 'video',
        userId: string
    ): Promise<{ success: boolean; url?: string; error?: string }> => {
        try {
            const ext = type === 'voice' ? 'mp3' : type === 'video' ? 'mp4' : 'png';
            const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const filePath = `${userId}/${type}s/${fileName}`;

            const { data, error } = await supabase.storage
                .from('ai-course-assets')
                .upload(filePath, file, {
                    contentType: type === 'voice' ? 'audio/mpeg' : type === 'video' ? 'video/mp4' : 'image/png',
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('ai-course-assets')
                .getPublicUrl(filePath);

            return { success: true, url: urlData.publicUrl };
        } catch (err: any) {
            console.error(`Error uploading ${type}:`, err);
            return { success: false, error: err.message };
        }
    },
};

export default aiCourseStorage;
