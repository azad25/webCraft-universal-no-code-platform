'use client'

import { TemplateLibrary } from '@/components/templates/template-library'

export default function TemplatesPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <TemplateLibrary mode="browse" />
    </div>
  )
}
