'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Card,
  CardContent,
} from '@/components/ui/card'
import { 
  Search,
  Mail,
  ShoppingCart,
  UserPlus,
  Package,
  Zap,
  ArrowRight
} from 'lucide-react'

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  triggerType: string
  workflowSteps: any[]
}

const CATEGORY_ICONS: Record<string, any> = {
  onboarding: UserPlus,
  ecommerce: ShoppingCart,
  marketing: Mail,
  inventory: Package,
}

interface AutomationTemplatesProps {
  onSelect: (template: AutomationTemplate) => void
}

export function AutomationTemplates({ onSelect }: AutomationTemplatesProps) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/automation-templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      // Use fallback templates
      setTemplates([
        {
          id: 'welcome_email',
          name: 'Welcome Email',
          description: 'Send welcome email when user signs up',
          category: 'onboarding',
          triggerType: 'user_signup',
          workflowSteps: [
            { id: '1', type: 'action', actionType: 'delay', config: { minutes: 5 } },
            { id: '2', type: 'action', actionType: 'send_email', config: { template: 'welcome' } }
          ]
        },
        {
          id: 'order_confirmation',
          name: 'Order Confirmation Flow',
          description: 'Send confirmation and update inventory on new order',
          category: 'ecommerce',
          triggerType: 'order_created',
          workflowSteps: [
            { id: '1', type: 'action', actionType: 'send_email', config: { template: 'order_confirm' } },
            { id: '2', type: 'action', actionType: 'update_record', config: { table: 'inventory' } }
          ]
        },
        {
          id: 'lead_nurture',
          name: 'Lead Nurturing',
          description: 'Follow up with leads over time',
          category: 'marketing',
          triggerType: 'form_submit',
          workflowSteps: [
            { id: '1', type: 'action', actionType: 'create_record', config: { table: 'contacts' } },
            { id: '2', type: 'action', actionType: 'send_email', config: { template: 'welcome' } },
            { id: '3', type: 'action', actionType: 'delay', config: { days: 3 } },
            { id: '4', type: 'action', actionType: 'send_email', config: { template: 'followup' } }
          ]
        },
        {
          id: 'low_inventory',
          name: 'Low Inventory Alert',
          description: 'Alert when inventory falls below threshold',
          category: 'inventory',
          triggerType: 'inventory_low',
          workflowSteps: [
            { id: '1', type: 'action', actionType: 'send_email', config: { to: 'admin' } },
            { id: '2', type: 'action', actionType: 'slack_message', config: { channel: '#inventory' } }
          ]
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [...new Set(templates.map(t => t.category))]

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category] || Zap
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              <Icon className="w-4 h-4 mr-2" />
              {category}
            </Button>
          )
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = CATEGORY_ICONS[template.category] || Zap
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{template.name}</h3>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {template.workflowSteps.length} steps
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onSelect(template)}
                        >
                          Use Template
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold mb-2">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  )
}
