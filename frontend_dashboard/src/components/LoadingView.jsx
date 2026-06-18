import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Shield, Zap, Radio, Database, Activity, Cpu, Globe } from 'lucide-react';

const LOADING_STEPS = [
    {
        id: 'LINK',
        title: 'ESTABLISHING LINK',
        subtext: 'Syncing with Space-Track Epoch data',
        icon: Radio,
        color: '#3b82f6'
    },
    {
        id: 'VECTOR',
        title: 'VECTOR EXTRACTION',
        subtext: 'Processing Perigee/Apogee harmonics',
        icon: Activity,
        color: '#8b5cf6'
    },
    {
        id: 'ENGINE',
        title: 'COLLISION ENGINE',
        subtext: 'Analyzing conjunction probability',
        icon: Cpu,
        color: '#ef4444'
    },
    {
        id: 'REPORT',
        title: 'REPORT GENERATION',
        subtext: 'Finalizing orbital safety assessment',
        icon: Database,
        color: '#10b981'
    }
];

export default function LoadingView() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#070708] z-50 flex flex-col items-center justify-between overflow-hidden py-12 px-12">
            {/* Background Texture/Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Top Branding/Security */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/20 overflow-hidden">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-1/3 h-full bg-zinc-400 opacity-50 shadow-[0_0_15px_#fff]"
                />
            </div>

            <div className="w-full flex justify-between font-mono text-[9px] text-zinc-700 tracking-[0.5em] uppercase font-bold opacity-50">
                <span>OARC_ANALYSIS_V4_SECURE</span>
                <span>COORD:// 51.5074° N, 0.1278° W</span>
            </div>

            {/* MAIN CENTERED LOADER */}
            <div className="flex flex-col items-center gap-6 relative z-10 scale-110">
                <div className="relative w-52 h-52 flex items-center justify-center">
                    {/* Ring layers */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-dashed border-zinc-800 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-10 border border-dashed border-zinc-700/40 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[80px] border border-zinc-700/60 rounded-full border-t-white/30"
                    />

                    {/* Scanning Glow */}
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.2, 0.05] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-20 bg-zinc-100/5 rounded-full blur-3xl"
                    />

                    {/* Dynamic Center Icon */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="relative z-20"
                        >
                            {(() => {
                                const StepIcon = LOADING_STEPS[currentStep].icon;
                                return <StepIcon size={64} strokeWidth={0.75} className="text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />;
                            })()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-light text-white tracking-[0.4em] font-mono uppercase">
                        ANALYZING
                    </h2>
                    <div className="flex items-center justify-center gap-6">
                        <div className="h-px w-16 bg-zinc-800" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.6em] font-bold">Orbital Logic Unit</span>
                        <div className="h-px w-16 bg-zinc-800" />
                    </div>
                </div>
            </div>

            {/* 4 DIVS BELOW IN GRID/LOOP */}
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 z-10">
                {LOADING_STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isPast = index < currentStep;
                    const isFuture = index > currentStep;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-6 border-l-2 transition-all duration-700
                                        ${isActive ? 'bg-zinc-900/40 border-white shadow-2xl' : 'bg-black/20 border-zinc-900'}`}
                        >
                            {/* Metadata Header */}
                            <div className="flex justify-between items-center mb-6">
                                <span className={`text-[8px] font-bold tracking-widest uppercase
                                                ${isActive ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                    0{index + 1}_PROC
                                </span>
                                {isPast && (
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-zinc-500/50" />)}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-2 transition-colors duration-500
                                                ${isActive ? 'text-white scale-110' : isPast ? 'text-zinc-500' : 'text-zinc-800'}`}>
                                    <step.icon size={24} strokeWidth={isActive ? 1.5 : 1} />
                                </div>
                                <h4 className={`text-sm font-bold tracking-[0.2em] uppercase transition-colors duration-500
                                              ${isActive ? 'text-white' : isPast ? 'text-zinc-400' : 'text-zinc-700'}`}>
                                    {step.title}
                                </h4>
                            </div>

                            <div className="h-[2px] bg-zinc-900 relative mb-4">
                                {isActive && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        className="absolute inset-0 bg-white"
                                    />
                                )}
                                {isPast && <div className="absolute inset-0 bg-zinc-700" />}
                            </div>

                            <p className={`text-[10px] font-mono leading-loose transition-colors duration-500
                                        ${isActive ? 'text-zinc-400' : isPast ? 'text-zinc-600 italic' : 'text-zinc-800'}`}>
                                {isActive ? `> EXECUTING: ${step.subtext}` : isPast ? `SYSTEM_OK: VERIFIED` : `AWAIT_SYNC...`}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom System Status */}
            <div className="w-full flex justify-between items-center opacity-30 mt-8 font-mono text-[9px] tracking-[0.3em]">
                <div className="flex gap-10">
                    <span className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-zinc-100 rounded-full animate-pulse" /> ENGINE_NOMINAL
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-zinc-100 rounded-full" /> BUFFER_STABLE
                    </span>
                </div>
                <span className="text-right italic">MISSION_CONTROL_PROTO_ACT_V4</span>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            ` }} />
        </div>
    );
}
