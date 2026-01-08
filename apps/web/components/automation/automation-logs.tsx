'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, RefreshCw, Search, Filter, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, Play, Pause, Eye,
  TrendingUp, TrendingDown, Activity, Zap, BarChart3,
  Download, Share, Settings, ChevronRight, Timer
} from 'lucide-react'

interface AutomationLog {
  id: string
  automation_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  trigger_data: Record<string, any>
  execution_result: Record<string, any>
  error_message?: string
  duration_ms: number
  steps_executed: number
  started_at: string
  completed_at?: string
  created_at: string
}

interface AutomationLogsProps {
  automationId: string
  automationName: string
  logs: AutomationLog[]
  onRefresh: () => void
  onClose: () => void
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Pending' },
  running: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900', label: 'Running' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900', label: 'Failed' },
}

export function AutomationLogs({ 
  automationId, 
  automationName, 
  logs, 
  onRefresh, 
  onClose 
}: AutomationLogsProps) {
  const [filteredLogs, setFilteredLogs] = useState<AutomationLog[]>(logs)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setFilteredLogs(logs)
  }, [logs])

  useEffect(() => {
    filterLogs()
  }, [logs, selectedStatus, search])

  const filterLogs = () => {
    let filtered = logs

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus)
    }

    if (search) {
      filtered = filtered.filter(log => 
        log.id.toLowerCase().includes(search.toLowerCase()) ||
        log.error_message?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.trigger_data).toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleViewDetails = (log: AutomationLog) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSuccessRate = () => {
    if (logs.length === 0) return 0
    const successful = logs.filter(log => log.status === 'completed').length
    return Math.round((successful / logs.length) * 100)
  }

  const getAverageDuration = () => {
    const completedLogs = logs.filter(log => log.status === 'completed' && log.duration_ms > 0)
    if (completedLogs.length === 0) return 0
    const total = completedLogs.reduce((sum, log) => sum + log.duration_ms, 0)
    return Math.round(total / completedLogs.length)
  }

  const getStatusCounts = () => {
    return {
      total: logs.length,
      completed: logs.filter(log => log.status === 'completed').length,
      failed: logs.filter(log => log.status === 'failed').length,
      running: logs.filter(log => log.status === 'running').length,
      pending: logs.filter(log => log.status === 'pending').length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Execution Logs
            </h1>
            <p className="text-sm text-muted-foreground">{automationName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{statusCounts.total}</p>
            <p className="text-xs text-muted-foreground">Total Runs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{getSuccessRate()}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatDuration(getAverageDuration())}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.running}</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
            {['all', 'completed', 'failed', 'running', 'pending'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label || status}
                {status !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {statusCounts[status as keyof typeof statusCounts]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-3">
            <AnimatePresence>
              {filteredLogs.map((log, index) => {
                const config = statusConfig[log.status]
                const StatusIcon = config.icon
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(log)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bg)}>
                              <StatusIcon className={cn("w-5 h-5", config.color)} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">Execution #{log.id.slice(-8)}</p>
                                <Badge variant="outline" className={config.color}>
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(log.started_at)}
                                </span>
                                {log.duration_ms > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {formatDuration(log.duration_ms)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {log.steps_executed} steps
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.error_message && (
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        
                        {log.error_message && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {log.error_message}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  {logs.length === 0 
                    ? "This automation hasn't been executed yet" 
                    : "Try adjusting your filters"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Execution Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this automation execution
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Execution ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant="outline" className={statusConfig[selectedLog.status].color}>
                      {statusConfig[selectedLog.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Started At</p>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedLog.started_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{formatDuration(selectedLog.duration_ms)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Steps Executed</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.steps_executed}</p>
                  </div>
                  {selectedLog.completed_at && (
                    <div>
                      <p className="text-sm font-medium">Completed At</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedLog.completed_at)}</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {selectedLog.error_message && (
                  <div>
                    <p className="text-sm font-medium mb-2">Error Message</p>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                        {selectedLog.error_message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trigger Data */}
                <div>
                  <p className="text-sm font-medium mb-2">Trigger Data</p>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.trigger_data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Execution Result */}
                {selectedLog.execution_result && Object.keys(selectedLog.execution_result).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Execution Result</p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.execution_result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Step Details */}
                {selectedLog.execution_result?.steps && (
                  <div>
                    <p className="text-sm font-medium mb-2">Step Execution Details</p>
                    <div className="space-y-2">
                      {selectedLog.execution_result.steps.map((step: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Step {index + 1}: {step.action_type}</p>
                            <Badge variant={step.result?.success ? 'default' : 'destructive'}>
                              {step.result?.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          {step.result?.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                              {step.result.error}
                            </p>
                          )}
                          {step.result?.output && (
                            <div className="text-xs bg-muted/30 p-2 rounded">
                              <pre>{JSON.stringify(step.result.output, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}