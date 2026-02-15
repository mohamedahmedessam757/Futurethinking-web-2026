// Professional Prompts Service
// Senior/Doctor level prompts for high-quality AI course generation

/**
 * Professional Prompt Templates
 * These prompts are designed to generate professional,
 * high-quality educational content at senior/expert level
 */

export interface PromptContext {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    audience: string;
    duration: string;
    style?: string; // Extracted from uploaded files
    language?: 'ar' | 'en';
}

export interface CourseSettings {
    totalDays: number;
    unitsCount: number;
    lessonsPerUnit: number;
    includeVoice: boolean;
    includeQuizzes: boolean;
    includeImages: boolean;
    includeVideos: boolean;
    includeScripts: boolean;
    includeScenarios: boolean;
}

// ============================================
// COURSE STRUCTURE PROMPTS
// ============================================

export const courseStructurePrompt = (context: PromptContext, settings: CourseSettings): string => `
أنت خبير ومستشار تعليمي عالمي (Senior Learning Consultant) بخبرة 30 عاماً.
مهمتك: تصميم "الهيكل العام" لدورة تدريبية احترافية جداً (Premium Quality).

الموضوع: "${context.topic}".
المدة: ${settings.totalDays} أيام.

المحددات الصارمة (Strict Constraints):
1. مدة الدورة: ${settings.totalDays} أيام تماماً (يجب توزيع الوحدات على هذه الأيام).
2. عدد الوحدات: ${settings.unitsCount} وحدات تماماً (لا تزيد ولا تنقص).
3. عدد الدروس في كل وحدة: ${settings.lessonsPerUnit} دروس تماماً (لا تزيد ولا تنقص).
4. إجمالي الدروس في الكورس يجب أن يكون: ${settings.unitsCount * settings.lessonsPerUnit} درس.

المطلوب:
1. **عناوين جذابة جداً (Catchy & Professional)**:
   - لا تستخدم عناوين تقليدية مثل "مقدمة".
   - استخدم عناوين مثل "فن القيادة..."، "أسرار ال..."، "استراتيجيات متقدمة لـ...".
   - اجعل العناوين تبدو وكأنها مأخوذة من كورس عالمي بآلاف الدولارات.

2. **وصف دقيق وجذاب (Concise & Punchy)**:
   - اكتب وصفاً للدورة والوحدات يكون "مختصراً" ولكن "قوي جداً".
   - (مهم جداً للسرعة): لا تكتب فقرات طويلة. جملتين فقط لكل وصف ولكن بأسلوب تسويقي رائع.

الهدف: إبهار المستخدم بجودة الهيكل مع الحفاظ على سرعة التوليد والالتزام التام بالعدد المطلوب.

أجب بصيغة JSON فقط:
{
    "title": "عنوان الدورة الإبداعي",
    "description": "وصف تسويقي احترافي للدورة (جملتين بحد أقصى)",
    "totalDays": ${settings.totalDays},
    "units": [
        {
            "id": "unit-1",
            "dayNumber": 1,
            "unitNumber": 1,
            "thinkingPattern": "نمط التفكير",
            "title": "عنوان الوحدة (جذاب واحترافي)",
            "lessons": [
                {
                    "id": "unit-1-lesson-1",
                    "title": "عنوان الدرس (قوي وعملي)",
                    "duration": "15:00",
                    "type": "video"
                }
            ]
        }
    ]
}
`;

// ============================================
// LESSON CONTENT PROMPTS (RICH ARTICLE)
// ============================================

