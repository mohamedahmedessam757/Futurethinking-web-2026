import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    title: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
    link?: string;
}

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
};

const borderColors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    info: 'border-blue-500/30'
};

const bgColors = {
    success: 'bg-green-500/10',
    error: 'bg-red-500/10',
    warning: 'bg-yellow-500/10',
    info: 'bg-blue-500/10'
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ id, title, message, type, onClose, duration = 5000, link }, ref) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClick = () => {
        if (link) {
            window.location.href = link; // Simple navigation, or use router if available in context
        }
    };

    return (
        <motion.div
            layout
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`w-full max-w-sm pointer-events-auto overflow-hidden rounded-xl border ${borderColors[type]} backdrop-blur-xl bg-[#0f172a]/90 shadow-2xl relative group cursor-pointer`}
            onClick={handleClick}
        >
            {/* Progress Bar (Optional - simplistic version) */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} opacity-30`}
            />

            <div className="p-4 flex gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-full ${bgColors[type]} flex items-center justify-center border border-white/5`}>
                    {icons[type]}
                </div>

                <div className="flex-1 pt-0.5">
                    <h4 className="font-bold text-white text-sm leading-none mb-1">{title}</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">{message}</p>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onClose(id); }}
                    className="shrink-0 text-gray-500 hover:text-white transition-colors self-start -mt-1 -mr-1 p-1 hover:bg-white/10 rounded-lg"
                >
                    <X size={14} />
                </button>
            </div>
        </motion.div>
    );
});
Toast.displayName = 'Toast';

export default Toast;
