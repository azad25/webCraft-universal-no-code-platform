'use client'

import React, { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import { Database, Lock, Wand2, ArrowRight } from 'lucide-react'

// Features Data
const features = [
    {
        icon: Wand2,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        title: "AI Generation",
        description: "Describe your dream app in plain English. Our LLM-powered engine generates the full database schema, API endpoints, and UI components in seconds.",
        example: "User: 'Build a CRM for real estate agents'"
    },
    {
        icon: Database,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        title: "Instant Backend",
        description: "Forget simple CRUD. We provide a full Postgres database, Redis caching, and auto-generated GraphQL & REST APIs instantly deployed to the edge.",
        example: "Automatic Migrations & Backups"
    },
    {
        icon: Lock,
        color: "text-green-400",
        bg: "bg-green-500/10",
        title: "Enterprise Auth",
        description: "Pre-configured authentication flows supporting Google, GitHub, Magic Links, and SSO. Role-based access control (RBAC) built right into the components.",
        example: "Secure by default"
    }
]

export function ParallaxFeatures() {
    const targetRef = useRef<HTMLDivElement>(null)

    // Track scroll within this section
    const { scrollYProgress } = useScroll({
        target: targetRef,
        // Start tracking when section hits top of viewport
        // End when section has scrolled its full height
        offset: ["start start", "end end"]
    })

    // Horizontal scroll transform: Moves content left as we scroll down
    // We map 0 -> 1 vertical progress to 0% -> -66% horizontal movement
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"])

    // Opacity fade in/out
    const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-[#0a0f1e]">
            {/* Sticky Container */}
            <div className="sticky top-0 h-screen flex items-center overflow-hidden w-full">

                <div className="absolute top-10 left-10 md:left-20 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300 mb-4">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Under the hood
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Power Features</h2>
                </div>

                {/* Horizontal Track */}
                <m.div style={{ x, opacity, translateZ: 0 }} className="flex gap-8 px-10 md:px-20 min-w-max will-change-transform">
                    {features.map((feature, i) => (
                        <div key={i} className="w-[85vw] md:w-[60vw] lg:w-[40vw] h-[60vh] md:h-[70vh] flex-shrink-0 relative group">
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-500 group-hover:border-white/20 group-hover:bg-slate-900/80">
                                {/* Background Gradient */}
                                <div className={`absolute top-0 right-0 w-[300px] h-[300px] ${feature.bg} blur-[100px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700`} />

                                <div className="p-8 md:p-12 h-full flex flex-col">
                                    <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-8`}>
                                        <feature.icon size={32} className={feature.color} />
                                    </div>

                                    <h3 className="text-3xl font-bold text-white mb-6">{feature.title}</h3>
                                    <p className="text-xl text-slate-400 leading-relaxed mb-auto bg-clip-text">
                                        {feature.description}
                                    </p>

                                    <div className="mt-8 p-4 bg-black/20 rounded-xl border border-white/5 font-mono text-sm text-slate-300">
                                        <span className="text-slate-500 mr-2">$</span>
                                        {feature.example}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Final 'More' Card */}
                    <div className="w-[85vw] md:w-[60vw] lg:w-[40vw] h-[60vh] md:h-[70vh] flex-shrink-0 flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-3xl font-bold text-white mb-4">And much more...</h3>
                            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Webhooks, PDF Generation, payment gateways, and third-party integrations.</p>
                            <button className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 mx-auto">
                                View All Features <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                </m.div>
            </div>
        </section>
    )
}
