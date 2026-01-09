'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, Monitor, ExternalLink } from 'lucide-react';
import { WidgetRenderer } from '@/components/editor/widget-renderer';
import { PreviewLoading } from '@/components/preview/preview-loading';
import { PreviewError } from '@/components/preview/preview-error';

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
  const token = params.token as string;
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    loadPreviewData();
  }, [token]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading embed preview data for token:', token);
      
      const response = await apiClient.get(`/api/apps/preview/${token}?device=desktop`);
      console.log('📡 Embed preview API response:', response.data);
      
      if (!response.data || !response.data.app) {
        throw new Error('Invalid preview data received');
      }
      
      // Debug the data structure
      console.log('🔍 Embed preview data structure:', {
        app: {
          id: response.data.app?.id,
          name: response.data.app?.name,
          type: response.data.app?.app_type,
          hasConfig: !!response.data.app?.config,
          configKeys: response.data.app?.config ? Object.keys(response.data.app.config) : []
        },
        pages: response.data.pages?.map((page: any) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          isHomepage: page.is_homepage,
          hasContent: !!page.content,
          contentKeys: page.content ? Object.keys(page.content) : [],
          elementsCount: page.content?.elements?.length || 0
        })) || []
      });
      
      setPreviewData(response.data);
      
      // Set initial page
      const pages = response.data.pages;
      if (pages && pages.length > 0) {
        const homepage = pages.find((p: any) => p.is_homepage);
        const selectedPage = homepage ? homepage.slug : pages[0].slug;
        console.log('🏠 Setting initial page:', selectedPage);
        setCurrentPage(selectedPage);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Embed preview API error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load preview';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PreviewLoading device="desktop" message="Loading embed preview..." />;
  }

  if (error || !previewData) {
    return (
      <PreviewError 
        error={error || 'No preview data available'}
        token={token}
        onRetry={loadPreviewData}
      />
    );
  }

  const activePage = previewData.pages?.find(p => p.slug === currentPage) || 
                    previewData.pages?.find(p => p.is_homepage) || 
                    previewData.pages?.[0];

  const elements = activePage?.content?.elements || previewData.app.config?.elements || [];
  const themeConfig = previewData.app.theme_config || {};
  const colors = themeConfig.colors || {};
  const fonts = themeConfig.fonts || {};

  const themeStyles = {
    '--primary-color': colors.primary || '#3b82f6',
    '--secondary-color': colors.secondary || '#6b7280',
    '--accent-color': colors.accent || '#8b5cf6',
    '--background-color': colors.background || '#ffffff',
    '--foreground-color': colors.foreground || '#1f2937',
    '--muted-color': colors.muted || '#f3f4f6',
    '--heading-font': fonts.heading || 'Inter',
    '--body-font': fonts.body || 'Inter',
    '--border-radius': themeConfig.borderRadius || '8px',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen" style={themeStyles}>
      {/* Minimal Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--heading-font)' }}>
            {previewData.app.name}
          </span>
          {activePage && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {activePage.title}
            </span>
          )}
        </div>
        
        <a
          href={`/preview/${token}`}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Full Preview</span>
        </a>
      </div>

      {/* Page Navigation - Minimal */}
      {previewData.pages && previewData.pages.length > 1 && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <nav className="flex flex-wrap gap-1">
            {previewData.pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.slug)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                  currentPage === page.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'var(--body-font)' }}
              >
                {page.title}
                {page.is_homepage && <span className="ml-1">🏠</span>}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* App Content */}
      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: 'var(--background-color)',
          color: 'var(--foreground-color)',
          fontFamily: 'var(--body-font)'
        }}
      >
        {elements && elements.length > 0 ? (
          <div className="relative w-full min-h-screen">
            {/* Debug info */}
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-50">
              Elements: {elements.length}
            </div>
            
            {elements.map((element: any, index: number) => {
              console.log(`🎨 Rendering embed element ${index}:`, {
                id: element.id,
                type: element.type,
                position: element.position,
                size: element.size,
                props: element.props
              });
              
              return (
                <div
                  key={element.id || index}
                  className="absolute border border-dashed border-green-300/50"
                  style={{
                    left: element.position?.x || 0,
                    top: element.position?.y || (index * 100),
                    width: element.size?.width || 'auto',
                    height: element.size?.height || 'auto',
                    zIndex: element.zIndex || index + 1,
                    transform: element.transform || 'none',
                    minWidth: '50px',
                    minHeight: '30px'
                  }}
                  title={`${element.type} - ${element.id}`}
                >
                  <WidgetRenderer
                    element={element}
                    isSelected={false}
                    isHovered={false}
                    isPreview={true}
                    onSelect={() => {}}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'var(--muted-color)' }}
              >
                <Monitor className="w-12 h-12 text-gray-400" />
              </div>
              <h1 
                className="text-4xl font-bold mb-4"
                style={{ 
                  fontFamily: 'var(--heading-font)',
                  color: 'var(--foreground-color)'
                }}
              >
                {activePage ? activePage.title : previewData.app.name}
              </h1>
              <p className="text-xl text-gray-600 mb-8" style={{ fontFamily: 'var(--body-font)' }}>
                {activePage 
                  ? `This page is ready for content.`
                  : "This app is ready for content."
                }
              </p>
              
              <div 
                className="bg-white rounded-lg shadow-sm border p-6 text-left max-w-md mx-auto"
                style={{ borderColor: 'var(--muted-color)' }}
              >
                <h4 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--heading-font)' }}>
                  App Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                      {previewData.app.app_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pages:</span>
                    <span className="font-medium">{previewData.pages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Elements:</span>
                    <span className="font-medium">{elements.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}