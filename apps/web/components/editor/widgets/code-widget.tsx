'use client'

import { useState } from 'react'
import { Copy, Check, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CodeWidgetProps {
  code?: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  theme?: 'dark' | 'light'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<CodeWidgetProps>) => void
}

export function CodeWidget({
  code = `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('World'));`,
  language = 'javascript',
  filename = '',
  showLineNumbers = true,
  showCopyButton = true,
  theme = 'dark',
  isEditing = false,
  isPreview = false,
  onChange
}: CodeWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')

  const themeClasses = {
    dark: 'bg-gray-900 text-gray-100',
    light: 'bg-gray-100 text-gray-900'
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Code Block Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Code</Label>
              <Textarea
                value={code}
                onChange={(e) => onChange?.({ code: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Language</Label>
                <select
                  value={language}
                  onChange={(e) => onChange?.({ language: e.target.value })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="bash">Bash</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Filename (optional)</Label>
                <Input
                  value={filename}
                  onChange={(e) => onChange?.({ filename: e.target.value })}
                  placeholder="example.js"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => onChange?.({ showLineNumbers: e.target.checked })}
                  className="rounded"
                />
                Line Numbers
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCopyButton}
                  onChange={(e) => onChange?.({ showCopyButton: e.target.checked })}
                  className="rounded"
                />
                Copy Button
              </label>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg overflow-hidden', themeClasses[theme])}>
      {(filename || showCopyButton) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <span className="text-sm text-gray-400">{filename || language}</span>
          {showCopyButton && (
            <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7 px-2">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="select-none text-gray-500 w-8 text-right mr-4">{i + 1}</span>
              )}
              <span>{line || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