export const lessonScriptPrompt = (
    lessonTitle: string,
    unitTitle: string,
    thinkingPattern: string,
    objectives: string[],
    previousLessonSummary?: string,
    style?: string
): string => `
أنت بروفيسور أكاديمي ومحاضر دولي بخبرة تتجاوز 30 عاماً في مجال "${thinkingPattern}".
لديك سجل حافل في تقديم المحتوى التعليمي العميق والمبني على البحث العلمي.
أسلوبك يتميز بالرصانة، العمق، الاستشهاد بالمصادر، وربط النظريات بالواقع العملي بشكل محترف.

═══════════════════════════════════════════════════
سياق الدرس:
═══════════════════════════════════════════════════
• الوحدة: "${unitTitle}"
• الدرس: "${lessonTitle}"
• المحور: "${thinkingPattern}"
• الأهداف: ${objectives.join(', ')}
${previousLessonSummary ? `• سياق سابق: ${previousLessonSummary}` : ''}

═══════════════════════════════════════════════════
معايير المحتوى الصارمة (Senior Professor Standard):
═══════════════════════════════════════════════════
1. **الطول والعمق المرجعي**:
   - يجب أن يكون طول الدرس ما بين **1000 إلى 1500 كلمة** فعلياً.
   - يمنع منعاً باتاً الاختصار أو السطحية. تعمق في كل فكرة واشرح جذورها.

2. **المنهجية البحثية والأكاديمية**:
   - يجب ذكر **تواريخ محددة** للأحداث والنظريات (مثلاً: "في عام 1995، قام الباحث...").
   - اذكر أسماء **علماء وباحثين** حقيقيين في هذا المجال وأهم مؤلفاتهم ذات الصلة.
   - استشهد بإحصائيات وأرقام دقيقة لتعزيز الحجج (مثلاً: "تشير دراسة هارفارد لعام 2018 أن 70% من...").

3. **الهيكل النقدي والتحليلي**:
   - لا تكتفِ بالسرد، بل قم بالتحليل والنقد والمقارنة بين وجهات النظر المختلفة.
   - اربط المفاهيم النظرية بالتطبيقات العملية المعاصرة (Industry Best Practices).

4. **دراسات الحالة (Case Studies)**:
   - خصص قسماً كاملاً لدراسة حالة واقعية ومفصلة (Real-world Case Study).
   - اذكر اسم الشركة أو المؤسسة أو الشخصية، المشكلة، الحل، والدروس المستفادة.

═══════════════════════════════════════════════════
الهيكل التنظيمي للمقالة (Article Structure):
═══════════════════════════════════════════════════
1. **المقدمة الأكاديمية (Introduction)**:
   - سياق تاريخي وتعريف بالمشكلة.
   - أهمية هذا الموضوع في الوقت الراهن.

2. **الأسس النظرية والمفاهيم (Theoretical Foundations)**:
   - شرح النظريات بعمق (Deep Dive).
   - الاستشهاد بأهم الرواد والمؤسسين.

3. **التحليل البحثي (Research & Insights)**:
   - عرض الدراسات والأبحاث ذات الصلة بالأرقام والتواريخ.

4. **دراسة حالة تطبيقية (In-depth Case Study)**:
   - موقف واقعي يجسد المفاهيم المشروحة.
   - تحليل النجاح أو الفشل في هذه الحالة.

5. **الخاتمة والتوصيات (Conclusion & Recommendations)**:
   - خلاصة الدرس وتوجيهات عملية للمدربين أو المتعلمين.

أجب بصيغة JSON حصراً:
{
    "script": "نص المقالة التعليمية الكامل (Markdown Supported) - يجب أن يكون طويلاً وغنياً جداً",
    "scriptSummary": "ملخص تنفيذي مكثف للمحتوى في 5-6 أسطر"
}
`;

// ============================================
// QUIZ PROMPTS (FROM CONTENT)
// ============================================

export const quizFromContentPrompt = (
    lessonTitle: string,
    lessonContent: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): string => `
أنت خبير تقييم تربوي.
قم بإنشاء اختبار مكون من 3 أسئلة بناءً على المحتوى التالي فقط.

عنوان الدرس: "${lessonTitle}"
المستوى: ${difficulty}

المحتوى المرجعي:
${lessonContent.substring(0, 3000)}...

المطلوب:
1. أسئلة تقيس الفهم والتحليل وليس مجرد التذكر.
2. تنوع في مستوى الصعوبة.
3. تغطية للنقاط الرئيسية في المحتوى (خاصة دراسة الحالة أو المفاهيم الرئيسية).

أجب بصيغة JSON:
{
    "questions": [
        {
            "id": "q1",
            "type": "mcq",
            "question": "نص السؤال",
            "options": ["أ) خيار 1", "ب) خيار 2", "ج) خيار 3", "د) خيار 4"],
            "answer": "أ) خيار 1",
            "explanation": "شرح مفصل لسبب صحة الإجابة، يظهر للطالب كفائدة تعليمية"
        }
    ]
}
`;

