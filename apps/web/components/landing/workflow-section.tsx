'use client'

import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Search, PenTool, Rocket } from 'lucide-react'

const steps = [
    {
        icon: Search,
        title: '1. Select a Template',
        description: 'Choose from hundreds of professionally designed templates for any industry.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: PenTool,
        title: '2. Customize',
        description: 'Use our visual drag-and-drop editor to tweak designs, add content, and match your brand.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: Rocket,
        title: '3. Publish',
        description: 'Deploy instantly to a global CDN with a single click. No server management required.',
        color: 'from-orange-500 to-red-500'
    }
]

export function WorkflowSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section ref={ref} className="py-24 bg-[#0a0f1e] relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How it Works</h2>
                    <p className="text-lg text-slate-400">Go from idea to live site in minutes, not months.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[24px] left-[16%] right-[16%] h-[2px] bg-white/5 z-0" />

                    {steps.map((step, index) => (
                        <m.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="relative z-10 flex flex-col items-center text-center group"
                        >
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <step.icon className="w-6 h-6" />
                            </div>

                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl w-full hover:border-white/10 transition-colors backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
