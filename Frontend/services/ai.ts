// AI Service - Wavespeed Integration (DeepSeek v3.2)
// Frontend service for AI content generation using Wavespeed API

import { courseStructurePrompt, lessonScriptPrompt, quizFromContentPrompt, trainingScenarioPrompt, PromptContext, CourseSettings } from './prompts';
import { wavespeedService } from './wavespeed';
import { supabase } from '../lib/supabase';

// Wavespeed/DeepSeek Constants
const WAVESPEED_LLM_URL = 'https://llm.wavespeed.ai/v1';
const WAVESPEED_MODELS = {
    TEXT: 'deepseek/deepseek-v3.2', // High capacity model
};

// ============================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// ============================================
/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 * @param onRetry - Optional callback on each retry attempt
 * @returns The result of the function
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                if (onRetry) {
                    onRetry(attempt, err);
                }
                console.warn(`⚠️ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

type AIContentType = 'syllabus' | 'script' | 'quiz' | 'resources' | 'slides';

interface AIGenerationResult {
    success: boolean;
    content?: any;
    tokens_used?: number;
    error?: string;
}

interface SyllabusResult {
    title: string;
    description: string;
    targetAudience: string;
    prerequisites: string[];
    learningOutcomes: string[];
    modules: {
        title: string;
        lessons: { title: string; duration: string; type: string }[];
    }[];
    totalDuration: string;
}

interface QuizResult {
    questions: {
        question: string;
        options: string[];
        answer: string;
        type: 'mcq' | 'true_false';
        explanation?: string;
    }[];
}

interface SlidesResult {
    slides: {
        title: string;
        points: string[];
        notes?: string;
    }[];
}

// Basic JSON Repair for common LLM errors (missing quotes)
const repairMalformedJSON = (text: string): string => {
    let fixed = text;
    // 1. Fix missing opening quote after colon (for string values)
    // Matches: "key": value (where value is NOT true/false/null/number/quote/{/[)
    // Use negative lookahead to exclude valid value starts
    fixed = fixed.replace(/("\s*:\s*)(?!true|false|null|["{\[\d\s])/g, '$1"');

    // 2. Fix missing opening quote in arrays (after comma)
    // Matches: , value
    fixed = fixed.replace(/(,\s*)(?!true|false|null|["{\[\d\s])/g, '$1"');

    return fixed;
}

// XML/JSON Cleaner
const cleanAndParseJSON = (text: string) => {
    let clean = text;
    try {
        // Remove markdown code blocks
        clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        // Find main JSON object/array
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        let start = -1;

        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            start = firstBrace;
        } else if (firstBracket !== -1) {
            start = firstBracket;
        }

        if (start !== -1) {
            clean = clean.substring(start);
            // Find end of JSON
            const lastBrace = clean.lastIndexOf('}');
            const lastBracket = clean.lastIndexOf(']');
            let end = clean.length;

            if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
                end = lastBrace + 1;
            } else if (lastBracket !== -1) {
                end = lastBracket + 1;
            }
            clean = clean.substring(0, end);
        }

        return JSON.parse(clean);
    } catch (e: any) {
        try {
            const repaired = repairMalformedJSON(clean);
            const parsed = JSON.parse(repaired);
            return parsed;
        } catch (err2) {
            console.error("JSON Parse Error. Raw Text:", text);
            console.error("Cleaned Text:", clean);
            throw new Error(`فشل في قراءة بيانات الذكاء الاصطناعي: ${e.message}. (راجع الكونسول للتفاصيل)`);
        }
    }
};

export const aiService = {
    /**
     * Generate course syllabus using Wavespeed
     */
    generateSyllabus: async (topic: string, language: 'ar' | 'en' = 'ar'): Promise<AIGenerationResult> => {
        try {
            const prompt = `Create a comprehensive course syllabus for topic: "${topic}".
Language: ${language === 'ar' ? 'Arabic' : 'English'}.

Output JSON only:
{
    "title": "Course Title",
    "description": "Course Description",
    "targetAudience": "Target Audience",
    "prerequisites": ["Req 1", "Req 2"],
    "learningOutcomes": ["Outcome 1", "Outcome 2"],
    "totalDuration": "Estimated Duration",
    "modules": [
        {
            "title": "Module Title",
            "lessons": [
                { "title": "Lesson Title", "duration": "10:00", "type": "video" }
            ]
        }
    ]
}
`;
            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are an expert curriculum designer. Output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate lesson script using Wavespeed
     */
    generateScript: async (lessonTitle: string, objectives: string[] = [], unitTitle: string = 'وحدة تدريبية', thinkingPattern: string = 'عام'): Promise<AIGenerationResult> => {
        try {
            const prompt = lessonScriptPrompt(
                lessonTitle,
                unitTitle,
                thinkingPattern,
                objectives,
                undefined,
                'أكاديمي محفز'
            );

            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are a professional educational content creator. Always output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate quiz from existing content using Wavespeed
     * Enhanced with retry logic and callback for live display animation
     */
    generateQuizFromContent: async (
        lessonTitle: string,
        lessonContent: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium',
        onProgress?: (status: string) => void
    ): Promise<AIGenerationResult> => {
        try {
            const prompt = quizFromContentPrompt(lessonTitle, lessonContent, difficulty);

            if (onProgress) onProgress('جاري إرسال الطلب...');

            // Use retry logic for robustness (built on top of wavespeedService internal retry)
            const text = await retryWithBackoff(
                async () => {
                    if (onProgress) onProgress('جاري توليد الأسئلة بالذكاء الاصطناعي...');
                    return await wavespeedService.generateText([
                        { role: 'system', content: 'You are an expert examiner. Output valid JSON with questions array.' },
                        { role: 'user', content: prompt }
                    ]);
                },
                3, // maxRetries
                1000, // baseDelay
                (attempt, _error) => {
                    if (onProgress) onProgress(`إعادة المحاولة ${attempt}/3...`);
                }
            );

            if (onProgress) onProgress('جاري معالجة النتائج...');
            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            console.error('❌ Quiz generation failed after retries:', err.message);
            return { success: false, error: `فشل توليد الاختبار: ${err.message}` };
        }
    },

    /**
     * Generate slides using Wavespeed
     */
    generateSlides: async (topic: string, objectives: string[] = []): Promise<AIGenerationResult> => {
        try {
            const prompt = `Create presentation slides content for topic: "${topic}".
Objectives: ${objectives.join(', ')}.
Language: Arabic.

Output JSON only:
{
    "slides": [
        {
            "title": "Slide Title",
            "points": ["Point 1", "Point 2", "Point 3"],
            "notes": "Speaker notes"
        }
    ]
}
Generate 5-7 slides.`;

            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are a presentation expert. Output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate resources using Wavespeed
     */
    generateResources: async (topic: string): Promise<AIGenerationResult> => {
        try {
            const prompt = `Suggest learning resources for: "${topic}".
Language: Arabic.

Output JSON only:
[
    { "title": "Resource Title", "type": "book/article/video", "url": "url or description", "description": "Brief description" }
]
Suggest 5 resources.`;

            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are an educational researcher. Output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate complete course content (syllabus + lessons)
     * NOTE: This is a deprecated monolithic method, prefer using granular methods.
     */
    generateFullCourse: async (topic: string, options?: {
        language?: 'ar' | 'en';
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
    }): Promise<AIGenerationResult> => {
        try {
            const syllabusResult = await aiService.generateSyllabus(topic, options?.language);
            if (!syllabusResult.success) return syllabusResult;

            return {
                success: true,
                content: syllabusResult.content,
                tokens_used: syllabusResult.tokens_used,
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Parse training bag content
     */
    parseTrainingBag: async (content: string): Promise<AIGenerationResult> => {
        try {
            const prompt = `أنت خبير تعليمي. حلل المحتوى واستخرج دورة تدريبية.
المحتوى:
${content.substring(0, 4000)}

Output JSON:
{
    "title": "Title",
    "description": "Desc",
    "thinkingPatterns": ["P1", "P2"],
    "mainTopics": ["T1", "T2"],
    "targetAudience": "Audience",
    "suggestedDuration": "3 Days",
    "learningOutcomes": ["O1", "O2"]
}`;

            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are an educational expert. Output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const parsed = cleanAndParseJSON(text);

            return {
                success: true,
                content: parsed,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate course structure
     */
    generateCourseStructure: async (
        trainingBagData: any,
        settings: {
            totalDays: number;
            unitsCount: number;
            lessonsPerUnit: number;
        } = { totalDays: 2, unitsCount: 4, lessonsPerUnit: 2 }
    ): Promise<AIGenerationResult> => {
        try {
            const context: PromptContext = {
                topic: trainingBagData.title || 'دورة تدريبية احترافية',
                level: 'expert',
                audience: trainingBagData.targetAudience || 'عام',
                duration: `${settings.totalDays} أيام`,
                language: 'ar'
            };

            const promptSettings: CourseSettings = {
                totalDays: settings.totalDays,
                unitsCount: settings.unitsCount,
                lessonsPerUnit: settings.lessonsPerUnit,
                includeVoice: true,
                includeQuizzes: true,
                includeImages: true,
                includeVideos: true,
                includeScripts: true,
                includeScenarios: true
            };

            const prompt = courseStructurePrompt(context, promptSettings);

            const payload = {
                type: 'course_structure',
                topic: context.topic,
                prompt: prompt,
                fileUrl: trainingBagData.fileUrl,
                content: trainingBagData.content,
                language: 'ar'
            };

            // 2. SERVER-SIDE STREAMING (Supabase Edge Function)
            const token = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Server Error (${response.status}): ${err}`);
            }

            // STREAM READER LOGIC
            // The backend now streams raw text (the partial JSON) directly.
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fullText += decoder.decode(value, { stream: true });
                }
            } else {
                // Fallback for non-stream check (should unlikely happen with new backend)
                fullText = await response.text();
            }

            // CLEAN & PARSE (Once stream is complete)
            const content = cleanAndParseJSON(fullText);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(fullText.length / 4),
            };
        } catch (err: any) {
            console.error("Structure Gen Error:", err);
            return { success: false, error: err.message };
        }
    },

    // NEW: Analyze Training Bag (Server-Side Parsing)
    analyzeTrainingBag: async (fileUrl: string, manualContent?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const token = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const payload = {
                type: 'analyze_training_bag',
                fileUrl,
                content: manualContent
            };

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errText.substring(0, 100)}`);
            }

            // Handle Streaming Response for Analysis
            // The backend now streams plain text delta
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fullText += decoder.decode(value, { stream: true });
                }
            }

            // Clean JSON
            const data = cleanAndParseJSON(fullText);
            return { success: true, data };

        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Generate training scenarios
     * Enhanced with retry logic and callback for live display animation
     */
    generateTrainingScenarios: async (
        lessonTitle: string,
        lessonContext: string,
        thinkingPattern: string,
        onProgress?: (status: string) => void
    ): Promise<AIGenerationResult> => {
        try {
            const prompt = trainingScenarioPrompt(
                lessonTitle,
                thinkingPattern,
                lessonContext,
                'الموظفين والمهنيين'
            );

            if (onProgress) onProgress('جاري إرسال الطلب...');

            // Use retry logic for robustness (built on top of wavespeedService internal retry)
            const text = await retryWithBackoff(
                async () => {
                    if (onProgress) onProgress('جاري تصميم السيناريوهات بالذكاء الاصطناعي...');
                    return await wavespeedService.generateText([
                        { role: 'system', content: 'You are a training consultant. Output valid JSON with scenarios array.' },
                        { role: 'user', content: prompt }
                    ]);
                },
                3, // maxRetries
                1000, // baseDelay
                (attempt, _error) => {
                    if (onProgress) onProgress(`إعادة المحاولة ${attempt}/3...`);
                }
            );

            if (onProgress) onProgress('جاري معالجة النتائج...');
            const content = cleanAndParseJSON(text);

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            console.error('❌ Scenario generation failed after retries:', err.message);
            return { success: false, error: `فشل توليد السيناريوهات: ${err.message}` };
        }
    },

    /**
     * Generate Lesson Content (Rich Article) - ONLY
     */
    /**
     * Generate Lesson Content (Rich Article) - Streaming Support
     */
    generateLessonContent: async (
        lessonTitle: string,
        unitTitle: string,
        thinkingPattern: string,
        objectives: string[],
        previousLessonContext?: string,
        onChunk?: (text: string) => void
    ): Promise<AIGenerationResult> => {
        try {

            const payload = {
                type: 'lesson_content',
                lessonTitle,
                topic: unitTitle,
                objectives,
                payload: {
                    thinkingPattern,
                    previousLessonContext
                }
            };

            // Use generate-ai-content edge function (Anon Key)
            const token = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Server Error (${response.status}): ${err}`);
            }

            // Handle Streaming Response (SSE)
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let text = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    text += chunk; // Backend sends raw text, so we just append it
                    if (onChunk) onChunk(text); // Notify UI
                }
            } else {
                const data = await response.json();
                text = data.content || '';
                if (onChunk) onChunk(text);
            }

            // Construct Result (Previous logic expected JSON with script/summary)
            // Now we have raw Markdown script. We simulate the object.
            const content = {
                script: text,
                scriptSummary: text.substring(0, 300) + '...' // Auto-generate summary from intro
            };

            return {
                success: true,
                content,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },
    /**
     * Analyze book content (from PDF/Text) for Library Auto-Fill
     */
    analyzeBook: async (content: string): Promise<AIGenerationResult> => {
        try {
            const prompt = `You are a world-class Book Editor and Marketing Genius. Analyze the following book content (first few pages) to extract metadata and create captivating marketing copy.

Content Preview:
${content.substring(0, 6000)}

Your Tasks:
1. Extract Title, Author, Publish Year.
2. Write a "Best-Selling" style description in Arabic. It must be engaging, emotional, and persuasive (2-3 sentences).
3. Determine the most relevant Category.
4. Estimate page count if not found.
5. Create a "Midjourney-style" prompt for a book cover. It should be symbolic, artistic, and suitable for a high-end book market (English).

Output JSON only:
{
    "title": "Book Title (Arabic)",
    "author": "Author Name",
    "description": "A captivating, marketing-oriented description in Arabic. Use power words.",
    "category": "Primary Category (e.g., Self Development, Technology)",
    "pages": 150,
    "publishYear": "2024",
    "suggestedCoverPrompt": "A highly detailed, prize-winning book cover art. minimalist, symbolic, cinematic lighting, 8k resolution, trending on artstation. [Subject Specific Details]."
}`;

            const text = await wavespeedService.generateText([
                { role: 'system', content: 'You are a professional librarian. Output valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const parsed = cleanAndParseJSON(text);

            return {
                success: true,
                content: parsed,
                tokens_used: Math.ceil(text.length / 4),
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },
};

export default aiService;
