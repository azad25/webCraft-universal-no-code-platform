'use client'

import { m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Layout, Box, Smartphone, Code2, Database, Cloud, Wifi, Globe, Server, Activity, Cpu } from 'lucide-react'

export const CircuitBackground = () => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Generate random popping icons
    const iconTypes = [Layout, Box, Smartphone, Code2, Database, Cloud, Wifi, Globe, Server, Activity, Cpu]

    const poppingIcons = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        Icon: iconTypes[i % iconTypes.length],
        // Position relative to a virtual 50px grid, centered
        xOffset: (Math.floor((i * 13) % 20) - 10) * 100 + 25,
        yOffset: (Math.floor((i * 7) % 12) - 6) * 100 + 25,
        delay: (i * 0.5) % 10,
        duration: 3 + (i % 4),
        size: (i % 3) === 0 ? 'lg' : (i % 3) === 1 ? 'md' : 'sm'
    }))

    // Generate random data packets for circuit effect
    // Snap to 50px grid lines
    const dataPackets = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        isVertical: i % 2 === 0,
        // Calculate offset from center in 50px increments
        offset: (Math.floor(Math.random() * 30) - 15) * 50,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 10,
        direction: Math.random() > 0.5 ? 1 : -1
    }))

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#0a0f1e] z-0">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-indigo-950/50 to-slate-950/90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />

            {/* Blueprint Grid (CSS Based for perfect squares) */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />

                {/* Circuit Data Packets (Glowing Lines) */}
                {dataPackets.map((packet) => {
                    const isForward = packet.direction === 1
                    const travelDistance = isForward ? ['-100%', '200%'] : ['200%', '-100%']

                    return (
                        <m.div
                            key={packet.id}
                            className={`absolute bg-cyan-400/80 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)] z-10 ${packet.isVertical ? 'w-[2px] h-32' : 'h-[2px] w-32'
                                }`}
                            style={{
                                left: packet.isVertical ? `calc(50% + ${packet.offset}px)` : undefined,
                                top: !packet.isVertical ? `calc(50% + ${packet.offset}px)` : undefined,
                                // Center the travelling axis initially
                                x: packet.isVertical ? '-50%' : '0%',
                                y: !packet.isVertical ? '-50%' : '0%'
                            }}
                            animate={{
                                y: packet.isVertical ? ['-100vh', '150vh'] : '-50%',
                                x: !packet.isVertical ? ['-100vw', '150vw'] : '-50%',
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: packet.duration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: packet.delay
                            }}
                        />
                    )
                })}
            </div>

            {/* Popping Icons */}
            {poppingIcons.map((item) => {
                const sizeClass =
                    item.size === 'lg' ? 'w-12 h-12 p-2.5' :
                        item.size === 'md' ? 'w-10 h-10 p-2' : 'w-8 h-8 p-1.5'

                return (
                    <m.div
                        key={item.id}
                        className={`absolute rounded-xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md text-blue-400 flex items-center justify-center shadow-lg ${sizeClass}`}
                        style={{
                            left: `calc(50% + ${item.xOffset}px)`,
                            top: `calc(50% + ${item.yOffset}px)`,
                            transform: 'translate(-50%, -50%)'
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1, 1, 0.5],
                            rotate: [0, 0, 10, -10, 0]
                        }}
                        transition={{
                            duration: item.duration,
                            repeat: Infinity,
                            delay: item.delay,
                            times: [0, 0.1, 0.8, 1],
                            ease: "easeInOut"
                        }}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg -z-10" />
                        <item.Icon className="w-full h-full stroke-[1.5]" />
                    </m.div>
                )
            })}
        </div>
    )
}
