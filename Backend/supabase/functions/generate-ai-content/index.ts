// Supabase Edge Function: AI Content Generator (Wavespeed + Gemini Hybrid)
// Deploy with: supabase functions deploy generate-ai-content

// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
    type: 'syllabus' | 'script' | 'quiz' | 'resources' | 'slides' | 'wavespeed_text' | 'wavespeed_image' | 'wavespeed_video' | 'wavespeed_voice' | 'wavespeed_poll' | 'course_structure' | 'analyze_training_bag' | 'lesson_content'
    topic?: string // Optional for wavespeed, required for others
    language?: 'ar' | 'en'
    lessonTitle?: string
    objectives?: string[]
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    // Wavespeed specific fields
    messages?: any[]
    prompt?: string
    duration?: number
    voice_id?: string
    model_id?: string // Override model (e.g. for HQ Voice)
    payload?: any // Generic payload for unexpected fields
    api_key?: string // Optional client-provided key
    content?: string // Manual text content
    fileUrl?: string // URL of the uploaded file
}

const WAVESPEED_MODELS = {
    TEXT: 'deepseek/deepseek-v3.2',
    IMAGE: 'google/nano-banana/text-to-image',
    VIDEO: 'minimax/hailuo-2.3/t2v-standard', // UPDATED: Per User Request
    VOICE: 'elevenlabs/eleven-v3' // UPDATED: Per User Docs
};

const WAVESPEED_BASE_URL = 'https://api.wavespeed.ai/api/v3';
const WAVESPEED_LLM_URL = 'https://llm.wavespeed.ai/v1';

const PROMPTS = {
    syllabus: (topic: string, lang: string) => `
أنت خبير تعليمي. قم بإنشاء منهج دراسي متكامل للموضوع: "${topic}"
اكتب باللغة ${lang === 'ar' ? 'العربية' : 'الإنجليزية'}.

المطلوب (بصيغة JSON):
{
  "title": "عنوان الدورة",
  "description": "وصف شامل للدورة (3-4 جمل)",
  "targetAudience": "الجمهور المستهدف",
  "prerequisites": ["متطلب 1", "متطلب 2"],
  "learningOutcomes": ["مخرج 1", "مخرج 2", "مخرج 3"],
  "modules": [
    {
      "title": "عنوان الوحدة",
      "lessons": [
        { "title": "عنوان الدرس", "duration": "30:00", "type": "video" },
        { "title": "اختبار الوحدة", "duration": "15:00", "type": "quiz" }
      ]
    }
  ],
  "totalDuration": "10 ساعات"
}

أنشئ 4-6 وحدات بـ 3-5 دروس لكل منها.
`,

    script: (topic: string, objectives: string[]) => `
أنت مُحاضر محترف. اكتب نص فيديو تعليمي للدرس: "${topic}"

أهداف الدرس:
${objectives?.map((o, i) => `${i + 1}. ${o}`).join('\n') || '- فهم الموضوع بشكل شامل'}

المطلوب:
1. مقدمة جذابة (30 ثانية)
2. شرح تفصيلي للمحتوى (3-5 دقائق)  
3. أمثلة عملية
4. ملخص وخاتمة (30 ثانية)

اكتب النص بأسلوب حواري طبيعي باللغة العربية الفصحى.
`,

    quiz: (topic: string, difficulty: string) => `
أنت معد اختبارات تعليمية. أنشئ اختبار للموضوع: "${topic}"
مستوى الصعوبة: ${difficulty || 'متوسط'}

المطلوب (بصيغة JSON):
{
  "questions": [
    {
      "question": "نص السؤال",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "answer": "الخيار الصحيح",
      "type": "mcq",
      "explanation": "شرح مختصر للإجابة"
    }
  ]
}

أنشئ 10 أسئلة متنوعة (7 اختيار متعدد + 3 صح/خطأ).
`,

    slides: (topic: string, objectives: string[]) => `
أنت مصمم عروض تقديمية. أنشئ مخطط PowerPoint للموضوع: "${topic}"

المطلوب (بصيغة JSON):
{
  "slides": [
    {
      "title": "عنوان الشريحة",
      "points": ["نقطة 1", "نقطة 2", "نقطة 3"],
      "notes": "ملاحظات للمحاضر"
    }
  ]
}

أنشئ 10-15 شريحة تغطي:
1. شريحة العنوان
2. الأهداف التعليمية
3. المحتوى الرئيسي (8-12 شريحة)
4. ملخص
5. أسئلة ونقاش
`,

    resources: (topic: string) => `
أنت باحث أكاديمي. اقترح مصادر تعلم إضافية للموضوع: "${topic}"

المطلوب (بصيغة JSON):
{
  "books": [
    { "title": "عنوان الكتاب", "author": "المؤلف", "reason": "سبب التوصية" }
  ],
  "articles": [
    { "title": "عنوان المقال", "source": "المصدر", "url": "رابط تقريبي" }
  ],
  "videos": [
    { "title": "عنوان الفيديو", "platform": "المنصة", "duration": "المدة" }
  ],
  "tools": [
    { "name": "اسم الأداة", "description": "الوصف", "url": "الرابط" }
  ]
}

اقترح 3-5 مصادر من كل نوع.
`
}

