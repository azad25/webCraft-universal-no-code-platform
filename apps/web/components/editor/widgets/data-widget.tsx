'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Globe,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Table,
  LayoutGrid,
  List,
  MoreVertical
} from 'lucide-react';
import { fetchDataSourceData } from '@/lib/data-source-api';

interface DataItem {
  [key: string]: any;
}

interface DataWidgetProps {
  // Data source configuration
  sourceType?: 'api' | 'scraper' | 'static';
  sourceId?: string;
  endpointId?: string;
  
  // New data source props from properties panel
  dataSourceId?: string;
  dataEndpointId?: string;
  dataSourceType?: 'api' | 'scraper';
  
  // Display configuration
  displayMode?: 'table' | 'cards' | 'list' | 'custom';
  title?: string;
  showHeader?: boolean;
  showRefresh?: boolean;
  
  // Data
  staticData?: DataItem[];
  fieldMappings?: Record<string, string>;
  
  // Styling
  columns?: number;
  cardStyle?: 'default' | 'bordered' | 'elevated';
  
  // Refresh
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  
  // Editor
  isEditing?: boolean;
  onChange?: (props: any) => void;
  
  // Additional props
  [key: string]: any;
}

// Mock data for preview
const mockApiData: DataItem[] = [
  { id: 1, title: 'Product A', price: '$99.00', status: 'In Stock', image: '/placeholder.jpg' },
  { id: 2, title: 'Product B', price: '$149.00', status: 'Low Stock', image: '/placeholder.jpg' },
  { id: 3, title: 'Product C', price: '$79.00', status: 'Out of Stock', image: '/placeholder.jpg' },
  { id: 4, title: 'Product D', price: '$199.00', status: 'In Stock', image: '/placeholder.jpg' },
];

const mockScraperData: DataItem[] = [
  { title: 'Tech News: AI Advances', source: 'TechCrunch', date: '2025-01-07', url: '#' },
  { title: 'Market Update: Stocks Rise', source: 'Bloomberg', date: '2025-01-07', url: '#' },
  { title: 'New Product Launch', source: 'The Verge', date: '2025-01-06', url: '#' },
];

export function DataWidget({
  sourceType = 'static',
  sourceId,
  endpointId,
  displayMode = 'cards',
  title = 'Data Widget',
  showHeader = true,
  showRefresh = true,
  staticData,
  fieldMappings,
  columns = 2,
  cardStyle = 'default',
  autoRefresh = false,
  refreshInterval = 60,
  isEditing = false,
  onChange,
  // New props from properties panel
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  ...props
}: DataWidgetProps) {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use new data source props if available, fallback to legacy props
  const activeSourceType = dataSourceType || sourceType;
  const activeSourceId = dataSourceId || sourceId;
  const activeEndpointId = dataEndpointId || endpointId;

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // If we have a real data source ID, fetch from API
        if (activeSourceId && activeEndpointId && activeSourceType === 'api') {
          try {
            const response = await fetchDataSourceData(activeSourceId, activeEndpointId);
            setData(Array.isArray(response.data) ? response.data : [response.data]);
            setLastUpdated(new Date());
            return;
          } catch (apiError) {
            console.warn('Failed to fetch from API, falling back to mock data:', apiError);
            // Fall through to mock data
          }
        }
        
        // Fallback to mock data for preview/development
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (activeSourceType === 'api') {
          setData(mockApiData);
        } else if (activeSourceType === 'scraper') {
          setData(mockScraperData);
        } else if (staticData) {
          setData(staticData);
        } else {
          setData(mockApiData);
        }
        
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto refresh
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [activeSourceType, activeSourceId, activeEndpointId, staticData, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 500);
  };

  const getSourceIcon = () => {
    switch (activeSourceType) {
      case 'api': return <Database className="w-4 h-4" />;
      case 'scraper': return <Globe className="w-4 h-4" />;
      default: return <Table className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (activeSourceType) {
      case 'api': return 'API';
      case 'scraper': return 'Scraper';
      default: return 'Static';
    }
  };

  const renderTableView = () => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'image');
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {keys.map(key => (
                <th key={key} className="text-left p-2 font-medium capitalize">
                  {fieldMappings?.[key] || key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                {keys.map(key => (
                  <td key={key} className="p-2">
                    {typeof item[key] === 'string' && item[key].startsWith('http') ? (
                      <a href={item[key]} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      item[key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardsView = () => {
    return (
      <div className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4"
      )}>
        {data.map((item, idx) => (
          <Card key={idx} className={cn(
            cardStyle === 'bordered' && 'border-2',
            cardStyle === 'elevated' && 'shadow-lg'
          )}>
            <CardContent className="p-4">
              {item.image && (
                <div className="w-full h-24 bg-muted rounded mb-3 flex items-center justify-center">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <h4 className="font-medium mb-1">{item.title || item.name || `Item ${idx + 1}`}</h4>
              {item.price && <p className="text-lg font-bold text-primary">{item.price}</p>}
              {item.status && (
                <Badge variant={item.status === 'In Stock' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'} className="mt-2">
                  {item.status}
                </Badge>
              )}
              {item.source && <p className="text-sm text-muted-foreground">{item.source}</p>}
              {item.date && <p className="text-xs text-muted-foreground mt-1">{item.date}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Database className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{item.title || item.name || `Item ${idx + 1}`}</p>
                {item.source && <p className="text-sm text-muted-foreground">{item.source}</p>}
              </div>
            </div>
            <div className="text-right">
              {item.price && <p className="font-bold">{item.price}</p>}
              {item.status && <Badge variant="outline">{item.status}</Badge>}
              {item.date && <p className="text-xs text-muted-foreground">{item.date}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Empty state for editor
  if (isEditing && !activeSourceId && activeSourceType !== 'static') {
    return (
      <div className="w-full h-full min-h-[200px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <Database className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">Connect a Data Source</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select an API or web scraper to display dynamic data
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            Connect API
          </Button>
          <Button variant="outline" size="sm">
            <Globe className="w-4 h-4 mr-2" />
            Connect Scraper
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Badge variant="outline" className="gap-1">
              {getSourceIcon()}
              {getSourceLabel()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      ) : (
        <>
          {displayMode === 'table' && renderTableView()}
          {displayMode === 'cards' && renderCardsView()}
          {displayMode === 'list' && renderListView()}
        </>
      )}

      {/* Display mode toggle for editor */}
      {isEditing && (
        <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t">
          <Button
            variant={displayMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange?.({ displayMode: 'table' })}
          >
            <Table className="w-4 h-4" />
          </Button>
          <Button
            variant={displayMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange?.({ displayMode: 'cards' })}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={displayMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange?.({ displayMode: 'list' })}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
