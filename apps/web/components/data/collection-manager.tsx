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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  Plus,
  Settings,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Layers,
  FileText,
  Hash,
  Calendar,
  ToggleLeft,
  Image,
  Link,
  Type
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  schema: FieldDefinition[];
  settings: Record<string, any>;
  record_count: number;
  created_at: string;
  updated_at: string;
}

interface FieldDefinition {
  name: string;
  type: string;
  label?: string;
  required: boolean;
  unique: boolean;
  default?: any;
  options?: string[];
  relation_collection_id?: string;
  relation_multiple?: boolean;
  formula?: string;
  validation?: Record<string, any>;
}

interface Record {
  id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface CollectionManagerProps {
  appId: string;
  onCollectionSelect?: (collectionId: string) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'datetime', label: 'Date & Time', icon: Calendar },
  { value: 'select', label: 'Select', icon: FileText },
  { value: 'multiselect', label: 'Multi-select', icon: FileText },
  { value: 'file', label: 'File', icon: FileText },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'relation', label: 'Relation', icon: Link },
];

export function CollectionManager({ appId, onCollectionSelect }: CollectionManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    loadCollections();
  }, [appId]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/collections/apps/${appId}/collections`);
      setCollections(response.data.collections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collections</h2>
          <p className="text-muted-foreground">
            Create custom databases to store and manage your app's data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <CreateCollectionForm 
              appId={appId} 
              onSuccess={() => {
                setShowCreateDialog(false);
                loadCollections();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Collections</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first collection to start storing structured data
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onSelect={() => setSelectedCollection(collection)}
              onCollectionSelect={onCollectionSelect}
            />
          ))}
        </div>
      )}

      {selectedCollection && (
        <CollectionDetails
          collection={selectedCollection}
          appId={appId}
          onClose={() => setSelectedCollection(null)}
          onUpdate={loadCollections}
        />
      )}
    </div>
  );
}

function CollectionCard({ 
  collection, 
  onSelect, 
  onCollectionSelect 
}: { 
  collection: Collection;
  onSelect: () => void;
  onCollectionSelect?: (collectionId: string) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: collection.color }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{collection.slug}</p>
            </div>
          </div>
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground">{collection.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Records</span>
          <Badge variant="secondary">{collection.record_count}</Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fields</span>
          <Badge variant="secondary">{collection.schema.length}</Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCollectionSelect?.(collection.id)}
          >
            <Eye className="w-4 h-4" />
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
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCollectionForm({ 
  appId, 
  onSuccess 
}: { 
  appId: string; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'database',
    color: '#6366f1',
    schema: [] as FieldDefinition[]
  });
  const [creating, setCreating] = useState(false);

  const addField = () => {
    setFormData({
      ...formData,
      schema: [
        ...formData.schema,
        {
          name: '',
          type: 'text',
          label: '',
          required: false,
          unique: false
        }
      ]
    });
  };

  const updateField = (index: number, field: Partial<FieldDefinition>) => {
    const newSchema = [...formData.schema];
    newSchema[index] = { ...newSchema[index], ...field };
    setFormData({ ...formData, schema: newSchema });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      schema: formData.schema.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await apiClient.post(`/collections/apps/${appId}/collections`, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Collection Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Products"
            required
          />
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Store product information"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Fields</Label>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>

        <div className="space-y-4">
          {formData.schema.map((field, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="title"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(index, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                  />
                  <span className="text-sm">Required</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.unique}
                    onChange={(e) => updateField(index, { unique: e.target.checked })}
                  />
                  <span className="text-sm">Unique</span>
                </label>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={creating}>
          {creating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Collection
        </Button>
      </div>
    </form>
  );
}

function CollectionDetails({ 
  collection, 
  appId,
  onClose, 
  onUpdate 
}: { 
  collection: Collection;
  appId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRecord, setShowCreateRecord] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [collection.id]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/collections/apps/${appId}/collections/${collection.id}/records`
      );
      setRecords(response.data.records || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: collection.color }}
            >
              <Layers className="w-4 h-4" />
            </div>
            {collection.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="records" className="w-full">
          <TabsList>
            <TabsTrigger value="records">Records ({collection.record_count})</TabsTrigger>
            <TabsTrigger value="schema">Schema ({collection.schema.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Records</h3>
              <Button onClick={() => setShowCreateRecord(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No records yet</p>
                <Button className="mt-4" onClick={() => setShowCreateRecord(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Record
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {collection.schema.map((field) => (
                        <TableHead key={field.name}>
                          {field.label || field.name}
                        </TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        {collection.schema.map((field) => (
                          <TableCell key={field.name}>
                            {record.data[field.name] || '-'}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schema" className="space-y-4">
            <h3 className="text-lg font-semibold">Schema</h3>
            <div className="space-y-2">
              {collection.schema.map((field, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{field.label || field.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {field.type} {field.required && '• Required'} {field.unique && '• Unique'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Collection Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={collection.name} readOnly />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={collection.slug} readOnly />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={collection.description} readOnly />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Collection
                </Button>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Collection
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}