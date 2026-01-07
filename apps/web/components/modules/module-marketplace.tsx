'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, Check, Loader2, Star, Download, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { 
  fetchModules, 
  enableModule, 
  disableModule,
  selectAvailableModules,
  selectEnabledModules,
  selectModulesLoading
} from '@/store/slices/moduleSlice'

const MODULE_CATEGORIES = [
  { id: 'all', name: 'All Modules' },
  { id: 'widget', name: 'Widgets' },
  { id: 'integration', name: 'Integrations' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'crm', name: 'CRM' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'ai_provider', name: 'AI' },
  { id: 'workflow', name: 'Automation' }
]

interface ModuleCardProps {
  module: any
  isEnabled: boolean
  isInstalling: boolean
  onEnable: () => void
  onDisable: () => void
}

function ModuleCard({ module, isEnabled, isInstalling, onEnable, onDisable }: ModuleCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "p-4 rounded-xl border bg-card transition-all",
        isEnabled && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isEnabled ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-xs text-muted-foreground">v{module.version}</p>
          </div>
        </div>
        
        {module.is_premium && (
          <Badge variant="secondary" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {module.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {module.type}
          </Badge>
          {module.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Button
          size="sm"
          variant={isEnabled ? "outline" : "default"}
          disabled={isInstalling}
          onClick={isEnabled ? onDisable : onEnable}
        >
          {isInstalling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEnabled ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Enabled
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-1" />
              Enable
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

export function ModuleMarketplace() {
  const dispatch = useAppDispatch()
  const modules = useAppSelector(selectAvailableModules)
  const enabledModules = useAppSelector(selectEnabledModules)
  const loading = useAppSelector(selectModulesLoading)
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [installing, setInstalling] = useState<string[]>([])

  useEffect(() => {
    dispatch(fetchModules())
  }, [dispatch])

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                         m.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || m.type === category
    return matchesSearch && matchesCategory
  })

  const handleEnable = async (moduleId: string) => {
    setInstalling(prev => [...prev, moduleId])
    await dispatch(enableModule({ moduleId }))
    setInstalling(prev => prev.filter(id => id !== moduleId))
  }

  const handleDisable = async (moduleId: string) => {
    await dispatch(disableModule(moduleId))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold mb-2">Module Marketplace</h2>
        <p className="text-muted-foreground mb-4">
          Extend your platform with powerful modules
        </p>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-3 border-b overflow-x-auto">
        <div className="flex gap-2">
          {MODULE_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isEnabled={enabledModules.includes(module.id)}
                  isInstalling={installing.includes(module.id)}
                  onEnable={() => handleEnable(module.id)}
                  onDisable={() => handleDisable(module.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {!loading && filteredModules.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No modules found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
