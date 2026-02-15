
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, Volume2, HelpCircle, SkipForward, RotateCcw, Briefcase, Target, BookOpen, ChevronUp, ChevronDown, Award, Image, Film } from 'lucide-react';
import type { Lesson, LessonSegment, QuizQuestion, TrainingScenario } from '../../../types/store';

// ============================================
// HELPER COMPONENTS
// ============================================

const VideoPlayer = ({ lesson }: { lesson: Lesson }) => {
    const videoUrl = lesson.videoUrl || '';
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isVimeo = videoUrl.includes('vimeo.com');

    const getEmbedUrl = () => {
        if (isYouTube) {
            const videoId = videoUrl.includes('youtu.be')
                ? videoUrl.split('/').pop()
                : new URL(videoUrl).searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}?rel=0`;
        }
        if (isVimeo) {
            const videoId = videoUrl.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return videoUrl;
    };

    if (!videoUrl) {
        return (
            <div className="w-full h-full bg-[#06152e] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold mb-4">
                    <Play size={32} />
                </div>
                <p className="text-gray-400">لم يتم إضافة فيديو لهذا الدرس بعد.</p>
            </div>
        );
    }

    return (
        <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        />
    );
};

// --- Inline Quiz Section ---
export const InlineQuizSection = ({ questions }: { questions: QuizQuestion[] }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    const handleSelect = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
    };

    const handleSubmit = () => {
        if (!selectedAnswer || isAnswered) return;
        setIsAnswered(true);
        if (selectedAnswer === currentQuestion.answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
    };

    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const passed = percentage >= 70;
        return (
            <div className="bg-[#06152e] rounded-2xl border border-white/10 p-8 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {passed ? <Award size={40} /> : <RotateCcw size={40} />}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                    {passed ? 'أحسنت! 🎉' : 'حاول مرة أخرى'}
                </h3>
                <p className="text-gray-400 mb-6">نتيجتك: {score} / {questions.length} ({percentage}%)</p>
                <button onClick={handleRestart} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                    <RotateCcw size={16} className="inline ml-2" /> إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#06152e] rounded-2xl border border-white/10">
            {/* Quiz Header */}
            <div className="bg-gradient-to-l from-brand-gold/20 to-transparent p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-gold/20 rounded-xl flex items-center justify-center text-brand-gold">
                    <HelpCircle size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold">اختبار الدرس</h3>
                    <p className="text-xs text-gray-400">السؤال {currentQuestionIndex + 1} من {questions.length}</p>
                </div>
                <div className="mr-auto bg-brand-gold/10 text-brand-gold text-xs font-bold px-3 py-1 rounded-lg">
                    {score} نقاط
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/5">
                <div className="h-full bg-brand-gold transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            <div className="p-6">
                <h4 className="text-lg font-bold text-white mb-6">{currentQuestion.question}</h4>
                <div className="grid gap-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isCorrect = option === currentQuestion.answer;
                        const isSelected = option === selectedAnswer;
                        let cls = 'p-4 rounded-xl border-2 text-right font-medium transition-all cursor-pointer text-sm';
                        if (isAnswered) {
                            if (isCorrect) cls += ' border-green-500 bg-green-500/10 text-green-300';
                            else if (isSelected) cls += ' border-red-500 bg-red-500/10 text-red-300';
                            else cls += ' border-white/5 bg-white/5 text-gray-500';
                        } else {
                            cls += isSelected ? ' border-brand-gold bg-brand-gold/10 text-white' : ' border-white/10 bg-white/5 text-gray-300 hover:border-brand-gold/50';
                        }
                        return (
                            <button key={idx} onClick={() => handleSelect(option)} className={cls} disabled={isAnswered}>
                                {option}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {isAnswered && currentQuestion.explanation && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                        💡 {currentQuestion.explanation}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    {!isAnswered ? (
                        <button onClick={handleSubmit} disabled={!selectedAnswer} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedAnswer ? 'bg-brand-gold text-brand-navy hover:bg-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                            تأكيد الإجابة
                        </button>
                    ) : (
                        <button onClick={handleNext} className="bg-brand-gold text-brand-navy px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white transition-colors flex items-center gap-2">
                            {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
                            <SkipForward size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Training Scenario Viewer ---
export const TrainingScenarioViewer = ({ scenarios }: { scenarios: TrainingScenario[] }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    return (
        <div>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                    <Briefcase size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">السيناريو التدريبي</h3>
                    <p className="text-xs text-gray-400">{scenarios.length} {scenarios.length === 1 ? 'سيناريو' : 'سيناريوهات'}</p>
                </div>
            </div>

            {/* Scenarios */}
            <div className="space-y-4">
                {scenarios.map((scenario, idx) => (
                    <div key={idx} className="bg-[#06152e] rounded-2xl border border-white/10 overflow-hidden">
                        {/* Scenario Header */}
                        <button
                            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-sm font-bold">
                                    {idx + 1}
                                </div>
                                <span className="text-white font-bold text-sm">{scenario.title}</span>
                            </div>
                            {expandedIndex === idx ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </button>

                        {/* Scenario Content */}
                        <AnimatePresence>
                            {expandedIndex === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0 space-y-4">
                                        {/* Context */}
                                        {scenario.context && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h5 className="text-brand-gold text-xs font-bold mb-2 flex items-center gap-1">
                                                    <BookOpen size={12} /> السياق
                                                </h5>
                                                <p className="text-gray-300 text-sm leading-relaxed">{scenario.context}</p>
                                            </div>
                                        )}

                                        {/* Role Description */}
                                        {scenario.roleDescription && (
                                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                                                <h5 className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-1">
                                                    <Target size={12} /> دورك
                                                </h5>
                                                <p className="text-gray-300 text-sm leading-relaxed">{scenario.roleDescription}</p>
                                            </div>
                                        )}

                                        {/* Challenge */}
                                        {scenario.challenge && (
                                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                                <h5 className="text-red-400 text-xs font-bold mb-2">⚡ التحدي</h5>
                                                <p className="text-gray-300 text-sm leading-relaxed">{scenario.challenge}</p>
                                            </div>
                                        )}

                                        {/* Objectives */}
                                        {scenario.objectives && scenario.objectives.length > 0 && (
                                            <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-xl p-4">
                                                <h5 className="text-brand-gold text-xs font-bold mb-2 flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> الأهداف
                                                </h5>
                                                <ul className="space-y-1">
                                                    {scenario.objectives.map((obj, i) => (
                                                        <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                            <span className="text-brand-gold mt-1">•</span> {obj}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Solution (Expandable Spoiler) */}
                                        {scenario.solution && (
                                            <details className="bg-green-500/5 border border-green-500/10 rounded-xl overflow-hidden">
                                                <summary className="p-4 text-green-400 text-xs font-bold cursor-pointer hover:bg-green-500/5 transition-colors">
                                                    💡 عرض الحل المقترح
                                                </summary>
                                                <div className="px-4 pb-4">
                                                    <p className="text-gray-300 text-sm leading-relaxed">{scenario.solution}</p>
                                                </div>
                                            </details>
                                        )}

                                        {/* Expected Outcome */}
                                        {scenario.expectedOutcome && (
                                            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                                                <h5 className="text-purple-400 text-xs font-bold mb-2">🎯 النتيجة المتوقعة</h5>
                                                <p className="text-gray-300 text-sm leading-relaxed">{scenario.expectedOutcome}</p>
                                            </div>
                                        )}

                                        {/* Discussion Points */}
                                        {scenario.discussionPoints && scenario.discussionPoints.length > 0 && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h5 className="text-gray-300 text-xs font-bold mb-2">💬 نقاط للنقاش</h5>
                                                <ul className="space-y-1">
                                                    {scenario.discussionPoints.map((point, i) => (
                                                        <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                                                            <span className="text-gray-500 mt-1">{i + 1}.</span> {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Inline Segment Media Renderer ---
const SegmentInlineMedia = ({ block }: { block: LessonSegment }) => {
    const hasAudio = !!block.audioUrl;
    const hasImage = !!block.imageUrl;
    const hasVideo = !!block.videoUrl;

    if (!hasAudio && !hasImage && !hasVideo) return null;

    return (
        <div className="mt-5 space-y-4">
            {/* Inline Audio Player */}
            {hasAudio && (
                <div className="bg-[#06152e] border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                        <Volume2 size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <audio
                            src={block.audioUrl}
                            controls
                            className="w-full h-8"
                            controlsList="nodownload"
                        />
                    </div>
                </div>
            )}
            {/* Inline Image */}
            {hasImage && (
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <img
                        src={block.imageUrl}
                        alt="محتوى الدرس"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                    />
                </div>
            )}
            {/* Inline Video */}
            {hasVideo && (
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black aspect-video">
                    <video
                        src={block.videoUrl}
                        controls
                        className="w-full h-full"
                        controlsList="nodownload"
                    />
                </div>
            )}
        </div>
    );
};

// --- Block Content Renderer ---
export const BlockContentRenderer = ({ block }: { block: LessonSegment }) => {
    // Resolve text content: prefer 'content', fallback to 'text' (AI segments use 'text')
    const textBody = block.content || block.text || '';

    switch (block.type) {
        case 'text':
        default: {
            // For text blocks AND any untyped/unknown blocks, render text + inline media
            if (!textBody && !block.audioUrl && !block.imageUrl && !block.videoUrl) {
                // Completely empty block — skip
                if (block.type && block.type !== 'text') return null;
                if (!textBody) return null;
            }
            return (
                <div className="mb-8">
                    {/* Text Content */}
                    {textBody && (
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {textBody}
                        </div>
                    )}
                    {/* Inline media attached to this text segment */}
                    <SegmentInlineMedia block={block} />
                </div>
            );
        }

        case 'image':
            return (
                <div className="my-8 w-full">
                    {block.imageUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                            <img
                                src={block.imageUrl}
                                alt="محتوى الدرس"
                                className="w-full h-auto object-cover"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-500">
                            <Image size={40} className="mx-auto mb-2 opacity-50" />
                            <p>صورة مفقودة</p>
                        </div>
                    )}
                </div>
            );

        case 'video':
            return (
                <div className="my-8 w-full">
                    {block.videoUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black aspect-video">
                            <video
                                src={block.videoUrl}
                                controls
                                className="w-full h-full"
                                controlsList="nodownload"
                            />
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-500">
                            <Film size={40} className="mx-auto mb-2 opacity-50" />
                            <p>فيديو مفقود</p>
                        </div>
                    )}
                </div>
            );

        case 'audio':
            return (
                <div className="my-6 bg-[#06152e] border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-md">
                    <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                        <Volume2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {block.audioUrl ? (
                            <audio
                                src={block.audioUrl}
                                controls
                                className="w-full h-8"
                                controlsList="nodownload"
                            />
                        ) : (
                            <span className="text-gray-500 text-sm">ملف صوتي مفقود</span>
                        )}
                    </div>
                </div>
            );

        case 'quiz':
            if (!block.metadata?.questions?.length) return null;
            return (
                <div className="my-10 border-t border-white/10 pt-6">
                    <InlineQuizSection questions={block.metadata.questions} />
                </div>
            );

        case 'scenario':
            if (!block.metadata?.scenarios?.length) return null;
            return (
                <div className="my-10 border-t border-white/10 pt-6">
                    <TrainingScenarioViewer scenarios={block.metadata.scenarios} />
                </div>
            );
    }
};

// --- Main Lesson Viewer Component ---
export const LessonViewer = ({ lesson }: { lesson: Lesson }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    const hasAudio = !!lesson.voiceUrl;
    const hasImage = !!lesson.imageUrl;

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const time = (Number(e.target.value) / 100) * audioRef.current.duration;
            audioRef.current.currentTime = time;
            setProgress(Number(e.target.value));
        }
    };

    const changeSpeed = () => {
        const speeds = [1, 1.25, 1.5, 1.75, 2];
        const currentIndex = speeds.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % speeds.length;
        const newRate = speeds[nextIndex];
        setPlaybackRate(newRate);
        if (audioRef.current) audioRef.current.playbackRate = newRate;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Detect if quiz/scenario blocks already exist in segments
    const segments = lesson.content_segments || [];
    const hasQuizInSegments = segments.some(s => s.type === 'quiz');
    const hasScenarioInSegments = segments.some(s => s.type === 'scenario');

    return (
        <div className="text-right" dir="rtl">
            {/* 1. New Block-Based Rendering */}
            {segments.length > 0 ? (
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 border-b border-white/10 pb-6">
                        {lesson.title}
                    </h1>

                    {/* Top-level Audio Player REMOVED as per user request */}

                    {/* Render Blocks in Order */}
                    <div className="space-y-2">
                        {segments.map((block, idx) => (
                            <BlockContentRenderer key={block.id || idx} block={block} />
                        ))}
                    </div>

                    {/* Fallback: Quiz from top-level quizData when no quiz block in segments */}
                    {!hasQuizInSegments && lesson.quizData && lesson.quizData.length > 0 && (
                        <div className="mt-10 border-t border-white/10 pt-8">
                            <InlineQuizSection questions={lesson.quizData} />
                        </div>
                    )}

                    {/* Fallback: Scenarios from top-level data when no scenario block in segments */}
                    {!hasScenarioInSegments && lesson.trainingScenarios && lesson.trainingScenarios.length > 0 && (
                        <div className="mt-10 border-t border-white/10 pt-8">
                            <TrainingScenarioViewer scenarios={lesson.trainingScenarios} />
                        </div>
                    )}
                </div>
            ) : (
                /* 2. Legacy Rendering (Fallback) */
                <>
                    {/* Hero Image */}
                    {hasImage && (
                        <div className="w-full h-56 md:h-72 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-xl">
                            <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Audio Player REMOVED as per user request */}

                    {/* Script Content */}
                    <article className="prose prose-invert prose-lg max-w-none">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{lesson.title}</h1>
                        {lesson.objectives && lesson.objectives.length > 0 && (
                            <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-2xl p-6 mb-8">
                                <h3 className="text-brand-gold font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={18} /> أهداف الدرس
                                </h3>
                                <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm">
                                    {lesson.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{lesson.script || 'لا يوجد محتوى نصي لهذا الدرس.'}</div>
                    </article>

                    {/* Inline Quiz Section */}
                    {lesson.quizData && lesson.quizData.length > 0 && (
                        <div className="mt-10 border-t border-white/10 pt-8">
                            <InlineQuizSection questions={lesson.quizData} />
                        </div>
                    )}

                    {/* Inline Training Scenarios Section */}
                    {lesson.trainingScenarios && lesson.trainingScenarios.length > 0 && (
                        <div className="mt-10 border-t border-white/10 pt-8">
                            <TrainingScenarioViewer scenarios={lesson.trainingScenarios} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LessonViewer;
