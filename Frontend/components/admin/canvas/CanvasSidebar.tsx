import React, { useEffect, useState } from 'react';
import { Plus, Search, Layers, Clock, Settings, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../../services/canvasStore';
import { aiCourseStorage } from '../../../services/aiCourseStorage';
import { supabase } from '../../../lib/supabase';

export const CanvasSidebar = () => {
    const { generationId, setGenerationId, setSession, setElements, setLoading } = useCanvasStore();
    const [sessions, setSessions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localLoading, setLocalLoading] = useState(true);

    useEffect(() => {
        const loadSessions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const result = await aiCourseStorage.getGenerations(user.id);
                if (result.success && result.data) {
                    setSessions(result.data);
                }
            }
            setLocalLoading(false);
        };
        loadSessions();
    }, []);

    const handleSelectSession = async (id: string) => {
        if (id === generationId) return;

        setGenerationId(id);
        setLoading(true); // store loading

        const result = await aiCourseStorage.getGeneration(id);
        if (result.success && result.data) {
            setSession(result.data);

            // Map DB lessons to Canvas Elements
            const lessons = (result.data.ai_generated_lessons || []).map((l: any) => ({
                id: l.lesson_id || l.id,
                localId: l.id, // DB primary key
                title: l.title,
                duration: l.duration,
                unitNumber: l.unit_number,
                lessonNumber: l.lesson_number,

                // Content
                script: l.script,
                scriptSummary: l.script_summary,
                quizData: l.quiz_data,
                trainingScenarios: l.training_scenarios,

                // Media
                voiceUrl: l.voice_url,
                voiceDuration: l.voice_duration,
                videoUrl: l.video_url,
                images: l.image_urls,

                // Metadata
                isGenerated: l.is_generated
            }));

            // Sort by unit then lesson
            lessons.sort((a: any, b: any) => {
                if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
                return a.lessonNumber - b.lessonNumber;
            });

            setElements(lessons);
        }
        setLoading(false);
    };

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-72 border-r border-white/10 bg-[#0f172a] flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Layers className="text-brand-gold" /> المشاريع المحفوظة
                </h2>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="بحث في الكورسات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg pr-10 pl-3 py-2 text-sm text-white focus:border-brand-gold/50 outline-none"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {localLoading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">جاري التحميل...</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">لا توجد مشاريع سابقة</div>
                ) : (
                    filteredSessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${generationId === session.id
                                ? 'bg-brand-gold/10 border-brand-gold/30'
                                : 'bg-[#0f172a] border-white/5 hover:border-white/20'
                                }`}
                        >
                            <h3 className={`font-bold text-sm mb-1 ${generationId === session.id ? 'text-brand-gold' : 'text-gray-300'}`}>
                                {session.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} /> {new Date(session.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${session.status === 'published' ? 'bg-green-500/10 text-green-400' :
                                    session.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    {session.status === 'published' ? 'منشور' : session.status === 'completed' ? 'مكتمل' : 'جاري'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
