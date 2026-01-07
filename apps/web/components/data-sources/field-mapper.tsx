'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  Wand2,
  AlertCircle
} from 'lucide-react';

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transform?: string;
}

interface FieldMapperProps {
  sourceFields: string[];
  targetFields: { name: string; type: string; required?: boolean }[];
  mappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
}

const transforms = [
  { value: 'none', label: 'No transform' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
  { value: 'number', label: 'To Number' },
  { value: 'currency', label: 'Format Currency' },
  { value: 'date', label: 'Format Date' },
  { value: 'truncate', label: 'Truncate (50 chars)' },
];

export function FieldMapper({
  sourceFields,
  targetFields,
  mappings,
  onChange
}: FieldMapperProps) {
  const [autoMapSuggestions, setAutoMapSuggestions] = useState<FieldMapping[]>([]);

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      sourceField: '',
      targetField: '',
    };
    onChange([...mappings, newMapping]);
  };

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    onChange(mappings.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(m => m.id !== id));
  };

  const autoMap = () => {
    // Simple auto-mapping based on field name similarity
    const suggestions: FieldMapping[] = [];
    
    targetFields.forEach(target => {
      const matchingSource = sourceFields.find(source => {
        const sourceLower = source.toLowerCase();
        const targetLower = target.name.toLowerCase();
        return sourceLower === targetLower ||
               sourceLower.includes(targetLower) ||
               targetLower.includes(sourceLower);
      });
      
      if (matchingSource) {
        suggestions.push({
          id: `auto-${Date.now()}-${target.name}`,
          sourceField: matchingSource,
          targetField: target.name,
        });
      }
    });
    
    if (suggestions.length > 0) {
      onChange(suggestions);
    }
  };

  const unmappedTargets = targetFields.filter(
    t => !mappings.some(m => m.targetField === t.name)
  );

  const unmappedRequired = unmappedTargets.filter(t => t.required);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Field Mappings</h4>
          <p className="text-sm text-muted-foreground">
            Map source data fields to widget properties
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={autoMap}>
          <Wand2 className="w-4 h-4 mr-2" />
          Auto Map
        </Button>
      </div>

      {unmappedRequired.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-400">
            {unmappedRequired.length} required field(s) not mapped: {unmappedRequired.map(t => t.name).join(', ')}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {mappings.map((mapping) => (
          <Card key={mapping.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Source Field</Label>
                <Select
                  value={mapping.sourceField}
                  onValueChange={(value) => updateMapping(mapping.id, { sourceField: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground mt-5" />

              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Target Property</Label>
                <Select
                  value={mapping.targetField}
                  onValueChange={(value) => updateMapping(mapping.id, { targetField: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetFields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        <span className="flex items-center gap-2">
                          {field.name}
                          {field.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Label className="text-xs text-muted-foreground mb-1 block">Transform</Label>
                <Select
                  value={mapping.transform || 'none'}
                  onValueChange={(value) => updateMapping(mapping.id, { transform: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transforms.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-5 text-red-500 hover:text-red-600"
                onClick={() => removeMapping(mapping.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={addMapping}>
        <Plus className="w-4 h-4 mr-2" />
        Add Field Mapping
      </Button>

      {mappings.length > 0 && (
        <div className="pt-4 border-t">
          <h5 className="text-sm font-medium mb-2">Preview</h5>
          <div className="bg-muted rounded-lg p-3 text-sm font-mono">
            {'{'}
            {mappings.filter(m => m.sourceField && m.targetField).map((m, i) => (
              <div key={m.id} className="ml-4">
                <span className="text-blue-600">"{m.targetField}"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-green-600">data.{m.sourceField}</span>
                {m.transform && (
                  <span className="text-purple-600"> | {m.transform}</span>
                )}
                {i < mappings.filter(m => m.sourceField && m.targetField).length - 1 && ','}
              </div>
            ))}
            {'}'}
          </div>
        </div>
      )}
    </div>
  );
}
