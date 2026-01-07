/**
 * Widget Style System
 * Comprehensive styling options for all widgets
 */

// Google Fonts available in the system
export const GOOGLE_FONTS = [
  { name: 'Inter', value: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', value: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', value: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro', category: 'sans-serif' },
  { name: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { name: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { name: 'Ubuntu', value: 'Ubuntu', category: 'sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { name: 'Lora', value: 'Lora', category: 'serif' },
  { name: 'PT Serif', value: 'PT Serif', category: 'serif' },
  { name: 'Crimson Text', value: 'Crimson Text', category: 'serif' },
  { name: 'Fira Code', value: 'Fira Code', category: 'monospace' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'monospace' },
  { name: 'Source Code Pro', value: 'Source Code Pro', category: 'monospace' },
  { name: 'Dancing Script', value: 'Dancing Script', category: 'handwriting' },
  { name: 'Pacifico', value: 'Pacifico', category: 'handwriting' },
  { name: 'Caveat', value: 'Caveat', category: 'handwriting' },
];

// Font weights
export const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Extra Light', value: '200' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
];

// Font sizes with responsive options
export const FONT_SIZES = [
  { label: 'XS', value: '0.75rem', px: '12px' },
  { label: 'SM', value: '0.875rem', px: '14px' },
  { label: 'Base', value: '1rem', px: '16px' },
  { label: 'LG', value: '1.125rem', px: '18px' },
  { label: 'XL', value: '1.25rem', px: '20px' },
  { label: '2XL', value: '1.5rem', px: '24px' },
  { label: '3XL', value: '1.875rem', px: '30px' },
  { label: '4XL', value: '2.25rem', px: '36px' },
  { label: '5XL', value: '3rem', px: '48px' },
  { label: '6XL', value: '3.75rem', px: '60px' },
  { label: '7XL', value: '4.5rem', px: '72px' },
  { label: '8XL', value: '6rem', px: '96px' },
];

// Line heights
export const LINE_HEIGHTS = [
  { label: 'None', value: '1' },
  { label: 'Tight', value: '1.25' },
  { label: 'Snug', value: '1.375' },
  { label: 'Normal', value: '1.5' },
  { label: 'Relaxed', value: '1.625' },
  { label: 'Loose', value: '2' },
];

// Letter spacing
export const LETTER_SPACINGS = [
  { label: 'Tighter', value: '-0.05em' },
  { label: 'Tight', value: '-0.025em' },
  { label: 'Normal', value: '0' },
  { label: 'Wide', value: '0.025em' },
  { label: 'Wider', value: '0.05em' },
  { label: 'Widest', value: '0.1em' },
];

// Color presets organized by category
export const COLOR_PRESETS = {
  brand: [
    { name: 'Primary', value: '#6366f1' },
    { name: 'Secondary', value: '#a855f7' },
    { name: 'Accent', value: '#06b6d4' },
  ],
  neutral: [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Gray 50', value: '#f9fafb' },
    { name: 'Gray 100', value: '#f3f4f6' },
    { name: 'Gray 200', value: '#e5e7eb' },
    { name: 'Gray 300', value: '#d1d5db' },
    { name: 'Gray 400', value: '#9ca3af' },
    { name: 'Gray 500', value: '#6b7280' },
    { name: 'Gray 600', value: '#4b5563' },
    { name: 'Gray 700', value: '#374151' },
    { name: 'Gray 800', value: '#1f2937' },
    { name: 'Gray 900', value: '#111827' },
  ],
  colors: [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
  ],
};

// Gradient presets
export const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)' },
  { name: 'Purple Haze', value: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
  { name: 'Night Sky', value: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)' },
  { name: 'Warm', value: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' },
  { name: 'Cool', value: 'linear-gradient(135deg, #a5f3fc 0%, #c4b5fd 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #fbbf24 0%, #ef4444 100%)' },
];

// Background types
export type BackgroundType = 'color' | 'gradient' | 'image' | 'video' | 'none';

export interface BackgroundStyle {
  type: BackgroundType;
  color?: string;
  gradient?: string;
  image?: {
    url: string;
    size: 'cover' | 'contain' | 'auto' | string;
    position: string;
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    attachment: 'scroll' | 'fixed' | 'local';
    overlay?: string; // Color overlay with opacity
  };
  video?: {
    url: string;
    poster?: string;
    loop: boolean;
    muted: boolean;
    overlay?: string;
  };
}

// Border styles
export const BORDER_STYLES = [
  { label: 'None', value: 'none' },
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
];

// Border radius presets
export const BORDER_RADIUS_PRESETS = [
  { label: 'None', value: '0' },
  { label: 'SM', value: '0.125rem' },
  { label: 'Default', value: '0.25rem' },
  { label: 'MD', value: '0.375rem' },
  { label: 'LG', value: '0.5rem' },
  { label: 'XL', value: '0.75rem' },
  { label: '2XL', value: '1rem' },
  { label: '3XL', value: '1.5rem' },
  { label: 'Full', value: '9999px' },
];

// Shadow presets
export const SHADOW_PRESETS = [
  { label: 'None', value: 'none' },
  { label: 'SM', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { label: 'Default', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
  { label: 'MD', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
  { label: 'LG', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
  { label: 'XL', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  { label: '2XL', value: '0 25px 50px -12px rgb(0 0 0 / 0.25)' },
  { label: 'Inner', value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' },
];

// Animation presets
export const ANIMATION_PRESETS = [
  { label: 'None', value: 'none' },
  { label: 'Fade In', value: 'fadeIn' },
  { label: 'Fade In Up', value: 'fadeInUp' },
  { label: 'Fade In Down', value: 'fadeInDown' },
  { label: 'Fade In Left', value: 'fadeInLeft' },
  { label: 'Fade In Right', value: 'fadeInRight' },
  { label: 'Zoom In', value: 'zoomIn' },
  { label: 'Bounce', value: 'bounce' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Shake', value: 'shake' },
  { label: 'Slide In Up', value: 'slideInUp' },
  { label: 'Slide In Down', value: 'slideInDown' },
];

// Complete widget style interface
export interface WidgetStyle {
  // Typography
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: 'none' | 'underline' | 'line-through';
    color?: string;
  };
  
  // Background
  background?: BackgroundStyle;
  
  // Border
  border?: {
    width?: string;
    style?: string;
    color?: string;
    radius?: string | { topLeft?: string; topRight?: string; bottomRight?: string; bottomLeft?: string };
  };
  
  // Shadow
  shadow?: string;
  
  // Spacing
  padding?: string | { top?: string; right?: string; bottom?: string; left?: string };
  margin?: string | { top?: string; right?: string; bottom?: string; left?: string };
  
  // Size
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  
  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  zIndex?: number;
  
  // Display
  display?: string;
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  // Animation
  animation?: {
    type?: string;
    duration?: string;
    delay?: string;
    easing?: string;
  };
  
  // Hover state
  hover?: Partial<WidgetStyle>;
  
  // Responsive overrides
  responsive?: {
    tablet?: Partial<WidgetStyle>;
    mobile?: Partial<WidgetStyle>;
  };
}

// Convert WidgetStyle to CSS object
export function widgetStyleToCSS(style: WidgetStyle): React.CSSProperties {
  const css: React.CSSProperties = {};
  
  // Typography
  if (style.typography) {
    if (style.typography.fontFamily) css.fontFamily = style.typography.fontFamily;
    if (style.typography.fontSize) css.fontSize = style.typography.fontSize;
    if (style.typography.fontWeight) css.fontWeight = style.typography.fontWeight;
    if (style.typography.lineHeight) css.lineHeight = style.typography.lineHeight;
    if (style.typography.letterSpacing) css.letterSpacing = style.typography.letterSpacing;
    if (style.typography.textAlign) css.textAlign = style.typography.textAlign;
    if (style.typography.textTransform) css.textTransform = style.typography.textTransform;
    if (style.typography.textDecoration) css.textDecoration = style.typography.textDecoration;
    if (style.typography.color) css.color = style.typography.color;
  }
  
  // Background
  if (style.background) {
    switch (style.background.type) {
      case 'color':
        css.backgroundColor = style.background.color;
        break;
      case 'gradient':
        css.background = style.background.gradient;
        break;
      case 'image':
        if (style.background.image) {
          css.backgroundImage = `url(${style.background.image.url})`;
          css.backgroundSize = style.background.image.size;
          css.backgroundPosition = style.background.image.position;
          css.backgroundRepeat = style.background.image.repeat;
          css.backgroundAttachment = style.background.image.attachment;
        }
        break;
    }
  }
  
  // Border
  if (style.border) {
    if (style.border.width && style.border.style && style.border.color) {
      css.border = `${style.border.width} ${style.border.style} ${style.border.color}`;
    }
    if (style.border.radius) {
      if (typeof style.border.radius === 'string') {
        css.borderRadius = style.border.radius;
      } else {
        css.borderTopLeftRadius = style.border.radius.topLeft;
        css.borderTopRightRadius = style.border.radius.topRight;
        css.borderBottomRightRadius = style.border.radius.bottomRight;
        css.borderBottomLeftRadius = style.border.radius.bottomLeft;
      }
    }
  }
  
  // Shadow
  if (style.shadow) css.boxShadow = style.shadow;
  
  // Spacing
  if (style.padding) {
    if (typeof style.padding === 'string') {
      css.padding = style.padding;
    } else {
      css.paddingTop = style.padding.top;
      css.paddingRight = style.padding.right;
      css.paddingBottom = style.padding.bottom;
      css.paddingLeft = style.padding.left;
    }
  }
  if (style.margin) {
    if (typeof style.margin === 'string') {
      css.margin = style.margin;
    } else {
      css.marginTop = style.margin.top;
      css.marginRight = style.margin.right;
      css.marginBottom = style.margin.bottom;
      css.marginLeft = style.margin.left;
    }
  }
  
  // Size
  if (style.width) css.width = style.width;
  if (style.height) css.height = style.height;
  if (style.minWidth) css.minWidth = style.minWidth;
  if (style.maxWidth) css.maxWidth = style.maxWidth;
  if (style.minHeight) css.minHeight = style.minHeight;
  if (style.maxHeight) css.maxHeight = style.maxHeight;
  
  // Position
  if (style.position) css.position = style.position;
  if (style.zIndex !== undefined) css.zIndex = style.zIndex;
  
  // Display
  if (style.display) css.display = style.display;
  if (style.opacity !== undefined) css.opacity = style.opacity;
  if (style.overflow) css.overflow = style.overflow;
  
  return css;
}

// Generate Google Fonts URL
export function generateGoogleFontsUrl(fonts: string[]): string {
  const uniqueFonts = [...new Set(fonts)];
  const fontParams = uniqueFonts
    .map(font => `family=${font.replace(/ /g, '+')}:wght@100;200;300;400;500;600;700;800;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}
