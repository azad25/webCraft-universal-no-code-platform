/**
 * Widget Registry
 * Central registry for all widget components
 */

import { ComponentType } from 'react'
import { moduleRegistry } from './module-system'

export interface WidgetDefinition {
  id: string
  name: string
  category: string
  icon: string
  description: string
  defaultProps: Record<string, any>
  configSchema: Record<string, any>
  component: ComponentType<any>
  isPremium?: boolean
}

class WidgetRegistry {
  private widgets: Map<string, WidgetDefinition> = new Map()
  private categories: Map<string, string[]> = new Map()

  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget)
    
    // Add to category
    if (!this.categories.has(widget.category)) {
      this.categories.set(widget.category, [])
    }
    this.categories.get(widget.category)!.push(widget.id)
  }

  unregister(widgetId: string): void {
    const widget = this.widgets.get(widgetId)
    if (widget) {
      this.widgets.delete(widgetId)
      const categoryWidgets = this.categories.get(widget.category)
      if (categoryWidgets) {
        const index = categoryWidgets.indexOf(widgetId)
        if (index > -1) categoryWidgets.splice(index, 1)
      }
    }
  }

  get(widgetId: string): WidgetDefinition | undefined {
    return this.widgets.get(widgetId)
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values())
  }

  getByCategory(category: string): WidgetDefinition[] {
    const widgetIds = this.categories.get(category) || []
    return widgetIds.map(id => this.widgets.get(id)!).filter(Boolean)
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  // Get widget component by ID
  getComponent(widgetId: string): ComponentType<any> | null {
    const widget = this.widgets.get(widgetId)
    return widget?.component || null
  }
}

export const widgetRegistry = new WidgetRegistry()

// Register built-in widgets
export function registerBuiltinWidgets() {
  // Import widget components
  const widgets = require('@/components/editor/widgets')
  
  const builtinWidgets: Omit<WidgetDefinition, 'component'>[] = [
    {
      id: 'hero',
      name: 'Hero Section',
      category: 'sections',
      icon: 'star',
      description: 'Full-width hero with title and CTA',
      defaultProps: { title: 'Welcome', subtitle: '' },
      configSchema: {}
    },
    {
      id: 'text',
      name: 'Text',
      category: 'content',
      icon: 'type',
      description: 'Rich text content',
      defaultProps: { text: 'Enter text...' },
      configSchema: {}
    },
    {
      id: 'image',
      name: 'Image',
      category: 'media',
      icon: 'image',
      description: 'Responsive image',
      defaultProps: {},
      configSchema: {}
    },
    {
      id: 'button',
      name: 'Button',
      category: 'interactive',
      icon: 'mouse-pointer',
      description: 'Interactive button',
      defaultProps: { text: 'Click Me' },
      configSchema: {}
    },
    {
      id: 'form',
      name: 'Form',
      category: 'interactive',
      icon: 'file-text',
      description: 'Contact form',
      defaultProps: { fields: [] },
      configSchema: {}
    },
    {
      id: 'card',
      name: 'Card',
      category: 'content',
      icon: 'square',
      description: 'Content card',
      defaultProps: { title: 'Card Title' },
      configSchema: {}
    },
    {
      id: 'list',
      name: 'List',
      category: 'content',
      icon: 'list',
      description: 'Bullet or numbered list',
      defaultProps: { items: [] },
      configSchema: {}
    },
    {
      id: 'chart',
      name: 'Chart',
      category: 'data',
      icon: 'bar-chart',
      description: 'Data visualization',
      defaultProps: { type: 'bar' },
      configSchema: {}
    },
    {
      id: 'video',
      name: 'Video',
      category: 'media',
      icon: 'video',
      description: 'Video player',
      defaultProps: {},
      configSchema: {}
    },
    {
      id: 'map',
      name: 'Map',
      category: 'advanced',
      icon: 'map',
      description: 'Interactive map',
      defaultProps: {},
      configSchema: {}
    },
    {
      id: 'social',
      name: 'Social Links',
      category: 'interactive',
      icon: 'share-2',
      description: 'Social media links',
      defaultProps: { links: [] },
      configSchema: {}
    },
    {
      id: 'ecommerce',
      name: 'Product Card',
      category: 'ecommerce',
      icon: 'shopping-cart',
      description: 'E-commerce product',
      defaultProps: {},
      configSchema: {},
      isPremium: true
    },
    {
      id: 'data',
      name: 'Data Widget',
      category: 'data',
      icon: 'database',
      description: 'Display data from APIs or scrapers',
      defaultProps: { sourceType: 'static', displayMode: 'cards' },
      configSchema: {},
      isPremium: false
    }
  ]

  // Map widget IDs to components
  const componentMap: Record<string, ComponentType<any>> = {
    hero: widgets.HeroWidget,
    text: widgets.TextWidget,
    image: widgets.ImageWidget,
    button: widgets.ButtonWidget,
    form: widgets.FormWidget,
    card: widgets.CardWidget,
    list: widgets.ListWidget,
    chart: widgets.ChartWidget,
    video: widgets.VideoWidget,
    map: widgets.MapWidget,
    social: widgets.SocialWidget,
    ecommerce: widgets.EcommerceWidget,
    data: widgets.DataWidget
  }

  builtinWidgets.forEach(widget => {
    if (componentMap[widget.id]) {
      widgetRegistry.register({
        ...widget,
        component: componentMap[widget.id]
      })
    }
  })
}
