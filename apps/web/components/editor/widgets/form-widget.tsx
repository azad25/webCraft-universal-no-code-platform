'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface FormField {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface FormWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Form configuration
  title?: string
  description?: string
  fields?: FormField[]
  submitText?: string
  successMessage?: string
  backgroundColor?: string
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultFields: FormField[] = [
  { id: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { id: 'email', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
  { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Your message...', required: false }
]

export function FormWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Form props
  title = 'Contact Us',
  description = 'Fill out the form below and we\'ll get back to you.',
  fields = defaultFields,
  submitText = 'Send Message',
  successMessage = 'Thank you! Your message has been sent.',
  backgroundColor = '#ffffff',
  isEditing = false,
  onChange
}: FormWidgetProps) {
  // Data source state
  const [formConfig, setFormConfig] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeTitle = (dataSourceId && formConfig?.title) || title
  const activeDescription = (dataSourceId && formConfig?.description) || description
  const activeFields = (dataSourceId && formConfig?.fields) || fields
  const activeSubmitText = (dataSourceId && formConfig?.submitText) || submitText

  // Fetch data from data source
  const fetchFormConfig = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to form config format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for form config
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setFormConfig({
          title: transformedData.title || transformedData.form_title,
          description: transformedData.description || transformedData.form_description,
          fields: transformedData.fields || transformedData.form_fields || [],
          submitText: transformedData.submitText || transformedData.submit_text || transformedData.button_text
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch form config')
      console.error('Failed to fetch form config:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchFormConfig()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchFormConfig, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchFormConfig()
    }
  }

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) return

    setIsSubmitting(true)
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  if (isSubmitted && !isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full flex items-center justify-center p-8"
        style={{ backgroundColor }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">{successMessage}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full h-full p-6" style={{ backgroundColor }}>
      <div className="flex items-center gap-4 mb-4">
        {activeTitle && <h3 className="text-2xl font-bold">{activeTitle}</h3>}
        {dataSourceId && (
          <Badge variant="outline" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            {dataSourceType === 'collection' ? 'Collection' : 
             dataSourceType === 'scraper' ? 'Scraper' : 'API'}
          </Badge>
        )}
        {isLoadingData && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {dataSourceId && lastRefresh && (
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoadingData}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
      {activeDescription && <p className="text-gray-600 mb-6">{activeDescription}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <Textarea
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
                disabled={isEditing}
                rows={4}
              />
            ) : field.type === 'select' ? (
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
                disabled={isEditing}
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
                disabled={isEditing}
              />
            )}
          </div>
        ))}
        
        <Button
          type="submit"
          className="w-full"
          disabled={isEditing || isSubmitting}
        >
          {isSubmitting ? 'Sending...' : activeSubmitText}
        </Button>
      </form>
    </div>
  )
}
