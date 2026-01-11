'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import {
    Layout, Database, Lock, BarChart,
    Smartphone, Box, Workflow, Zap, Ship
} from 'lucide-react'

function FlyInComponent({
    icon: Icon,
    label,
    targetPos, // { x, y } in percentage of the wireframe
    scrollRange, // [start, end]
    smoothProgress,
    index
}: {
    icon: any,
    label: string,
    targetPos: { x: string, y: string },
    scrollRange: [number, number],
    smoothProgress: MotionValue<number>,
    index: number
}) {
    // Fly in from outside
    const startX = index % 2 === 0 ? "-150%" : "150%"
    const startY = index < 2 ? "-150%" : "150%"

    const x = useTransform(smoothProgress, scrollRange, [startX, targetPos.x])
    const y = useTransform(smoothProgress, scrollRange, [startY, targetPos.y])
    const scale = useTransform(smoothProgress, scrollRange, [0.5, 1])
    const opacity = useTransform(smoothProgress, [scrollRange[0], scrollRange[0] + 0.1, scrollRange[1]], [0, 1, 1])
    const rotate = useTransform(smoothProgress, scrollRange, [45, 0])

    // Success Pulse when locked in
    const pulseScale = useTransform(smoothProgress, [scrollRange[1], scrollRange[1] + 0.05], [1, 1.2])
    const pulseOp = useTransform(smoothProgress, [scrollRange[1], scrollRange[1] + 0.05], [0, 1])

    return (
        <m.div
            style={{ left: x, top: y, scale, opacity, rotate }}
            className="absolute z-20 group"
        >
            <div className="relative p-4 md:p-6 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-3 backdrop-blur-xl group-hover:border-blue-500/50 transition-colors">
                <Icon className="text-blue-400" size={24} />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{label}</span>

                {/* Status Indicator */}
                <m.div
                    style={{ scale: pulseScale, opacity: pulseOp }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 flex items-center justify-center"
                >
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </m.div>
            </div>

            {/* Connector Line to target point (if we had one) */}
        </m.div>
    )
}

export function ModularAssembly() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 40, stiffness: 50 })

    const rotateX = useTransform(smoothProgress, [0, 1], [25, 10])
    const rotateZ = useTransform(smoothProgress, [0, 1], [-10, 5])
    const overallScale = useTransform(smoothProgress, [0, 0.5, 1], [0.9, 1.1, 1])
    const opacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])

    const components = [
        { icon: Layout, label: "UI_SHELL", targetPos: { x: "10%", y: "15%" }, range: [0.1, 0.3] as [number, number] },
        { icon: Database, label: "DATA_NODE", targetPos: { x: "70%", y: "20%" }, range: [0.2, 0.4] as [number, number] },
        { icon: Lock, label: "AUTH_GATE", targetPos: { x: "15%", y: "65%" }, range: [0.3, 0.5] as [number, number] },
        { icon: BarChart, label: "ANALYTICS", targetPos: { x: "65%", y: "70%" }, range: [0.4, 0.6] as [number, number] }
    ]

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-[#02040a] overflow-hidden flex flex-col items-center justify-center">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center perspective-[2000px]">

                {/* 1. BACKGROUND ATMOSPHERE */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/5 rounded-full blur-[180px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f604_0%,transparent_75%)]" />
                </div>

                {/* 2. SECTION HEADER */}
                <m.div
                    style={{ opacity }}
                    className="absolute top-24 text-center z-50 px-6 max-w-4xl"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 backdrop-blur-md">
                        <Zap size={14} className="text-blue-400" />
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em]">System_Build_Sequence.vortex</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tighter">
                        Modular <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Assembly</span>
                    </h2>
                    <p className="text-base md:text-xl text-slate-400 font-light leading-relaxed">
                        Watch your vision materialize. Our engine assembles production-ready
                        infrastructure from your deconstructed blueprints in milliseconds.
                    </p>
                </m.div>

                {/* 3. THE 3D WIREFRAME CANVAS */}
                <m.div
                    style={{ rotateX, rotateZ, scale: overallScale, opacity }}
                    className="relative w-[95%] md:w-[900px] h-[500px] md:h-[600px] mt-24 md:mt-32 transform-style-3d"
                >
                    {/* The Ghost Mobile Frame */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[260px] h-[520px] md:w-[320px] md:h-[640px] border-2 border-white/10 rounded-[3rem] md:rounded-[4rem] bg-slate-900/10 backdrop-blur-sm z-0">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-4 md:h-6 bg-slate-900 border-b border-white/10 rounded-b-xl md:rounded-b-2xl" />
                    </div>

                    {/* The Desktop Wireframe Behind */}
                    <div className="absolute inset-0 border border-blue-500/10 rounded-[3rem] bg-blue-500/5 -z-10 translate-z-[-200px]" />

                    {/* Flying Components */}
                    {components.map((comp, i) => (
                        <FlyInComponent
                            key={i}
                            index={i}
                            icon={comp.icon}
                            label={comp.label}
                            targetPos={comp.targetPos}
                            scrollRange={comp.range}
                            smoothProgress={smoothProgress}
                        />
                    ))}

                    {/* Infrastructure Base */}
                    <m.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        style={{ opacity: useTransform(smoothProgress, [0.6, 0.8], [0, 1]) }}
                        className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-blue-600/20 to-transparent blur-3xl -z-20"
                    />

                    <m.div
                        style={{ opacity: useTransform(smoothProgress, [0.7, 0.9], [0, 1]) }}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center"
                    >
                        <div className="flex items-center gap-3 px-6 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <Ship size={16} className="text-green-400 animate-bounce" />
                            <span className="text-xs font-mono text-green-400 uppercase tracking-widest">Deployment_Ready_v4.0.1</span>
                        </div>
                    </m.div>
                </m.div>

            </div>
        </section>
    )
}
