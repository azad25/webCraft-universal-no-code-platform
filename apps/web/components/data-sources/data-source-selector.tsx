'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/dev-auth';
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
  Zap,
  Loader2,
  Table,
  FileText
} from 'lucide-react';
import { getDataSources, getDataSourceEndpoints } from '@/lib/data-source-api';
import { CollectionManager } from './collection-manager';
import { RecordManager } from './record-manager';

interface DataSource {
  id: string;
  name: string;
  type?: 'api' | 'scraper' | 'collection'; // Added collection type
  description: string;
  endpoints?: { id: string; name: string; path: string }[];
  isConnected?: boolean; // Legacy property for mock data
  
  // New properties from API
  base_url?: string;
  auth_type?: string;
  is_connected?: boolean;
  last_tested?: string | null;
  last_error?: string | null;
  endpoint_count?: number;
  created_at?: string;
  
  // Collection properties
  schema?: any[];
  record_count?: number;
  color?: string;
  icon?: string;
}

interface DataSourceConfigProps {
  selectedSourceId?: string;
  selectedEndpointId?: string;
  onSelect: (sourceId: string, endpointId?: string, sourceType?: 'api' | 'scraper' | 'collection') => void;
  appId: string;
}

export function DataSourceSelector({
  selectedSourceId,
  selectedEndpointId,
  onSelect,
  appId
}: DataSourceConfigProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [collections, setCollections] = useState<DataSource[]>([]);
  const [endpoints, setEndpoints] = useState<Record<string, any[]>>({});
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(
    dataSources.find(s => s.id === selectedSourceId) || null
  );
  
  // View states
  const [currentView, setCurrentView] = useState<'selector' | 'collections' | 'records'>('selector');
  const [selectedCollection, setSelectedCollection] = useState<DataSource | null>(null);

  // Load data sources when dialog opens
  useEffect(() => {
    if (open && appId) {
      loadDataSources();
      loadCollections();
    }
  }, [open, appId]);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const sources = await getDataSources(appId);
      setDataSources(sources);
      
      // Load endpoints for API sources
      const endpointPromises = sources
        .filter(s => s.auth_type !== 'scraper') // Assuming scrapers don't have endpoints
        .map(async (source) => {
          try {
            const sourceEndpoints = await getDataSourceEndpoints(source.id);
            return { sourceId: source.id, endpoints: sourceEndpoints };
          } catch (error) {
            console.warn(`Failed to load endpoints for source ${source.id}:`, error);
            return { sourceId: source.id, endpoints: [] };
          }
        });
      
      const endpointResults = await Promise.all(endpointPromises);
      const endpointMap: Record<string, any[]> = {};
      endpointResults.forEach(({ sourceId, endpoints }) => {
        endpointMap[sourceId] = endpoints;
      });
      setEndpoints(endpointMap);
      
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch(`/api/apps/${appId}/collections`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const collectionsAsDataSources = data.collections.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
          type: 'collection' as const,
          description: collection.description || `Custom data collection with ${collection.record_count} records`,
          schema: collection.schema,
          record_count: collection.record_count,
          color: collection.color,
          icon: collection.icon,
          isConnected: true,
          is_connected: true
        }));
        setCollections(collectionsAsDataSources);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const allSources = [...dataSources, ...collections];
  const filteredSources = allSources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const apiSources = filteredSources.filter(s => (s.auth_type && s.auth_type !== 'scraper') || s.type === 'api');
  const scraperSources = filteredSources.filter(s => s.auth_type === 'scraper' || s.type === 'scraper');
  const collectionSources = filteredSources.filter(s => s.type === 'collection');

  const handleSourceSelect = (source: DataSource) => {
    setSelectedSource(source);
    if (source.auth_type === 'scraper' || source.type === 'scraper') {
      // Scrapers don't have endpoints
      onSelect(source.id, undefined, 'scraper');
      setOpen(false);
    } else if (source.type === 'collection') {
      // Collections are direct data sources
      onSelect(source.id, undefined, 'collection');
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
    const source = allSources.find(s => s.id === selectedSourceId);
    if (!source) return 'Select data source';
    
    if (source.type === 'collection') {
      return `📊 ${source.name}`;
    }
    
    if (source.auth_type === 'scraper' || source.type === 'scraper') {
      return `🌐 ${source.name}`;
    }
    
    const sourceEndpoints = endpoints[source.id] || [];
    const endpoint = sourceEndpoints.find(e => e.id === selectedEndpointId);
    return endpoint ? `🔗 ${source.name} → ${endpoint.name}` : `🔗 ${source.name}`;
  };

  const openCollectionManager = () => {
    setCurrentView('collections');
  };

  const openRecordManager = (collection: DataSource) => {
    setSelectedCollection(collection);
    setCurrentView('records');
  };

  const backToSelector = () => {
    setCurrentView('selector');
    setSelectedCollection(null);
  };

  if (currentView === 'collections') {
    return (
      <Dialog open={true} onOpenChange={() => setCurrentView('selector')}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <CollectionManager appId={appId} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentView === 'records' && selectedCollection) {
    return (
      <Dialog open={true} onOpenChange={() => setCurrentView('selector')}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <RecordManager 
            appId={appId} 
            collection={selectedCollection as any}
            onBack={backToSelector}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2 truncate">
            {selectedSourceId ? (
              <>
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
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Connect Data Source</DialogTitle>
          <DialogDescription>
            Select an API endpoint, web scraper, or custom collection to bind to this widget
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="collections" className="flex-1">
            <TabsList className="w-full">
              <TabsTrigger value="collections" className="flex-1 gap-2">
                <Database className="w-4 h-4" />
                Custom Data ({collectionSources.length})
              </TabsTrigger>
              <TabsTrigger value="apis" className="flex-1 gap-2">
                <Zap className="w-4 h-4" />
                APIs ({apiSources.length})
              </TabsTrigger>
              <TabsTrigger value="scrapers" className="flex-1 gap-2">
                <Globe className="w-4 h-4" />
                Scrapers ({scraperSources.length})
              </TabsTrigger>
            </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="collections" className="mt-0 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Custom data collections created for this app
                </p>
                <Button variant="outline" size="sm" onClick={openCollectionManager}>
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Collections
                </Button>
              </div>
              
              {collectionSources.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No custom collections yet</p>
                  <Button variant="outline" size="sm" onClick={openCollectionManager}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Collection
                  </Button>
                </div>
              ) : (
                collectionSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSource?.id === source.id ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSourceSelect(source)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded flex items-center justify-center text-white"
                            style={{ backgroundColor: source.color || '#6366f1' }}
                          >
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{source.name}</CardTitle>
                            <CardDescription>
                              {source.record_count} records • {source.schema?.length || 0} fields
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRecordManager(source);
                            }}
                          >
                            <Table className="w-4 h-4 mr-2" />
                            View Data
                          </Button>
                          {selectedSourceId === source.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="apis" className="mt-0 space-y-2">
              {apiSources.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
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
                          <Zap className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-base">{source.name}</CardTitle>
                          {(source.is_connected || source.isConnected) && (
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
                    {selectedSource?.id === source.id && (endpoints[source.id] || []).length > 0 && (
                      <CardContent className="p-4 pt-0">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Select Endpoint
                        </Label>
                        <div className="space-y-1">
                          {(endpoints[source.id] || []).map((endpoint) => (
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
                          {(source.is_connected || source.isConnected) && (
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
        )}

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
