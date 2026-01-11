'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { m } from \'framer-motion\'
import { ArrowLeft, Save, Play, Zap, Clock, FileText, ShoppingCart, Users, Webhook, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { WorkflowBuilder } from '@/components/automation/workflow-builder'

const triggers = [
  { id: 'form_submit', name: 'Form Submitted', description: 'When a form is submitted', icon: FileText },
  { id: 'order_created', name: 'Order Created', description: 'When a new order is placed', icon: ShoppingCart },
  { id: 'user_signup', name: 'User Signed Up', description: 'When a new user registers', icon: Users },
  { id: 'schedule', name: 'Scheduled', description: 'Run on a schedule', icon: Clock },
  { id: 'webhook', name: 'Webhook', description: 'Triggered by external webhook', icon: Webhook },
  { id: 'button_click', name: 'Button Click', description: 'When a button is clicked', icon: MousePointer }
]

export default function NewAutomationPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState('')
  const [steps, setSteps] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('trigger')

  const handleSave = async () => {
    // Save automation
    router.push(`/apps/${appId}/automations`)
  }

  const handleTest = async () => {
    // Test automation
    alert('Test run completed!')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">New Automation</h1>
                <p className="text-sm text-muted-foreground">Create a new workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTest} disabled={!selectedTrigger}>
                <Play className="w-4 h-4 mr-2" />
                Test
              </Button>
              <Button onClick={handleSave} disabled={!name || !selectedTrigger}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Automation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this automation do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Trigger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {triggers.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => setSelectedTrigger(trigger.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                        selectedTrigger === trigger.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedTrigger === trigger.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-slate-100 dark:bg-slate-700"
                      )}>
                        <trigger.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{trigger.name}</p>
                        <p className="text-xs text-muted-foreground">{trigger.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Workflow Builder */}
          <div className="lg:col-span-2">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTrigger ? (
                  <div className="flex justify-center py-8">
                    <WorkflowBuilder
                      steps={steps}
                      onStepsChange={setSteps}
                      triggerType={selectedTrigger}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Zap className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Trigger</h3>
                    <p className="text-muted-foreground">Choose a trigger from the left panel to start building your workflow</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
