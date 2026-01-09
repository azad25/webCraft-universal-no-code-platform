'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SmartLink } from '@/components/ui/smart-link'
import { ExternalLink, MousePointer, Link as LinkIcon } from 'lucide-react'

interface LinkConfig {
  type: 'page' | 'section' | 'data' | 'custom' | 'external' | 'action'
  target: string
  label?: string
  openInNewTab?: boolean
  parameters?: Record<string, any>
  conditions?: string[]
  tracking?: {
    event: string
    properties?: Record<string, any>
  }
}

interface LinkableWidgetWrapperProps {
  children: React.ReactNode
  linkConfig?: LinkConfig
  href?: string
  target?: string
  isPreview?: boolean
  isSelected?: boolean
  isHovered?: boolean
  elementId?: string
  elementType?: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
  contextData?: Record<string, any>
  // Link behavior options
  linkBehavior?: 'click' | 'hover' | 'none'
  showLinkIndicator?: boolean
  linkIndicatorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function LinkableWidgetWrapper({
  children,
  linkConfig,
  href,
  target,
  isPreview = false,
  isSelected = false,
  isHovered = false,
  elementId,
  elementType = 'widget',
  className,
  onClick,
  onDoubleClick,
  contextData = {},
  linkBehavior = 'click',
  showLinkIndicator = true,
  linkIndicatorPosition = 'top-right'
}: LinkableWidgetWrapperProps) {
  
  // Determine if this widget has a link
  const hasLink = !!(linkConfig || href)
  
  // Handle click events
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Call custom onClick first
    if (onClick) {
      onClick(e)
    }
    
    // If not in preview mode, don't execute links
    if (!isPreview && hasLink) {
      e.preventDefault()
      return
    }
  }, [onClick, isPreview, hasLink])

  // Handle double click events
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (onDoubleClick) {
      onDoubleClick(e)
    }
  }, [onDoubleClick])

  // Get link indicator icon based on link type
  const getLinkIcon = () => {
    if (!linkConfig) return LinkIcon
    
    switch (linkConfig.type) {
      case 'external':
        return ExternalLink
      case 'action':
        return MousePointer
      default:
        return LinkIcon
    }
  }

  // Get link indicator position classes
  const getIndicatorClasses = () => {
    const baseClasses = "absolute z-10 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
    
    switch (linkIndicatorPosition) {
      case 'top-left':
        return `${baseClasses} top-2 left-2`
      case 'top-right':
        return `${baseClasses} top-2 right-2`
      case 'bottom-left':
        return `${baseClasses} bottom-2 left-2`
      case 'bottom-right':
        return `${baseClasses} bottom-2 right-2`
      default:
        return `${baseClasses} top-2 right-2`
    }
  }

  // If no link, just render children with basic wrapper
  if (!hasLink) {
    return (
      <div
        className={cn(
          "relative",
          className
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
    )
  }

  // Render with link functionality
  return (
    <div className={cn("relative group", className)}>
      <SmartLink
        linkConfig={linkConfig}
        href={href}
        target={target}
        isPreview={isPreview}
        contextData={contextData}
        onClick={handleClick}
        className={cn(
          "block w-full h-full",
          hasLink && isPreview && "cursor-pointer",
          hasLink && !isPreview && "cursor-default",
          // Add hover effects for linked widgets
          hasLink && isPreview && "transition-transform hover:scale-[1.02] active:scale-[0.98]"
        )}
      >
        <motion.div
          className="w-full h-full"
          whileHover={hasLink && isPreview ? { 
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
          } : undefined}
          onDoubleClick={handleDoubleClick}
        >
          {children}
        </motion.div>
      </SmartLink>

      {/* Link Indicator */}
      {hasLink && showLinkIndicator && (isSelected || isHovered || !isPreview) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={getIndicatorClasses()}
        >
          {React.createElement(getLinkIcon(), { className: "w-3 h-3" })}
        </motion.div>
      )}

      {/* Link Preview Tooltip (for editor mode) */}
      {hasLink && !isPreview && (isSelected || isHovered) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20 pointer-events-none"
        >
          {linkConfig ? (
            <>
              {linkConfig.type === 'page' && `→ /${linkConfig.target}`}
              {linkConfig.type === 'section' && `→ ${linkConfig.target}`}
              {linkConfig.type === 'external' && `→ ${linkConfig.target}`}
              {linkConfig.type === 'data' && `→ /data/${linkConfig.target}`}
              {linkConfig.type === 'custom' && `→ ${linkConfig.target}`}
              {linkConfig.type === 'action' && `⚡ ${linkConfig.target}`}
            </>
          ) : (
            `→ ${href}`
          )}
          {linkConfig?.openInNewTab && (
            <ExternalLink className="w-3 h-3 ml-1 inline" />
          )}
        </motion.div>
      )}

      {/* Click hint for editor mode */}
      {hasLink && !isPreview && isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs whitespace-nowrap z-20 pointer-events-none"
        >
          🔗 Linked • Preview to test
        </motion.div>
      )}
    </div>
  )
}

// Higher-order component to make any widget linkable
export function withLinkability<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  const LinkableComponent = React.forwardRef<any, T & LinkableWidgetWrapperProps>((props, ref) => {
    const {
      linkConfig,
      href,
      target,
      isPreview,
      isSelected,
      isHovered,
      elementId,
      elementType,
      contextData,
      linkBehavior,
      showLinkIndicator,
      linkIndicatorPosition,
      onClick,
      onDoubleClick,
      className,
      ...componentProps
    } = props

    return (
      <LinkableWidgetWrapper
        linkConfig={linkConfig}
        href={href}
        target={target}
        isPreview={isPreview}
        isSelected={isSelected}
        isHovered={isHovered}
        elementId={elementId}
        elementType={elementType}
        contextData={contextData}
        linkBehavior={linkBehavior}
        showLinkIndicator={showLinkIndicator}
        linkIndicatorPosition={linkIndicatorPosition}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={className}
      >
        <WrappedComponent
          {...(componentProps as T)}
          ref={ref}
          isPreview={isPreview}
          isSelected={isSelected}
          isHovered={isHovered}
          elementId={elementId}
        />
      </LinkableWidgetWrapper>
    )
  })

  LinkableComponent.displayName = `Linkable(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return LinkableComponent
}