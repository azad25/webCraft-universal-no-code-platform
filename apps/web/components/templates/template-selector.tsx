'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { 
  Layout, Rocket, Briefcase, ShoppingCart, Building, 
  FileText, Utensils, Calendar, Cloud, Palette, Home,
  Check, ArrowRight, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Quick start templates
const QUICK_START_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with a blank page',
    icon: Layout,
    color: 'bg-gray-500',
    pages: 0
  },
  {
    id: 'landing-startup',
    name: 'Startup Landing',
    description: 'Modern landing page with hero, features, pricing',
    icon: Rocket,
    color: 'bg-blue-500',
    pages: 1,
    popular: true
  },
  {
    id: 'portfolio-creative',
    name: 'Creative Portfolio',
    description: 'Showcase your work beautifully',
    icon: Briefcase,
    color: 'bg-purple-500',
    pages: 1
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Complete online store setup',
    icon: ShoppingCart,
    color: 'bg-green-500',
    pages: 2,
    premium: true
  },
  {
    id: 'business-corporate',
    name: 'Business Website',
    description: 'Professional company website',
    icon: Building,
    color: 'bg-indigo-500',
    pages: 3
  },
  {
    id: 'erp-dashboard',
    name: 'ERP System',
    description: 'Enterprise resource planning dashboard',
    icon: Building,
    color: 'bg-slate-600',
    pages: 4,
    premium: true,
    popular: true
  },
  {
    id: 'lms-platform',
    name: 'LMS Platform',
    description: 'Learning management system',
    icon: FileText,
    color: 'bg-emerald-500',
    pages: 3,
    premium: true
  },
  {
    id: 'restaurant-pos',
    name: 'Restaurant',
    description: 'Menu, reservations, and POS',
    icon: Utensils,
    color: 'bg-red-500',
    pages: 4
  },
  {
    id: 'retail-shop',
    name: 'Retail Shop',
    description: 'Shop management with POS',
    icon: ShoppingCart,
    color: 'bg-amber-500',
    pages: 3
  },
  {
    id: 'crm-system',
    name: 'CRM System',
    description: 'Customer relationship management',
    icon: Briefcase,
    color: 'bg-cyan-500',
    pages: 3,
    popular: true
  },
  {
    id: 'project-management',
    name: 'Project Manager',
    description: 'Tasks, teams, and timelines',
    icon: Layout,
    color: 'bg-violet-500',
    pages: 4
  },
  {
    id: 'hr-management',
    name: 'HR System',
    description: 'Employee and payroll management',
    icon: Briefcase,
    color: 'bg-pink-500',
    pages: 4
  },
  {
    id: 'booking-system',
    name: 'Booking System',
    description: 'Appointments and reservations',
    icon: Calendar,
    color: 'bg-teal-500',
    pages: 3
  },
  {
    id: 'clinic-management',
    name: 'Clinic/Healthcare',
    description: 'Patient and appointment management',
    icon: Building,
    color: 'bg-rose-500',
    pages: 3,
    premium: true
  },
  {
    id: 'school-management',
    name: 'School System',
    description: 'Students, teachers, and classes',
    icon: FileText,
    color: 'bg-orange-500',
    pages: 4,
    premium: true
  },
  {
    id: 'hotel-management',
    name: 'Hotel & Resort',
    description: 'Rooms, bookings, and guests',
    icon: Home,
    color: 'bg-sky-500',
    pages: 3,
    premium: true
  }
]

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void
  selectedId?: string
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose a Starting Point</h2>
        <p className="text-muted-foreground">
          Select a template to get started quickly, or start from scratch
        </p>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
          {QUICK_START_TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = selectedId === template.id
            const isHovered = hoveredId === template.id

            return (
              <m.button
                key={template.id}
                onClick={() => onSelect(template.id)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'relative p-4 rounded-xl border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-card hover:border-primary/50'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {template.popular && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                      Popular
                    </Badge>
                  )}
                  {template.premium && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3 mt-4',
                  template.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {/* Pages count */}
                {template.pages > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {template.pages} page{template.pages > 1 ? 's' : ''} included
                  </p>
                )}
              </m.button>
            )
          })}
        </div>
      </ScrollArea>

      {/* AI Generation Option */}
      <div className="border-t pt-4">
        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => onSelect('ai-generate')}
        >
          <Sparkles className="w-4 h-4" />
          Generate with AI
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Describe your project and let AI create a custom template
        </p>
      </div>
    </div>
  )
}

// Compact version for sidebar/modal
export function TemplateQuickPicker({ onSelect }: { onSelect: (templateId: string) => void }) {
  return (
    <div className="space-y-2">
      {QUICK_START_TEMPLATES.slice(0, 6).map((template) => {
        const Icon = template.icon
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className={cn(
              'w-8 h-8 rounded flex items-center justify-center text-white',
              template.color
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{template.name}</p>
              <p className="text-xs text-muted-foreground truncate">{template.description}</p>
            </div>
            {template.popular && (
              <Badge variant="secondary" className="text-xs">Popular</Badge>
            )}
          </button>
        )
      })}
      <Button variant="ghost" className="w-full text-sm" onClick={() => onSelect('browse')}>
        Browse all templates
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}
