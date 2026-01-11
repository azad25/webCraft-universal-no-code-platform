'use client'

import React from 'react'
import { m } from 'framer-motion'
import {
    Layout, Type, Image as ImageIcon, Settings,
    MousePointer2, Plus, Minus, AlignLeft,
    BarChart3, Users, Globe, ArrowUpRight,
    MessageSquare, Home, Search, Bell, User,
    Sparkles
} from 'lucide-react'

// --- 1. BUILDER MOCKUP ---
export const BuilderMockup = () => {
    return (
        <div className="flex h-full w-full bg-[#0f172a] text-slate-400 font-sans overflow-hidden">

            {/* Left Sidebar (Tools) */}
            <div className="w-14 border-r border-white/5 flex flex-col items-center py-4 gap-6 bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-4">
                    <Layout size={18} />
                </div>
                {[Type, ImageIcon, MousePointer2, Settings].map((Icon, i) => (
                    <div key={i} className="p-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors group">
                        <Icon size={20} className="group-hover:text-white" />
                    </div>
                ))}
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Bar */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-slate-900/50">
                    <div className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1.5 rounded-md border border-white/5 min-w-[200px]">
                        <Globe size={14} className="text-blue-400" />
                        <span className="text-slate-500">my-app.webcraft.dev</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-800" />
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Users size={12} className="text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Canvas (The "Website" being built) */}
                <div className="flex-1 p-8 bg-[#020617] overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

                    {/* Selected Element Frame (Hero Section) */}
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full h-full border-2 border-blue-500/50 rounded-lg relative bg-slate-900/30 backdrop-blur-sm p-8 flex flex-col items-center justify-center gap-6"
                    >
                        {/* Drag Handles */}
                        <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-[#0f172a] z-20">
                            <MousePointer2 size={12} className="text-white fill-white" />
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                            Hero Section
                        </div>

                        {/* Content Placeholder */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mb-2">
                            <Layout size={32} className="text-white opacity-80" />
                        </div>
                        <div className="space-y-3 w-full max-w-sm text-center">
                            <div className="h-8 bg-slate-700/50 rounded-lg w-3/4 mx-auto animate-pulse" />
                            <div className="h-4 bg-slate-800/50 rounded-lg w-full" />
                            <div className="h-4 bg-slate-800/50 rounded-lg w-5/6 mx-auto" />
                        </div>
                        <div className="flex gap-4 mt-4">
                            <div className="h-10 w-28 bg-blue-600 rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
                            <div className="h-10 w-28 border border-white/10 rounded-lg bg-white/5" />
                        </div>

                        {/* Floating AI Suggestion */}
                        <m.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-12 bottom-12 bg-slate-800 border border-purple-500/30 p-3 rounded-xl shadow-xl max-w-[180px]"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <SparklesIcon className="text-purple-400 w-3 h-3" />
                                <span className="text-[10px] font-bold text-purple-300">AI Suggestion</span>
                            </div>
                            <p className="text-[10px] leading-tight text-slate-300">Try increasing the contrast on the CTA button.</p>
                        </m.div>
                    </m.div>
                </div>
            </div>

            {/* Right Sidebar (Properties) */}
            <div className="w-60 border-l border-white/5 bg-slate-900/50 p-4 flex flex-col gap-6 hidden md:flex">

                {/* Section 1: Dimensions */}
                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Layout</div>
                    <div className="grid grid-cols-2 gap-2">
                        <PropInput label="W" value="100%" />
                        <PropInput label="H" value="Auto" />
                    </div>
                </div>

                {/* Section 2: Colors */}
                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Appearance</div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5">
                        <div className="w-6 h-6 rounded bg-blue-600 border border-white/10" />
                        <span className="text-xs font-mono">#2563EB</span>
                    </div>
                </div>

                {/* Section 3: Sliders */}
                <div className="space-y-4 mt-2">
                    <RangeProp label="Padding" value={40} />
                    <RangeProp label="Radius" value={75} />
                    <RangeProp label="Opacity" value={100} />
                </div>

            </div>
        </div>
    )
}

const PropInput = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-black/20 border border-white/5 rounded px-2 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className="text-xs text-slate-300">{value}</span>
    </div>
)

const RangeProp = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-slate-400">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${value}%` }} />
        </div>
    </div>
)

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
)

// --- LEGACY AI EXPORT ---
// Keeps compatibility with FeaturesSection if it still imports AIMockup
export const AIMockup = () => (
    <div className="w-full h-full bg-[#0F172A] relative overflow-hidden flex items-center justify-center border border-white/5">
        <div className="text-center space-y-4 relative z-10">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-purple-500/50">
                <Sparkles size={32} className="text-purple-400" />
            </div>
            <div className="text-sm text-slate-400">AI Logic Processing...</div>
        </div>
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl" />
    </div>
)


// --- 2. ANALYTICS MOCKUP ---
export const AnalyticsMockup = () => {
    return (
        <div className="flex flex-col h-full w-full bg-[#0F172A] p-2 font-sans relative">
            {/* Header */}
            <div className="flex justify-between items-end mb-6 px-4">
                <div>
                    <div className="text-sm text-slate-400 mb-1">Total Revenue</div>
                    <div className="text-3xl font-bold text-white flex items-center gap-2">
                        $124,500
                        <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ArrowUpRight size={10} /> 12%
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer"><Settings size={16} className="text-slate-400" /></div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-white/5 relative overflow-hidden mb-4">
                {/* Fake Chart Lines */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between px-6 pb-6 pt-12 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                        <m.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full bg-blue-500/20 rounded-t-sm relative group"
                        >
                            <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm" style={{ height: '100%' }} />
                            {/* Hover Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                Value: {h}k
                            </div>
                        </m.div>
                    ))}
                </div>
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6 px-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-[1px] bg-white/5" />)}
                </div>
            </div>

            {/* Bottom List */}
            <div className="h-32 bg-slate-900/50 rounded-lg p-3 border border-white/5 overflow-hidden">
                <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Active Users</div>
                <div className="space-y-2">
                    {[1, 2].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600" />
                                <div>
                                    <div className="text-xs font-bold text-white">User {2400 + i}</div>
                                    <div className="text-[10px] text-slate-500">San Francisco, CA</div>
                                </div>
                            </div>
                            <div className="text-xs text-green-400">Active</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}


// --- 3. MOBILE MOCKUP ---
export const MobileMockup = () => {
    return (
        <div className="h-full w-full bg-black text-white relative flex flex-col font-sans">

            {/* Header */}
            <div className="p-5 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <div className="font-bold text-lg">Messages</div>
                <Search size={18} className="text-slate-400" />
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-hidden p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <m.div
                        key={i}
                        initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                        <div className={`p-3 rounded-2xl max-w-[70%] text-sm leading-relaxed ${i % 2 === 0
                            ? 'bg-indigo-600 text-white rounded-tl-sm'
                            : 'bg-slate-800 text-slate-200 rounded-tr-sm'
                            }`}>
                            <div className="w-full h-2 bg-white/10 rounded mb-1.5 w-3/4" />
                            <div className="w-full h-2 bg-white/10 rounded w-1/2" />
                        </div>
                    </m.div>
                ))}
            </div>

            {/* Bottom Tab Bar */}
            <div className="h-16 bg-slate-900 border-t border-white/10 flex items-center justify-around px-2 pb-2">
                {[Home, Search, Bell, User].map((Icon, i) => (
                    <div key={i} className={`p-2 rounded-xl transition-colors ${i === 2 ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <Icon size={20} />
                    </div>
                ))}
            </div>
        </div>
    )
}
