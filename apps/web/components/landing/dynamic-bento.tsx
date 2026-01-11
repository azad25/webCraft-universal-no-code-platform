'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import {
    Code2, Database, ShieldCheck, Zap,
    Layers, Cpu, Layout, Workflow,
    ChevronRight, Sparkles
} from 'lucide-react'

function BentoCard({
    title,
    description,
    icon: Icon,
    index,
    scrollYProgress,
    className = ""
}: {
    title: string,
    description: string,
    icon: any,
    index: number,
    scrollYProgress: MotionValue<number>,
    className?: string
}) {
    // Staggered parallax based on index
    const y = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [100 * (index + 1), 0, 0, -50 * (index + 1)])
    const z = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [-200, 0, 0, -100])
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 1, 1, 0.9])

    return (
        <m.div
            style={{ y, z, opacity, scale }}
            className={`relative group bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 overflow-hidden hover:border-blue-500/40 transition-colors duration-500 ${className}`}
        >
            {/* Blueprint Glow Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute -inset-24 bg-blue-500/5 blur-[100px] rounded-full group-hover:bg-blue-500/10 transition-all pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-400/20 mb-6 group-hover:bg-blue-500/30 group-hover:border-blue-400/40 transition-all duration-500">
                    <Icon className="text-blue-400" size={28} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">{description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest leading-none">Module_ID: PB-00{index + 1}</span>
                    <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Hidden Technical Schematic (reveal on hover) */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                <Workflow size={120} className="text-blue-400 -rotate-12" />
            </div>
        </m.div>
    )
}

export function DynamicBento() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 60 })

    const features = [
        {
            title: "Logic Fabric",
            description: "Visual logic engine designed for high-availability systems. Blueprint-first orchestration.",
            icon: Cpu,
            className: "md:col-span-2 md:row-span-1"
        },
        {
            title: "Data Substrate",
            description: "Distributed persistence layer with multi-region replication locked in.",
            icon: Database,
            className: "md:col-span-1 md:row-span-2"
        },
        {
            title: "Vision Shell",
            description: "Pixel-perfect UI generation with deep dark mode aesthetics.",
            icon: Layout,
            className: "md:col-span-1 md:row-span-1"
        },
        {
            title: "Atomic Security",
            description: "Zero-trust architecture built into the core blueprint of every application.",
            icon: ShieldCheck,
            className: "md:col-span-1 md:row-span-1"
        },
        {
            title: "Neural Engine",
            description: "AI-assisted building that understands your architectural intent.",
            icon: Sparkles,
            className: "md:col-span-2 md:row-span-1"
        }
    ]

    return (
        <section ref={containerRef} className="relative h-[250vh] bg-[#02040a] flex items-center justify-center overflow-hidden">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center perspective-[2000px] px-6">

                <m.div
                    style={{ opacity: useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]) }}
                    className="text-center mb-20 max-w-4xl"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 backdrop-blur-md">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.3em]">Architectural_Modules_v1.2</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
                        Assembling <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Power</span>
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed">
                        Every module in Webcraft is a deconstructed piece of engineering,
                        designed to snap together with absolute precision.
                    </p>
                </m.div>

                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 w-full max-w-7xl h-auto md:h-[600px] transform-style-3d">
                    {features.map((feature, i) => (
                        <BentoCard
                            key={i}
                            {...feature}
                            index={i}
                            scrollYProgress={smoothProgress}
                        />
                    ))}
                </div>

            </div>
        </section>
    )
}