// Helper to interact with Wavespeed (DeepSeek)
async function generateWithDeepSeek(messages: any[], apiKey: string) {
    const response = await fetch(`${WAVESPEED_LLM_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: WAVESPEED_MODELS.TEXT,
            messages: messages,
            max_tokens: 4000,
            stream: false
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Wavespeed Error: ${response.status} - ${txt}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Helper to Stream with DeepSeek (Prevents 504 Timeouts)
async function streamDeepSeekResponse(messages: any[], apiKey: string) {
    const response = await fetch(`${WAVESPEED_LLM_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: WAVESPEED_MODELS.TEXT,
            messages: messages,
            max_tokens: 8000,
            stream: true // ENABLE STREAMING
        })
    });

    if (!response.ok) {
        throw new Error(`Wavespeed Error: ${response.status} - ${await response.text()}`);
    }

    // Transform Stream: Parse SSE "data: JSON" -> Raw Text Delta
    const stream = new ReadableStream({
        async start(controller) {
            // @ts-ignore
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === 'data: [DONE]') continue;
                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            try {
                                const data = JSON.parse(dataStr);
                                const content = data.choices[0]?.delta?.content || '';
                                if (content) {
                                    controller.enqueue(new TextEncoder().encode(content));
                                }
                            } catch (e) {
                                // Ignore json parse errors for partial chunks
                            }
                        }
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked'
        }
    });
}

