'use client'

import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AnimatedLogo({ className, showText = true }: { className?: string, showText?: boolean }) {
    return (
        <div className={cn("flex items-center gap-3 group cursor-pointer", className)}>
            {/* Animated Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                    {/* Outer Hexagon Glow */}
                    <m.path
                        d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
                        className="stroke-blue-500/30"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Inner Cube - Animated Drawing */}
                    <m.path
                        d="M20 8L30 14V26L20 32L10 26V14L20 8Z M20 8V32 M10 14L20 20L30 14 M6 12L20 4L34 12"
                        className="stroke-white group-hover:stroke-blue-400 transition-colors duration-300"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
                    />

                    {/* Floating Particle */}
                    <m.circle
                        cx="20" cy="20" r="3"
                        className="fill-blue-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                </svg>

                {/* Background glow pulse */}
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Text Reveal */}
            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
                        WebCraft
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                        Builder
                    </span>
                </div>
            )}
        </div>
    )
}
