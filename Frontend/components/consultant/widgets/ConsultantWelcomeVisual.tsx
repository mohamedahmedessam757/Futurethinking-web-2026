import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Briefcase, BarChart2, Users, Calendar, DollarSign, TrendingUp, Shield } from 'lucide-react';

const ConsultantWelcomeVisual = () => {
    // Animation Variants
    const float: Variants = {
        animate: {
            y: [0, -6, 0],
            transition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    const hologramPulse: Variants = {
        animate: {
            opacity: [0.5, 0.8, 0.5],
            scale: [0.95, 1.05, 0.95],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    const cardEntrance = (index: number): Variants => ({
        initial: { opacity: 0, x: 20 },
        animate: {
            opacity: 1,
            x: 0,
            y: [0, -4, 0],
            transition: {
                delay: index * 0.2,
                y: {
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 1,
                    ease: "easeInOut" as const
                }
            }
        }
    });

    return (
        <div className="relative w-96 h-80 flex items-center justify-center">
            {/* Background Aura */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute w-72 h-72 bg-brand-gold/5 rounded-full blur-[60px]"
            />

            <div className="relative flex items-center gap-8">
                {/* Left Side: 3D Laptop with Hologram */}
                <motion.div
                    variants={float}
                    animate="animate"
                    className="relative z-10 w-48"
                >
                    <div className="relative transform perspective-[800px] rotateY-[15deg] rotateX-[5deg]">
                        {/* Screen Frame */}
                        <div className="w-44 h-28 bg-[#0f2344] rounded-t-xl border-4 border-[#1e3a6e] relative overflow-hidden shadow-2xl">
                            {/* Screen Content */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#06152e] to-[#0f2344] flex items-end justify-center pb-2 gap-1.5 px-3">
                                <motion.div animate={{ height: ["30%", "60%", "40%"] }} transition={{ duration: 4, repeat: Infinity }} className="w-4 bg-blue-500/60 rounded-t-sm" />
                                <motion.div animate={{ height: ["40%", "80%", "50%"] }} transition={{ duration: 5, repeat: Infinity }} className="w-4 bg-brand-gold/60 rounded-t-sm" />
                                <motion.div animate={{ height: ["20%", "50%", "30%"] }} transition={{ duration: 3, repeat: Infinity }} className="w-4 bg-purple-500/60 rounded-t-sm" />

                                {/* Screen Glare */}
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rotate-45 blur-md" />
                            </div>
                        </div>

                        {/* Keyboard Base */}
                        <div className="w-52 h-3 bg-[#1e3a6e] -ml-4 transform skew-x-[20deg] rounded-b-lg shadow-[0_20px_30px_rgba(0,0,0,0.4)] border-b-2 border-[#06152e] flex items-center justify-center">
                            <div className="w-12 h-0.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Holographic Projection (Clean & Separated) */}
                        <motion.div
                            variants={hologramPulse}
                            animate="animate"
                            className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 h-32 flex flex-col items-center justify-end pb-4"
                        >
                            {/* Hologram Light Beam */}
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-gold/10 to-transparent clip-path-polygon-[20%_100%,_80%_100%,_100%_0%,_0%_0%] pointer-events-none"
                                style={{ clipPath: 'polygon(30% 100%, 70% 100%, 100% 0, 0 0)' }}
                            />

                            {/* Floating Icon */}
                            <div className="relative z-10 bg-[#06152e]/80 backdrop-blur-sm p-3 rounded-xl border border-brand-gold/30 shadow-[0_0_15px_rgba(198,165,104,0.3)]">
                                <TrendingUp size={24} className="text-brand-gold" />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Right Side: Organized Floating Data Cards */}
                <div className="flex flex-col gap-3 relative z-20">
                    {/* Revenue Card */}
                    <motion.div
                        variants={cardEntrance(0)}
                        initial="initial"
                        animate="animate"
                        className="bg-[#06152e]/90 backdrop-blur-md p-2.5 pr-4 rounded-xl border border-brand-gold/20 shadow-lg flex items-center gap-3"
                    >
                        <div className="bg-brand-gold/10 p-1.5 rounded-lg">
                            <DollarSign size={16} className="text-brand-gold" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-12 bg-white/20 rounded-full" />
                            <div className="h-1.5 w-8 bg-white/10 rounded-full" />
                        </div>
                    </motion.div>

                    {/* Schedule Card */}
                    <motion.div
                        variants={cardEntrance(1)}
                        initial="initial"
                        animate="animate"
                        className="bg-[#06152e]/90 backdrop-blur-md p-2.5 pr-4 rounded-xl border border-blue-400/20 shadow-lg flex items-center gap-3 pl-6" // Offset layout
                    >
                        <div className="bg-blue-400/10 p-1.5 rounded-lg">
                            <Calendar size={16} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-10 bg-white/20 rounded-full" />
                        </div>
                    </motion.div>

                    {/* Security/Clients Card */}
                    <motion.div
                        variants={cardEntrance(2)}
                        initial="initial"
                        animate="animate"
                        className="bg-[#06152e]/90 backdrop-blur-md p-2.5 pr-4 rounded-xl border border-purple-400/20 shadow-lg flex items-center gap-3"
                    >
                        <div className="bg-purple-400/10 p-1.5 rounded-lg">
                            <Briefcase size={16} className="text-purple-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-14 bg-white/20 rounded-full" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ConsultantWelcomeVisual;
