'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { AppPreviewRenderer } from '@/components/preview/app-preview-renderer';

interface PreviewData {
  app: {
    id: string;
    name: string;
    slug: string;
    app_type: string;
    config: any;
    theme_config: any;
    seo_config: any;
  };
  preview: {
    token: string;
    device: string;
    expires_at: string;
  };
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    content: any;
    is_homepage: boolean;
    meta_title?: string;
    meta_description?: string;
  }>;
}

export default function EmbedPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const device = searchParams.get('device') || 'desktop';
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreviewData();
  }, [token, device]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/preview/${token}?device=${device}`);
      
      if (!response.data || !response.data.app) {
        throw new Error('Invalid preview data received');
      }
      
      setPreviewData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-gray-600 text-sm">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Preview Unavailable</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  const expiresAt = new Date(previewData.preview.expires_at);
  const isExpired = expiresAt < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Preview Expired</h2>
          <p className="text-gray-600 text-sm">
            This preview link has expired. Please generate a new preview link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header for Embed */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-medium text-gray-900">
              {previewData.app.name}
            </h1>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {device.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Preview Mode
          </div>
        </div>
      </div>

      {/* App Content */}
      <div className="h-full">
        <AppPreviewRenderer 
          app={previewData.app}
          device={device as 'desktop' | 'tablet' | 'mobile'}
          pages={previewData.pages}
          showControls={false}
          className="min-h-screen"
        />
      </div>
    </div>
  );
}