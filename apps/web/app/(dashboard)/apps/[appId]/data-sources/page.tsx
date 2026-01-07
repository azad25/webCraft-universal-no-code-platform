'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Plus,
  Database,
  Globe,
  Key,
  Settings,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Link2,
  Code,
  Loader2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DataSource {
  id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  is_connected: boolean;
  last_tested: string | null;
  endpoint_count: number;
}

interface WebScraper {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  last_run: string | null;
  run_count: number;
  schedule: string | null;
  is_scheduled: boolean;
}

export default function DataSourcesPage() {
  const params = useParams();
  const appId = params.appId as string;
  
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [scrapers, setScrapers] = useState<WebScraper[]>([]);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isAddingScraper, setIsAddingScraper] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  
  const [newSource, setNewSource] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'none',
    api_key: '',
    token: '',
    rate_limit: 60,
    timeout: 30,
    cache_ttl: 300
  });
  
  const [newScraper, setNewScraper] = useState({
    name: '',
    description: '',
    url: '',
    item_selector: '',
    fields: [{ name: '', selector: '', selector_type: 'css' }]
  });

  const fetchDataSources = useCallback(async () => {
    try {
      const response = await apiClient.get(`/data-sources?app_id=${appId}`);
      setDataSources(response.data.data_sources || []);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  }, [appId]);

  const fetchScrapers = useCallback(async () => {
    try {
      const response = await apiClient.get(`/scrapers?app_id=${appId}`);
      setScrapers(response.data.scrapers || []);
    } catch (error) {
      console.error('Failed to fetch scrapers:', error);
    }
  }, [appId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDataSources(), fetchScrapers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDataSources, fetchScrapers]);

  const handleCreateSource = async () => {
    try {
      const authConfig: Record<string, string> = {};
      if (newSource.auth_type === 'api_key') {
        authConfig.api_key = newSource.api_key;
      } else if (newSource.auth_type === 'bearer_token') {
        authConfig.token = newSource.token;
      }

      await apiClient.post(`/data-sources?app_id=${appId}`, {
        name: newSource.name,
        description: newSource.description,
        base_url: newSource.base_url,
        auth_type: newSource.auth_type,
        auth_config: authConfig,
        rate_limit: newSource.rate_limit,
        timeout: newSource.timeout,
        cache_ttl: newSource.cache_ttl
      });
      
      setIsAddingSource(false);
      setNewSource({
        name: '', description: '', base_url: '', auth_type: 'none',
        api_key: '', token: '', rate_limit: 60, timeout: 30, cache_ttl: 300
      });
      await fetchDataSources();
    } catch (error) {
      console.error('Failed to create data source:', error);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setIsTesting(sourceId);
    try {
      await apiClient.post(`/data-sources/${sourceId}/test`);
      await fetchDataSources();
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setIsTesting(null);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;
    try {
      await apiClient.delete(`/data-sources/${sourceId}`);
      await fetchDataSources();
    } catch (error) {
      console.error('Failed to delete data source:', error);
    }
  };

  const handleCreateScraper = async () => {
    try {
      await apiClient.post(`/scrapers?app_id=${appId}`, {
        name: newScraper.name,
        description: newScraper.description,
        url: newScraper.url,
        fields: newScraper.fields.filter(f => f.name && f.selector)
      });
      
      setIsAddingScraper(false);
      setNewScraper({
        name: '', description: '', url: '', item_selector: '',
        fields: [{ name: '', selector: '', selector_type: 'css' }]
      });
      await fetchScrapers();
    } catch (error) {
      console.error('Failed to create scraper:', error);
    }
  };

  const handleRunScraper = async (scraperId: string) => {
    setIsRunning(scraperId);
    try {
      await apiClient.post(`/scrapers/${scraperId}/run`);
      // Poll for status
      const pollStatus = async () => {
        const response = await apiClient.get(`/scrapers/${scraperId}/status`);
        if (response.data.status === 'running') {
          setTimeout(pollStatus, 2000);
        } else {
          setIsRunning(null);
          await fetchScrapers();
        }
      };
      setTimeout(pollStatus, 2000);
    } catch (error) {
      console.error('Failed to run scraper:', error);
      setIsRunning(null);
    }
  };

  const handleDeleteScraper = async (scraperId: string) => {
    if (!confirm('Are you sure you want to delete this scraper?')) return;
    try {
      await apiClient.delete(`/scrapers/${scraperId}`);
      await fetchScrapers();
    } catch (error) {
      console.error('Failed to delete scraper:', error);
    }
  };

  const filteredSources = dataSources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredScrapers = scrapers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: WebScraper['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WebScraper['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      idle: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading data sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-muted-foreground">
            Connect external APIs and scrape websites for dynamic content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{dataSources.length} APIs</Badge>
          <Badge variant="secondary">{scrapers.length} Scrapers</Badge>
        </div>
      </div>

      <Tabs defaultValue="apis" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="apis" className="gap-2">
              <Database className="w-4 h-4" />
              API Sources
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="gap-2">
              <Globe className="w-4 h-4" />
              Web Scrapers
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        <TabsContent value="apis" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Source
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add API Data Source</DialogTitle>
                  <DialogDescription>
                    Connect to an external API to use as a data source for your widgets
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Weather API"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What data does this API provide?"
                      value={newSource.description}
                      onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder="https://api.example.com/v1"
                      value={newSource.base_url}
                      onChange={(e) => setNewSource({ ...newSource, base_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Authentication Type</Label>
                    <Select
                      value={newSource.auth_type}
                      onValueChange={(value) => setNewSource({ ...newSource, auth_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Authentication</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="bearer_token">Bearer Token</SelectItem>
                        <SelectItem value="basic_auth">Basic Auth</SelectItem>
                        <SelectItem value="custom_header">Custom Header</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newSource.auth_type === 'api_key' && (
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter your API key"
                        value={newSource.api_key}
                        onChange={(e) => setNewSource({ ...newSource, api_key: e.target.value })}
                      />
                    </div>
                  )}
                  {newSource.auth_type === 'bearer_token' && (
                    <div className="space-y-2">
                      <Label>Bearer Token</Label>
                      <Input
                        type="password"
                        placeholder="Enter your token"
                        value={newSource.token}
                        onChange={(e) => setNewSource({ ...newSource, token: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingSource(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSource} disabled={!newSource.name || !newSource.base_url}>
                    Add Source
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className={source.is_connected ? 'border-green-200 dark:border-green-900' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${source.is_connected ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                        <Database className={`w-5 h-5 ${source.is_connected ? 'text-green-600' : ''}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {source.name}
                          {source.is_connected && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </CardTitle>
                        <CardDescription>{source.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Key className="w-3 h-3 mr-1" />
                      {source.auth_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="w-4 h-4" />
                      <span className="truncate">{source.base_url}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {source.endpoint_count} endpoints
                      </span>
                      {source.last_tested && (
                        <span className="text-muted-foreground">
                          Tested {new Date(source.last_tested).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestConnection(source.id)}
                        disabled={isTesting === source.id}
                      >
                        {isTesting === source.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        Test
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteSource(source.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSources.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No API sources found</h3>
              <p className="text-muted-foreground mb-4">Add your first API data source to get started</p>
              <Button onClick={() => setIsAddingSource(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add API Source
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scrapers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddingScraper} onOpenChange={setIsAddingScraper}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Web Scraper
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Web Scraper</DialogTitle>
                  <DialogDescription>
                    Configure a web scraper to extract data from websites
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Product Prices"
                      value={newScraper.name}
                      onChange={(e) => setNewScraper({ ...newScraper, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What data will this scraper collect?"
                      value={newScraper.description}
                      onChange={(e) => setNewScraper({ ...newScraper, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target URL</Label>
                    <Input
                      placeholder="https://example.com/products"
                      value={newScraper.url}
                      onChange={(e) => setNewScraper({ ...newScraper, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fields to Extract</Label>
                    {newScraper.fields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Field name"
                          value={field.name}
                          onChange={(e) => {
                            const fields = [...newScraper.fields];
                            fields[index].name = e.target.value;
                            setNewScraper({ ...newScraper, fields });
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder="CSS selector"
                          value={field.selector}
                          onChange={(e) => {
                            const fields = [...newScraper.fields];
                            fields[index].selector = e.target.value;
                            setNewScraper({ ...newScraper, fields });
                          }}
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewScraper({
                        ...newScraper,
                        fields: [...newScraper.fields, { name: '', selector: '', selector_type: 'css' }]
                      })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingScraper(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateScraper} disabled={!newScraper.name || !newScraper.url}>
                    Create Scraper
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredScrapers.map((scraper) => (
              <Card key={scraper.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {scraper.name}
                          {getStatusIcon(scraper.status)}
                        </CardTitle>
                        <CardDescription>{scraper.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(scraper.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="w-4 h-4" />
                      <span className="truncate">{scraper.url}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {scraper.run_count} runs
                      </span>
                      {scraper.is_scheduled && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                    {scraper.last_run && (
                      <p className="text-xs text-muted-foreground">
                        Last run: {new Date(scraper.last_run).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={scraper.status === 'running' || isRunning === scraper.id}
                        onClick={() => handleRunScraper(scraper.id)}
                      >
                        {scraper.status === 'running' || isRunning === scraper.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Run Now
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteScraper(scraper.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredScrapers.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No web scrapers found</h3>
              <p className="text-muted-foreground mb-4">Create your first web scraper to extract data</p>
              <Button onClick={() => setIsAddingScraper(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Web Scraper
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
