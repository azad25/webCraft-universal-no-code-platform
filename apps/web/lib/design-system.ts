/**
 * WebCraft Design System
 * Professional color palette, typography, and design tokens
 * Based on WebCraft brand identity
 */

// WebCraft Brand Colors - Primary Palette
export const WEBCRAFT_COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d6fe',
    300: '#a4b8fc',
    400: '#8093f8',
    500: '#6366f1', // Main brand color - Indigo
    600: '#5046e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Secondary - Vibrant Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Secondary brand color
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  
  // Accent - Cyan/Teal for highlights
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Accent color
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  
  // Success - Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error - Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral - Slate
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
}

// Gradient Definitions
export const WEBCRAFT_GRADIENTS = {
  // Primary brand gradient
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
  
  // Hero section gradient
  hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  
  // Accent gradient
  accent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  
  // Success gradient
  success: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
  
  // Premium/Gold gradient
  premium: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  
  // Dark mode gradient
  dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  
  // Glass effect
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  
  // Mesh gradient for backgrounds
  mesh: `
    radial-gradient(at 40% 20%, hsla(240, 91%, 65%, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(270, 91%, 65%, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(200, 91%, 65%, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 50%, hsla(340, 91%, 65%, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsla(240, 91%, 65%, 0.2) 0px, transparent 50%)
  `,
}

// Typography Scale
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    display: ['Cal Sans', 'Inter', 'sans-serif'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.16' }],
    '6xl': ['3.75rem', { lineHeight: '1.1' }],
    '7xl': ['4.5rem', { lineHeight: '1.05' }],
  },
  
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
}

// Spacing Scale
export const SPACING = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
}

// Border Radius
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
}

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Colored shadows for brand elements
  primary: '0 10px 40px -10px rgba(99, 102, 241, 0.5)',
  secondary: '0 10px 40px -10px rgba(168, 85, 247, 0.5)',
  accent: '0 10px 40px -10px rgba(6, 182, 212, 0.5)',
  
  // Glass shadow
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
}

// Animation Durations
export const ANIMATION = {
  duration: {
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}

// Z-Index Scale
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
}

// Breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Component-specific tokens
export const COMPONENT_TOKENS = {
  button: {
    borderRadius: BORDER_RADIUS.lg,
    paddingX: SPACING[4],
    paddingY: SPACING[2],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  input: {
    borderRadius: BORDER_RADIUS.md,
    paddingX: SPACING[3],
    paddingY: SPACING[2],
    fontSize: TYPOGRAPHY.fontSize.sm,
    borderWidth: '1px',
  },
  
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[6],
    shadow: SHADOWS.lg,
  },
  
  modal: {
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING[6],
    shadow: SHADOWS['2xl'],
  },
}

// Export CSS custom properties for use in stylesheets
export const CSS_VARIABLES = `
  :root {
    /* Primary Colors */
    --webcraft-primary-50: ${WEBCRAFT_COLORS.primary[50]};
    --webcraft-primary-100: ${WEBCRAFT_COLORS.primary[100]};
    --webcraft-primary-200: ${WEBCRAFT_COLORS.primary[200]};
    --webcraft-primary-300: ${WEBCRAFT_COLORS.primary[300]};
    --webcraft-primary-400: ${WEBCRAFT_COLORS.primary[400]};
    --webcraft-primary-500: ${WEBCRAFT_COLORS.primary[500]};
    --webcraft-primary-600: ${WEBCRAFT_COLORS.primary[600]};
    --webcraft-primary-700: ${WEBCRAFT_COLORS.primary[700]};
    --webcraft-primary-800: ${WEBCRAFT_COLORS.primary[800]};
    --webcraft-primary-900: ${WEBCRAFT_COLORS.primary[900]};
    
    /* Secondary Colors */
    --webcraft-secondary-500: ${WEBCRAFT_COLORS.secondary[500]};
    
    /* Accent Colors */
    --webcraft-accent-500: ${WEBCRAFT_COLORS.accent[500]};
    
    /* Gradients */
    --webcraft-gradient-primary: ${WEBCRAFT_GRADIENTS.primary};
    --webcraft-gradient-hero: ${WEBCRAFT_GRADIENTS.hero};
    --webcraft-gradient-accent: ${WEBCRAFT_GRADIENTS.accent};
    
    /* Shadows */
    --webcraft-shadow-primary: ${SHADOWS.primary};
    --webcraft-shadow-glass: ${SHADOWS.glass};
  }
`