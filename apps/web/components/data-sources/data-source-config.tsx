'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database,
  Globe,
  Settings,
  Check,
  ChevronRight,
  Link2,
  RefreshCw,
  Plus,
  Zap,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { DataSourceSelector } from './data-source-selector';
import { getDataSources, previewEndpointData } from '@/lib/data-source-api';

interface DataSourceConfigProps {
  // Current configuration
  dataSourceId?: string;
  dataEndpointId?: string;
  dataSourceType?: 'api' | 'scraper';
  autoRefresh?: boolean;
  refreshInterval?: number;
  fieldMappings?: Record<string, string>;
  
  // Callbacks
  onConfigChange: (config: {
    dataSourceId?: string;
    dataEndpointId?: string;
    dataSourceType?: 'api' | 'scraper';
    autoRefresh?: boolean;
    refreshInterval?: number;
    fieldMappings?: Record<string, string>;
  }) => void;
  
  // Context
  appId: string;
  widgetType?: string;
}

interface DataPreview {
  sample_data: any;
  structure: Array<{
    path: string;
    type: string;
    sample?: string;
  }>;
  total_items: number;
}

export function DataSourceConfig({
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  fieldMappings = {},
  onConfigChange,
  appId,
  widgetType = 'widget'
}: DataSourceConfigProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<any[]>([]);

  // Load data sources when component mounts
  useEffect(() => {
    const loadDataSources = async () => {
      try {
        const sources = await getDataSources(appId);
        setDataSources(sources);
      } catch (error) {
        console.error('Failed to load data sources:', error);
      }
    };
    loadDataSources();
  }, [appId]);

  // Load preview when endpoint changes
  useEffect(() => {
    if (dataSourceId && dataEndpointId && dataSourceType === 'api') {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [dataSourceId, dataEndpointId, dataSourceType]);

  const loadPreview = async () => {
    if (!dataSourceId || !dataEndpointId) return;
    
    setLoading(true);
    setPreviewError(null);
    
    try {
      const previewData = await previewEndpointData(dataSourceId, dataEndpointId);
      setPreview(previewData);
    } catch (error) {
      setPreviewError('Failed to load data preview');
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceSelect = (sourceId: string, endpointId?: string, sourceType?: 'api' | 'scraper') => {
    onConfigChange({
      dataSourceId: sourceId,
      dataEndpointId: endpointId,
      dataSourceType: sourceType,
      autoRefresh,
      refreshInterval,
      fieldMappings
    });
  };

  const handleAutoRefreshChange = (enabled: boolean) => {
    onConfigChange({
      dataSourceId,
      dataEndpointId,
      dataSourceType,
      autoRefresh: enabled,
      refreshInterval,
      fieldMappings
    });
  };

  const handleRefreshIntervalChange = (interval: number) => {
    onConfigChange({
      dataSourceId,
      dataEndpointId,
      dataSourceType,
      autoRefresh,
      refreshInterval: interval,
      fieldMappings
    });
  };

  const handleFieldMappingChange = (mappings: Record<string, string>) => {
    onConfigChange({
      dataSourceId,
      dataEndpointId,
      dataSourceType,
      autoRefresh,
      refreshInterval,
      fieldMappings: mappings
    });
  };

  const getSelectedSourceName = () => {
    if (!dataSourceId) return null;
    const source = dataSources.find(s => s.id === dataSourceId);
    return source?.name || 'Unknown Source';
  };

  const getSelectedEndpointName = () => {
    if (!dataEndpointId || !preview) return null;
    // This would need to be enhanced to get actual endpoint name
    return 'Selected Endpoint';
  };

  const isConfigured = dataSourceId && (dataSourceType === 'scraper' || dataEndpointId);

  return (
    <div className="space-y-4">
      {/* Data Source Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Source</Label>
        <DataSourceSelector
          selectedSourceId={dataSourceId}
          selectedEndpointId={dataEndpointId}
          onSelect={handleDataSourceSelect}
          appId={appId}
        />
      </div>

      {/* Configuration Options */}
      {isConfigured && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-green-600" />
            <span className="font-medium">Connected to {getSelectedSourceName()}</span>
            {dataSourceType === 'api' && getSelectedEndpointName() && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{getSelectedEndpointName()}</span>
              </>
            )}
          </div>

          {/* Auto Refresh Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">Auto Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh data at regular intervals
                </p>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={handleAutoRefreshChange}
              />
            </div>

            {autoRefresh && (
              <div className="space-y-2">
                <Label className="text-sm">Refresh Interval</Label>
                <Select
                  value={refreshInterval.toString()}
                  onValueChange={(value) => handleRefreshIntervalChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Every 10 seconds</SelectItem>
                    <SelectItem value="30">Every 30 seconds</SelectItem>
                    <SelectItem value="60">Every minute</SelectItem>
                    <SelectItem value="300">Every 5 minutes</SelectItem>
                    <SelectItem value="900">Every 15 minutes</SelectItem>
                    <SelectItem value="3600">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Data Preview */}
          {dataSourceType === 'api' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Data Preview</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPreview}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewError ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{previewError}</span>
                </div>
              ) : preview ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <Check className="w-4 h-4" />
                      <span>Found {preview.total_items} items</span>
                    </div>
                  </div>

                  {preview.structure && preview.structure.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Available Fields</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {preview.structure.map((field, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs"
                          >
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <span className="font-mono">{field.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.sample_data && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Sample Data</Label>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(preview.sample_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Field Mapping (Advanced) */}
          <div className="space-y-2">
            <Label className="text-sm">Field Mapping</Label>
            <p className="text-xs text-muted-foreground">
              Map API response fields to {widgetType} properties (optional)
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configure Field Mapping
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/apps/${appId}/data-sources`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Sources
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onConfigChange({
                  dataSourceId: undefined,
                  dataEndpointId: undefined,
                  dataSourceType: undefined,
                  autoRefresh: false,
                  refreshInterval: 60,
                  fieldMappings: {}
                });
              }}
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isConfigured && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Database className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Connect a data source to display dynamic content
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/apps/${appId}/data-sources`} target="_blank">
                <Plus className="w-4 h-4 mr-2" />
                Create Data Source
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}