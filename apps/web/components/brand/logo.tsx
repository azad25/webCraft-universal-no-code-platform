'use client'

import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 48, text: 'text-3xl' }
}

export function Logo({ 
  size = 'md', 
  variant = 'full', 
  animated = true,
  className 
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]
  
  const LogoIcon = () => (
    <m.svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.3 }}
      whileHover={animated ? { scale: 1.05 } : undefined}
    >
      {/* Background gradient circle */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main circle background */}
      <circle 
        cx="24" 
        cy="24" 
        r="22" 
        fill="url(#logoGradient)"
        filter="url(#glow)"
      />
      
      {/* Inner design - Abstract "W" shape representing web/craft */}
      <m.path
        d="M12 16L18 32L24 20L30 32L36 16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Accent dot */}
      <m.circle
        cx="24"
        cy="14"
        r="3"
        fill="url(#accentGradient)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      
      {/* Decorative elements */}
      <m.circle
        cx="38"
        cy="24"
        r="2"
        fill="white"
        opacity="0.6"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      <m.circle
        cx="10"
        cy="24"
        r="2"
        fill="white"
        opacity="0.6"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
    </m.svg>
  )
  
  const LogoText = () => (
    <m.span
      className={cn(
        "font-bold tracking-tight",
        textSize
      )}
      initial={animated ? { opacity: 0, x: -10 } : false}
      animate={animated ? { opacity: 1, x: 0 } : false}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
        Web
      </span>
      <span className="text-foreground">Craft</span>
    </m.span>
  )
  
  if (variant === 'icon') {
    return (
      <div className={cn("flex items-center", className)}>
        <LogoIcon />
      </div>
    )
  }
  
  if (variant === 'text') {
    return (
      <div className={cn("flex items-center", className)}>
        <LogoText />
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon />
      <LogoText />
    </div>
  )
}

// Favicon component for use in metadata
export function Favicon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#faviconGradient)" />
      <path
        d="M12 16L18 32L24 20L30 32L36 16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="24" cy="14" r="3" fill="#06b6d4" />
    </svg>
  )
}

// Loading spinner with logo
export function LogoSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const spinnerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <div className="flex items-center justify-center">
      <m.div
        className={cn(spinnerSizes[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <Logo size={size} variant="icon" animated={false} />
      </m.div>
    </div>
  )
}