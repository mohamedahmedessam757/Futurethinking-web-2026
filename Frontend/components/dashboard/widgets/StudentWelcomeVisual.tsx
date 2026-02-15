
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { GraduationCap, BookOpen, Code, Trophy, Sparkles } from 'lucide-react';

const StudentWelcomeVisual = () => {
    // Floating Animation Variants
    const float: Variants = {
        animate: {
            y: [0, -15, 0],
            rotate: [0, 2, -2, 0],
            transition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    const orbit: Variants = {
        animate: {
            rotate: 360,
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: "linear" as const
            }
        }
    };

    const pulse: Variants = {
        animate: {
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background Glow */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute w-48 h-48 bg-brand-gold/20 rounded-full blur-[50px]"
            />

            {/* Central 3D-like Platform/Tablet */}
            <motion.div
                variants={float}
                animate="animate"
                className="relative z-10"
            >
                {/* Device Base */}
                <div className="w-32 h-40 bg-gradient-to-br from-[#1e3a6e] to-[#0f2344] rounded-2xl border border-brand-gold/30 shadow-2xl relative overflow-hidden transform rotate-[-10deg] skew-y-6">
                    <div className="absolute inset-0 bg-grid-white/[0.05]" />

                    {/* Screen Content */}
                    <div className="absolute top-4 left-4 right-4 bottom-12 bg-[#06152e]/50 rounded-lg p-2 flex flex-col items-center justify-center gap-2 border border-white/5">
                        <Sparkles className="text-brand-gold w-6 h-6" />
                        <div className="h-1 w-12 bg-white/10 rounded-full" />
                        <div className="h-1 w-8 bg-white/10 rounded-full" />
                    </div>

                    {/* Progress Bar visual */}
                    <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-brand-gold"
                            animate={{ width: ["10%", "70%"] }}
                            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        />
                    </div>
                </div>

                {/* Floating Cap on top */}
                <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -top-10 -right-8"
                >
                    <div className="relative">
                        <GraduationCap size={48} className="text-brand-gold drop-shadow-[0_0_15px_rgba(198,165,104,0.5)] fill-brand-gold/10" />
                        <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                            variants={pulse}
                            animate="animate"
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Orbiting Elements Ring 1 */}
            <motion.div
                variants={orbit}
                animate="animate"
                className="absolute w-56 h-56 rounded-full border border-white/5 border-dashed"
                style={{ rotateX: 60 }}
            >
                <div className="absolute -top-3 left-1/2 bg-[#0f172a] p-1 rounded-full border border-white/10 shadow-lg transform -translate-x-1/2">
                    <BookOpen size={16} className="text-blue-400" />
                </div>
            </motion.div>

            {/* Orbiting Elements Ring 2 (Reverse) */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 rounded-full border border-brand-gold/10"
                style={{ rotateX: -60 }}
            >
                <div className="absolute -bottom-3 left-1/2 bg-[#0f172a] p-1 rounded-full border border-brand-gold/20 shadow-lg transform -translate-x-1/2">
                    <Code size={16} className="text-brand-gold" />
                </div>
                <div className="absolute top-1/2 -right-3 bg-[#0f172a] p-1 rounded-full border border-purple-500/20 shadow-lg transform -translate-y-1/2">
                    <Trophy size={14} className="text-purple-400" />
                </div>
            </motion.div>

            {/* Floating Particles */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-brand-gold rounded-full"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}
        </div>
    );
};

export default StudentWelcomeVisual;
