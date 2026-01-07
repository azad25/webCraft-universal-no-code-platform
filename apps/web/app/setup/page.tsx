'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft,
  Server, Database, Mail, User, Settings, Sparkles, Shield, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'

interface SystemRequirements {
  docker_installed: boolean
  docker_running: boolean
  docker_compose_installed: boolean
  node_installed: boolean
  node_version: string | null
  python_installed: boolean
  python_version: string | null
  available_memory_gb: number
  available_disk_gb: number
  required_ports_available: Record<string, boolean>
  os_name: string
  os_version: string
  cpu_cores: number
  meets_requirements: boolean
  issues: string[]
  warnings: string[]
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'requirements', title: 'System Check', icon: Server },
  { id: 'database', title: 'Database', icon: Database },
  { id: 'admin', title: 'Admin Account', icon: User },
  { id: 'email', title: 'Email (Optional)', icon: Mail },
  { id: 'features', title: 'Features', icon: Settings },
  { id: 'install', title: 'Installing', icon: Rocket },
]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [requirements, setRequirements] = useState<SystemRequirements | null>(null)
  const [setupProgress, setSetupProgress] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    // Admin
    adminEmail: '',
    adminUsername: '',
    adminPassword: '',
    adminFullName: '',
    companyName: '',
    // Database
    dbHost: 'postgres',
    dbPort: 5432,
    dbName: 'webcraft_db',
    dbUser: 'webcraft',
    dbPassword: 'password',
    useDocker: true,
    // Email
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    // Features
    enableAnalytics: true,
    enableAI: true,
    openaiKey: '',
    stripeKey: '',
    sendWelcomeEmail: true,
  })

  // Check if setup is needed
  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/v1/setup/status')
      const data = await res.json()
      if (!data.setup_required) {
        router.push('/dashboard')
      }
    } catch (e) {
      // Setup API not available yet, continue with setup
    }
  }

  const checkRequirements = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/setup/requirements')
      const data = await res.json()
      setRequirements(data)
    } catch (e) {
      setError('Failed to check system requirements. Make sure the API is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const startInstallation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const config = {
        admin_user: {
          email: formData.adminEmail,
          username: formData.adminUsername,
          password: formData.adminPassword,
          full_name: formData.adminFullName,
          company_name: formData.companyName,
          send_welcome_email: formData.sendWelcomeEmail,
        },
        database: {
          host: formData.dbHost,
          port: formData.dbPort,
          database: formData.dbName,
          username: formData.dbUser,
          password: formData.dbPassword,
          use_docker: formData.useDocker,
        },
        smtp_host: formData.smtpHost || null,
        smtp_port: formData.smtpPort,
        smtp_user: formData.smtpUser || null,
        smtp_password: formData.smtpPassword || null,
        from_email: formData.fromEmail || null,
        openai_api_key: formData.openaiKey || null,
        stripe_secret_key: formData.stripeKey || null,
        enable_analytics: formData.enableAnalytics,
        enable_ai_features: formData.enableAI,
      }

      await fetch('/api/v1/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      // Poll for progress
      pollProgress()
    } catch (e) {
      setError('Failed to start installation')
      setIsLoading(false)
    }
  }

  const pollProgress = async () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/setup/progress')
        const data = await res.json()
        setSetupProgress(data)
        
        if (data.completed) {
          clearInterval(interval)
          setIsLoading(false)
          setTimeout(() => router.push('/dashboard'), 2000)
        }
        
        if (data.error) {
          clearInterval(interval)
          setError(data.error)
          setIsLoading(false)
        }
      } catch (e) {
        // Continue polling
      }
    }, 2000)
  }

  const nextStep = () => {
    if (currentStep === 1 && !requirements?.meets_requirements) {
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    if (currentStep === 1) checkRequirements()
    if (currentStep === steps.length - 2) startInstallation()
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to WebCraft</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Let's get your no-code platform set up. This wizard will guide you through 
              the installation process in just a few minutes.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { icon: Shield, label: 'Secure Setup' },
                { icon: Rocket, label: 'Quick Install' },
                { icon: Settings, label: 'Easy Config' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'requirements':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">System Requirements</h2>
              <p className="text-muted-foreground">Checking your system compatibility</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3">Checking system...</span>
              </div>
            ) : requirements ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <RequirementItem 
                    label="Operating System" 
                    value={`${requirements.os_name} ${requirements.os_version}`}
                    status="info"
                  />
                  <RequirementItem 
                    label="CPU Cores" 
                    value={`${requirements.cpu_cores} cores`}
                    status="info"
                  />
                  <RequirementItem 
                    label="Available Memory" 
                    value={`${requirements.available_memory_gb} GB`}
                    status={requirements.available_memory_gb >= 4 ? 'success' : 'warning'}
                  />
                  <RequirementItem 
                    label="Available Disk" 
                    value={`${requirements.available_disk_gb} GB`}
                    status={requirements.available_disk_gb >= 10 ? 'success' : 'warning'}
                  />
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <RequirementItem 
                    label="Docker" 
                    value={requirements.docker_installed ? 'Installed' : 'Not Found'}
                    status={requirements.docker_installed ? 'success' : 'error'}
                  />
                  <RequirementItem 
                    label="Docker Running" 
                    value={requirements.docker_running ? 'Running' : 'Not Running'}
                    status={requirements.docker_running ? 'success' : 'error'}
                  />
                  <RequirementItem 
                    label="Docker Compose" 
                    value={requirements.docker_compose_installed ? 'Installed' : 'Not Found'}
                    status={requirements.docker_compose_installed ? 'success' : 'error'}
                  />
                </div>

                {requirements.issues.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Issues Found:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                      {requirements.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  </div>
                )}

                {requirements.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                      {requirements.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={checkRequirements} className="w-full">
                Check System Requirements
              </Button>
            )}
          </div>
        )

      case 'database':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Database Configuration</h2>
              <p className="text-muted-foreground">Configure your PostgreSQL database</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>Use Docker for Database</Label>
                <p className="text-sm text-muted-foreground">Recommended for quick setup</p>
              </div>
              <Switch 
                checked={formData.useDocker}
                onCheckedChange={(v) => updateForm('useDocker', v)}
              />
            </div>

            {!formData.useDocker && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input value={formData.dbHost} onChange={(e) => updateForm('dbHost', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={formData.dbPort} onChange={(e) => updateForm('dbPort', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input value={formData.dbName} onChange={(e) => updateForm('dbName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={formData.dbUser} onChange={(e) => updateForm('dbUser', e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={formData.dbPassword} onChange={(e) => updateForm('dbPassword', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Create Admin Account</h2>
              <p className="text-muted-foreground">Set up your administrator account</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    value={formData.adminFullName} 
                    onChange={(e) => updateForm('adminFullName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={formData.companyName} 
                    onChange={(e) => updateForm('companyName', e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={formData.adminEmail} 
                  onChange={(e) => updateForm('adminEmail', e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input 
                  value={formData.adminUsername} 
                  onChange={(e) => updateForm('adminUsername', e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input 
                  type="password"
                  value={formData.adminPassword} 
                  onChange={(e) => updateForm('adminPassword', e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
          </div>
        )

      case 'email':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Email Configuration</h2>
              <p className="text-muted-foreground">Optional: Configure SMTP for sending emails</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input 
                    value={formData.smtpHost} 
                    onChange={(e) => updateForm('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input 
                    type="number"
                    value={formData.smtpPort} 
                    onChange={(e) => updateForm('smtpPort', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input 
                  value={formData.smtpUser} 
                  onChange={(e) => updateForm('smtpUser', e.target.value)}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input 
                  type="password"
                  value={formData.smtpPassword} 
                  onChange={(e) => updateForm('smtpPassword', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input 
                  type="email"
                  value={formData.fromEmail} 
                  onChange={(e) => updateForm('fromEmail', e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Send Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">Send setup details to admin email</p>
                </div>
                <Switch 
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(v) => updateForm('sendWelcomeEmail', v)}
                />
              </div>
            </div>
          </div>
        )

      case 'features':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Feature Configuration</h2>
              <p className="text-muted-foreground">Enable optional features and integrations</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Enable Analytics</Label>
                  <p className="text-sm text-muted-foreground">Track visitor statistics</p>
                </div>
                <Switch 
                  checked={formData.enableAnalytics}
                  onCheckedChange={(v) => updateForm('enableAnalytics', v)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">AI content generation & suggestions</p>
                </div>
                <Switch 
                  checked={formData.enableAI}
                  onCheckedChange={(v) => updateForm('enableAI', v)}
                />
              </div>

              {formData.enableAI && (
                <div className="space-y-2 pl-4 border-l-2 border-primary">
                  <Label>OpenAI API Key</Label>
                  <Input 
                    type="password"
                    value={formData.openaiKey} 
                    onChange={(e) => updateForm('openaiKey', e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-muted-foreground">Required for AI features</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Stripe Secret Key (Optional)</Label>
                <Input 
                  type="password"
                  value={formData.stripeKey} 
                  onChange={(e) => updateForm('stripeKey', e.target.value)}
                  placeholder="sk_..."
                />
                <p className="text-xs text-muted-foreground">For payment processing</p>
              </div>
            </div>
          </div>
        )

      case 'install':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">
                {setupProgress?.completed ? 'Setup Complete!' : 'Installing WebCraft'}
              </h2>
              <p className="text-muted-foreground">
                {setupProgress?.completed 
                  ? 'Your platform is ready to use' 
                  : 'Please wait while we set up your platform'}
              </p>
            </div>
            
            {setupProgress?.completed ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {setupProgress?.steps?.map((step: any) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {step.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {step.status === 'in_progress' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                    {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2" />}
                    <span className={step.status === 'pending' ? 'text-muted-foreground' : ''}>
                      {step.name}
                    </span>
                  </div>
                ))}
                
                {setupProgress && (
                  <Progress 
                    value={(setupProgress.current_step / setupProgress.total_steps) * 100} 
                    className="mt-4"
                  />
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'requirements':
        return requirements?.meets_requirements
      case 'admin':
        return formData.adminEmail && formData.adminUsername && 
               formData.adminPassword.length >= 8 && formData.adminFullName
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${i <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'}
              `}>
                <step.icon className="w-5 h-5" />
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-1 mx-1 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  {currentStep === steps.length - 2 ? 'Start Installation' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for requirement items
function RequirementItem({ 
  label, 
  value, 
  status 
}: { 
  label: string
  value: string
  status: 'success' | 'error' | 'warning' | 'info'
}) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <div className="w-5 h-5" />,
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{value}</span>
        {icons[status]}
      </div>
    </div>
  )
}
