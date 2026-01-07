"""
SDK Generator Service
Generates client SDKs from OpenAPI specification
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class SDKGenerator:
    """Generate client SDKs for various platforms"""
    
    def __init__(self, openapi_spec: Dict[str, Any]):
        self.spec = openapi_spec
        self.base_url = "https://api.webcraft.dev"
    
    def generate_typescript_sdk(self) -> str:
        """Generate TypeScript/JavaScript SDK"""
        code = '''/**
 * WebCraft API Client
 * Auto-generated TypeScript SDK
 * Generated: {timestamp}
 */

export interface WebCraftConfig {{
  apiKey?: string;
  baseUrl?: string;
}}

export interface ApiResponse<T> {{
  data: T;
  status: number;
  headers: Record<string, string>;
}}

class WebCraftClient {{
  private apiKey: string;
  private baseUrl: string;

  constructor(config: WebCraftConfig = {{}}) {{
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || '{base_url}';
  }}

  private async request<T>(
    method: string,
    path: string,
    options: RequestInit = {{}}
  ): Promise<ApiResponse<T>> {{
    const url = `${{this.baseUrl}}${{path}}`;
    const headers: Record<string, string> = {{
      'Content-Type': 'application/json',
      ...(this.apiKey && {{ 'Authorization': `Bearer ${{this.apiKey}}` }}),
      ...(options.headers as Record<string, string>),
    }};

    const response = await fetch(url, {{
      method,
      headers,
      ...options,
    }});

    const data = await response.json();
    return {{
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    }};
  }}

  // Apps
  async getApps(): Promise<ApiResponse<any>> {{
    return this.request('GET', '/api/v1/apps');
  }}

  async getApp(appId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}`);
  }}

  async createApp(data: any): Promise<ApiResponse<any>> {{
    return this.request('POST', '/api/v1/apps', {{
      body: JSON.stringify(data),
    }});
  }}

  async updateApp(appId: string, data: any): Promise<ApiResponse<any>> {{
    return this.request('PUT', `/api/v1/apps/${{appId}}`, {{
      body: JSON.stringify(data),
    }});
  }}

  async deleteApp(appId: string): Promise<ApiResponse<any>> {{
    return this.request('DELETE', `/api/v1/apps/${{appId}}`);
  }}

  // Pages
  async getPages(appId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/pages`);
  }}

  async getPage(appId: string, pageId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/pages/${{pageId}}`);
  }}

  async createPage(appId: string, data: any): Promise<ApiResponse<any>> {{
    return this.request('POST', `/api/v1/apps/${{appId}}/pages`, {{
      body: JSON.stringify(data),
    }});
  }}

  // Collections
  async getCollections(appId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/collections`);
  }}

  async getRecords(appId: string, collectionId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/collections/${{collectionId}}/records`);
  }}

  async createRecord(appId: string, collectionId: string, data: any): Promise<ApiResponse<any>> {{
    return this.request('POST', `/api/v1/apps/${{appId}}/collections/${{collectionId}}/records`, {{
      body: JSON.stringify(data),
    }});
  }}

  // Automations
  async getAutomations(appId: string): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/automations`);
  }}

  async executeAutomation(appId: string, automationId: string, data?: any): Promise<ApiResponse<any>> {{
    return this.request('POST', `/api/v1/apps/${{appId}}/automations/${{automationId}}/execute`, {{
      body: JSON.stringify(data || {{}}),
    }});
  }}

  // Analytics
  async getAnalytics(appId: string, timeRange: string = '30d'): Promise<ApiResponse<any>> {{
    return this.request('GET', `/api/v1/apps/${{appId}}/analytics/overview?time_range=${{timeRange}}`);
  }}

  // Media
  async uploadMedia(appId: string, file: File): Promise<ApiResponse<any>> {{
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('POST', `/api/v1/apps/${{appId}}/media/upload`, {{
      body: formData,
      headers: {{}}, // Let browser set content-type for FormData
    }});
  }}
}}

export default WebCraftClient;
export {{ WebCraftClient }};
'''.format(timestamp=datetime.utcnow().isoformat(), base_url=self.base_url)
        
        return code
    
    def generate_python_sdk(self) -> str:
        """Generate Python SDK"""
        code = '''"""
