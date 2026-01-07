'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Globe, ShoppingCart, Users, FileText, Calendar, Briefcase, Sparkles, Loader2, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useCreateAppMutation } from '@/store/api/apiSlice'
import { TemplateSelector } from '@/components/templates/template-selector'

const appTypes = [
  { id: 'website', name: 'Website', description: 'Landing pages, portfolios, blogs', icon: Globe, color: 'bg-blue-500' },
  { id: 'ecommerce', name: 'E-commerce', description: 'Online stores, product catalogs', icon: ShoppingCart, color: 'bg-green-500' },
  { id: 'crm', name: 'CRM', description: 'Customer management, sales pipeline', icon: Users, color: 'bg-purple-500' },
  { id: 'blog', name: 'Blog', description: 'Content publishing, articles', icon: FileText, color: 'bg-orange-500' },
  { id: 'booking', name: 'Booking', description: 'Appointments, reservations', icon: Calendar, color: 'bg-pink-500' },
  { id: 'business', name: 'Business App', description: 'Custom business tools', icon: Briefcase, color: 'bg-indigo-500' }
]

export default function NewAppPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [appName, setAppName] = useState('')
  const [appDescription, setAppDescription] = useState('')
  const [useAI, setUseAI] = useState(false)
  
  const [createApp, { isLoading }] = useCreateAppMutation()

  const handleCreate = async () => {
    try {
      const result = await createApp({
        name: appName,
        description: appDescription,
        app_type: selectedType,
        template_id: selectedTemplate !== 'blank' ? selectedTemplate : undefined,
        config: {},
        theme_config: {}
      }).unwrap()
      
      router.push(`/editor/${result.id}`)
    } catch (error) {
      console.error('Failed to create app:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'browse') {
      router.push('/templates')
      return
    }
    if (templateId === 'ai-generate') {
      setUseAI(true)
      setSelectedTemplate('blank')
      return
    }
    setSelectedTemplate(templateId)
    setUseAI(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-24 h-1 mx-2",
                  step > s ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">What do you want to build?</h1>
              <p className="text-muted-foreground">Choose the type of app that best fits your needs</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {appTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all",
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-white dark:bg-slate-800 hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4", type.color)}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!selectedType}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: App Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Name your app</h1>
              <p className="text-muted-foreground">Give your app a name and description</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome App"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is your app about?"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!appName}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Choose Template or AI */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">How do you want to start?</h1>
              <p className="text-muted-foreground">Choose a starting point for your app</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUseAI(false)}
                className={cn(
                  "p-8 rounded-xl border-2 text-left",
                  !useAI ? "border-primary bg-primary/5" : "border-transparent bg-white dark:bg-slate-800"
                )}
              >
                <Globe className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Start from Scratch</h3>
                <p className="text-muted-foreground">Begin with a blank canvas and build your app step by step</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUseAI(true)}
                className={cn(
                  "p-8 rounded-xl border-2 text-left",
                  useAI ? "border-primary bg-primary/5" : "border-transparent bg-white dark:bg-slate-800"
                )}
              >
                <Sparkles className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Generate with AI</h3>
                <p className="text-muted-foreground">Let AI create a starting point based on your description</p>
              </motion.button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
