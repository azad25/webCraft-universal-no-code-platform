'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Search, Star, Clock, Users, Zap, Bot, Target, Shield, 
  TrendingUp, CheckCircle, Play, Copy, Eye, Filter,
  Mail, ShoppingCart, Database, Globe, MessageSquare,
  Calendar, BarChart3, Settings, Sparkles
} from 'lucide-react'

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  trigger_type: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: string
  features: string[]
  workflow_steps: any[]
  usage_count: number
  success_rate: number
}

const categoryIcons: Record<string, any> = {
  marketing: Mail,
  ecommerce: ShoppingCart,
  sales: Target,
  productivity: Database,
  support: Shield,
  integration: Globe,
  reporting: BarChart3,
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

interface AutomationTemplatesProps {
  onSelectTemplate: (template: AutomationTemplate) => void
  onClose: () => void
}

export function AutomationTemplates({ onSelectTemplate, onClose }: AutomationTemplatesProps) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<AutomationTemplate[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const categories = [
    { id: 'all', name: 'All Templates', icon: Sparkles },
    { id: 'marketing', name: 'Marketing', icon: Mail },
    { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
    { id: 'sales', name: 'Sales', icon: Target },
    { id: 'productivity', name: 'Productivity', icon: Database },
    { id: 'support', name: 'Support', icon: Shield },
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, selectedCategory, selectedDifficulty, search])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/automation-templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty)
    }

    if (search) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.features.some(f => f.toLowerCase().includes(search.toLowerCase()))
      )
    }

    setFilteredTemplates(filtered)
  }

  const handlePreview = (template: AutomationTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleUseTemplate = (template: AutomationTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Automation Templates
          </h2>
          <p className="text-muted-foreground">Choose from pre-built workflows to get started quickly</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
              className="capitalize"
            >
              {difficulty}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => {
            const CategoryIcon = categoryIcons[template.category] || Bot
            
            return (
              <m.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {template.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", difficultyColors[template.difficulty])}
                            >
                              {template.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                        {template.success_rate}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {template.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {template.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.features.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.estimated_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {template.usage_count} uses
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Use Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  {React.createElement(categoryIcons[selectedTemplate.category] || Bot, { 
                    className: "w-5 h-5 text-primary" 
                  })}
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground capitalize">{selectedTemplate.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Difficulty</p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", difficultyColors[selectedTemplate.difficulty])}
                  >
                    {selectedTemplate.difficulty}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Estimated Time</p>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.estimated_time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Success Rate</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">{selectedTemplate.success_rate}%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-medium mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Workflow Preview */}
              <div>
                <p className="text-sm font-medium mb-2">Workflow Steps</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTemplate.workflow_steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {step.action_type?.replace('_', ' ') || step.type}
                        </p>
                        {step.config && Object.keys(step.config).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Object.entries(step.config).slice(0, 2).map(([key, value]) => 
                              `${key}: ${String(value).slice(0, 30)}${String(value).length > 30 ? '...' : ''}`
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}>
              <Zap className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}