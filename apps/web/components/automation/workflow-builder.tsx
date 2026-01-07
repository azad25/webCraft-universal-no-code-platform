'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Play, Settings, ChevronRight, Zap, Mail, MessageSquare, Database, Clock, GitBranch, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  actionType?: string
  config: Record<string, any>
  nextSteps: string[]
}

interface WorkflowBuilderProps {
  steps: WorkflowStep[]
  onStepsChange: (steps: WorkflowStep[]) => void
  triggerType: string
}

const actionTypes = [
  { id: 'send_email', name: 'Send Email', icon: Mail, color: 'bg-blue-500' },
  { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, color: 'bg-green-500' },
  { id: 'create_record', name: 'Create Record', icon: Database, color: 'bg-purple-500' },
  { id: 'update_record', name: 'Update Record', icon: Database, color: 'bg-indigo-500' },
  { id: 'http_request', name: 'HTTP Request', icon: Zap, color: 'bg-orange-500' },
  { id: 'delay', name: 'Delay', icon: Clock, color: 'bg-yellow-500' },
  { id: 'condition', name: 'Condition', icon: GitBranch, color: 'bg-pink-500' },
  { id: 'loop', name: 'Loop', icon: Repeat, color: 'bg-cyan-500' }
]

export function WorkflowBuilder({ steps, onStepsChange, triggerType }: WorkflowBuilderProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [showActionPicker, setShowActionPicker] = useState(false)

  const addStep = useCallback((actionType: string) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: 'action',
      actionType,
      config: {},
      nextSteps: []
    }
    
    const newSteps = [...steps]
    if (newSteps.length > 0) {
      newSteps[newSteps.length - 1].nextSteps = [newStep.id]
    }
    newSteps.push(newStep)
    
    onStepsChange(newSteps)
    setShowActionPicker(false)
  }, [steps, onStepsChange])

  const removeStep = useCallback((stepId: string) => {
    const newSteps = steps.filter(s => s.id !== stepId)
    // Update references
    newSteps.forEach(s => {
      s.nextSteps = s.nextSteps.filter(id => id !== stepId)
    })
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const getActionInfo = (actionType: string) => {
    return actionTypes.find(a => a.id === actionType) || actionTypes[0]
  }

  return (
    <div className="relative">
      {/* Trigger Node */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-64"
        >
          <Card className="border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trigger</p>
                  <p className="font-medium capitalize">{triggerType.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Line */}
        {steps.length > 0 && (
          <div className="w-0.5 h-8 bg-border" />
        )}

        {/* Action Steps */}
        {steps.map((step, index) => {
          const actionInfo = getActionInfo(step.actionType || '')
          const Icon = actionInfo.icon

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-64"
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedStep === step.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedStep(step.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", actionInfo.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Action {index + 1}</p>
                          <p className="font-medium">{actionInfo.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeStep(step.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Connection Line */}
              <div className="w-0.5 h-8 bg-border" />
            </div>
          )
        })}

        {/* Add Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <Button
            variant="outline"
            className="rounded-full w-12 h-12 p-0"
            onClick={() => setShowActionPicker(!showActionPicker)}
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Action Picker */}
          {showActionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border p-4 z-10"
            >
              <p className="text-sm font-medium mb-3">Add Action</p>
              <div className="grid grid-cols-2 gap-2">
                {actionTypes.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => addStep(action.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className={cn("w-8 h-8 rounded flex items-center justify-center text-white", action.color)}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{action.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
