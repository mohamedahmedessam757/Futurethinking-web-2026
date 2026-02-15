// Voice Service - Wavespeed Integration (ElevenLabs via Proxy)
// Advanced text-to-speech generation via Wavespeed polling service

import { supabase } from '../lib/supabase';
import { wavespeedService } from './wavespeed';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface VoiceGenerationResult {
    success: boolean;
    audioUrl?: string;
    audioBlob?: Blob;
    audioDuration?: number;
    charactersUsed?: number;
    error?: string;
}

export interface VoiceSettings {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
    modelId: string;
}

export interface Voice {
    voice_id: string;
    name: string;
    category: string;
    description?: string;
    preview_url?: string;
    labels: {
        accent?: string;
        description?: string;
        age?: string;
        gender?: string;
        use_case?: string;
    };
}

export interface VoiceHistoryItem {
    history_item_id: string;
    voice_id: string;
    voice_name: string;
    text: string;
    date_unix: number;
    character_count_change: number;
    content_type: string;
    state: string;
}

export interface UserSubscription {
    tier: string;
    character_count: number;
    character_limit: number;
    can_extend_character_limit: boolean;
    allowed_to_extend_character_limit: boolean;
    next_character_count_reset_unix: number;
    voice_limit: number;
    professional_voice_limit: number;
}

// ============================================
// ARABIC VOICE IDS
// ============================================

export const ARABIC_VOICES = {
    // Male voices  
    adam: 'pNInz6obpgDQGcFmaJgB',  // Adam - Deep, professional
    sam: '8mJuDjKrZWrM4P4AwSuF',    // Sam - Warm, friendly
    arnold: 'VR6AewLTigWG4xSOukaG', // Arnold - Strong, confident

    // Female voices
    rachel: '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear, professional
    domi: 'AZnzlk1XvdvUeBnXmlld',   // Domi - Young, energetic
    bella: 'EXAVITQu4vr4xnSDxMaL',   // Bella - Soft, calm

    // Arabic-specific (if available)
    arabicMale1: 'onwK4e9ZLuTAKqWW03F9',
    arabicFemale1: 'XB0fDUnXU5powFXDhCwa',
};

// Default settings optimized for Arabic
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    voiceId: ARABIC_VOICES.adam,
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
    modelId: 'eleven_multilingual_v2' // Best for Arabic
};

// ============================================
// VOICE SERVICE CLASS
// ============================================

class VoiceService {
    private isInitialized: boolean = true; // Always assumed true via Wavespeed service check

    // ============================================
    // CORE VOICE GENERATION
    // ============================================

    /**
     * Generate voice from text using Wavespeed (ElevenLabs)
     */
    async generateVoice(
        text: string,
        settings?: Partial<VoiceSettings>
    ): Promise<VoiceGenerationResult> {
        try {
            // 1. Generate via Wavespeed (Returns a temp URL)
            const tempAudioUrl = await wavespeedService.generateVoice(text, settings?.voiceId || ARABIC_VOICES.adam);

            // 2. Fetch Blob for caller to upload via aiCourseStorage.uploadAsset()
            const response = await fetch(tempAudioUrl);
            const rawBlob = await response.blob();
            const audioBlob = new Blob([rawBlob], { type: 'audio/mpeg' }); // Force correct MIME type

            // Note: Upload responsibility is on the caller (AICourseCreator)
            // This keeps VoiceService focused on generation only
            return {
                success: true,
                audioUrl: tempAudioUrl, // Temp URL — caller uploads for persistence
                audioBlob,
                audioDuration: this.estimateDuration(text),
                charactersUsed: text.length
            };

        } catch (error: any) {
            console.error('Voice generation error:', error);
            return {
                success: false,
                error: `Failed to generate voice: ${error.message}`
            };
        }
    }

    /**
     * Generate voice for long text by splitting into chunks
     * (Retained for backward compatibility, but Wavespeed might handle larger texts better)
     */
    async generateLongVoice(
        text: string,
        settings?: Partial<VoiceSettings>
    ): Promise<VoiceGenerationResult> {
        const chunks = this.splitTextIntoChunks(text, 4000);
        const audioBlobs: Blob[] = [];
        let totalDuration = 0;

        for (let i = 0; i < chunks.length; i++) {
            const result = await this.generateVoice(chunks[i], settings);

            if (!result.success || !result.audioBlob) {
                return {
                    success: false,
                    error: `Failed at chunk ${i + 1}/${chunks.length}: ${result.error}`
                };
            }

            audioBlobs.push(result.audioBlob);
            totalDuration += result.audioDuration || 0;

            // Minimal delay not needed strictly for polling, but good practice
            await this.delay(200);
        }

        // Combine audio blobs
        const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(combinedBlob);

        return {
            success: true,
            audioUrl,
            audioBlob: combinedBlob,
            audioDuration: totalDuration,
            charactersUsed: text.length
        };
    }

    // ============================================
    // SUPABASE INTEGRATION
    // ============================================

    /**
     * Upload generated audio to Supabase Storage
     */
    async uploadToSupabase(
        audioBlob: Blob,
        lessonId: string,
        userId: string
    ): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            const fileName = `voice_${lessonId}_${Date.now()}.mp3`;
            const filePath = `${userId}/voices/${fileName}`;

            const { data, error } = await supabase.storage
                .from('ai-course-assets')
                .upload(filePath, audioBlob, {
                    contentType: 'audio/mpeg',
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('ai-course-assets')
                .getPublicUrl(filePath);

            return {
                success: true,
                url: urlData.publicUrl
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        return true; // We rely on wavespeed service
    }

    /**
     * Estimate audio duration from text
     */
    private estimateDuration(text: string): number {
        // Average speaking rate: ~150 words per minute for Arabic
        const words = text.split(/\s+/).length;
        const minutes = words / 150;
        return Math.round(minutes * 60);
    }

    /**
     * Split text into chunks at sentence boundaries
     */
    private splitTextIntoChunks(text: string, maxLength: number): string[] {
        const sentences = text.split(/([.!?؟،])/);
        const chunks: string[] = [];
        let currentChunk = '';

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];

            if ((currentChunk + sentence).length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }

                // If single sentence is too long, split by words
                if (sentence.length > maxLength) {
                    const wordChunks = this.splitByWords(sentence, maxLength);
                    chunks.push(...wordChunks);
                } else {
                    currentChunk = sentence;
                }
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Split by words when sentence is too long
     */
    private splitByWords(text: string, maxLength: number): string[] {
        const words = text.split(' ');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const word of words) {
            if ((currentChunk + ' ' + word).length > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = word;
            } else {
                currentChunk += ' ' + word;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get API key status (masked)
     */
    getApiKeyStatus(): { configured: boolean; masked: string } {
        return { configured: true, masked: 'WAVESPEED' };
    }
}

// ============================================
// EXPORT SINGLETON
// ============================================

const voiceService = new VoiceService();
export default voiceService;
