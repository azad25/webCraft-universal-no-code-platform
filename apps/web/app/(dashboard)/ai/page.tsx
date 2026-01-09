'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bot,
  Sparkles,
  MessageSquare,
  Image,
  FileText,
  Code,
  Palette,
  Zap,
  TrendingUp,
  Clock,
  Star,
  Send,
  Mic,
  Upload,
  Download,
  Settings,
  Play
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'

const AI_FEATURES = [
  {
    id: 'content',
    title: 'Content Generation',
    description: 'Generate high-quality text content for your apps',
    icon: FileText,
    color: 'bg-blue-500',
    badge: 'Popular'
  },
  {
    id: 'images',
    title: 'Image Generation',
    description: 'Create stunning images with AI-powered tools',
    icon: Image,
    color: 'bg-purple-500',
    badge: 'New'
  },
  {
    id: 'code',
    title: 'Code Assistant',
    description: 'Get help with coding and development tasks',
    icon: Code,
    color: 'bg-green-500'
  },
  {
    id: 'design',
    title: 'Design Suggestions',
    description: 'Get AI-powered design recommendations',
    icon: Palette,
    color: 'bg-orange-500'
  },
  {
    id: 'chat',
    title: 'AI Chat Assistant',
    description: 'Interactive AI assistant for any questions',
    icon: MessageSquare,
    color: 'bg-cyan-500'
  },
  {
    id: 'automation',
    title: 'Smart Automation',
    description: 'AI-powered workflow automation suggestions',
    icon: Zap,
    color: 'bg-indigo-500'
  }
]

const STATS = [
  { label: 'AI Requests', value: '2.4K', icon: Bot, color: 'bg-blue-500' },
  { label: 'Content Generated', value: '156', icon: FileText, color: 'bg-green-500' },
  { label: 'Images Created', value: '89', icon: Image, color: 'bg-purple-500' },
  { label: 'Time Saved', value: '24h', icon: Clock, color: 'bg-orange-500' }
]

const RECENT_GENERATIONS = [
  {
    id: 1,
    type: 'content',
    title: 'Product Description',
    preview: 'Revolutionary smartwatch with advanced health monitoring...',
    timestamp: '2 min ago',
    rating: 5
  },
  {
    id: 2,
    type: 'image',
    title: 'Hero Banner',
    preview: 'Modern tech startup hero image with gradient background',
    timestamp: '15 min ago',
    rating: 4
  },
  {
    id: 3,
    type: 'code',
    title: 'React Component',
    preview: 'const Button = ({ children, onClick, variant = "primary" }) => {',
    timestamp: '1 hour ago',
    rating: 5
  },
  {
    id: 4,
    type: 'content',
    title: 'Blog Post Outline',
    preview: '10 Essential Tips for Building Better Web Applications',
    timestamp: '2 hours ago',
    rating: 4
  }
]

const TEMPLATES = [
  { name: 'Product Description', category: 'E-commerce', uses: 245 },
  { name: 'Blog Post', category: 'Content', uses: 189 },
  { name: 'Landing Page Copy', category: 'Marketing', uses: 156 },
  { name: 'Email Newsletter', category: 'Marketing', uses: 134 },
  { name: 'Social Media Post', category: 'Social', uses: 98 },
  { name: 'Press Release', category: 'PR', uses: 67 }
]

export default function AIPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('assistant')
  const [prompt, setPrompt] = useState('')

  const handleFeatureClick = (featureId: string) => {
    dispatch(addToast({
      type: 'info',
      title: 'AI Feature',
      message: `${featureId} feature will be available soon!`
    }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return FileText
      case 'image': return Image
      case 'code': return Code
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'text-blue-500'
      case 'image': return 'text-purple-500'
      case 'code': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Supercharge your productivity with AI-powered tools and assistance
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/ai/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          AI Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Chat Interface */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Assistant Chat
              </CardTitle>
              <CardDescription>
                Ask me anything about your projects, get content suggestions, or request help with development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages Area */}
                <div className="min-h-[300px] max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        Hello! I'm your AI assistant. I can help you with content generation, code suggestions, 
                        design ideas, and much more. What would you like to work on today?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ask me anything or describe what you need help with..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    Generate blog post
                  </Button>
                  <Button variant="outline" size="sm">
                    Create product description
                  </Button>
                  <Button variant="outline" size="sm">
                    Write marketing copy
                  </Button>
                  <Button variant="outline" size="sm">
                    Code assistance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {feature.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        <Play className="w-4 h-4 mr-2" />
                        Try Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Generations</CardTitle>
              <CardDescription>Your recent AI-generated content and creations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_GENERATIONS.map((item) => {
                  const Icon = getTypeIcon(item.type)
                  const colorClass = getTypeColor(item.type)
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {item.preview}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Templates</CardTitle>
              <CardDescription>Pre-built prompts and templates for common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {TEMPLATES.map((template) => (
                  <div key={template.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {template.uses} uses
                      </Badge>
                      <Button variant="outline" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}