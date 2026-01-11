'use client'

import { useRef, useMemo } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { Globe, MapPin, Zap, Shield, Satellite, Activity, Wifi, Radar } from 'lucide-react'

// --- HELPER COMPONENTS ---

function HUDLabel({ text, x, y, opacity }: { text: string, x: string, y: string, opacity: MotionValue<number> }) {
    return (
        <m.div
            style={{ opacity, left: x, top: y }}
            className="absolute z-30 pointer-events-none flex items-center gap-3"
        >
            <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
                <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-400/50 to-transparent" />
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 p-2 rounded-lg flex flex-col gap-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{text}</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-3 h-1 bg-cyan-500/20 rounded-full overflow-hidden">
                            <m.div
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                                className="w-full h-full bg-cyan-400"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </m.div>
    )
}

function GridPoint({ delay = 0 }: { delay?: number }) {
    return (
        <div
            style={{ animationDelay: `${delay}s` }}
            className="w-1 h-1 bg-blue-400/30 rounded-full animate-pulse-slow"
        />
    )
}

// --- MAIN COMPONENT ---

export function GlobalConnectivity() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 40, stiffness: 40 })

    // Scene & Globe Transforms
    const rotateY = useTransform(smoothProgress, [0, 1], [0, 315])
    const rotateX = useTransform(smoothProgress, [0, 1], [20, -10])
    const sceneScale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1.3, 0.9])
    const sceneOpacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])

    // HUD & Trace Progressions
    const hudOp = useTransform(smoothProgress, [0.3, 0.5, 0.8], [0, 1, 1])
    const scanLines = useTransform(smoothProgress, [0.2, 0.8], ["0%", "100%"])

    // Generate Dot Matrix for Globe - OPTIMIZED DENSITY
    const globePoints = useMemo(() => {
        const points = []
        for (let i = 0; i < 8; i++) { // Reduced from 12
            for (let j = 0; j < 16; j++) { // Reduced from 24
                points.push({ id: `${i}-${j}`, delay: Math.random() * 5 })
            }
        }
        return points
    }, [])

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-[#010208] overflow-hidden flex flex-col items-center justify-center">

            {/* 1. ATMOSPHERIC SCANNING RADIUS */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-blue-500/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] border border-blue-500/[0.02] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] border border-blue-500/[0.01] rounded-full" />
            </div>

            {/* 2. STICKY VIEWPORT CONTAINER */}
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center pointer-events-none perspective-[3000px]">

                {/* 3. SECTION HEADER - MORE TECHNICAL */}
                <m.div
                    style={{ opacity: sceneOpacity }}
                    className="absolute top-24 text-center z-50 px-6 max-w-5xl"
                >
                    <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 backdrop-blur-xl">
                        <Radar size={16} className="text-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-[0.4em]">Global_Matrix_Sync_Active</span>
                    </div>
                    <h2 className="text-4xl md:text-[8rem] font-bold text-white mb-6 md:mb-8 tracking-tighter leading-none">
                        Universal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">Fabric</span>
                    </h2>
                    <p className="text-lg md:text-3xl max-w-4xl mx-auto font-light leading-relaxed">
                        Scale without borders. A high-fidelity infrastructure layer
                        orchestrated by the Webcraft blueprint engine.
                    </p>
                </m.div>

                {/* 4. THE HOLOGRAPHIC GLOBE */}
                <m.div
                    style={{
                        scale: sceneScale,
                        opacity: sceneOpacity,
                        rotateY,
                        rotateX,
                        transformStyle: 'preserve-3d'
                    }}
                    className="relative w-[320px] h-[320px] md:w-[800px] md:h-[800px] flex items-center justify-center mt-20 md:mt-40"
                >
                    {/* Glowing Core Sphere */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/[0.03] shadow-[inset_0_0_150px_rgba(59,130,246,0.15)] border border-blue-400/10 group overflow-hidden">
                        {/* Scanning Light Strip */}
                        <m.div
                            style={{ top: scanLines }}
                            className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_20px_#22d3ee] z-10"
                        />
                    </div>

                    {/* Dot Matrix Surface - OPTIMIZED GRID */}
                    <div className="absolute inset-10 md:inset-20 grid grid-cols-16 grid-rows-8 gap-1 md:gap-2 items-center justify-center opacity-30">
                        {globePoints.map(p => <GridPoint key={p.id} delay={p.delay} />)}
                    </div>

                    {/* Orbital Rings - Rotating differently */}
                    {[1, 1.15, 1.3].map((s, i) => (
                        <m.div
                            key={i}
                            animate={{ rotateY: i % 2 === 0 ? 360 : -360 }}
                            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
                            style={{ scale: s }}
                            className="absolute inset-0 rounded-full border border-cyan-400/[0.05] pointer-events-none"
                        />
                    ))}

                    {/* Data HUD Labels */}
                    <HUDLabel text="SYNC_HUB_AMERICAS" x="15%" y="25%" opacity={hudOp} />
                    <HUDLabel text="EDGE_CLUSTER_EU" x="75%" y="15%" opacity={hudOp} />
                    <HUDLabel text="QUANTUM_NODE_APAC" x="45%" y="80%" opacity={hudOp} />

                    {/* Central Holographic Core */}
                    <div className="relative z-10">
                        <m.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl"
                        />
                        <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-cyan-400/40" />
                    </div>

                    {/* SVG Data Traces - ENHANCED GLOW */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Trace Paths with Staggered PathLength Reveal */}
                        {[
                            { d: "M 200 250 Q 300 150 600 120", delay: 0 },
                            { d: "M 600 120 Q 550 450 350 650", delay: 1 },
                            { d: "M 350 650 Q 250 500 200 250", delay: 2 }
                        ].map((p, i) => (
                            <m.path
                                key={i}
                                d={p.d}
                                stroke="#22d3ee"
                                strokeWidth="1.5"
                                fill="none"
                                filter="url(#glow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                style={{
                                    pathLength: useTransform(smoothProgress, [0.3 + i * 0.1, 0.5 + i * 0.1], [0, 1]),
                                    opacity: useTransform(smoothProgress, [0.2 + i * 0.1, 0.3 + i * 0.1], [0, 0.6])
                                }}
                                strokeDasharray="5, 15"
                                animate={{ strokeDashoffset: [100, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />
                        ))}
                    </svg>
                </m.div>

                {/* 5. GLOBAL METRICS HUD (Floating Corners) - REPOSITIONED ON MOBILE */}
                <div className="absolute left-6 md:left-12 bottom-6 md:bottom-12 right-6 md:right-auto flex flex-row md:flex-col gap-4 md:gap-8 z-50 overflow-x-auto md:overflow-visible no-scrollbar">
                    {[
                        { label: "Active Nodes", value: "3,482", icon: Wifi, color: "text-green-400" },
                        { label: "Throughput", value: "1.2 TB/s", icon: Activity, color: "text-cyan-400" }
                    ].map((m_item, i) => (
                        <m.div
                            key={i}
                            style={{ opacity: sceneOpacity }}
                            className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 m-item-4 md:m-item-6 p-4 md:p-6 rounded-2xl md:rounded-3xl min-w-[180px] md:min-w-[240px] shadow-2xl flex items-center gap-4 md:gap-6"
                        >
                            <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                <m_item.icon size={20} className={m_item.color} />
                            </div>
                            <div>
                                <div className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{m_item.label}</div>
                                <div className="text-xl md:text-2xl font-bold text-white tracking-tight">{m_item.value}</div>
                            </div>
                        </m.div>
                    ))}
                </div>

                <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-10">
                    {[0, 1, 2].map(i => (
                        <m.div
                            key={i}
                            style={{ opacity: useTransform(smoothProgress, [0.2 + i * 0.2, 0.4 + i * 0.2], [0, 1]) }}
                            className="w-1.5 h-16 bg-white/10 rounded-full relative overflow-hidden"
                        >
                            <m.div
                                style={{
                                    top: useTransform(smoothProgress, [0.2 + i * 0.2, 0.4 + i * 0.2], ["100%", "0%"])
                                }}
                                className="absolute inset-0 bg-cyan-400"
                            />
                        </m.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
