'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

interface ExecutionLog {
  id: string
  automationId: string
  status: 'completed' | 'failed' | 'running'
  triggerData: Record<string, any>
  executionResult: Record<string, any>
  errorMessage?: string
  durationMs: number
  executedAt: string
}

interface AutomationLogsProps {
  automationId: string
  automationName: string
  logs: ExecutionLog[]
  onRefresh: () => void
  onClose: () => void
}

export function AutomationLogs({
  automationId,
  automationName,
  logs,
  onRefresh,
  onClose
}: AutomationLogsProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all')

  const filteredLogs = logs.filter(log => 
    statusFilter === 'all' || log.status === statusFilter
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary">Running</Badge>
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <Button variant="ghost" size="sm" onClick={onClose} className="mb-2">
            ← Back
          </Button>
          <h2 className="text-xl font-semibold">{automationName}</h2>
          <p className="text-sm text-muted-foreground">Execution History</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b flex items-center gap-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['all', 'completed', 'failed'] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredLogs.length} execution{filteredLogs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Logs List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-2">No executions yet</h3>
              <p className="text-sm text-muted-foreground">
                This automation hasn't been triggered yet
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                layout
                className="border rounded-lg overflow-hidden"
              >
                {/* Log Header */}
                <button
                  className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  {getStatusIcon(log.status)}
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(log.executedAt).toLocaleString()}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Duration: {log.durationMs}ms
                      {log.errorMessage && ` • Error: ${log.errorMessage}`}
                    </p>
                  </div>

                  {expandedLog === log.id ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Log Details */}
                {expandedLog === log.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t bg-muted/30"
                  >
                    <div className="p-4 space-y-4">
                      {/* Trigger Data */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Trigger Data</h4>
                        <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-40">
                          {JSON.stringify(log.triggerData, null, 2)}
                        </pre>
                      </div>

                      {/* Execution Result */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Execution Result</h4>
                        <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-40">
                          {JSON.stringify(log.executionResult, null, 2)}
                        </pre>
                      </div>

                      {/* Error Message */}
                      {log.errorMessage && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-destructive">Error</h4>
                          <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-lg">
                            {log.errorMessage}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
