// Video Service - Wavespeed Integration (Video & Image)
// Frontend service for AI video and image generation using Wavespeed

interface VideoGenerationResult {
    success: boolean;
    videoUrl?: string;
    videoDuration?: number;
    error?: string;
}

interface ImageGenerationResult {
    success: boolean;
    imageUrls?: string[];
    error?: string;
}

interface VideoGenerationOptions {
    duration?: number;      // Max 6 seconds for Hailuo typically
    aspectRatio?: '16:9' | '9:16' | '1:1';
    style?: 'realistic' | 'animated' | 'whiteboard' | 'professional' | 'illustration';
}

import { wavespeedService } from './wavespeed';

// 🎨 Style Strategy Config (Professional & Scalable)
const VIDEO_STYLE_PROMPTS = {
    illustration: "Modern flat vector illustration, corporate memphis style, minimalist, clean lines, vibrant colors, educational explainer, smooth motion, white background, no text, high quality 4k, digital art",
    animation: "2D animated scene, motion graphics style, professional explainer video aesthetics, colorful, clean, friendly, no text, 4k",
    whiteboard: "Whiteboard animation style, hand drawn sketch, clean lines, educational, simple, clear, black and white with accent colors",
    professional: "Professional corporate video, high quality stock footage style, clean office environment, business attire, soft lighting, 4k",
    realistic: "Cinematic shot, High Definition, 4k, Slow Motion, Professional Lighting, Movie Quality"
};

export const videoService = {
    /**
     * Generate a short video using Wavespeed (Hailuo)
     */
    generateShortVideo: async (
        prompt: string,
        options?: VideoGenerationOptions
    ): Promise<VideoGenerationResult & { videoBlob?: Blob }> => {
        try {
            // Default to 'illustration' for better educational fit (User Request)
            const selectedStyle = options?.style || 'illustration';
            const stylePrefix = VIDEO_STYLE_PROMPTS[selectedStyle] || VIDEO_STYLE_PROMPTS.illustration;

            // Construct Enhanced Prompt
            const enhancedPrompt = `${stylePrefix}: ${prompt}`;

            const videoUrl = await wavespeedService.generateVideo(enhancedPrompt, options?.duration || 6);

            // Access Blob for Persistence
            const response = await fetch(videoUrl);
            const rawBlob = await response.blob();
            const videoBlob = new Blob([rawBlob], { type: 'video/mp4' }); // FIX: Enforce MIME Type

            return {
                success: true,
                videoUrl,
                videoBlob, // Return blob for upload
                videoDuration: options?.duration || 6,
            };
        } catch (err: any) {
            console.error('Video generation error:', err);
            return {
                success: false,
                error: err.message || 'حدث خطأ في توليد الفيديو',
            };
        }
    },

    /**
     * Check video generation status (Compatibility Shim)
     */
    checkVideoStatus: async (jobId: string): Promise<VideoGenerationResult> => {
        return {
            success: true,
            videoUrl: jobId,
        };
    },

    /**
     * Generate images using Wavespeed (Nano Banana/Flux)
     */
    generateImages: async (
        prompts: string[],
        style?: 'educational' | 'infographic' | 'illustration'
    ): Promise<ImageGenerationResult & { imageBlobs?: Blob[] }> => {
        try {
            const imageUrls: string[] = [];
            const imageBlobs: Blob[] = [];

            for (const prompt of prompts) {
                let enhancedPrompt = prompt;

                // 🎨 Smart Style Engineering
                if (style === 'infographic') {
                    enhancedPrompt = `Professional modern infographic about: "${prompt}". 
                    Clean white background, vector icons, structured layout, data visualization style, 
                    minimalist design, high resolution, corporate color palette (Blue/Gold/White). 
                    IMPORTANT: VISUALS ONLY. NO TEXT, NO LABELS, NO LETTERS, NO TYPOGRAPHY. 
                    Symbolic representation only.`;
                } else {
                    // Default to Illustration
                    enhancedPrompt = `High quality digital illustration of: "${prompt}". 
                    Vibrant colors, modern art style, storytelling visual, 4k resolution, 
                    highly detailed, cinematic lighting, conceptual art. 
                    IMPORTANT: NO TEXT, NO WRITING, NO LETTERS. Visuals only.`;
                }

                const url = await wavespeedService.generateImage(enhancedPrompt);

                // Fetch Blob for Persistence
                const response = await fetch(url);
                const rawBlob = await response.blob();
                const blob = new Blob([rawBlob], { type: 'image/png' }); // FIX: Enforce MIME Type

                imageUrls.push(url);
                imageBlobs.push(blob);
            }

            return {
                success: imageUrls.length > 0,
                imageUrls,
                imageBlobs, // Return blobs for upload
                error: imageUrls.length === 0 ? 'لم يتم توليد أي صور' : undefined,
            };
        } catch (err: any) {
            console.error('Image generation error:', err);
            return {
                success: false,
                error: err.message || 'حدث خطأ في توليد الصور',
            };
        }
    },

    /**
     * Generate images using generic logic (replaces old Vicsee/Gemini logic)
     */
    generateVicseeImages: async (
        prompts: string[],
        style: 'professional' | 'educational' | 'infographic' | 'diagram' = 'educational'
    ): Promise<ImageGenerationResult & { imageBlobs?: Blob[] }> => {
        return videoService.generateImages(prompts, style as any);
    },

    /**
     * Generate placeholder images from Unsplash (Fallback)
     */
    getPlaceholderImages: (category: string, count: number = 3): string[] => {
        const categories: Record<string, string> = {
            business: 'business,professional,meeting',
            education: 'education,learning,classroom',
            technology: 'technology,computer,digital',
            thinking: 'brain,mind,thinking',
            teamwork: 'team,collaboration,people',
        };

        const query = categories[category] || 'education';
        return Array.from({ length: count }, (_, i) =>
            `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=450&fit=crop&q=80&auto=format&fm=jpg&crop=entropy&cs=tinysrgb&q=${query}`
        );
    },

    /**
     * Generate educational infographic
     */
    generateInfographic: async (
        title: string,
        keyPoints: string[],
        style: 'modern' | 'corporate' | 'creative' = 'modern'
    ): Promise<ImageGenerationResult & { imageBlobs?: Blob[] }> => {
        const prompt = `Professional infographic about "${title}".
Key points to visualize:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Style: ${style}, clean layout, professional icons, suitable for Arabic content.`;

        return videoService.generateImages([prompt], 'infographic');
    },
};

export default videoService;
