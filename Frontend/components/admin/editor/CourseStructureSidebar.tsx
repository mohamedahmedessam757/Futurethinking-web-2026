import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Clock, Plus, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../../services/canvasStore';

export const CourseStructureSidebar = () => {
    const { elements, selectedElementId, selectElement, courseStructure } = useCanvasStore();
    // Default open first unit if exists, else empty array
    const [expandedUnits, setExpandedUnits] = useState<number[]>([1]);

    // Group elements by unit
    const units = useMemo(() => {
        const groups: Record<number, typeof elements> = {};
        if (!elements) return groups;

        elements.forEach(el => {
            const unit = el.unitNumber || 1;
            if (!groups[unit]) groups[unit] = [];
            groups[unit].push(el);
        });

        // Sort lessons within units
        Object.keys(groups).forEach(key => {
            groups[Number(key)].sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
        });

        return groups;
    }, [elements]);

    const toggleUnit = (unitNum: number) => {
        setExpandedUnits(prev =>
            prev.includes(unitNum)
                ? prev.filter(u => u !== unitNum)
                : [...prev, unitNum]
        );
    };

    return (
        <div className="w-80 bg-[#06152e] border-l border-white/10 flex flex-col h-full text-white">
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-[#0f172a]/50">
                <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
                    هيكل الكورس
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    {Object.keys(units).length} وحدات • {elements?.length || 0} دروس
                </p>
            </div>

            {/* Units List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {Object.keys(units).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                        <FolderPlus className="mb-2 opacity-50" size={32} />
                        <span className="text-sm font-medium">ابدأ بإضافة وحدة دراسية</span>
                    </div>
                ) : (
                    Object.keys(units)
                        .sort((a, b) => Number(a) - Number(b))
                        .map((unitKey) => {
                            const unitNum = Number(unitKey);
                            const isExpanded = expandedUnits.includes(unitNum);
                            const unitLessons = units[unitNum];

                            return (
                                <div key={unitNum} className="rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]/50 transition-all hover:bg-[#0f172a]">
                                    {/* Unit Header */}
                                    <button
                                        onClick={() => toggleUnit(unitNum)}
                                        className="w-full flex items-center justify-between p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center text-sm font-bold border border-brand-gold/20">
                                                {unitNum}
                                            </div>
                                            <span className="font-bold text-sm text-gray-200 truncate max-w-[180px]" title={courseStructure?.units?.find((u: any) => u.unitNumber === unitNum)?.title || `الوحدة ${unitNum}`}>
                                                {courseStructure?.units?.find((u: any) => u.unitNumber === unitNum)?.title || `الوحدة ${unitNum}`}
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden bg-[#0a101f]"
                                            >
                                                <div className="p-2 space-y-1 border-t border-white/5">
                                                    {unitLessons.length === 0 && (
                                                        <p className="text-xs text-center text-gray-600 py-3">لا توجد دروس في هذه الوحدة</p>
                                                    )}
                                                    {unitLessons.map((lesson) => {
                                                        const isActive = selectedElementId === lesson.id;
                                                        return (
                                                            <div
                                                                key={lesson.id}
                                                                onClick={() => selectElement(lesson.id)}
                                                                className={`
                                                                    group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                                                                    ${isActive
                                                                        ? 'bg-brand-gold/10 border-brand-gold/40 shadow-[0_0_15px_-5px_rgba(198,165,104,0.3)]'
                                                                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                                                                    }
                                                                `}
                                                            >
                                                                <div className={`
                                                                    w-2 h-2 rounded-full transition-all
                                                                    ${isActive ? 'bg-brand-gold scale-125' : 'bg-gray-700 group-hover:bg-gray-500'}
                                                                `} />

                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-brand-gold' : 'text-gray-300 group-hover:text-white'}`}>
                                                                        {lesson.title}
                                                                    </p>
                                                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock size={10} />
                                                                            {lesson.duration || '0 دقيقة'}
                                                                        </span>
                                                                        {lesson.isGenerated && (
                                                                            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-1.5 py-0.5 rounded-[4px]">
                                                                                <CheckCircle size={8} /> AI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {isActive && <ChevronRight size={14} className="text-brand-gold animate-in slide-in-from-right-2" />}
                                                            </div>
                                                        );
                                                    })}

                                                    <button className="w-full py-2.5 mt-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 border border-dashed border-white/10 rounded-lg flex items-center justify-center gap-2 transition-all group/btn">
                                                        <Plus size={14} className="group-hover/btn:text-brand-gold transition-colors" />
                                                        إضافة درس جديد
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                )}

                <button className="w-full py-4 mt-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-brand-gold hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all group">
                    <div className="p-1 rounded bg-white/5 group-hover:bg-brand-gold/20 transition-colors">
                        <FolderPlus size={18} />
                    </div>
                    <span className="font-bold text-sm">إضافة وحدة جديدة</span>
                </button>
            </div>
        </div>
    );
};