// @ts-ignore
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: req.headers.get('Authorization')! } }
            }
        )

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            console.warn('Auth Warning: User not found or not logged in (proceeding for debug/setup)');
        }

        const body: AIRequest = await req.json()
        const { type, topic, language = 'ar', lessonTitle, objectives, difficulty } = body

        // --- SPECIAL ROUTE: COURSE STRUCTURE & ANALYSIS & LESSON CONTENT (Hybrid) ---
        if (type === 'course_structure' || type === 'analyze_training_bag' || type === 'lesson_content') {
            let extractedText = body.content || '';

            // 1. EXTRACT TEXT FROM FILE (Using Gemini as Reader)
            // This part remains synchronous as it is usually fast.
            if (body.fileUrl) {
                console.log(`[Processing] Extracting text from file: ${body.fileUrl}`);
                try {
                    // @ts-ignore
                    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
                    if (geminiApiKey) {
                        const genAI = new GoogleGenerativeAI(geminiApiKey);
                        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                        const fileResponse = await fetch(body.fileUrl);
                        if (!fileResponse.ok) throw new Error(`File fetch failed: ${fileResponse.statusText}`);

                        const arrayBuffer = await fileResponse.arrayBuffer();
                        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                        const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

                        // Ask Gemini to iterate/extract ALL text content for processing
                        const result = await model.generateContent([
                            { inlineData: { data: base64Data, mimeType: mimeType } },
                            "Extract all the educational content, outline, and key points from this document verbatim. Return it as plain text."
                        ]);
                        extractedText += "\n" + result.response.text();
                    } else {
                        console.warn('Gemini API Key missing for file extraction');
                    }
                } catch (e) {
                    console.error('File extraction failed:', e);
                }
            }

            // 2. PREPARE PROMPT FOR DEEPSEEK
            // @ts-ignore
            const wavespeedKey = Deno.env.get('WAVESPEED_API_KEY');
            if (!wavespeedKey) throw new Error('Wavespeed API Key missing in backend');

            const systemPrompt = "You are a professional educational consultant. You must output valid JSON only.";
            let userPrompt = "";

            if (type === 'analyze_training_bag') {
                // ANALYSIS PROMPT
                userPrompt = `
                 Analyze the following educational content and extract the key metadata to structure a course.
                 
                 Content:
                 ${extractedText.substring(0, 50000)}

                 Output JSON:
                 {
                    "title": "Proposed Course Title (in Arabic)",
                     "description": "Summary of the content (in Arabic)",
                     "targetAudience": "Who is this course for? (in Arabic)",
                     "learningOutcomes": ["Outcome 1", "Outcome 2"],
                     "mainTopics": ["Topic 1", "Topic 2"],
                     "thinkingPatterns": ["Pattern 1 (Module suggestion)", "Pattern 2"]
                 }
                 `;
            } else if (type === 'lesson_content') {
                // LESSON CONTENT PROMPT
                // Payload structure: { thinkingPattern, previousLessonContext }
                const { thinkingPattern, previousLessonContext } = body.payload || {};

                userPrompt = `
                You are a senior professor. Write a comprehensive lesson script for: "${lessonTitle}".
                Topic/Unit: "${topic}"
                Thinking Pattern: "${thinkingPattern}"
                Objectives: ${objectives?.join(', ')}

                ${previousLessonContext ? `Context from previous lesson: ${previousLessonContext}` : ''}

                Requirements:
                1. Length: 1000-1500 words.
                2. Academic depth with citations (years, names).
                3. Real-world case study included.
                4. Tone: Professional, engaging, flowy Arabic.
                5. Output: Just the text (Markdown formatted). Do NOT output JSON.
                `;
            } else {
                // FULL STRUCTURE PROMPT
                userPrompt = `${body.prompt}\n\nBased on the following content:\n${extractedText.substring(0, 50000)}`;
            }

            // 3. GENERATE WITH STREAMING (Fix for 504 Timeout)
            // We pass the stream directly to the client
            return await streamDeepSeekResponse(
                [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                wavespeedKey
            );
        }

        if (type.startsWith('wavespeed_')) {
            // --- WAVESPEED PROXY LOGIC ---
            // @ts-ignore
            const wavespeedKey = body.api_key || Deno.env.get('WAVESPEED_API_KEY');
            if (!wavespeedKey) {
                // Return a clear error if key is missing so client knows
                return new Response(
                    JSON.stringify({ success: false, error: 'Wavespeed API Key missing in server environment or request' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const wsHeaders = {
                'Authorization': `Bearer ${wavespeedKey}`,
                'Content-Type': 'application/json'
            };

            let responseData: any;

            if (type === 'wavespeed_text') {
                // Chat Completion Proxy
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s

                // Select Model
                // @ts-ignore
                const modelToUse = body.model_tier === 'fast' ? 'openai/gpt-4o-mini' : WAVESPEED_MODELS.TEXT;

                try {
                    const response = await fetch(`${WAVESPEED_LLM_URL}/chat/completions`, {
                        method: 'POST',
                        headers: wsHeaders,
                        body: JSON.stringify({
                            model: modelToUse,
                            messages: body.messages || [],
                            max_tokens: 4000,
                            stream: false
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const err = await response.text();
                        console.error(`Upstream API Error: ${response.status} ${err}`);
                        return new Response(
                            JSON.stringify({
                                success: false,
                                error: `Wavespeed Text API Error: ${response.status} - ${err}`
                            }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                        );
                    }
                    const data = await response.json();
                    responseData = data.choices?.[0]?.message?.content || '';
                } catch (err: any) {
                    clearTimeout(timeoutId);
                    throw err; // Re-throw to be caught by outer catch
                }

            } else if (type === 'wavespeed_poll') {
                // Polling Proxy
                const taskId = body.payload?.taskId;
                if (!taskId) throw new Error('Task ID required for polling');

                console.log(`[Wavespeed Proxy] Polling Task ID: ${taskId}`);

                const response = await fetch(`${WAVESPEED_BASE_URL}/predictions/${taskId}/result`, {
                    method: 'GET',
                    headers: wsHeaders
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error(`[Wavespeed Proxy] Polling Failed: ${response.status} - ${err}`);
                    // Return error response gracefully so frontend can retry or fail
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: `Polling Error: ${response.status}`,
                            upstreamError: err
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }

                responseData = await response.json();

            } else {
                // Generalized task submission (Image, Video, Voice)
                let url = '';
                let payload: any = {};

                if (type === 'wavespeed_image') {
                    url = `${WAVESPEED_BASE_URL}/${WAVESPEED_MODELS.IMAGE}`;
                    payload = {
                        prompt: body.prompt,
                        output_format: 'png',
                        enable_sync_mode: true
                    };
                } else if (type === 'wavespeed_video') {
                    url = `${WAVESPEED_BASE_URL}/${WAVESPEED_MODELS.VIDEO}`;
                    payload = {
                        prompt: body.prompt,
                        duration: body.duration || 6
                    };
                } else if (type === 'wavespeed_voice') {
                    // URL is now correct via WAVESPEED_MODELS.VOICE ('elevenlabs/eleven-v3')
                    url = `${WAVESPEED_BASE_URL}/${WAVESPEED_MODELS.VOICE}`;

                    payload = {
                        text: body.topic || body.prompt,
                        voice_id: body.voice_id || "Ethan",
                        // V3 might not need explicit language param, but keeping it safe
                        // language: body.language || "ar", 
                        // Add V3 specific params defaults
                        similarity: 1.0,
                        stability: 0.5,
                        use_speaker_boost: true
                    };
                }

                // If specific payload provided, merge it
                if (body.payload) {
                    payload = { ...payload, ...body.payload };
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: wsHeaders,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Wavespeed API Error (${type}): ${response.status} - ${err}`);
                }
                const data = await response.json();
                responseData = data;
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    data: responseData,
                    type,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // --- EXISTING GEMINI LOGIC (Keep for backward compatibility) ---
        // @ts-ignore
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
        if (geminiApiKey && topic) {
            const genAI = new GoogleGenerativeAI(geminiApiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
            let prompt: string
            switch (type) {
                case 'syllabus': prompt = PROMPTS.syllabus(topic, language); break;
                // ... defaults ...
                default: prompt = `Generate content for ${topic}`; break;
            }
            // Simple fallback gen
            const result = await model.generateContent(prompt)
            const text = result.response.text();
            return new Response(
                JSON.stringify({ success: true, content: text, type }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: false, error: 'Invalid Request: Type not handled or API keys missing' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('AI generation error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal Server Error'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
