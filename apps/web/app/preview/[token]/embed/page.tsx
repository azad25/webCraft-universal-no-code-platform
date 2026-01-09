'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, Monitor, ExternalLink, Globe, Layers, Home, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-white" style={themeStyles}>
      {/* Minimal Professional Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'var(--heading-font)' }}>
              {previewData.app.name}
            </span>
          </div>
          
          {activePage && (
            <>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">
                  {activePage.title}
                </span>
              </div>
            </>
          )}
          
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium">
            {previewData.app.app_type}
          </span>
        </div>
        
        <a
          href={`/preview/${token}`}
          className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Full Preview</span>
        </a>
      </div>

      {/* Enhanced Page Navigation */}
      {previewData.pages && previewData.pages.length > 1 && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <nav className="flex flex-wrap gap-2">
            {previewData.pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.slug)}
                className={`group flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === page.slug
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                style={{ fontFamily: 'var(--body-font)' }}
              >
                {page.is_homepage && <Home className="w-4 h-4" />}
                <span>{page.title}</span>
                {currentPage === page.slug && (
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Enhanced App Content */}
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
            {/* Render elements in stacked layout */}
            <div className="space-y-0">
              {elements.map((element: any, index: number) => {
                return (
                  <motion.div
                    key={element.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="w-full"
                    style={{
                      minHeight: element.size?.height || 'auto',
                      zIndex: element.zIndex || index + 1,
                    }}
                  >
                    <WidgetRenderer
                      element={element}
                      isSelected={false}
                      isHovered={false}
                      isPreview={true}
                      onSelect={() => {}}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl"
            >
              <div 
                className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg"
                style={{ backgroundColor: 'var(--muted-color)' }}
              >
                <Zap className="w-16 h-16 text-slate-400" />
              </div>
              <h1 
                className="text-5xl font-bold mb-6"
                style={{ 
                  fontFamily: 'var(--heading-font)',
                  color: 'var(--foreground-color)'
                }}
              >
                {activePage ? activePage.title : previewData.app.name}
              </h1>
              <p className="text-2xl text-slate-600 mb-8 leading-relaxed" style={{ fontFamily: 'var(--body-font)' }}>
                {activePage 
                  ? `This page is ready for content.`
                  : "This app is ready for content."
                }
              </p>
              
              <div 
                className="bg-white rounded-2xl shadow-lg border p-8 text-left max-w-lg mx-auto"
                style={{ borderColor: 'var(--muted-color)' }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'var(--heading-font)' }}>
                      App Information
                    </h4>
                    <p className="text-slate-500 text-sm">Embed Preview</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block mb-1">Type</span>
                      <span className="font-semibold capitalize px-3 py-1 bg-slate-100 rounded-lg text-sm">
                        {previewData.app.app_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Pages</span>
                      <span className="font-bold text-lg">{previewData.pages?.length || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block mb-1">Current Page</span>
                      <span className="font-semibold">{activePage?.title || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Elements</span>
                      <span className="font-bold text-lg">{elements.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}