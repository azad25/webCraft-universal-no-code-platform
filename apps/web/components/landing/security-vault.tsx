'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { Shield, Lock, Fingerprint, Eye, Key, ShieldCheck, Zap } from 'lucide-react'

function SecurityLayer({
    icon: Icon,
    label,
    z,
    rotate,
    opacity,
    color,
    scale
}: {
    icon: any,
    label: string,
    z: MotionValue<number>,
    rotate: MotionValue<number>,
    opacity: MotionValue<number>,
    color: string,
    scale: MotionValue<number>
}) {
    return (
        <m.div
            style={{ z, rotate, opacity, scale, translateZ: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
        >
            <div className={`w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full border-4 ${color} flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
                <Icon size={120} className={color.replace('border-', 'text-').split(' ')[0]} />
                <div className="mt-8 px-6 py-2 bg-slate-950 border border-white/10 rounded-full">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{label}</span>
                </div>

                {/* Technical Decals */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[2px] h-10 bg-gradient-to-t from-white/20 to-transparent" />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[2px] h-10 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
        </m.div>
    )
}

export function SecurityVault() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const smoothProgress = useSpring(scrollYProgress, { damping: 40, stiffness: 40 })

    // Scene Meta
    const sceneScale = useTransform(smoothProgress, [0, 0.4, 0.6, 1], [0.8, 1.2, 1.2, 0.8])
    const sceneOpacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])

    // Layer 1: HARDWARE_SHIELD (Outer)
    const layer1Z = useTransform(smoothProgress, [0, 0.3, 0.5], [0, 600, 1500])
    const layer1Rotate = useTransform(smoothProgress, [0, 0.5], [0, 90])
    const layer1Op = useTransform(smoothProgress, [0, 0.1, 0.4, 0.5], [0, 1, 1, 0])
    const layer1Scale = useTransform(smoothProgress, [0, 0.5], [1, 1.5])

    // Layer 2: ENCRYPTION_GATE (Middle)
    const layer2Z = useTransform(smoothProgress, [0.1, 0.4, 0.7], [-400, 0, 1000])
    const layer2Rotate = useTransform(smoothProgress, [0.1, 0.7], [-45, 45])
    const layer2Op = useTransform(smoothProgress, [0.1, 0.2, 0.6, 0.7], [0, 1, 1, 0])

    // Layer 3: AUTH_IDENTITY (Inner)
    const layer3Z = useTransform(smoothProgress, [0.3, 0.6, 0.9], [-800, 0, 400])
    const layer3Rotate = useTransform(smoothProgress, [0.3, 0.9], [0, -30])
    const layer3Op = useTransform(smoothProgress, [0.3, 0.45, 0.85, 0.95], [0, 1, 1, 0])

    // Core Content
    const coreScale = useTransform(smoothProgress, [0.6, 0.8], [0.5, 1])
    const coreOp = useTransform(smoothProgress, [0.6, 0.8], [0, 1])

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-[#020408] overflow-hidden flex flex-col items-center justify-center">

            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center perspective-[2500px]">

                {/* 1. ATMOSPHERIC SCAN - OPTIMIZED WITH GRADIENT */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03)_0%,transparent_70%)]" />
                </div>

                {/* 2. SECTION HEADER */}
                <m.div
                    style={{ opacity: sceneOpacity }}
                    className="absolute top-24 text-center z-50 px-6 max-w-4xl"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6 backdrop-blur-md">
                        <Lock size={14} className="text-red-400" />
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-[0.3em]">Security_Protocol_Active_v2</span>
                    </div>
                    <h2 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tighter">
                        Hardened <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500">Core</span>
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed">
                        Security is not a feature, it's the foundation. Every blueprint is
                        protected by multi-layer zero-trust architecture.
                    </p>
                </m.div>

                {/* 3. THE 3D DECONSTRUCTED SHIELD */}
                <m.div
                    style={{ scale: sceneScale, opacity: sceneOpacity, transformStyle: 'preserve-3d' }}
                    className="relative w-full h-[600px] flex items-center justify-center mt-32"
                >
                    {/* Layer 1: Hardware Shield */}
                    <SecurityLayer
                        icon={Shield}
                        label="HARDWARE_SHIELD_V4"
                        z={layer1Z}
                        rotate={layer1Rotate}
                        opacity={layer1Op}
                        color="border-red-500/20"
                        scale={layer1Scale}
                    />

                    {/* Layer 2: Encryption Gate */}
                    <SecurityLayer
                        icon={Fingerprint}
                        label="AES_256_QUANTUM_SYNC"
                        z={layer2Z}
                        rotate={layer2Rotate}
                        opacity={layer2Op}
                        color="border-red-400/15"
                        scale={useTransform(smoothProgress, [0.1, 0.7], [0.8, 1.2])}
                    />

                    {/* Layer 3: Identity Auth */}
                    <SecurityLayer
                        icon={Key}
                        label="ZERO_TRUST_AUTH_SYNC"
                        z={layer3Z}
                        rotate={layer3Rotate}
                        opacity={layer3Op}
                        color="border-red-300/10"
                        scale={useTransform(smoothProgress, [0.3, 0.9], [0.6, 1])}
                    />

                    {/* THE CORE (Hidden until deconstructed) */}
                    <m.div
                        style={{ scale: coreScale, opacity: coreOp }}
                        className="relative z-0 flex flex-col items-center gap-12"
                    >
                        <div className="w-48 h-48 bg-gradient-to-br from-red-600 to-red-900 rounded-[3rem] shadow-[0_0_100px_rgba(239,68,68,0.4)] flex items-center justify-center border border-red-400/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-400/20 rounded-[3rem] blur-xl animate-pulse" />
                            <ShieldCheck size={80} className="text-white relative z-10" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">Verified Secure</h3>
                            <div className="flex gap-4 items-center justify-center">
                                <div className="h-1 w-12 bg-red-500/50 rounded-full" />
                                <span className="text-xs font-mono text-red-400 uppercase tracking-[0.5em]">STATUS: ARMORED</span>
                                <div className="h-1 w-12 bg-red-500/50 rounded-full" />
                            </div>
                        </div>
                    </m.div>
                </m.div>

                {/* 4. SECURITY AUDIT LOG (Floating) */}
                <div className="absolute right-12 bottom-12 flex flex-col gap-4 max-w-[300px]">
                    {[
                        { label: "Threat Detection", val: "ACTIVE", icon: Eye },
                        { label: "Data Encryption", val: "AES-256", icon: Lock },
                        { label: "Sync Latency", val: "0.2ms", icon: Zap }
                    ].map((item, i) => (
                        <m.div
                            key={i}
                            style={{ opacity: useTransform(smoothProgress, [0.4 + i * 0.1, 0.6 + i * 0.1], [0, 1]) }}
                            className="bg-slate-950/60 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex items-center gap-4"
                        >
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <item.icon size={16} className="text-red-400" />
                            </div>
                            <div>
                                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{item.label}</div>
                                <div className="text-sm font-bold text-white tracking-widest">{item.val}</div>
                            </div>
                        </m.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
