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
  FileText,
  Plus,
  Settings,
  Eye,
  RefreshCw,
  Database,
  Layers,
  Globe,
  Code,
  Layout,
  Trash2,
  Edit,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  getDynamicPages, 
  createDynamicPage, 
  updateDynamicPage, 
  deleteDynamicPage,
  generateDynamicPagePreviews,
  getCollections,
  getDataSources,
  getDataSourceEndpoints,
  Collection,
  DataSource
} from '@/lib/data-source-api';

interface DynamicPage {
  id: string;
  name: string;
  slug_template: string;
  collection_id?: string;
  data_source_id?: string;
  endpoint_id?: string;
  template: any;
  settings: Record<string, any>;
  generated_count: number;
  last_generated: string | null;
  created_at: string;
  updated_at: string;
}

interface DynamicPageBuilderProps {
  appId: string;
}

export function DynamicPageBuilder({ appId }: DynamicPageBuilderProps) {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<DynamicPage | null>(null);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagesData, collectionsData, dataSourcesData] = await Promise.all([
        getDynamicPages(appId),
        getCollections(appId),
        getDataSources(appId)
      ]);
      
      setPages(pagesData);
      setCollections(collectionsData);
      setDataSources(dataSourcesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (pageData: any) => {
    try {
      await createDynamicPage(appId, pageData);
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create dynamic page:', error);
    }
  };

  const handleGeneratePreviews = async (pageId: string) => {
    try {
      await generateDynamicPagePreviews(pageId);
      loadData(); // Refresh to get updated counts
    } catch (error) {
      console.error('Failed to generate previews:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dynamic Pages</h2>
          <p className="text-muted-foreground">
            Create pages that automatically generate content based on your data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Dynamic Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Dynamic Page</DialogTitle>
            </DialogHeader>
            <CreateDynamicPageForm 
              appId={appId}
              collections={collections}
              dataSources={dataSources}
              onSuccess={handleCreatePage}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Dynamic Pages</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first dynamic page to automatically generate content from your data
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Dynamic Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <DynamicPageCard
              key={page.id}
              page={page}
              collections={collections}
              dataSources={dataSources}
              onSelect={() => setSelectedPage(page)}
              onGeneratePreviews={() => handleGeneratePreviews(page.id)}
            />
          ))}
        </div>
      )}

      {selectedPage && (
        <DynamicPageDetails
          page={selectedPage}
          appId={appId}
          collections={collections}
          dataSources={dataSources}
          onClose={() => setSelectedPage(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

function DynamicPageCard({ 
  page, 
  collections,
  dataSources,
  onSelect, 
  onGeneratePreviews 
}: { 
  page: DynamicPage;
  collections: Collection[];
  dataSources: DataSource[];
  onSelect: () => void;
  onGeneratePreviews: () => void;
}) {
  const [generating, setGenerating] = useState(false);

  const getDataSourceInfo = () => {
    if (page.collection_id) {
      const collection = collections.find(c => c.id === page.collection_id);
      return {
        type: 'collection',
        name: collection?.name || 'Unknown Collection',
        icon: Layers,
        color: collection?.color || '#6366f1'
      };
    } else if (page.data_source_id) {
      const dataSource = dataSources.find(ds => ds.id === page.data_source_id);
      return {
        type: 'data_source',
        name: dataSource?.name || 'Unknown Data Source',
        icon: Database,
        color: '#10b981'
      };
    }
    return null;
  };

  const dataSourceInfo = getDataSourceInfo();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGeneratePreviews();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{page.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{page.slug_template}</p>
          </div>
          <Badge variant="secondary">
            {page.generated_count} pages
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {dataSourceInfo && (
          <div className="flex items-center gap-2 text-sm">
            <div 
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{ backgroundColor: dataSourceInfo.color }}
            >
              <dataSourceInfo.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-muted-foreground">{dataSourceInfo.name}</span>
          </div>
        )}

        {page.last_generated && (
          <div className="text-sm text-muted-foreground">
            Last generated: {new Date(page.last_generated).toLocaleDateString()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
          >
            <Eye className="w-4 h-4" />
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

function CreateDynamicPageForm({ 
  appId,
  collections,
  dataSources,
  onSuccess 
}: { 
  appId: string;
  collections: Collection[];
  dataSources: DataSource[];
  onSuccess: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug_template: '',
    data_type: 'collection', // 'collection' or 'data_source'
    collection_id: '',
    data_source_id: '',
    endpoint_id: '',
    template: {
      layout: 'default',
      components: []
    },
    settings: {
      generate_on_data_change: true,
      cache_duration: 3600,
      seo_enabled: true
    }
  });
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (formData.data_source_id) {
      loadEndpoints(formData.data_source_id);
    }
  }, [formData.data_source_id]);

  const loadEndpoints = async (sourceId: string) => {
    try {
      const data = await getDataSourceEndpoints(sourceId);
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const submitData = {
        name: formData.name,
        slug_template: formData.slug_template,
        ...(formData.data_type === 'collection' 
          ? { collection_id: formData.collection_id }
          : { 
              data_source_id: formData.data_source_id,
              endpoint_id: formData.endpoint_id 
            }
        ),
        template: formData.template,
        settings: formData.settings
      };

      onSuccess(submitData);
    } catch (error) {
      console.error('Failed to create dynamic page:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Page Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Product Pages"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug_template">URL Template</Label>
          <Input
            id="slug_template"
            value={formData.slug_template}
            onChange={(e) => setFormData({ ...formData, slug_template: e.target.value })}
            placeholder="/products/{slug}"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use {'{field_name}'} for dynamic values
          </p>
        </div>
      </div>

      <div>
        <Label>Data Source</Label>
        <Tabs 
          value={formData.data_type} 
          onValueChange={(value) => setFormData({ ...formData, data_type: value })}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="data_source">External API</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-4">
            <div>
              <Label htmlFor="collection_id">Collection</Label>
              <Select
                value={formData.collection_id}
                onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: collection.color }}
                        />
                        {collection.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="data_source" className="space-y-4">
            <div>
              <Label htmlFor="data_source_id">Data Source</Label>
              <Select
                value={formData.data_source_id}
                onValueChange={(value) => setFormData({ ...formData, data_source_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.data_source_id && (
              <div>
                <Label htmlFor="endpoint_id">Endpoint</Label>
                <Select
                  value={formData.endpoint_id}
                  onValueChange={(value) => setFormData({ ...formData, endpoint_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map((endpoint) => (
                      <SelectItem key={endpoint.id} value={endpoint.id}>
                        {endpoint.name} ({endpoint.method} {endpoint.path})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <Label>Settings</Label>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.settings.generate_on_data_change}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  generate_on_data_change: e.target.checked
                }
              })}
            />
            <span className="text-sm">Auto-generate when data changes</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.settings.seo_enabled}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  seo_enabled: e.target.checked
                }
              })}
            />
            <span className="text-sm">Enable SEO optimization</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={creating}>
          {creating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Dynamic Page
        </Button>
      </div>
    </form>
  );
}

function DynamicPageDetails({ 
  page, 
  appId,
  collections,
  dataSources,
  onClose, 
  onUpdate 
}: { 
  page: DynamicPage;
  appId: string;
  collections: Collection[];
  dataSources: DataSource[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPreviews = async () => {
    try {
      setLoading(true);
      const data = await generateDynamicPagePreviews(page.id);
      setPreviews(data.previews || []);
    } catch (error) {
      console.error('Failed to load previews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreviews();
  }, [page.id]);

  const getDataSourceInfo = () => {
    if (page.collection_id) {
      const collection = collections.find(c => c.id === page.collection_id);
      return collection ? {
        type: 'Collection',
        name: collection.name,
        description: collection.description
      } : null;
    } else if (page.data_source_id) {
      const dataSource = dataSources.find(ds => ds.id === page.data_source_id);
      return dataSource ? {
        type: 'Data Source',
        name: dataSource.name,
        description: dataSource.description
      } : null;
    }
    return null;
  };

  const dataSourceInfo = getDataSourceInfo();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {page.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="previews">Previews ({previews.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">URL Template</h4>
                <code className="text-sm bg-muted p-2 rounded block">
                  {page.slug_template}
                </code>
              </Card>
              
              {dataSourceInfo && (
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Data Source</h4>
                  <div>
                    <p className="font-medium">{dataSourceInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{dataSourceInfo.type}</p>
                    {dataSourceInfo.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {dataSourceInfo.description}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">{page.generated_count}</p>
                  <p className="text-sm text-muted-foreground">Generated Pages</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {page.last_generated ? new Date(page.last_generated).toLocaleDateString() : 'Never'}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Date(page.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Page Template</h3>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </div>
            
            <Card className="p-4">
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(page.template, null, 2)}
              </pre>
            </Card>
          </TabsContent>

          <TabsContent value="previews" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generated Pages</h3>
              <Button onClick={loadPreviews} disabled={loading}>
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : previews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pages generated yet</p>
                <Button className="mt-4" onClick={loadPreviews}>
                  Generate Previews
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {previews.map((preview, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">{preview.title || preview.slug}</h4>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {preview.slug}
                    </p>
                    {preview.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {preview.description}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Page Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={page.name} readOnly />
              </div>
              <div>
                <Label>URL Template</Label>
                <Input value={page.slug_template} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={page.settings.generate_on_data_change}
                      readOnly
                    />
                    <span className="text-sm">Auto-generate when data changes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={page.settings.seo_enabled}
                      readOnly
                    />
                    <span className="text-sm">SEO optimization enabled</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Settings
                </Button>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Page
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}