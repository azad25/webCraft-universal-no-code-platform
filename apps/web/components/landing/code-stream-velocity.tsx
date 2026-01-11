'use client'

import { useRef, useMemo } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { Terminal, Binary, Code2, Hash, Braces } from 'lucide-react'

const CODE_SNIPPETS = [
    "function deploy() { status: 'stable' }",
    "export const builder = new WebCraft()",
    "01011010 01100001 01110011",
    "useEffect(() => { stream.pulse() })",
    "grid.layout.assemble({ depth: 4 })",
    "SELECT * FROM brain WHERE state = 'ideal'",
    "const architecture = Blueprint.v3",
    "01110011 01110101 01100011 01100011 01100101 01110011 01110011",
    "auth.verify(handshake.secure)",
    "node.broadcast({ global: true })"
]

function CodeStreamColumn({ speed, delay, direction = "down", x, opacity }: { speed: number, delay: number, direction?: "up" | "down", x: string, opacity: number }) {
    return (
        <m.div
            initial={{ y: direction === "down" ? "-100%" : "100%" }}
            animate={{ y: direction === "down" ? "100%" : "-100%" }}
            transition={{ duration: speed, delay, repeat: Infinity, ease: "linear" }}
            className="absolute flex flex-col gap-8 whitespace-nowrap pointer-events-none will-change-transform"
            style={{ left: x, opacity: opacity * 0.3, translateZ: 0 }}
        >
            {[...Array(10)].map((_, i) => (
                <div key={i} className="text-blue-500/80 font-mono text-xs tracking-widest vertical-text select-none">
                    {CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]}
                </div>
            ))}
        </m.div>
    )
}

export function CodeStreamVelocity() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 40, stiffness: 50 })

    // Central Parallax
    const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1.2, 1.1])
    const titleOpacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    const titleBlur = useTransform(smoothProgress, [0.8, 1], ["0px", "10px"])

    // Background speed modulation based on scroll
    const streamSpeedMult = useTransform(smoothProgress, [0, 1], [1, 2.5])

    return (
        <section ref={containerRef} className="relative h-[200vh] bg-[#010206] overflow-hidden flex items-center justify-center">
            {/* 1. CODE STREAMS (PARALLAX LAYERS) */}
            <div className="absolute inset-0 z-0">
                {/* Background Layer (Slow, Small, Blur) */}
                <div className="absolute inset-0 blur-[1px] scale-110">
                    <CodeStreamColumn speed={30} delay={0} x="5%" opacity={0.2} />
                    <CodeStreamColumn speed={25} delay={1} x="85%" opacity={0.2} direction="up" />
                </div>

                {/* Mid Layer */}
                <div className="absolute inset-0">
                    <CodeStreamColumn speed={15} delay={1} x="25%" opacity={0.4} />
                    <CodeStreamColumn speed={18} delay={4} x="60%" opacity={0.4} />
                    <CodeStreamColumn speed={14} delay={2} x="75%" opacity={0.3} direction="up" />
                </div>

                {/* Foreground Layer (Fast, Large, Bright) */}
                <div className="absolute inset-0 scale-125 z-10 pointer-events-none">
                    <CodeStreamColumn speed={8} delay={0} x="10%" opacity={0.6} />
                </div>
            </div>

            {/* 2. ATMOSPHERIC GLOWS */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#010206] via-transparent to-[#010206]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />

            {/* 3. CENTRAL FOCUS TYPOGRAPHY */}
            <m.div
                style={{ scale: titleScale, opacity: titleOpacity, filter: titleBlur }}
                className="relative z-20 text-center px-6 max-w-5xl"
            >
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-8 backdrop-blur-xl">
                    <Braces size={18} className="text-blue-400" />
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-[0.5em]">Logic_Flow_Active</span>
                </div>

                <h2 className="text-5xl md:text-[10rem] font-bold text-white mb-8 tracking-tighter leading-[0.9] md:leading-[0.8] drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    Pure <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-600">Performance</span>
                </h2>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mt-12 md:mt-16">
                    <div className="flex flex-col items-center">
                        <Terminal size={28} className="text-blue-500 mb-3 opacity-70" />
                        <div className="text-xl md:text-2xl font-mono text-white">Full-Stack</div>
                        <div className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">Blueprint control</div>
                    </div>
                    <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
                    <div className="flex flex-col items-center">
                        <Binary size={28} className="text-indigo-500 mb-3 opacity-70" />
                        <div className="text-xl md:text-2xl font-mono text-white">Edge-First</div>
                        <div className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">Ultra-low latency</div>
                    </div>
                    <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
                    <div className="flex flex-col items-center">
                        <Code2 size={28} className="text-blue-400 mb-3 opacity-70" />
                        <div className="text-xl md:text-2xl font-mono text-white">Type-Safe</div>
                        <div className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">Enterprise ready</div>
                    </div>
                </div>
            </m.div>

            {/* Floating Schematic Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="w-full h-full">
                    <pattern id="velocityGrid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.5" fill="#3b82f6" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#velocityGrid)" />
                </svg>
            </div>
        </section>
    )
}