WebCraft API Client
Auto-generated Python SDK
Generated: {timestamp}
"""

import requests
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class ApiResponse:
    data: Any
    status_code: int
    headers: Dict[str, str]


class WebCraftClient:
    """WebCraft API Client"""
    
    def __init__(self, api_key: str = "", base_url: str = "{base_url}"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        if api_key:
            self.session.headers["Authorization"] = f"Bearer {{api_key}}"
        self.session.headers["Content-Type"] = "application/json"
    
    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> ApiResponse:
        url = f"{{self.base_url}}{{path}}"
        response = self.session.request(
            method=method,
            url=url,
            json=data,
            params=params
        )
        return ApiResponse(
            data=response.json() if response.content else None,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    
    # Apps
    def get_apps(self) -> ApiResponse:
        return self._request("GET", "/api/v1/apps")
    
    def get_app(self, app_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}")
    
    def create_app(self, data: Dict) -> ApiResponse:
        return self._request("POST", "/api/v1/apps", data=data)
    
    def update_app(self, app_id: str, data: Dict) -> ApiResponse:
        return self._request("PUT", f"/api/v1/apps/{{app_id}}", data=data)
    
    def delete_app(self, app_id: str) -> ApiResponse:
        return self._request("DELETE", f"/api/v1/apps/{{app_id}}")
    
    # Pages
    def get_pages(self, app_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/pages")
    
    def get_page(self, app_id: str, page_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/pages/{{page_id}}")
    
    def create_page(self, app_id: str, data: Dict) -> ApiResponse:
        return self._request("POST", f"/api/v1/apps/{{app_id}}/pages", data=data)
    
    # Collections
    def get_collections(self, app_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/collections")
    
    def get_records(self, app_id: str, collection_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/collections/{{collection_id}}/records")
    
    def create_record(self, app_id: str, collection_id: str, data: Dict) -> ApiResponse:
        return self._request("POST", f"/api/v1/apps/{{app_id}}/collections/{{collection_id}}/records", data=data)
    
    # Automations
    def get_automations(self, app_id: str) -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/automations")
    
    def execute_automation(self, app_id: str, automation_id: str, data: Optional[Dict] = None) -> ApiResponse:
        return self._request("POST", f"/api/v1/apps/{{app_id}}/automations/{{automation_id}}/execute", data=data or {{}})
    
    # Analytics
    def get_analytics(self, app_id: str, time_range: str = "30d") -> ApiResponse:
        return self._request("GET", f"/api/v1/apps/{{app_id}}/analytics/overview", params={{"time_range": time_range}})


# Convenience function
def create_client(api_key: str = "", base_url: str = "{base_url}") -> WebCraftClient:
    return WebCraftClient(api_key=api_key, base_url=base_url)
'''.format(timestamp=datetime.utcnow().isoformat(), base_url=self.base_url)
        
        return code
    
    def generate_react_hooks(self) -> str:
        """Generate React hooks for the API"""
        code = '''/**
 * WebCraft React Hooks
 * Auto-generated React hooks for WebCraft API
 * Generated: {timestamp}
 */

import {{ useState, useEffect, useCallback }} from 'react';

const BASE_URL = '{base_url}';

interface UseApiOptions {{
  apiKey?: string;
  immediate?: boolean;
}}

interface UseApiResult<T> {{
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}}

function useApi<T>(
  path: string,
  options: UseApiOptions = {{}}
): UseApiResult<T> {{
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {{
    setLoading(true);
    setError(null);
    try {{
      const headers: Record<string, string> = {{
        'Content-Type': 'application/json',
      }};
      if (options.apiKey) {{
        headers['Authorization'] = `Bearer ${{options.apiKey}}`;
      }}
      
      const response = await fetch(`${{BASE_URL}}${{path}}`, {{ headers }});
      if (!response.ok) throw new Error(`HTTP ${{response.status}}`);
      const result = await response.json();
      setData(result);
    }} catch (err) {{
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }} finally {{
      setLoading(false);
    }}
  }}, [path, options.apiKey]);

  useEffect(() => {{
    if (options.immediate !== false) {{
      fetchData();
    }}
  }}, [fetchData, options.immediate]);

  return {{ data, loading, error, refetch: fetchData }};
}}

// Apps hooks
export function useApps(apiKey?: string) {{
  return useApi<any>('/api/v1/apps', {{ apiKey }});
}}

export function useApp(appId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}`, {{ apiKey }});
}}

// Pages hooks
export function usePages(appId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/pages`, {{ apiKey }});
}}

export function usePage(appId: string, pageId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/pages/${{pageId}}`, {{ apiKey }});
}}

// Collections hooks
export function useCollections(appId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/collections`, {{ apiKey }});
}}

export function useRecords(appId: string, collectionId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/collections/${{collectionId}}/records`, {{ apiKey }});
}}

// Analytics hooks
export function useAnalytics(appId: string, timeRange: string = '30d', apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/analytics/overview?time_range=${{timeRange}}`, {{ apiKey }});
}}

// Automations hooks
export function useAutomations(appId: string, apiKey?: string) {{
  return useApi<any>(`/api/v1/apps/${{appId}}/automations`, {{ apiKey }});
}}

export {{ useApi }};
'''.format(timestamp=datetime.utcnow().isoformat(), base_url=self.base_url)
        
        return code
    
    def generate_curl_examples(self) -> str:
        """Generate cURL examples"""
        examples = '''# WebCraft API - cURL Examples
# Generated: {timestamp}

# Authentication
# Replace YOUR_API_KEY with your actual API key

# Get all apps
curl -X GET "{base_url}/api/v1/apps" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Get single app
curl -X GET "{base_url}/api/v1/apps/APP_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create app
curl -X POST "{base_url}/api/v1/apps" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"name": "My App", "app_type": "website"}}'

# Get pages
curl -X GET "{base_url}/api/v1/apps/APP_ID/pages" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create page
curl -X POST "{base_url}/api/v1/apps/APP_ID/pages" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"title": "Home", "slug": "home", "is_homepage": true}}'

# Get collections
curl -X GET "{base_url}/api/v1/apps/APP_ID/collections" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create record
curl -X POST "{base_url}/api/v1/apps/APP_ID/collections/COLLECTION_ID/records" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"data": {{"title": "My Record", "status": "active"}}}}'

# Get analytics
curl -X GET "{base_url}/api/v1/apps/APP_ID/analytics/overview?time_range=30d" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Execute automation
curl -X POST "{base_url}/api/v1/apps/APP_ID/automations/AUTOMATION_ID/execute" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"trigger_data": {{}}}}'

# Export static site
curl -X POST "{base_url}/api/v1/apps/APP_ID/export/static" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"format": "zip", "minify_html": true}}'
'''.format(timestamp=datetime.utcnow().isoformat(), base_url=self.base_url)
        
        return examples
    
    def generate_all(self) -> Dict[str, str]:
        """Generate all SDK variants"""
        return {
            "typescript": self.generate_typescript_sdk(),
            "python": self.generate_python_sdk(),
            "react-hooks": self.generate_react_hooks(),
            "curl": self.generate_curl_examples()
        }
