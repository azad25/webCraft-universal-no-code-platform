'use client'

import { m } from 'framer-motion'
import { Disc, Hexagon, Triangle, Circle, Square, BoxSelect } from 'lucide-react'

const companies = [
    { name: 'Acme Corp', icon: Disc },
    { name: 'Global Tech', icon: Hexagon },
    { name: 'Nebula', icon: Triangle },
    { name: 'Orbit', icon: Circle },
    { name: 'SquareOne', icon: Square },
    { name: 'BoxIo', icon: BoxSelect },
    // Repeat for infinite effect
    { name: 'Acme Corp', icon: Disc },
    { name: 'Global Tech', icon: Hexagon },
    { name: 'Nebula', icon: Triangle },
    { name: 'Orbit', icon: Circle },
    { name: 'SquareOne', icon: Square },
    { name: 'BoxIo', icon: BoxSelect },
]

export function TrustedBySection() {
    return (
        <section className="py-12 bg-[#0a0f1e] border-b border-white/5 overflow-hidden">
            <div className="container mx-auto px-4 mb-8 text-center">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Trusted by innovative teams worldwide</p>
            </div>

            <div className="flex overflow-hidden relative">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10" />

                <m.div
                    className="flex gap-16 min-w-full"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                    }}
                >
                    {companies.map((Company, i) => (
                        <div key={i} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                            <Company.icon className="w-8 h-8 text-white" />
                            <span className="text-xl font-bold text-white hidden md:block">{Company.name}</span>
                        </div>
                    ))}
                    {/* Duplicate strictly if needed for smoother loop, but array duplication above handles it for simple cases */}
                </m.div>
            </div>
        </section>
    )
}
