'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import {
    Layers, Cpu, Database, MousePointer2, Sparkles, Box, Layout,
    Code2, Globe, ShieldCheck, Zap, BarChart3, Binary, Network,
    Terminal, Server, Cloud, Workflow
} from 'lucide-react'

// --- HELPER COMPONENTS ---

function TechnicalLabel({ text, x, y, opacity }: { text: string, x: string, y: string, opacity: MotionValue<number> }) {
    return (
        <m.div
            style={{ opacity, left: x, top: y }}
            className="absolute z-50 pointer-events-none flex items-center gap-4"
        >
            <div className="w-16 h-[1px] bg-blue-500/40" />
            <span className="text-[12px] font-mono text-blue-400 uppercase tracking-[0.4em] whitespace-nowrap bg-blue-950/90 px-4 py-1.5 rounded-sm border border-blue-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                {text}
            </span>
        </m.div>
    )
}

// --- MAIN COMPONENT ---

export function LayeredBlueprint() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 35, stiffness: 60, mass: 1 })

    // --- SCENE DYNAMICS ---
    // User requested: keep cards straight (remove tilt)
    const sceneRotateX = 0
    const sceneRotateZ = 0
    const sceneScale = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.9, 1.05, 1.05, 0.9])

    // --- ADVANCED PINNING LOGIC ---
    // Layer 1: PRESENTATION (Top) - Pins at [0.15 - 0.35]
    const layer1Z = useTransform(smoothProgress, [0, 0.15, 0.35, 0.55], [-300, 0, 0, 1500])
    const layer1Y = useTransform(smoothProgress, [0, 0.15, 0.35, 0.55], [0, 0, 0, -800])
    const layer1Op = useTransform(smoothProgress, [0, 0.15, 0.35, 0.55], [0, 1, 1, 0])
    const layer1Blur = useTransform(smoothProgress, [0.35, 0.55], ["blur(0px)", "blur(20px)"])

    // Layer 2: COGNITIVE (AI/Analytics) - Pins at [0.35 - 0.55]
    const layer2Z = useTransform(smoothProgress, [0.2, 0.35, 0.55, 0.75], [-500, 0, 0, 1200])
    const layer2Y = useTransform(smoothProgress, [0.2, 0.35, 0.55, 0.75], [150, 0, 0, -600])
    const layer2Op = useTransform(smoothProgress, [0.2, 0.35, 0.55, 0.75], [0, 1, 1, 0])

    // Layer 3: LOGIC (Worker/CPU) - Pins at [0.55 - 0.75]
    const layer3Z = useTransform(smoothProgress, [0.4, 0.55, 0.75, 0.95], [-700, 0, 0, 800])
    const layer3Y = useTransform(smoothProgress, [0.4, 0.55, 0.75, 0.95], [300, 0, 0, -400])
    const layer3Op = useTransform(smoothProgress, [0.4, 0.55, 0.75, 0.95], [0, 1, 1, 0])

    // Layer 4: PERSISTENCE (Infra) - Pins at [0.75 - 0.95]
    const layer4Op = useTransform(smoothProgress, [0.5, 0.75, 0.95, 1], [0, 1, 1, 0])
    const layer4Scale = useTransform(smoothProgress, [0.6, 0.9], [0.9, 1.2])

    // Floating Titles
    const titleOp = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
    const titleY = useTransform(smoothProgress, [0, 0.1], [50, 0])

    return (
        <section ref={containerRef} className="relative h-[800vh] bg-[#010208]">
            {/* Sticky Viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">

                {/* 1. ATMOSPHERIC BACKGROUND */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1800px] h-[1800px] bg-blue-600/5 rounded-full blur-[250px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f605_0%,transparent_80%)]" />
                    <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#3b82f611_1px,transparent_1px),linear-gradient(to_bottom,#3b82f611_1px,transparent_1px)] bg-[size:100px_100px]" />
                </div>

                {/* 2. SECTION HEADER */}
                <m.div
                    style={{ opacity: titleOp, y: titleY }}
                    className="absolute top-20 text-center z-50 px-6"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 backdrop-blur-md">
                        <Terminal size={14} className="text-blue-400" />
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em]">Full_Stack_Architecture_Deconstruction</span>
                    </div>
                    <h2 className="text-5xl md:text-[6rem] font-bold text-white mb-6 tracking-tighter leading-[0.9]">
                        Blueprint for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-500">Excellence</span>
                    </h2>
                </m.div>

                {/* 3. THE STACK - STRAIGHT & TALL */}
                <m.div
                    style={{
                        rotateX: sceneRotateX,
                        rotateZ: sceneRotateZ,
                        scale: sceneScale,
                        transformStyle: 'preserve-3d',
                        translateZ: 0
                    }}
                    className="relative w-full max-w-[1400px] h-[850px] flex items-center justify-center mt-32 will-change-transform"
                >

                    {/* LAYER 1: THE SURFACE (UI/UX) - HEIGHT INCREASED */}
                    <m.div
                        style={{ z: layer1Z, y: layer1Y, opacity: layer1Op, filter: layer1Blur, translateZ: layer1Z }}
                        className="absolute w-[95%] md:w-[1300px] h-auto min-h-[500px] md:h-[750px] z-40 will-change-transform"
                    >
                        <TechnicalLabel text="Layer_01: Presentation_Engine" x="5%" y="-5%" opacity={layer1Op} />

                        <div className="w-full h-full bg-slate-900/40 backdrop-blur-3xl border border-white/20 shadow-[0_120px_240px_rgba(0,0,0,0.8)] rounded-[3rem] overflow-hidden flex flex-col relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-white/5 pointer-events-none" />

                            <div className="p-16 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-20">
                                    <div className="flex gap-6">
                                        <div className="w-6 h-6 rounded-full bg-red-500/30 border border-white/10" />
                                        <div className="w-6 h-6 rounded-full bg-yellow-500/30 border border-white/10" />
                                        <div className="w-6 h-6 rounded-full bg-green-500/30 border border-white/10" />
                                    </div>
                                    <div className="px-10 py-3 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center gap-4">
                                        <Globe size={20} className="text-blue-400" />
                                        <span className="text-base font-mono text-blue-300 uppercase tracking-widest leading-none">cluster.cdn.global</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 flex-1 items-stretch">
                                    <div className="col-span-1 md:col-span-4 bg-white/5 rounded-3xl md:rounded-[3rem] border border-white/10 p-8 md:p-12 flex flex-col gap-8 md:gap-12">
                                        <div className="w-full h-32 bg-blue-500/20 rounded-[2rem] border border-blue-400/20 flex items-center justify-center">
                                            <Zap size={56} className="text-blue-400" />
                                        </div>
                                        <div className="space-y-8 pt-6">
                                            <div className="w-full h-5 bg-white/15 rounded-full" />
                                            <div className="w-5/6 h-5 bg-white/10 rounded-full" />
                                            <div className="w-4/6 h-5 bg-white/10 rounded-full" />
                                            <div className="w-full h-5 bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-8 bg-gradient-to-br from-indigo-500/15 to-blue-600/10 rounded-3xl md:rounded-[3rem] border border-white/10 p-12 md:p-20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_4px,transparent_4px),linear-gradient(to_bottom,#ffffff05_4px,transparent_4px)] bg-[size:50px_50px]" />

                                        <div className="relative mb-16 scale-[1.75]">
                                            {[1, 2, 3].map((ring) => (
                                                <m.div
                                                    key={ring}
                                                    className="absolute inset-0 rounded-2xl border border-blue-500/40"
                                                    animate={{
                                                        scale: [1, 1.35 + (ring * 0.15), 1.15],
                                                        opacity: [0.5, 0, 0],
                                                        rotate: ring % 2 === 0 ? 90 : -90
                                                    }}
                                                    transition={{
                                                        duration: 4,
                                                        delay: ring * 0.5,
                                                        repeat: Infinity,
                                                        ease: "easeOut"
                                                    }}
                                                />
                                            ))}
                                            <m.div
                                                animate={{
                                                    y: [0, -15, 0],
                                                    rotate: [5, 7, 5]
                                                }}
                                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.75rem] flex items-center justify-center shadow-5xl shadow-blue-600/50 border border-blue-400/40 relative z-10 overflow-hidden"
                                            >
                                                <m.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                                    animate={{ x: ['-200%', '200%'] }}
                                                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                                                />
                                                <Layers className="w-16 h-16 text-white fill-white/15" />
                                            </m.div>
                                        </div>

                                        <div className="w-[80%] h-12 bg-white/20 rounded-full mb-8 z-10" />
                                        <div className="w-[60%] h-6 bg-white/10 rounded-full z-10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>

                    {/* LAYER 2: COGNITIVE (AI/Intelligence) - HEIGHT INCREASED */}
                    <m.div
                        style={{ z: layer2Z, y: layer2Y, opacity: layer2Op, translateZ: layer2Z }}
                        className="absolute w-[90%] md:w-[1200px] h-auto min-h-[500px] md:h-[700px] z-30 will-change-transform"
                    >
                        <TechnicalLabel text="Layer_02: Intelligence_Node" x="90%" y="-5%" opacity={layer2Op} />

                        <div className="w-full h-full bg-indigo-950/20 backdrop-blur-3xl border border-indigo-400/40 rounded-[3rem] shadow-[0_100px_200px_rgba(0,0,0,0.6)] p-20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#6366f120_0%,transparent_60%)]" />

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-full gap-10 md:gap-20">
                                <div className="flex flex-col justify-center gap-10 md:gap-16">
                                    <div className="space-y-12">
                                        <div className="flex items-center gap-8">
                                            <div className="p-6 bg-indigo-500/20 rounded-3xl border border-indigo-500/30 scale-110">
                                                <BarChart3 className="text-indigo-400" size={64} />
                                            </div>
                                            <div className="text-4xl font-mono text-indigo-200 tracking-tight leading-none bg-indigo-500/10 px-6 py-3 rounded-xl">NEURAL_AI</div>
                                        </div>
                                        <div className="flex gap-6 h-64 items-end px-6">
                                            {[40, 70, 50, 100, 65, 85, 55, 95, 45, 75, 55, 85].map((h, i) => (
                                                <m.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ duration: 2.5, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse' }}
                                                    className="flex-1 bg-gradient-to-t from-indigo-500/40 to-indigo-400 rounded-t-xl shadow-[0_0_25px_rgba(99,102,241,0.3)]"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="relative scale-110">
                                        <m.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                            className="w-96 h-96 border-2 border-indigo-500/10 rounded-full border-dashed p-12 flex items-center justify-center"
                                        >
                                            <div className="w-full h-full border border-indigo-500/40 rounded-full flex items-center justify-center bg-indigo-500/5">
                                                <Network className="w-40 h-40 text-indigo-400/70" />
                                            </div>
                                        </m.div>
                                        <div className="absolute inset-0 bg-indigo-500/15 blur-[150px] rounded-full animate-pulse" />

                                        {[0, 120, 240].map((deg) => (
                                            <m.div
                                                key={deg}
                                                className="absolute top-1/2 left-1/2 w-6 h-6"
                                                animate={{ rotate: [deg, deg + 360] }}
                                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            >
                                                <div className="w-4 h-4 bg-indigo-400 rounded-full blur-[3px] shadow-[0_0_20px_#818cf8]" style={{ transform: 'translateX(200px)' }} />
                                            </m.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>

                    {/* LAYER 3: EXECUTION (Logic/Worker) - HEIGHT INCREASED */}
                    <m.div
                        style={{ z: layer3Z, y: layer3Y, opacity: layer3Op, translateZ: layer3Z }}
                        className="absolute w-[85%] md:w-[1100px] h-auto min-h-[500px] md:h-[650px] z-20 will-change-transform"
                    >
                        <TechnicalLabel text="Layer_03: Compute_Logic" x="0%" y="102%" opacity={layer3Op} />

                        <div className="w-full h-full bg-blue-900/10 backdrop-blur-3xl border border-blue-400/40 rounded-[2.5rem] shadow-[0_80px_160px_rgba(0,0,0,0.7)] flex flex-col p-20 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#3b82f622_4px,transparent_4px),linear-gradient(to_bottom,#3b82f622_4px,transparent_4px)] bg-[size:80px_80px]" />

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-full gap-10 md:gap-20">
                                <div className="flex flex-col justify-center gap-10 md:gap-20">
                                    <div className="flex items-center gap-10 group">
                                        <div className="p-8 bg-blue-500/20 rounded-[2rem] border border-blue-500/40 group-hover:bg-blue-500/50 transition-all duration-700">
                                            <Code2 className="text-blue-400" size={64} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-2xl font-mono text-blue-300 mb-6 tracking-widest flex justify-between">
                                                <span>RUNTIME_V2</span>
                                                <span className="text-green-400">READY</span>
                                            </div>
                                            <div className="w-full h-5 bg-blue-500/10 rounded-full overflow-hidden border border-blue-500/20">
                                                <m.div
                                                    animate={{ x: ['-100%', '100%'] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_25px_#60a5fa]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 group">
                                        <div className="p-8 bg-purple-500/20 rounded-[2rem] border border-purple-500/30">
                                            <ShieldCheck className="text-purple-400" size={64} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-2xl font-mono text-purple-200 mb-6 tracking-widest">SECURE_VAULT</div>
                                            <div className="flex gap-4">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-4 w-10 bg-purple-500/25 rounded-md border border-purple-500/20" />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="relative scale-150">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-[130px] rounded-full animate-pulse" />
                                        <Cpu className="w-72 h-72 text-blue-500/40 relative z-10" />
                                        <m.div
                                            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/25 rounded-full border border-blue-400/60 flex items-center justify-center"
                                        >
                                            <Binary className="w-16 h-16 text-blue-400" />
                                        </m.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>

                    {/* LAYER 4: PERSISTENCE (Core/Infra) - HEIGHT INCREASED */}
                    <m.div
                        style={{ opacity: layer4Op, scale: layer4Scale }}
                        className="absolute w-[80%] md:w-[1000px] h-auto min-h-[500px] md:h-[600px] z-10"
                    >
                        <TechnicalLabel text="Layer_04: Core_Persistence" x="80%" y="108%" opacity={layer4Op} />

                        <div className="w-full h-full bg-slate-950 border border-slate-800/90 rounded-[3.5rem] shadow-[inset_0_10px_100px_rgba(0,0,0,0.95)] flex flex-col p-24 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#3b82f615_0%,transparent_60%)]" />

                            <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-12 md:gap-24">
                                <div className="flex flex-col justify-center space-y-10 md:space-y-16">
                                    <div className="space-y-12">
                                        <div className="flex items-center gap-8">
                                            <div className="p-6 bg-indigo-500/15 rounded-3xl border border-indigo-500/30 scale-125">
                                                <Database className="text-indigo-400" size={56} />
                                            </div>
                                            <span className="text-2xl font-mono text-indigo-300 uppercase tracking-[0.5em] leading-none">RED_GRID.SYS</span>
                                        </div>
                                        <div className="space-y-8 pl-4">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="flex gap-6 items-center">
                                                    <div className="w-3 h-3 rounded-full bg-indigo-500/50 shadow-[0_0_15px_#6366f1]" />
                                                    <div className="h-3 flex-1 bg-slate-900 rounded-full border border-white/10" />
                                                    <div className="h-3 w-1/4 bg-blue-900/50 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-900/60 backdrop-blur-md rounded-[1.5rem] border border-white/10 flex items-center justify-between shadow-3xl">
                                        <div className="flex items-center gap-6">
                                            <div className="w-5 h-5 rounded-full bg-green-500 shadow-[0_0_30px_#22c55e] animate-pulse" />
                                            <span className="text-lg font-mono text-green-300 uppercase tracking-[0.2em]">CONSENSUS: STABLE</span>
                                        </div>
                                        <div className="text-sm font-mono text-blue-500 bg-blue-500/10 px-4 py-1 rounded-md">99.999% SLA</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center relative scale-[1.8]">
                                    <Server className="w-48 h-48 text-slate-900" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <m.div
                                            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15] }}
                                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-80 h-80 border border-indigo-500/30 rounded-[2.5rem] rotate-12"
                                        />
                                        <Box className="absolute w-24 h-24 text-indigo-500/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </m.div>

                {/* 4. PINNED NAVIGATION (Fixed Left) - HIDDEN ON MOBILE */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-20 z-50">
                    {[
                        { icon: Layout, progress: layer1Op, label: 'UI_ENGINE' },
                        { icon: BarChart3, progress: layer2Op, label: 'COGNITIVE' },
                        { icon: Cpu, progress: layer3Op, label: 'RUNTIME' },
                        { icon: Database, progress: layer4Op, label: 'DATA' }
                    ].map((item, i) => (
                        <div key={i} className="relative group">
                            <m.div
                                style={{
                                    opacity: useTransform(item.progress, [0, 1], [0.35, 1]),
                                    scale: useTransform(item.progress, [0, 1], [0.9, 1.3]),
                                    backgroundColor: useTransform(item.progress, [0, 1], ["rgba(15, 23, 42, 0.6)", "rgba(59, 130, 246, 0.2)"])
                                }}
                                className={`w-28 h-28 rounded-[2rem] backdrop-blur-3xl border ${i === 0 ? 'border-blue-500/40' : 'border-white/10'} flex flex-col items-center justify-center text-blue-400 shadow-2xl transition-all duration-500 overflow-hidden relative`}
                            >
                                <m.div
                                    style={{ opacity: item.progress }}
                                    className="absolute inset-0 bg-blue-500/10"
                                />
                                <item.icon size={44} className="relative z-10" />
                                <span className="text-[11px] font-mono mt-3 opacity-60 tracking-[0.2em] relative z-10">{item.label}</span>
                            </m.div>

                            {i < 3 && (
                                <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[1.5px] h-20 bg-gradient-to-b from-blue-500/40 via-blue-500/20 to-transparent" />
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}
