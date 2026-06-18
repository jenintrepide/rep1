import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Radio, Shield, ChevronRight, Activity, Cpu, Database } from 'lucide-react';

export default function BgIntro({ onComplete }) {
    const [initPhase, setInitPhase] = useState('boot');
    const [showMessage, setShowMessage] = useState(false);
    const [showSubtext, setShowSubtext] = useState(false);
    const [statusText, setStatusText] = useState('ESTABLISHING ENCRYPTED LINK...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animated progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                const increment = Math.random() > 0.8 ? 5 : 1;
                return Math.min(prev + increment, 100);
            });
        }, 40);

        // Boot sequence
        const bootTimer = setTimeout(() => {
            setStatusText('SYNCING ORBITAL TELEMETRY...');
            setInitPhase('init');
        }, 1000);

        // Show welcome message
        const messageTimer = setTimeout(() => {
            setShowMessage(true);
        }, 1600);

        // Ready state
        const readyTimer = setTimeout(() => {
            setStatusText('SECURITY PROTOCOL VERIFIED');
            setInitPhase('ready');
        }, 3800);

        // Final phase
        const finalTimer = setTimeout(() => {
            setShowSubtext(true);
        }, 2200);

        // Auto complete
        const completeTimer = setTimeout(() => {
            onComplete?.();
        }, 5500);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(bootTimer);
            clearTimeout(messageTimer);
            clearTimeout(readyTimer);
            clearTimeout(finalTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    const handleSkip = () => {
        onComplete?.();
    };

    return (
        <div className="relative w-full h-screen bg-[#0a0a0c] overflow-hidden font-mono">
            {/* Background Video */}
            <video
                src="/236105_small.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />

            {/* Technical overlays */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Scan Lines Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

            {/* Main Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">

                {/* Logo Frame */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="mb-10 relative"
                >
                    <div className="w-24 h-24 border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/40 relative">
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-zinc-400" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-zinc-400" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-zinc-400" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-zinc-400" />

                        <Satellite size={48} strokeWidth={1} className="text-zinc-100" />
                        <motion.div
                            animate={{ opacity: [0.1, 0.4, 0.1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-zinc-100/5"
                        />
                    </div>
                </motion.div>

                {/* Branding Section */}
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, letterSpacing: "1em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-light text-white uppercase tracking-[0.5em]"
                    >
                        ORBITARCH
                    </motion.h1>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-px w-full max-w-lg mx-auto bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                    >
                        <p className="text-lg md:text-xl font-light text-zinc-400 tracking-[0.3em] uppercase">
                            MISSION CONTROL INTERFACE
                        </p>
                    </motion.div>
                </div>

                {/* Technical Icons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 1 }}
                    className="flex items-center gap-16 mt-16"
                >
                    {[
                        { icon: Activity, label: 'VECTOR' },
                        { icon: Database, label: 'DATABASE' },
                        { icon: Shield, label: 'SHIELD' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border border-dashed border-zinc-800 flex items-center justify-center">
                                <item.icon size={18} className="text-zinc-500" />
                            </div>
                            <span className="text-[9px] text-zinc-600 tracking-[0.4em] font-bold">{item.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Interface Footer */}
            <div className="absolute bottom-12 left-0 right-0 px-12 z-30">
                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Progress */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-[8px] text-zinc-600 uppercase tracking-widest font-bold">
                                <span>Initializing Core</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-900 border border-zinc-800 p-[2px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                />
                            </div>
                        </div>

                        {/* Skip Action - Enhanced Visibility */}
                        <motion.button
                            onClick={handleSkip}
                            whileHover={{ scale: 1.05, borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            className="group px-10 py-3 border border-dashed border-zinc-500 text-[11px] text-zinc-200 
                                       tracking-[0.5em] uppercase transition-all duration-300 flex items-center gap-4 bg-black/40"
                        >
                            SKIP SEQUENCE <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Perimeter Borders */}
            <div className="absolute inset-8 pointer-events-none">
                <div className="absolute top-0 left-0 w-24 h-24 border-l border-t border-dashed border-zinc-800" />
                <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-dashed border-zinc-800" />
                <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-dashed border-zinc-800" />
                <div className="absolute bottom-0 right-0 w-24 h-24 border-r border-b border-dashed border-zinc-800" />
            </div>

            {/* Identification Metadata */}
            <div className="absolute top-12 left-12 text-zinc-800 text-[9px] tracking-[0.5em] font-bold uppercase z-30">
                OARC-SEC-V2.1 // SESSION_INIT
            </div>
            <div className="absolute bottom-12 right-12 text-zinc-800 text-[9px] tracking-[0.5em] font-bold uppercase z-30">
                COORD:// 51.5074° N, 0.1278° W
            </div>
        </div>
    );
}

