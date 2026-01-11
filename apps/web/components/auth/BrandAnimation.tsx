'use client'

import { m } from 'framer-motion'
import { Layers, Zap, Layout, Code2 } from 'lucide-react'
import { CircuitBackground } from './CircuitBackground'
import { AnimatedLogo } from '@/components/brand/animated-logo'

export const BrandAnimation = () => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0f1e] flex items-center justify-center">
            <CircuitBackground />

            {/* Main Content */}
            <div className="relative z-20 text-center p-8">
                <m.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-10"
                >
                    {/* Central Logo Animation */}
                    <div className="relative inline-block group">
                        {/* Animated Rings */}
                        {[1, 2, 3].map((ring) => (
                            <m.div
                                key={ring}
                                className="absolute inset-0 rounded-2xl border border-blue-500/30"
                                initial={{ scale: 1, opacity: 0, rotate: 0 }}
                                animate={{
                                    scale: [1, 1.5 + (ring * 0.2), 1.2],
                                    opacity: [0.5, 0, 0],
                                    rotate: ring % 2 === 0 ? 90 : -90
                                }}
                                transition={{
                                    duration: 3,
                                    delay: ring * 0.4,
                                    repeat: Infinity,
                                    ease: "easeOut"
                                }}
                            />
                        ))}

                        <m.div
                            className="relative z-10"
                            animate={{
                                y: [0, -10, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <AnimatedLogo className="scale-[2.5] mb-12" showText={false} />
                        </m.div>
                    </div>

                    <h1 className="text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
                        WebCraft <span className="text-blue-400">Pro</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-sm mx-auto leading-relaxed font-light">
                        Architect the future of web apps.
                    </p>
                </m.div>

                {/* Feature Pills - Tech Style */}
                <div className="flex flex-wrap justify-center gap-3">
                    {[
                        { text: 'Visual Editor', icon: Layout },
                        { text: 'Auto Code', icon: Code2 },
                        { text: 'Instant Deploy', icon: Zap }
                    ].map((item, i) => (
                        <m.div
                            key={item.text}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + (i * 0.1) }}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                            className="px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-md border border-blue-500/20 text-blue-200 text-sm font-medium flex items-center gap-2 shadow-lg shadow-black/20"
                        >
                            <item.icon className="w-4 h-4 text-blue-400" />
                            {item.text}
                        </m.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
