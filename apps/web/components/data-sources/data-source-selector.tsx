'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search,
  Check,
  ChevronRight,
  Link2,
  RefreshCw,
  Plus,
  Settings,
  Zap
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'scraper';
  description: string;
  endpoints?: { id: string; name: string; path: string }[];
  isConnected: boolean;
}

interface DataSourceSelectorProps {
  selectedSourceId?: string;
  selectedEndpointId?: string;
  onSelect: (sourceId: string, endpointId?: string, sourceType?: 'api' | 'scraper') => void;
  appId: string;
}

// Mock data sources
const mockSources: DataSource[] = [
  {
    id: 'ds-1',
    name: 'Weather API',
    type: 'api',
    description: 'OpenWeather API',
    isConnected: true,
    endpoints: [
      { id: 'ep-1', name: 'Current Weather', path: '/weather' },
      { id: 'ep-2', name: 'Forecast', path: '/forecast' },
      { id: 'ep-3', name: 'Alerts', path: '/alerts' },
    ]
  },
  {
    id: 'ds-2',
    name: 'News API',
    type: 'api',
    description: 'Latest news headlines',
    isConnected: true,
    endpoints: [
      { id: 'ep-4', name: 'Top Headlines', path: '/top-headlines' },
      { id: 'ep-5', name: 'Everything', path: '/everything' },
    ]
  },
  {
    id: 'ds-3',
    name: 'Product Scraper',
    type: 'scraper',
    description: 'Competitor product prices',
    isConnected: true,
  },
  {
    id: 'ds-4',
    name: 'Job Listings',
    type: 'scraper',
    description: 'Job board scraper',
    isConnected: true,
  },
];

export function DataSourceSelector({
  selectedSourceId,
  selectedEndpointId,
  onSelect,
  appId
}: DataSourceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(
    mockSources.find(s => s.id === selectedSourceId) || null
  );

  const filteredSources = mockSources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const apiSources = filteredSources.filter(s => s.type === 'api');
  const scraperSources = filteredSources.filter(s => s.type === 'scraper');

  const handleSourceSelect = (source: DataSource) => {
    setSelectedSource(source);
    if (source.type === 'scraper') {
      // Scrapers don't have endpoints
      onSelect(source.id, undefined, 'scraper');
      setOpen(false);
    }
  };

  const handleEndpointSelect = (endpointId: string) => {
    if (selectedSource) {
      onSelect(selectedSource.id, endpointId, 'api');
      setOpen(false);
    }
  };

  const getSelectedLabel = () => {
    if (!selectedSourceId) return 'Select data source';
    const source = mockSources.find(s => s.id === selectedSourceId);
    if (!source) return 'Select data source';
    
    if (source.type === 'scraper') {
      return source.name;
    }
    
    const endpoint = source.endpoints?.find(e => e.id === selectedEndpointId);
    return endpoint ? `${source.name} → ${endpoint.name}` : source.name;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2 truncate">
            {selectedSourceId ? (
              <>
                {mockSources.find(s => s.id === selectedSourceId)?.type === 'api' ? (
                  <Database className="w-4 h-4 text-blue-500" />
                ) : (
                  <Globe className="w-4 h-4 text-green-500" />
                )}
                {getSelectedLabel()}
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Select data source
              </>
            )}
          </span>
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Connect Data Source</DialogTitle>
          <DialogDescription>
            Select an API endpoint or web scraper to bind to this widget
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="apis" className="flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="apis" className="flex-1 gap-2">
              <Database className="w-4 h-4" />
              API Sources ({apiSources.length})
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="flex-1 gap-2">
              <Globe className="w-4 h-4" />
              Web Scrapers ({scraperSources.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="apis" className="mt-0 space-y-2">
              {apiSources.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No API sources found</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Source
                  </Button>
                </div>
              ) : (
                apiSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSource?.id === source.id ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSourceSelect(source)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-base">{source.name}</CardTitle>
                          {source.isConnected && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        {selectedSource?.id === source.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <CardDescription>{source.description}</CardDescription>
                    </CardHeader>
                    {selectedSource?.id === source.id && source.endpoints && (
                      <CardContent className="p-4 pt-0">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Select Endpoint
                        </Label>
                        <div className="space-y-1">
                          {source.endpoints.map((endpoint) => (
                            <Button
                              key={endpoint.id}
                              variant={selectedEndpointId === endpoint.id ? 'default' : 'ghost'}
                              size="sm"
                              className="w-full justify-start"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndpointSelect(endpoint.id);
                              }}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              {endpoint.name}
                              <span className="ml-auto text-xs text-muted-foreground">
                                {endpoint.path}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="scrapers" className="mt-0 space-y-2">
              {scraperSources.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No web scrapers found</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Web Scraper
                  </Button>
                </div>
              ) : (
                scraperSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSource?.id === source.id ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSourceSelect(source)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-green-500" />
                          <CardTitle className="text-base">{source.name}</CardTitle>
                          {source.isConnected && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {selectedSourceId === source.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <CardDescription>{source.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/dashboard/apps/${appId}/data-sources`}>
              <Settings className="w-4 h-4 mr-2" />
              Manage Data Sources
            </a>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {selectedSourceId && (
              <Button
                variant="destructive"
                onClick={() => {
                  onSelect('', undefined, undefined);
                  setSelectedSource(null);
                  setOpen(false);
                }}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
