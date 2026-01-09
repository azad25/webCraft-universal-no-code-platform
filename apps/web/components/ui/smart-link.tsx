'use client'

import React, { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

interface SmartLinkProps {
  linkConfig?: LinkConfig
  href?: string
  target?: string
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  isPreview?: boolean
  contextData?: Record<string, any>
}

export function SmartLink({
  linkConfig,
  href,
  target,
  children,
  className,
  onClick,
  isPreview = false,
  contextData = {}
}: SmartLinkProps) {
  const router = useRouter()

  // Handle smart link actions
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Call custom onClick first
    if (onClick) {
      onClick(e)
    }

    // If in preview mode and no link config, don't do anything
    if (isPreview && !linkConfig && !href) {
      e.preventDefault()
      return
    }

    // Handle link config actions
    if (linkConfig) {
      switch (linkConfig.type) {
        case 'action':
          e.preventDefault()
          handleAction(linkConfig.target, linkConfig.parameters)
          break
        case 'section':
          e.preventDefault()
          handleSectionScroll(linkConfig.target)
          break
        case 'data':
          e.preventDefault()
          handleDataNavigation(linkConfig)
          break
        case 'custom':
          e.preventDefault()
          handleCustomNavigation(linkConfig)
          break
        case 'page':
          // Let Next.js Link handle this
          break
        case 'external':
          // Let browser handle this
          break
      }

      // Track the click if tracking is configured
      if (linkConfig.tracking) {
        trackEvent(linkConfig.tracking.event, linkConfig.tracking.properties)
      }
    }
  }, [onClick, linkConfig, isPreview, contextData])

  // Handle different action types
  const handleAction = (action: string, parameters?: Record<string, any>) => {
    switch (action) {
      case 'scroll-to-top':
        window.scrollTo({ top: 0, behavior: 'smooth' })
        break
      case 'scroll-to-bottom':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        break
      case 'open-modal':
        // Dispatch custom event for modal opening
        window.dispatchEvent(new CustomEvent('open-modal', { 
          detail: { modalId: parameters?.modalId } 
        }))
        break
      case 'close-modal':
        window.dispatchEvent(new CustomEvent('close-modal'))
        break
      case 'toggle-menu':
        window.dispatchEvent(new CustomEvent('toggle-menu'))
        break
      case 'submit-form':
        const form = document.querySelector(`form[data-form-id="${parameters?.formId}"]`) as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
        break
      case 'download-file':
        if (parameters?.url) {
          const a = document.createElement('a')
          a.href = parameters.url
          a.download = parameters.filename || 'download'
          a.click()
        }
        break
      case 'copy-text':
        if (parameters?.text) {
          navigator.clipboard.writeText(parameters.text)
          // Show toast notification
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'Text copied to clipboard', type: 'success' }
          }))
        }
        break
      case 'share-page':
        if (navigator.share) {
          navigator.share({
            title: document.title,
            url: window.location.href
          })
        } else {
          // Fallback to copying URL
          navigator.clipboard.writeText(window.location.href)
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'URL copied to clipboard', type: 'success' }
          }))
        }
        break
      case 'print-page':
        window.print()
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }

  // Handle section scrolling
  const handleSectionScroll = (target: string) => {
    const sectionId = target.replace('#', '')
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle data navigation
  const handleDataNavigation = (config: LinkConfig) => {
    let url = `/data/${config.target}`
    
    // Add parameters
    if (config.parameters) {
      Object.entries(config.parameters).forEach(([key, value]) => {
        if (key === 'id') {
          url += `/${value}`
        } else {
          const separator = url.includes('?') ? '&' : '?'
          url += `${separator}${key}=${encodeURIComponent(value)}`
        }
      })
    }
    
    router.push(url)
  }

  // Handle custom navigation
  const handleCustomNavigation = (config: LinkConfig) => {
    let url = config.target
    
    // Replace parameters in the URL
    if (config.parameters) {
      Object.entries(config.parameters).forEach(([key, value]) => {
        url = url.replace(`[${key}]`, String(value))
      })
    }
    
    // Replace context data
    if (contextData) {
      Object.entries(contextData).forEach(([key, value]) => {
        url = url.replace(`[${key}]`, String(value))
      })
    }
    
    if (config.openInNewTab) {
      window.open(url, '_blank')
    } else {
      router.push(url)
    }
  }

  // Track events (integrate with your analytics)
  const trackEvent = (event: string, properties?: Record<string, any>) => {
    // Example: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties)
    }
    
    // Example: Custom analytics
    window.dispatchEvent(new CustomEvent('track-event', {
      detail: { event, properties }
    }))
  }

  // Determine the final href and target
  const getFinalHref = () => {
    if (linkConfig) {
      switch (linkConfig.type) {
        case 'page':
          return `/${linkConfig.target}`
        case 'section':
          return linkConfig.target
        case 'external':
          return linkConfig.target
        case 'data':
          let url = `/data/${linkConfig.target}`
          if (linkConfig.parameters?.id) {
            url += `/${linkConfig.parameters.id}`
          }
          return url
        case 'custom':
          let customUrl = linkConfig.target
          if (linkConfig.parameters) {
            Object.entries(linkConfig.parameters).forEach(([key, value]) => {
              customUrl = customUrl.replace(`[${key}]`, String(value))
            })
          }
          return customUrl
        case 'action':
          return '#'
        default:
          return href || '#'
      }
    }
    return href || '#'
  }

  const getFinalTarget = () => {
    if (linkConfig?.openInNewTab) {
      return '_blank'
    }
    return target
  }

  const finalHref = getFinalHref()
  const finalTarget = getFinalTarget()

  // For external links or new tab links, use regular anchor tag
  if (linkConfig?.type === 'external' || finalTarget === '_blank' || finalHref.startsWith('http') || finalHref.startsWith('mailto:') || finalHref.startsWith('tel:')) {
    return (
      <a
        href={finalHref}
        target={finalTarget}
        rel={finalTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className={className}
        onClick={handleClick}
      >
        {children}
      </a>
    )
  }

  // For internal navigation, use Next.js Link
  if (linkConfig?.type === 'page' || linkConfig?.type === 'data' || linkConfig?.type === 'custom') {
    return (
      <Link href={finalHref} className={className} onClick={handleClick}>
        {children}
      </Link>
    )
  }

  // For actions and sections, use button-like behavior
  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}