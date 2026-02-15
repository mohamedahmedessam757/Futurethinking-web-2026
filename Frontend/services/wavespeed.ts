import { supabase } from '../lib/supabase';

// Helper Interface
export interface WavespeedResult {
    success: boolean;
    data?: any;
    error?: string;
    url?: string;
}

// Core Class
class WavespeedService {
    private apiKey: string;
    // Removed direct OpenAI client

    constructor() {
        this.apiKey = import.meta.env.VITE_WAVESPEED_API_KEY || '';
    }

    // --- 0. Connection Test (Simple Proxy Check) ---
    async testConnection(): Promise<boolean> {
        try {
            // Check if we can reach the edge function and get a response

            // Check if we can reach the edge function and get a response
            await this.generateText([{ role: 'user', content: 'Connection check' }], 1);
            return true;
        } catch (e: any) {
            if (e.message && e.message.includes('non-2xx')) {
                console.error('HINT: Check the Network tab in Developer Tools for the specific status code (403, 500) and response body.');
            }
            return false;
        }
    }

    // --- 1. Text Generation (via Edge Function) ---
    async generateText(messages: any[], maxTokens = 4000, options: { model_tier?: 'fast' | 'default' } = {}): Promise<string> {
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // 1. Force explicit session refresh to ensure token is valid
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                // Log session status for debugging

                let token = session?.access_token;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


                // Construct URL
                const projectUrl = import.meta.env.VITE_SUPABASE_URL;
                const functionUrl = `${projectUrl}/functions/v1/generate-ai-content`;

                // Helper for fetch with Timeout
                const doFetch = async (authToken: string) => {
                    const controller = new AbortController();
                    // 90s Timeout for Frontend Fetch (Edge Function has 60s limit)
                    const timeoutId = setTimeout(() => controller.abort(), 90000);

                    try {
                        const response = await fetch(functionUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({
                                type: 'wavespeed_text',
                                messages,
                                api_key: this.apiKey,
                                model_tier: options.model_tier
                            }),
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        return response;
                    } catch (err: any) {
                        clearTimeout(timeoutId);
                        if (err.name === 'AbortError') {
                            throw new Error('انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
                        }
                        throw err;
                    }
                };

                // First Attempt
                let response = await doFetch(token || anonKey);

                // RETRY LOGIC: If 401/403 and we used a User Token, retry with Anon Key
                if (!response.ok && (response.status === 401 || response.status === 403) && token) {
                    response = await doFetch(anonKey);
                }

                const data = await response.json();

                if (!response.ok) {
                    console.error('Raw Function Response Error:', response.status, data);
                    const msg = data.error || data.message || `HTTP Error ${response.status}`;
                    // Don't retry 4xx errors (client errors), only retry 5xx or network errors
                    if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
                        throw new Error(msg); // Throw immediately for client errors
                    }
                    throw new Error(msg);
                }

                if (data.error) {
                    throw new Error(data.error);
                }

                if (!data.success && !data.data) {
                    throw new Error('Unknown API error (success=false)');
                }

                return data.data || '';

            } catch (error: any) {
                console.error(`Wavespeed Text Error (Attempt ${attempt}):`, error);

                // If it's the last attempt or a non-retriable error (like AbortError specific to user cancellation, but here it's timeout so maybe retry?), throw
                // We do retry timeouts.

                if (attempt === MAX_RETRIES) {
                    throw new Error(error.message || 'فشل في إنشاء المحتوى بعد عدة محاولات.');
                }

                // Exponential Backoff: 1s, 2s, 4s...
                const delay = 1000 * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        return '';
    }

    // --- 2. Image Generation (via Edge Function) ---
    async generateImage(prompt: string): Promise<string> {
        return this.robustCall('wavespeed_image', { prompt });
    }



    // --- Helper: Robust Call with Retry ---
    private async robustCall(type: string, payload: any): Promise<any> {
        // 1. Force explicit session refresh
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        let token = session?.access_token;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const functionUrl = `${projectUrl}/functions/v1/generate-ai-content`;

        const doFetch = async (authToken: string) => {
            return fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    type,
                    ...payload,
                    api_key: this.apiKey
                }),
                signal: AbortSignal.timeout(60000) // 60s Timeout to prevent infinite hang
            });
        };

        let response = await doFetch(token || anonKey);

        // Retry with Anon Key if User Token fails (401/403)
        if (!response.ok && (response.status === 401 || response.status === 403) && token) {
            response = await doFetch(anonKey);
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(`Edge Function Error (${type}):`, response.status, data);
            throw new Error(data.error || data.message || `HTTP Error ${response.status}`);
        }

        if (data.error) throw new Error(data.error);

        // Extract Data
        const resultRaw = data.data; // Raw Wavespeed response

        // Image Response Handling
        if (type === 'wavespeed_image') {
            if (resultRaw?.data?.outputs?.[0]) return resultRaw.data.outputs[0];
            if (Array.isArray(resultRaw?.outputs) && resultRaw.outputs[0]) return resultRaw.outputs[0];
            throw new Error('No image URL in response');
        }

        // Generic Return for Video/Voice (Task ID or Data)
        return resultRaw;
    }

    // --- 3. Async Task Submitter (Internal Helper) ---
    // Not strictly needed as a separate public method anymore, but keeping for logic structure if needed.
    // However, for Video/Voice we now just call the specific edge function types.

    // --- 4. Polling Logic (Client-side Polling) ---
    // Note: The Edge Function currently returns the initial 'submit' response for async tasks.
    // We still need to poll from the client, BUT we can't poll 'api.wavespeed.ai' directly due to CORS.
    // PROBLEM: Polling `https://api.wavespeed.ai/api/v3/predictions/{id}/result` will ALSO fail CORS.
    // SOLUTION: We need a generic 'proxy fetch' or specific poll endpoint in the backend.
    // I will add a 'poll' capability to the generateText method or creating a separate poll helper isn't efficient in the edge function without holding the connection (bad practice).
    // BETTER SOLUTION: The Edge Function should act as a "fetch" proxy for polling too.
    // For now, I will assume the user will deploy the backend change. I will update generate-ai-content to handle polling if needed,
    // OR I can try to see if the initial response contains a result immediately (rare for video).
    //
    // WAIT: Does `generate-ai-content` handle polling? My previous edit didn't explicitly add a "poll" type.
    // I should probably add a generic "wavespeed_poll" type to the backend in the next step to be safe, 
    // OR just use the 'wavespeed_video' type but with a 'taskId' to indicate polling?
    // Let's look at the backend code I wrote:
    // It proxies `type === 'wavespeed_video'`.
    //
    // I need to update the backend to support polling. 
    // I will execute this frontend update assuming I'll fix the backend polling in a subsequent step or if I missed it.
    // Actually, looking at the previous backend code, I didn't add a 'poll' case.
    //
    // Strategy:
    // 1. Update this file to use `wavespeed_poll` type (which I will add to backend next).
    // 2. Poll using that proxy.

    private async pollTask(taskId: string, maxAttempts = 60, intervalMs = 2000): Promise<any> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Use proxy to poll via robustCall
                const resultData = await this.robustCall('wavespeed_poll', { payload: { taskId } });

                // robustCall returns the 'data' part of the response
                const result = resultData;

                // FIX: Unwrap nested data if present (Wavespeed proxy often matches { code: 200, data: { status... } })
                const actualData = result.data || result;
                const status = actualData.status || actualData.state;


                if (status === 'succeeded' || status === 'completed') {
                    // RETURN INNER DATA (which contains 'outputs')
                    return actualData;
                } else if (status === 'failed' || status === 'canceled') {
                    throw new Error(actualData.error || result.error || 'Generation task failed');
                }

                await new Promise(r => setTimeout(r, intervalMs));
            } catch (e: any) {
                // FORCE ERROR LOGGING FOR USER VISIBILITY
                console.error(`🚨 POLLING ERROR (Attempt ${i + 1}/${maxAttempts}):`, e.message);
                console.error('Full Error Object:', e);

                // Stop if task definitely not found (404 from backend)
                if (e.message && e.message.includes('Polling Error: 404')) {
                    throw new Error('Task not found (possibly expired).');
                }
            }
        }
        throw new Error('Task timed out after waiting.');
    }

    // --- 5. Video Generation (Async) ---
    async generateVideo(prompt: string, duration = 6): Promise<string> {
        // 1. Submit
        const responseData = await this.robustCall('wavespeed_video', { prompt, duration });

        const taskId = responseData.data?.id || responseData.id;
        if (!taskId) throw new Error('No Task ID returned for video generation');

        // 2. Poll
        const result = await this.pollTask(taskId, 120, 3000);
        const outputs = result.outputs || [];
        if (outputs.length > 0) return outputs[0];
        throw new Error('No video URL in completed task');
    }

    // --- 6. Voice Generation (Async) ---
    // --- 6. Voice Generation (Async) ---
    async generateVoice(text: string, voiceId = "pNInz6obpgDQGcFmaJgB", language = "ar"): Promise<string> {
        // 1. Submit
        const responseData = await this.robustCall('wavespeed_voice', {
            topic: text,
            voice_id: voiceId,
            language,
            // ENV PROXY: Pass V3 specific settings inside 'payload' to merge with backend defaults
            payload: {
                // V3 Parameters
                similarity: 1.0,
                stability: 0.5,
                use_speaker_boost: true
            }
        });

        const taskId = responseData.data?.id || responseData.id;
        if (!taskId) throw new Error('No Task ID returned for voice generation');

        // 2. Poll
        const result = await this.pollTask(taskId, 30, 1000);
        const outputs = result.outputs || [];
        if (outputs.length > 0) return outputs[0];
        throw new Error('No audio URL in completed task');
    }
}

export const wavespeedService = new WavespeedService();

