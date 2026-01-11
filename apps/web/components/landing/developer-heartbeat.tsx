'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { Terminal, Code2, Cpu, GitBranch, GitPullRequest, Activity, MousePointer2, Sparkles } from 'lucide-react'

const LOG_ENTRIES = [
    "Compiling blueprint 'RealEstate_v3'...",
    "Injecting AI middleware signatures...",
    "Deploying edge-node: us-east-1 (ACTIVE)",
    "Syncing persistence layer (CONSISTENT)",
    "Optimizing asset delivery protocol...",
    "Handshake secure: AES-256-GCM",
    "Allocating compute cycles: 4GHz",
    "Schema migration successful (t=42ms)",
    "Broadcasting cluster state: STABLE",
    "Awaiting developer interaction..."
]

const CODE_DIFFS = [
    { type: 'add', content: '+  export const app = createBlueprint({' },
    { type: 'add', content: '+    theme: \'blueprint-dark\',' },
    { type: 'add', content: '+    security: \'zero-trust\',' },
    { type: 'dim', content: '     scaling: { mode: "automatic" }' },
    { type: 'rem', content: '-    legacy: { mode: "manual" }' },
    { type: 'add', content: '+    orchestration: \'distributed\'' },
    { type: 'add', content: '+  })' }
]

function ScrollingLogStream({ speed = 20, reverse = false }) {
    return (
        <m.div
            animate={{ y: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
            transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
            className="flex flex-col gap-6 will-change-transform"
            style={{ translateZ: 0 }}
        >
            {[...Array(12)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl min-w-[300px]">
                    <Activity size={12} className="text-blue-400" />
                    <span className="text-[10px] font-mono text-slate-400 tracking-tight">
                        {LOG_ENTRIES[i % LOG_ENTRIES.length]}
                    </span>
                    <span className="ml-auto text-[8px] font-mono text-blue-500/50 uppercase">T+{100 * i}ms</span>
                </div>
            ))}
        </m.div>
    )
}

export function DeveloperHeartbeat() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 40, stiffness: 40 })

    const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 0.9])
    const opacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
    const rotateX = useTransform(smoothProgress, [0, 1], [15, -5])

    // Split View Drift
    const logDrift = useTransform(smoothProgress, [0, 1], [50, -100])
    const codeDrift = useTransform(smoothProgress, [0, 1], [-50, 80])

    return (
        <section ref={containerRef} className="relative h-[250vh] bg-[#010204] overflow-hidden flex flex-col items-center justify-center">

            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center perspective-[2500px] px-6">

                {/* 1. SECTION HEADER */}
                <m.div
                    style={{ opacity }}
                    className="absolute top-24 text-center z-50 px-6 max-w-4xl"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 backdrop-blur-md">
                        <Terminal size={14} className="text-blue-400" />
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em]">Developer_Experience_Pulse</span>
                    </div>
                    <h2 className="text-5xl md:text-[7rem] font-bold text-white mb-6 tracking-tighter">
                        Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-500">Velocity</span>
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed">
                        Build as fast as you think. Real-time feedback, instant migrations,
                        and high-fidelity orchestration at your fingertips.
                    </p>
                </m.div>

                {/* 2. THE DUAL HEARTBEAT VIEW */}
                <m.div
                    style={{ scale, opacity, rotateX, transformStyle: 'preserve-3d' }}
                    className="relative w-full max-w-7xl h-[600px] grid grid-cols-1 md:grid-cols-2 gap-12 mt-40"
                >
                    {/* Left side: Log Feed (Lower Z-Depth) */}
                    <m.div
                        style={{ y: logDrift, z: -100, translateZ: -100 }}
                        className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 overflow-hidden will-change-transform"
                    >
                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                <Activity size={20} className="text-blue-400" />
                            </div>
                            <span className="text-sm font-mono text-blue-200 tracking-widest">BLUEPRINT_DEPLOY_FEED</span>
                        </div>

                        <div className="flex flex-col gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                            <ScrollingLogStream speed={30} />
                            <ScrollingLogStream speed={25} reverse />
                        </div>
                    </m.div>

                    {/* Right side: Code Canvas (Higher Z-Depth) */}
                    <m.div
                        style={{ y: codeDrift, z: 200, translateZ: 200 }}
                        className="relative bg-[#0d1117]/80 backdrop-blur-3xl border border-blue-500/30 rounded-[2.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col will-change-transform"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30">
                                    <Code2 size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Editing</div>
                                    <div className="text-base font-bold text-white tracking-tight">MainStack.blueprint.ts</div>
                                </div>
                            </div>
                            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">AI_Refined</span>
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-sm md:text-lg flex flex-col gap-6 pt-6">
                            {CODE_DIFFS.map((line, i) => (
                                <m.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`pl-6 border-l-2 ${line.type === 'add' ? 'border-green-500/40 text-green-300' :
                                        line.type === 'rem' ? 'border-red-500/40 text-red-300' :
                                            'border-white/10 text-slate-500'
                                        }`}
                                >
                                    {line.content}
                                </m.div>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-6 pt-10 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                <GitBranch size={14} className="text-indigo-400" />
                                <span>main</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                <GitPullRequest size={14} className="text-indigo-400" />
                                <span>3 commits ahead</span>
                            </div>
                        </div>
                    </m.div>
                </m.div>

                {/* 3. MOUSE POINTERS (AI Shadows) */}
                <div className="absolute inset-x-0 bottom-40 h-20 overflow-hidden pointer-events-none opacity-20 hidden md:block">
                    <m.div
                        animate={{ x: ["10%", "90%", "10%"] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center gap-3"
                    >
                        <MousePointer2 className="text-blue-400 rotate-[-15deg]" size={24} />
                        <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[10px] font-mono text-blue-300 uppercase tracking-widest">AI_Copilot_vortex</div>
                    </m.div>
                </div>

            </div>
        </section>
    )
}
