'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Plus,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Key,
  Trash2,
  Edit
} from 'lucide-react';
import { getDataSources, getDataSourceEndpoints } from '@/lib/data-source-api';
import { apiClient } from '@/lib/api-client';

interface DataSource {
  id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  is_connected: boolean;
  last_tested: string | null;
  last_error: string | null;
  endpoint_count: number;
  created_at: string;
}

interface DataSourceManagerProps {
  appId: string;
  onDataSourceSelect?: (sourceId: string, endpointId: string) => void;
}

export function DataSourceManager({ appId, onDataSourceSelect }: DataSourceManagerProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  useEffect(() => {
    loadDataSources();
  }, [appId]);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await getDataSources(appId);
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (sourceId: string) => {
    try {
      const response = await apiClient.post(`/data-sources/${sourceId}/test`);
      await loadDataSources(); // Refresh to get updated connection status
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Sources</h2>
          <p className="text-muted-foreground">
            Connect external APIs and services to power your app with dynamic data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Data Source</DialogTitle>
            </DialogHeader>
            <CreateDataSourceForm 
              appId={appId} 
              onSuccess={() => {
                setShowCreateDialog(false);
                loadDataSources();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : dataSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Data Sources</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your first data source to start building dynamic content
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((source) => (
            <DataSourceCard
              key={source.id}
              source={source}
              onTest={() => testConnection(source.id)}
              onSelect={() => setSelectedSource(source)}
              onDataSourceSelect={onDataSourceSelect}
            />
          ))}
        </div>
      )}

      {selectedSource && (
        <DataSourceDetails
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
          onDataSourceSelect={onDataSourceSelect}
        />
      )}
    </div>
  );
}

function DataSourceCard({ 
  source, 
  onTest, 
  onSelect, 
  onDataSourceSelect 
}: { 
  source: DataSource;
  onTest: () => Promise<any>;
  onSelect: () => void;
  onDataSourceSelect?: (sourceId: string, endpointId: string) => void;
}) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest();
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{source.name}</CardTitle>
          </div>
          <Badge variant={source.is_connected ? 'default' : 'destructive'}>
            {source.is_connected ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            {source.is_connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        {source.description && (
          <p className="text-sm text-muted-foreground">{source.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span className="truncate">{source.base_url}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Key className="w-4 h-4" />
          <span className="capitalize">{source.auth_type.replace('_', ' ')}</span>
        </div>

        <div className="text-sm text-muted-foreground">
          {source.endpoint_count} endpoint{source.endpoint_count !== 1 ? 's' : ''}
        </div>

        {source.last_error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {source.last_error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={onSelect}
            className="flex-1"
          >
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDataSourceForm({ 
  appId, 
  onSuccess 
}: { 
  appId: string; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'none',
    auth_config: {
      api_key: '',
      api_key_header: 'X-API-Key',
      token: '',
      username: '',
      password: ''
    }
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await apiClient.post(`/data-sources?app_id=${appId}`, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create data source:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My API"
            required
          />
        </div>
        <div>
          <Label htmlFor="base_url">Base URL</Label>
          <Input
            id="base_url"
            value={formData.base_url}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            placeholder="https://api.example.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div>
        <Label htmlFor="auth_type">Authentication</Label>
        <Select
          value={formData.auth_type}
          onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="api_key">API Key</SelectItem>
            <SelectItem value="bearer_token">Bearer Token</SelectItem>
            <SelectItem value="basic_auth">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.auth_type === 'api_key' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.auth_config.api_key}
              onChange={(e) => setFormData({
                ...formData,
                auth_config: { ...formData.auth_config, api_key: e.target.value }
              })}
              placeholder="Your API key"
            />
          </div>
          <div>
            <Label htmlFor="api_key_header">Header Name</Label>
            <Input
              id="api_key_header"
              value={formData.auth_config.api_key_header}
              onChange={(e) => setFormData({
                ...formData,
                auth_config: { ...formData.auth_config, api_key_header: e.target.value }
              })}
              placeholder="X-API-Key"
            />
          </div>
        </div>
      )}

      {formData.auth_type === 'bearer_token' && (
        <div>
          <Label htmlFor="token">Bearer Token</Label>
          <Input
            id="token"
            type="password"
            value={formData.auth_config.token}
            onChange={(e) => setFormData({
              ...formData,
              auth_config: { ...formData.auth_config, token: e.target.value }
            })}
            placeholder="Your bearer token"
          />
        </div>
      )}

      {formData.auth_type === 'basic_auth' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.auth_config.username}
              onChange={(e) => setFormData({
                ...formData,
                auth_config: { ...formData.auth_config, username: e.target.value }
              })}
              placeholder="Username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.auth_config.password}
              onChange={(e) => setFormData({
                ...formData,
                auth_config: { ...formData.auth_config, password: e.target.value }
              })}
              placeholder="Password"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={creating}>
          {creating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Data Source
        </Button>
      </div>
    </form>
  );
}

function DataSourceDetails({ 
  source, 
  onClose, 
  onDataSourceSelect 
}: { 
  source: DataSource;
  onClose: () => void;
  onDataSourceSelect?: (sourceId: string, endpointId: string) => void;
}) {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEndpoints();
  }, [source.id]);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const data = await getDataSourceEndpoints(source.id);
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {source.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="endpoints" className="w-full">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : endpoints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No endpoints configured</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Endpoint
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <Card key={endpoint.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{endpoint.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {endpoint.method} {endpoint.path}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDataSourceSelect?.(source.id, endpoint.id)}
                        >
                          Use in Widget
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <div>
                <Label>Base URL</Label>
                <Input value={source.base_url} readOnly />
              </div>
              <div>
                <Label>Authentication</Label>
                <Input value={source.auth_type.replace('_', ' ')} readOnly />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}