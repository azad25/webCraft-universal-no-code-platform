'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { BuilderMockup, AnalyticsMockup, MobileMockup } from './landing-illustrations'
import { Code2, Zap, Smartphone, Layers, Command, Cpu, Globe, Braces, Terminal, Database } from 'lucide-react'

// --- PARALLAX UTILS ---
function useParallax(value: MotionValue<number>, distance: number) {
    return useTransform(value, [0, 1], [-distance, distance]);
}

// Floating background element
function FloatingElement({ children, depth = 1, x, y, rotate = 0 }: { children: React.ReactNode, depth?: number, x: string, y: string, rotate?: number }) {
    return (
        <m.div
            className="absolute z-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 0.15 * depth, scale: 1 }}
            viewport={{ once: true }}
            style={{
                left: x,
                top: y,
                rotate: rotate
            }}
        >
            <m.div
                animate={{
                    y: [0, -20 * depth, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{
                    duration: 5 + depth * 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {children}
            </m.div>
        </m.div>
    )
}

function FloatingCodeSnippet({ code, x, y, delay = 0 }: { code: string, x: string, y: string, delay?: number }) {
    return (
        <m.div
            className="absolute z-0 pointer-events-none font-mono text-[10px] text-blue-500/20 whitespace-pre"
            style={{ left: x, top: y }}
            animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                delay: delay
            }}
        >
            {code}
        </m.div>
    )
}

export function ProductShowcase() {
    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 25, mass: 0.5, stiffness: 120 })

    // --- 3D TRANSFORMS ---

    // Overall Scene Rotation
    const sceneRotateX = useTransform(smoothProgress, [0, 0.2, 1], [10, 25, 40])
    const sceneScale = useTransform(smoothProgress, [0, 0.2], [0.85, 1])

    // Phase 1: Builder
    const builderY = useTransform(smoothProgress, [0.1, 0.4], ["0%", "20%"])
    const builderRotateX = useTransform(smoothProgress, [0.1, 0.4], [0, 20])
    const builderOp = useTransform(smoothProgress, [0.3, 0.5], [1, 0.3])
    const builderBlur = useTransform(smoothProgress, [0.3, 0.5], ["0px", "8px"])

    // Phase 2: Analytics
    const analyticsY = useTransform(smoothProgress, [0.35, 0.65], ["100%", "0%"])
    const analyticsRotateX = useTransform(smoothProgress, [0.4, 0.7], [45, 0])
    const analyticsScale = useTransform(smoothProgress, [0.4, 0.6], [0.7, 1])
    const analyticsOp = useTransform(smoothProgress, [0.35, 0.45, 0.6, 0.75], [0, 1, 1, 0.5])
    const analyticsBlur = useTransform(smoothProgress, [0.65, 0.8], ["0px", "4px"])

    // Phase 3: Mobile
    const mobileX = useTransform(smoothProgress, [0.65, 0.9], ["100%", "20%"])
    const mobileY = useTransform(smoothProgress, [0.65, 0.9], ["20%", "-5%"])
    const mobileRotateY = useTransform(smoothProgress, [0.65, 0.9], [40, -10])
    const mobileScale = useTransform(smoothProgress, [0.65, 0.9], [0.6, 1])

    // Headers Parallax & Fading
    const h1Op = useTransform(smoothProgress, [0.05, 0.25], [1, 0])
    const h1Y = useTransform(smoothProgress, [0, 0.25], [0, -50])

    const h2Op = useTransform(smoothProgress, [0.35, 0.45, 0.55], [0, 1, 0])
    const h2Y = useTransform(smoothProgress, [0.3, 0.55], [50, -50])

    const h3Op = useTransform(smoothProgress, [0.7, 0.85], [0, 1])
    const h3Y = useTransform(smoothProgress, [0.65, 0.9], [50, 0])

    const bgY = useParallax(smoothProgress, 250)

    return (
        <section ref={containerRef} className="relative h-[600vh] bg-[#0a0f1e]">

            {/* Sticky Viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center perspective-[2500px]">

                {/* Background Textures */}
                <m.div style={{ y: bgY }} className="absolute inset-0 w-full h-[140%] -top-[20%] pointer-events-none">
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000,transparent)]" />

                    {/* Floating Code Snippets */}
                    <FloatingCodeSnippet x="5%" y="20%" code={`const app = createWebcraft({\n  logic: 'AI_OPTIMIZED',\n  scale: Infinity\n})`} delay={1} />
                    <FloatingCodeSnippet x="80%" y="40%" code={`<Section>\n  <Hero />\n  <BentoGrid />\n</Section>`} delay={3} />
                    <FloatingCodeSnippet x="15%" y="60%" code={`query UserStats {\n  totalUsers\n  growthRate\n}`} delay={5} />
                    <FloatingCodeSnippet x="70%" y="15%" code={`deploy.to('edge')\n.on('scroll')\n.animate()`} delay={0} />
                </m.div>

                {/* Floating Icons with increased depth */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <FloatingElement x="12%" y="18%" depth={1.5} rotate={-15}><Cpu className="text-blue-500 w-16 h-16" /></FloatingElement>
                    <FloatingElement x="82%" y="22%" depth={2} rotate={12}><Globe className="text-purple-500 w-24 h-24" /></FloatingElement>
                    <FloatingElement x="8%" y="75%" depth={1} rotate={-25}><Braces className="text-cyan-400 w-14 h-14" /></FloatingElement>
                    <FloatingElement x="78%" y="85%" depth={1.8} rotate={20}><Database className="text-emerald-500 w-16 h-16" /></FloatingElement>
                    <FloatingElement x="45%" y="5%" depth={2.5} rotate={0}><Command className="text-pink-500 w-10 h-10" /></FloatingElement>
                    <FloatingElement x="90%" y="60%" depth={1.2} rotate={45}><Terminal className="text-amber-500 w-12 h-12" /></FloatingElement>
                </div>

                {/* Text Layer (Parallax Headers) */}
                <div className="absolute top-1/4 left-0 right-0 z-30 pointer-events-none">
                    <div className="container mx-auto px-4 text-center relative h-32">
                        <m.div style={{ opacity: h1Op, y: h1Y }} className="absolute inset-x-0 top-0">
                            <h2 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tight">
                                Visual <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Builder</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">High-fidelity design meets instant deployment. No handoffs, no friction.</p>
                        </m.div>

                        <m.div style={{ opacity: h2Op, y: h2Y }} className="absolute inset-x-0 top-0">
                            <h2 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tight">
                                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Insights</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">Understand your users with integrated, real-time analytics dashboards.</p>
                        </m.div>

                        <m.div style={{ opacity: h3Op, y: h3Y }} className="absolute inset-x-0 top-0">
                            <h2 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tight">
                                True <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Mobility</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">Native feel on every screen. Desktop power, mobile elegance.</p>
                        </m.div>
                    </div>
                </div>

                {/* 3D Scene Container */}
                <m.div
                    style={{ rotateX: sceneRotateX, scale: sceneScale, translateZ: 0 }}
                    className="relative w-full max-w-6xl h-[650px] perspective-[3000px] transform-style-3d flex items-center justify-center mt-32 will-change-transform"
                >

                    {/* LAYER 1: Builder (Base) */}
                    <m.div
                        style={{
                            y: builderY,
                            rotateX: builderRotateX,
                            opacity: builderOp,
                            filter: builderBlur,
                            z: -100
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-[95%] md:w-[1000px] h-[600px] bg-slate-900 border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
                            {/* Window Controls */}
                            <div className="absolute top-0 w-full h-12 bg-slate-800/90 backdrop-blur-md border-b border-white/5 flex items-center px-6 gap-2.5 z-20">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                                <div className="ml-4 px-3 py-1 bg-black/20 rounded-md text-[10px] text-slate-500 font-mono">webcraft.studio/editor</div>
                            </div>
                            <BuilderMockup />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                        </div>
                    </m.div>

                    {/* LAYER 2: Analytics (Mid) */}
                    <m.div
                        style={{
                            y: analyticsY,
                            rotateX: analyticsRotateX,
                            scale: analyticsScale,
                            opacity: analyticsOp,
                            filter: analyticsBlur,
                            z: 200
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-[85%] md:w-[800px] h-[500px] bg-[#0f172a] border border-blue-500/30 rounded-2xl shadow-[0_80px_150px_rgba(0,0,0,1)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-blue-500/5 pulse-slow" />
                            <div className="h-full relative z-10">
                                <AnalyticsMockup />
                            </div>
                        </div>
                    </m.div>

                    {/* LAYER 3: Mobile (Front) */}
                    <m.div
                        style={{
                            left: mobileX,
                            top: mobileY,
                            rotateY: mobileRotateY,
                            scale: mobileScale,
                            z: 600,
                            translateZ: 600
                        }}
                        className="absolute right-0 bottom-0 pointer-events-none will-change-transform"
                    >
                        <div className="w-[280px] md:w-[320px] h-[550px] md:h-[650px] bg-black rounded-[44px] md:rounded-[54px] border-[8px] md:border-[10px] border-[#1e293b] shadow-[0_100px_200px_rgba(0,0,0,1)] overflow-hidden relative">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-black rounded-b-3xl z-20 flex items-center justify-center p-1">
                                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                            </div>
                            <div className="w-full h-full bg-slate-900 pt-12">
                                <MobileMockup />
                            </div>
                            {/* Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-[44px]" />
                        </div>
                    </m.div>

                </m.div>

            </div>
        </section>
    )
}
