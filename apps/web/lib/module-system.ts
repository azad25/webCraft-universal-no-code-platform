/**
 * WebCraft Frontend Module System
 * Dynamic module loading and registration
 */

import { ComponentType, lazy } from 'react'

// Module types
export type ModuleType =
  | 'widget'
  | 'integration'
  | 'payment'
  | 'ai_provider'
  | 'storage'
  | 'analytics'
  | 'ecommerce'
  | 'crm'
  | 'workflow'
  | 'notification'

export interface ModuleMetadata {
  id: string
  name: string
  version: string
  type: ModuleType
  description: string
  author: string
  dependencies: string[]
  isPremium: boolean
  price: number
  icon: string
  tags: string[]
}

export interface ModuleComponent {
  id: string
  component: ComponentType<any>
  props?: Record<string, any>
}

export interface ModuleRoute {
  path: string
  component: ComponentType<any>
  exact?: boolean
}

export interface ModuleHook {
  event: string
  handler: (data: any) => void | Promise<void>
}

export interface Module {
  metadata: ModuleMetadata
  components: Record<string, ModuleComponent>
  routes: ModuleRoute[]
  hooks: ModuleHook[]
  initialize: () => Promise<boolean>
  shutdown: () => Promise<boolean>
}

// Module Registry
class ModuleRegistry {
  private modules: Map<string, Module> = new Map()
  private enabledModules: Set<string> = new Set()
  private hooks: Map<string, Array<(data: any) => void>> = new Map()

  register(module: Module): void {
    this.modules.set(module.metadata.id, module)
  }

  async enable(moduleId: string, config?: Record<string, any>): Promise<boolean> {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module ${moduleId} not found`)
    }

    // Check dependencies
    for (const depId of module.metadata.dependencies) {
      if (!this.enabledModules.has(depId)) {
        throw new Error(`Dependency ${depId} not enabled`)
      }
    }

    const success = await module.initialize()
    if (success) {
      this.enabledModules.add(moduleId)

      // Register hooks
      for (const hook of module.hooks) {
        this.registerHook(hook.event, hook.handler)
      }

      this.triggerHook('module.enabled', { moduleId, module })
    }
    return success
  }

  async disable(moduleId: string): Promise<boolean> {
    const module = this.modules.get(moduleId)
    if (!module) return true

    // Check if other modules depend on this
    for (const [id, m] of Array.from(this.modules)) {
      if (this.enabledModules.has(id) && m.metadata.dependencies.includes(moduleId)) {
        throw new Error(`Module ${id} depends on ${moduleId}`)
      }
    }

    const success = await module.shutdown()
    if (success) {
      this.enabledModules.delete(moduleId)
      this.triggerHook('module.disabled', { moduleId })
    }
    return success
  }

  getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId)
  }

  getEnabledModules(): Module[] {
    return Array.from(this.enabledModules)
      .map(id => this.modules.get(id)!)
      .filter(Boolean)
  }

  getAllModules(): Module[] {
    return Array.from(this.modules.values())
  }

  getModulesByType(type: ModuleType): Module[] {
    return this.getEnabledModules().filter(m => m.metadata.type === type)
  }

  isEnabled(moduleId: string): boolean {
    return this.enabledModules.has(moduleId)
  }

  // Hook system
  registerHook(event: string, handler: (data: any) => void): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, [])
    }
    this.hooks.get(event)!.push(handler)
  }

  triggerHook(event: string, data?: any): void {
    const handlers = this.hooks.get(event) || []
    handlers.forEach(handler => handler(data))
  }

  // Get all components from enabled modules
  getAllComponents(): Record<string, ModuleComponent> {
    const components: Record<string, ModuleComponent> = {}
    for (const module of this.getEnabledModules()) {
      Object.assign(components, module.components)
    }
    return components
  }

  // Get all routes from enabled modules
  getAllRoutes(): ModuleRoute[] {
    return this.getEnabledModules().flatMap(m => m.routes)
  }
}

// Global registry instance
export const moduleRegistry = new ModuleRegistry()

// Helper to create a module
export function createModule(config: {
  metadata: ModuleMetadata
  components?: Record<string, ComponentType<any>>
  routes?: ModuleRoute[]
  hooks?: ModuleHook[]
  initialize?: () => Promise<boolean>
  shutdown?: () => Promise<boolean>
}): Module {
  return {
    metadata: config.metadata,
    components: Object.entries(config.components || {}).reduce((acc, [id, component]) => {
      acc[id] = { id, component }
      return acc
    }, {} as Record<string, ModuleComponent>),
    routes: config.routes || [],
    hooks: config.hooks || [],
    initialize: config.initialize || (async () => true),
    shutdown: config.shutdown || (async () => true)
  }
}

// Dynamic module loader
export async function loadModule(moduleId: string): Promise<Module | null> {
  try {
    // Try to load from remote or local
    const module = await import(`@/modules/${moduleId}`)
    return module.default
  } catch (error) {
    console.error(`Failed to load module ${moduleId}:`, error)
    return null
  }
}
