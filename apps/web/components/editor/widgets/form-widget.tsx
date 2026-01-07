'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormField {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface FormWidgetProps {
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
  title = 'Contact Us',
  description = 'Fill out the form below and we\'ll get back to you.',
  fields = defaultFields,
  submitText = 'Send Message',
  successMessage = 'Thank you! Your message has been sent.',
  backgroundColor = '#ffffff',
  isEditing = false,
  onChange
}: FormWidgetProps) {
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
      {title && <h3 className="text-2xl font-bold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
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
          {isSubmitting ? 'Sending...' : submitText}
        </Button>
      </form>
    </div>
  )
}
