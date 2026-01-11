'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { m } from \'framer-motion\'
import { ArrowLeft, ArrowRight, Globe, ShoppingCart, Users, FileText, Calendar, Briefcase, Sparkles, Loader2, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCreateAppMutation } from '@/store/api/apiSlice'
import { apiClient } from '@/lib/api-client'

const iconMap = {
  Globe,
  ShoppingCart,
  Users,
  FileText,
  Calendar,
  Briefcase
}

interface AppType {
  id: string
  name: string
  description: string
  icon: string
  color: string
  templates: Template[]
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  tags: string[]
  downloads: number
  rating: number
  isPremium: boolean
}

export default function NewAppForm() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [appTypes, setAppTypes] = useState<AppType[]>([])
    const [selectedType, setSelectedType] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [appName, setAppName] = useState('')
    const [appDescription, setAppDescription] = useState('')
    const [useAI, setUseAI] = useState(false)
    const [loading, setLoading] = useState(true)

    const [createApp, { isLoading }] = useCreateAppMutation()

    // Load app types from backend
    useEffect(() => {
        const loadAppTypes = async () => {
            try {
                const response = await apiClient.get('/api/v1/templates/app-types')
                setAppTypes(response.data.app_types || [])
            } catch (error) {
                console.error('Failed to load app types:', error)
                // Fallback to hardcoded types if API fails
                setAppTypes([
                    { id: 'website', name: 'Website', description: 'Landing pages, portfolios, blogs', icon: 'Globe', color: 'bg-blue-500', templates: [] },
                    { id: 'ecommerce', name: 'E-commerce', description: 'Online stores, product catalogs', icon: 'ShoppingCart', color: 'bg-green-500', templates: [] },
                    { id: 'crm', name: 'CRM', description: 'Customer management, sales pipeline', icon: 'Users', color: 'bg-purple-500', templates: [] },
                    { id: 'blog', name: 'Blog', description: 'Content publishing, articles', icon: 'FileText', color: 'bg-orange-500', templates: [] },
                    { id: 'booking', name: 'Booking', description: 'Appointments, reservations', icon: 'Calendar', color: 'bg-pink-500', templates: [] },
                    { id: 'business', name: 'Business App', description: 'Custom business tools', icon: 'Briefcase', color: 'bg-indigo-500', templates: [] }
                ])
            } finally {
                setLoading(false)
            }
        }

        loadAppTypes()
    }, [])

    const selectedAppType = appTypes.find(type => type.id === selectedType)
    const availableTemplates = selectedAppType?.templates || []

    const handleCreate = async () => {
        try {
            console.log('🚀 Creating app with data:', {
                name: appName,
                description: appDescription,
                app_type: selectedType,
                template_id: selectedTemplate !== 'blank' ? selectedTemplate : undefined,
                config: {},
                theme_config: {}
            })

            // Prepare the request data, excluding template_id if it's not needed
            const requestData: any = {
                name: appName,
                description: appDescription,
                app_type: selectedType,
                config: {},
                theme_config: {}
            }

            // Only include template_id if we have a valid template selected
            if (selectedTemplate && selectedTemplate !== 'blank') {
                requestData.template_id = selectedTemplate
            }

            console.log('📤 Final request data:', requestData)

            const result = await createApp(requestData).unwrap()

            console.log('✅ App created successfully:', result)
            router.push(`/apps/${result.id}`)
        } catch (error: any) {
            console.error('❌ Failed to create app:', error)
            
            // Show user-friendly error message
            let errorMessage = 'Failed to create app. Please try again.'
            
            if (error?.status === 422) {
                if (error?.data?.detail) {
                    if (Array.isArray(error.data.detail)) {
                        errorMessage = error.data.detail.map((err: any) => 
                            `${err.loc?.join('.')}: ${err.msg}`
                        ).join(', ')
                    } else {
                        errorMessage = error.data.detail
                    }
                } else if (error?.data?.message) {
                    errorMessage = error.data.message
                } else {
                    errorMessage = 'Validation error: Please check your input.'
                }
            } else if (error?.data?.detail) {
                errorMessage = error.data.detail
            } else if (error?.message) {
                errorMessage = error.message
            } else if (error?.status === 401) {
                errorMessage = 'Authentication required. Please log in.'
            } else if (error?.status === 403) {
                errorMessage = 'Permission denied. Please check your account.'
            } else if (error?.status >= 500) {
                errorMessage = 'Server error. Please try again later.'
            }
            
            alert(`Error: ${errorMessage}`)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading app types...</p>
                </div>
            </div>
        )
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
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {s}
                            </div>
                            {s < 4 && (
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
                    <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">What do you want to build?</h1>
                            <p className="text-muted-foreground">Choose the type of app that best fits your needs</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {appTypes.map((type) => {
                                const IconComponent = iconMap[type.icon as keyof typeof iconMap] || Globe
                                return (
                                    <m.button
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
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold mb-1">{type.name}</h3>
                                        <p className="text-sm text-muted-foreground">{type.description}</p>
                                        {type.templates.length > 0 && (
                                            <Badge variant="secondary" className="mt-2">
                                                {type.templates.length} template{type.templates.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </m.button>
                                )
                            })}
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setStep(2)} disabled={!selectedType}>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </m.div>
                )}

                {/* Step 2: Choose Template */}
                {step === 2 && (
                    <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">Choose a template</h1>
                            <p className="text-muted-foreground">Start with a pre-designed template or build from scratch</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {/* Blank Template */}
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTemplate('blank')}
                                className={cn(
                                    "p-6 rounded-xl border-2 text-left transition-all",
                                    selectedTemplate === 'blank'
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent bg-white dark:bg-slate-800 hover:border-primary/50"
                                )}
                            >
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-4 flex items-center justify-center">
                                    <Layout className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="font-semibold mb-1">Start from Scratch</h3>
                                <p className="text-sm text-muted-foreground">Begin with a blank canvas</p>
                            </m.button>

                            {/* Available Templates */}
                            {availableTemplates.map((template) => (
                                <m.button
                                    key={template.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTemplate(template.id)}
                                    className={cn(
                                        "p-6 rounded-xl border-2 text-left transition-all",
                                        selectedTemplate === template.id
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent bg-white dark:bg-slate-800 hover:border-primary/50"
                                    )}
                                >
                                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg mb-4 flex items-center justify-center">
                                        <Globe className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold">{template.name}</h3>
                                        {template.isPremium && (
                                            <Badge variant="secondary" className="text-xs">
                                                Pro
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>⭐ {template.rating}</span>
                                        <span>•</span>
                                        <span>{template.downloads} downloads</span>
                                    </div>
                                </m.button>
                            ))}
                        </div>

                        {availableTemplates.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No templates available for this app type yet.</p>
                                <p className="text-sm">You can start from scratch and build your own!</p>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={() => setStep(3)} disabled={!selectedTemplate}>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </m.div>
                )}

                {/* Step 3: App Details */}
                {step === 3 && (
                    <m.div
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
                            <Button variant="outline" onClick={() => setStep(2)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={() => setStep(4)} disabled={!appName}>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </m.div>
                )}

                {/* Step 4: Choose Starting Method */}
                {step === 4 && (
                    <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">How do you want to start?</h1>
                            <p className="text-muted-foreground">Choose your preferred way to build</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setUseAI(false)}
                                className={cn(
                                    "p-8 rounded-xl border-2 text-left",
                                    !useAI ? "border-primary bg-primary/5" : "border-transparent bg-white dark:bg-slate-800"
                                )}
                            >
                                <Layout className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Visual Editor</h3>
                                <p className="text-muted-foreground">Use our drag-and-drop editor to build your app visually</p>
                            </m.button>

                            <m.button
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
                                <p className="text-muted-foreground">Let AI create content based on your description</p>
                            </m.button>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(3)}>
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
                    </m.div>
                )}
            </main>
        </div>
    )
}