// ============================================
// TRAINING SCENARIO PROMPTS (FROM CONTENT)
// ============================================

export const trainingScenarioPrompt = (
    lessonTitle: string,
    thinkingPattern: string,
    lessonContext: string,
    audience: string
): string => `
أنت مستشار تدريب وتطوير مهني.
صمم سيناريو تدريبي واحد (Role Play or Situation) يعتمد على محتوى الدرس المشروح.

الدرس: "${lessonTitle}"
المحتوى:
${lessonContext.substring(0, 3000)}...

الهدف: تطبيق المفاهيم المشروحة في الدرس على موقف عملي يواجهه ${audience}.

أجب بصيغة JSON:
{
    "scenarios": [
        {
            "id": "scenario-1",
            "title": "عنوان السيناريو (جذاب ويعبر عن الموقف)",
            "context": "وصف مفصل لسياق الموقف (المكان، الزمان، الأطراف المعنية) - Context",
            "roleDescription": "وصف دقيق لدور المتدرب في هذا الموقف - Role",
            "challenge": "المعضلة الرئيسية أو التحدي الذي يجب حله - Challenge",
            "solution": "الحل الأمثل أو التصرف الصحيح المتوقع (Best Practice Solution)",
            "discussionPoints": ["سؤال للنقاش 1", "سؤال للنقاش 2"]
        }
    ]
}

Strictly text-only JSON. No Markdown formatting (no \`\`\`). No explanations.
`;

// ============================================
// IMAGE GENERATION PROMPTS
// ============================================

export const imagePrompt = (
    topic: string,
    context: string,
    style: 'professional' | 'educational' | 'infographic' | 'diagram' = 'educational'
): string => {
    const styleGuides = {
        professional: 'Corporate, clean, modern business style with blue and white tones',
        educational: 'Engaging educational illustration, colorful but professional, suitable for learning',
        infographic: 'Data visualization style, clear icons, structured layout, easy to understand',
        diagram: 'Technical diagram, flowchart style, labeled components, professional look'
    };

    return `Create a professional ${style} image for educational content.

Topic: ${topic}
Context: ${context}

Style requirements:
- ${styleGuides[style]}
- High quality, 4K resolution ready
- Clean and uncluttered composition
- Suitable for Arabic educational content
- NO text in the image (text will be added separately)
- Professional color palette
- Modern and engaging visual design

The image should effectively communicate the concept visually and be suitable for a professional training course.`;
};

// ============================================
// VIDEO DESCRIPTION PROMPTS
// ============================================

export const videoDescriptionPrompt = (
    topic: string,
    keyMessage: string,
    duration: number = 8
): string => `
Create a visual description for a ${duration}-second educational video.

Topic: ${topic}
Key Message: ${keyMessage}

Requirements:
- Start with an attention-grabbing visual
- Smooth transitions between key points
- Professional, corporate aesthetic
- Suitable for Arabic business training
- Motion graphics style preferred
- Clean typography spaces for Arabic text overlay

Describe the visual sequence frame by frame.`;

// ============================================
// CONTENT VALIDATION PROMPTS
// ============================================

export const contentValidationPrompt = (
    content: string,
    expectedType: 'script' | 'quiz' | 'scenario',
    criteria: string[]
): string => `
أنت مراقب جودة للمحتوى التعليمي.
مهمتك: تقييم جودة المحتوى والتحقق من استيفائه للمعايير.

المحتوى المراد تقييمه:
${content.substring(0, 2000)}

نوع المحتوى: ${expectedType === 'script' ? 'سكريبت' : expectedType === 'quiz' ? 'اختبار' : 'سيناريو'}

معايير التقييم:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

أجب بصيغة JSON:
{
    "isValid": true/false,
    "qualityScore": 0-100,
    "issues": ["مشكلة 1 إن وجدت"],
    "suggestions": ["اقتراح تحسين 1"],
    "passedCriteria": ["معيار 1", "معيار 2"],
    "failedCriteria": ["معيار فشل إن وجد"]
}
`;

export default {
    courseStructurePrompt,
    lessonScriptPrompt,
    quizFromContentPrompt,
    trainingScenarioPrompt,
    imagePrompt,
    videoDescriptionPrompt,
    contentValidationPrompt,
};
