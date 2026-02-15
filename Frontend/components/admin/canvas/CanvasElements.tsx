import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Mic, Video, FileText, HelpCircle, Layers, Image as ImageIcon, Play, PenTool } from 'lucide-react';
import { CanvasElement, useCanvasStore } from '../../../services/canvasStore';

interface LessonCardProps {
    element: CanvasElement;
}

export const LessonCard: React.FC<LessonCardProps> = ({ element }) => {
    const controls = useDragControls();
    const { selectedElementId, selectElement } = useCanvasStore();
    const isSelected = selectedElementId === element.id;

    return (
        <Reorder.Item
            value={element}
            id={element.id}
            dragListener={false}
            dragControls={controls}
            className={`group relative bg-[#0f172a] border rounded-xl overflow-hidden transition-all mb-4 ${isSelected
                ? 'border-brand-gold ring-1 ring-brand-gold shadow-[0_0_15px_rgba(198,165,104,0.1)]'
                : 'border-white/10 hover:border-white/20'
                }`}
            onClick={() => selectElement(element.id)}
        >
            {/* Header / Drag Handle */}
            <div className="flex items-center gap-3 p-4 bg-[#06152e] border-b border-white/5">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-move text-gray-600 hover:text-brand-gold transition-colors p-1"
                >
                    <GripVertical size={20} />
                </div>

                <div className="flex-1">
                    <h4 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                            {element.lessonNumber}
                        </span>
                        {element.title}
                    </h4>
                    <span className="text-xs text-gray-500">Unit {element.unitNumber}</span>
                </div>

                <div className="flex gap-2">
                    {/* Icons indicating content types present */}
                    {element.segments && element.segments.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded">
                            <Layers size={10} />
                            <span>{element.segments.length}</span>
                        </div>
                    )}
                    {element.script && <FileText size={14} className="text-blue-400" />}
                    {element.voiceUrl && <Mic size={14} className="text-green-400" />}
                    {element.videoUrl && <Video size={14} className="text-red-400" />}
                    {element.quizData && element.quizData.length > 0 && <HelpCircle size={14} className="text-purple-400" />}
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-4 space-y-3">
                {/* Script Preview */}
                {element.script && (
                    <div className="text-xs text-gray-400 line-clamp-2 pl-4 border-l-2 border-white/10">
                        {element.script.substring(0, 100)}...
                    </div>
                )}

                {/* Media Row */}
                <div className="flex gap-2 mt-2">
                    {element.images && element.images.length > 0 && (
                        <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative">
                            <img src={element.images[0]} alt="" className="w-full h-full object-cover opacity-70" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <ImageIcon size={12} className="text-white" />
                            </div>
                        </div>
                    )}

                    {element.videoUrl && (
                        <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group/media cursor-pointer hover:bg-white/10">
                            <Video size={16} className="text-red-400" />
                        </div>
                    )}

                    {element.voiceUrl && (
                        <div className="h-12 flex-1 rounded-lg bg-white/5 border border-white/10 flex items-center px-3 gap-2">
                            <button className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/30">
                                <Play size={10} fill="currentColor" />
                            </button>
                            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-green-500/50 rounded-full"></div>
                            </div>
                            <span className="text-[10px] text-gray-500">{element.voiceDuration || '0:00'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
            )}
        </Reorder.Item>
    );
};
