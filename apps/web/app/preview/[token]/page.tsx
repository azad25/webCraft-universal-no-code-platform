'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, Smartphone, Tablet, Monitor, ExternalLink, QrCode, ArrowLeft, RefreshCw, Eye, EyeOff, Copy, Check, Keyboard, Home, Globe, Layers, Zap } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
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

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;
  const device = searchParams.get('device') || 'desktop';
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDevice, setCurrentDevice] = useState(device);
  const [showQR, setShowQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPreviewBar, setShowPreviewBar] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    loadPreviewData();
  }, [token, currentDevice]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC to exit fullscreen
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
        setShowPreviewBar(true);
      }
      // F11 to toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // R to refresh (Ctrl+R or Cmd+R)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      // C to copy link (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.shiftKey) {
        e.preventDefault();
        handleCopyLink();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullscreen]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      console.log('� Loading Apreview data for token:', token);
      
      const response = await apiClient.get(`/api/apps/preview/${token}?device=${currentDevice}`);
      console.log('📡 Preview API response:', response.data);
      
      if (!response.data || !response.data.app) {
        throw new Error('Invalid preview data received');
      }
      
      setPreviewData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Preview API error:', err);
      
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load preview';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPreviewData();
    setIsRefreshing(false);
  };

  const handleClose = () => {
    if (previewData?.app?.id) {
      router.push(`/editor/${previewData.app.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/preview/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    setShowPreviewBar(!fullscreen);
  };

  const getDeviceClass = () => {
    switch (currentDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-full';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <PreviewLoading device={currentDevice} message="Loading preview..." />;
  }

  if (error) {
    return (
      <PreviewError 
        error={error} 
        token={token}
        onRetry={handleRefresh}
        isRetrying={isRefreshing}
      />
    );
  }

  if (!previewData) {
    return (
      <PreviewError 
        error="No preview data was received from the server. Please try generating a new preview link."
        token={token}
        onRetry={handleRefresh}
        isRetrying={isRefreshing}
      />
    );
  }

  const expiresAt = new Date(previewData.preview.expires_at);
  const isExpired = expiresAt < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Fixed Preview Bar */}
      <AnimatePresence>
        {showPreviewBar && (
          <m.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-lg backdrop-blur-sm"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleClose}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Editor</span>
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-sm font-semibold text-slate-700">Live Preview</span>
                    </div>
                    
                    <div className="h-4 w-px bg-slate-300"></div>
                    
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-bold text-slate-900">{previewData.app.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium">
                        {previewData.app.app_type}
                      </span>
                    </div>
                    
                    {previewData.pages && previewData.pages.length > 0 && (
                      <>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                          <Layers className="w-3 h-3" />
                          <span>{previewData.pages.length} page{previewData.pages.length !== 1 ? 's' : ''}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Enhanced Device Selector */}
                  <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
                    {['desktop', 'tablet', 'mobile'].map((deviceType) => (
                      <button
                        key={deviceType}
                        onClick={() => setCurrentDevice(deviceType)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentDevice === deviceType
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {getDeviceIcon(deviceType)}
                        <span className="capitalize hidden sm:inline">{deviceType}</span>
                      </button>
                    ))}
                  </div>

                  <div className="h-6 w-px bg-slate-300"></div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="hidden sm:inline">QR</span>
                    </button>

                    <a
                      href={`/preview/${token}/embed`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Embed</span>
                    </a>

                    <button
                      onClick={toggleFullscreen}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Full'}</span>
                    </button>

                    <button
                      onClick={() => setShowShortcuts(!showShortcuts)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShowPreviewBar(false)}
                      className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expiration Warning */}
              {isExpired && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm font-medium">
                      ⚠️ This preview has expired. Please generate a new preview link.
                    </p>
                  </div>
                </m.div>
              )}

              {/* QR Code Panel */}
              <AnimatePresence>
                {showQR && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={`/api/apps/preview/${token}/qr?size=150`}
                          alt="QR Code for mobile preview"
                          className="w-24 h-24 border border-slate-300 rounded-lg shadow-sm"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          Mobile Preview QR Code
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          Scan this QR code with your mobile device to preview the app on your phone.
                        </p>
                        <p className="text-xs text-slate-500">
                          Expires: {expiresAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Keyboard Shortcuts Help */}
              <AnimatePresence>
                {showShortcuts && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Keyboard Shortcuts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Toggle Fullscreen:</span>
                        <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono shadow-sm">F11</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Exit Fullscreen:</span>
                        <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono shadow-sm">Esc</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Refresh Preview:</span>
                        <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono shadow-sm">Ctrl+R</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Copy Link:</span>
                        <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono shadow-sm">Ctrl+Shift+C</kbd>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Show Preview Bar Button (when hidden) */}
      {!showPreviewBar && (
        <m.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowPreviewBar(true)}
          className="fixed top-4 right-4 z-50 bg-white text-slate-700 p-3 rounded-xl shadow-lg hover:shadow-xl border border-slate-200 transition-all duration-200 hover:scale-105"
        >
          <Eye className="w-5 h-5" />
        </m.button>
      )}

      {/* Enhanced Preview Content */}
      <div className={`transition-all duration-300 ${showPreviewBar ? 'pt-24' : 'pt-6'} ${fullscreen ? 'fixed inset-0 z-40 bg-gradient-to-br from-slate-50 to-slate-100' : ''}`}>
        <div className={`${fullscreen ? 'h-full' : 'p-6'}`}>
          <div className={`transition-all duration-300 ${fullscreen ? 'h-full' : getDeviceClass()}`}>
            {/* Enhanced Device Frame */}
            <div className={`
              bg-white shadow-2xl overflow-hidden transition-all duration-300 relative
              ${fullscreen ? 'h-full rounded-none border-none' : ''}
              ${!fullscreen && currentDevice === 'mobile' ? 'rounded-[2.5rem] border-8 border-slate-800 max-w-sm mx-auto shadow-slate-900/20' : ''}
              ${!fullscreen && currentDevice === 'tablet' ? 'rounded-2xl border-4 border-slate-600 max-w-2xl mx-auto shadow-slate-600/20' : ''}
              ${!fullscreen && currentDevice === 'desktop' ? 'rounded-xl border border-slate-300 shadow-slate-300/20' : ''}
            `}>
              {/* Mobile Device Notch */}
              {!fullscreen && currentDevice === 'mobile' && (
                <div className="h-6 bg-slate-900 flex items-center justify-center">
                  <div className="w-20 h-4 bg-slate-700 rounded-full"></div>
                </div>
              )}
              
              {/* Device Content Area */}
              <div className={`
                ${!fullscreen && currentDevice === 'mobile' ? 'aspect-[9/16]' : ''}
                ${!fullscreen && currentDevice === 'tablet' ? 'aspect-[4/3]' : ''}
                ${!fullscreen && currentDevice === 'desktop' ? 'min-h-[700px]' : ''}
                ${fullscreen ? 'h-full' : ''}
                overflow-hidden relative
              `}>
                <AppPreviewRenderer 
                  app={previewData.app}
                  device={currentDevice}
                  pages={previewData.pages}
                  fullscreen={fullscreen}
                />
              </div>
              
              {/* Mobile Device Home Indicator */}
              {!fullscreen && currentDevice === 'mobile' && (
                <div className="h-8 bg-slate-900 flex items-center justify-center">
                  <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Preview Info Footer */}
      {!fullscreen && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-xs text-slate-600 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">Preview Active</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Token:</span>
              <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">
                {token.substring(0, 8)}...
              </code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Expires:</span>
              <span className="font-medium">{expiresAt.toLocaleString()}</span>
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}

// Enhanced App Preview Renderer Component - Professional Layout
function AppPreviewRenderer({ 
  app, 
  device, 
  pages,
  fullscreen = false
}: { 
  app: PreviewData['app']; 
  device: string; 
  pages: PreviewData['pages'];
  fullscreen?: boolean;
}) {
  // Initialize with homepage slug or first page slug
  const [currentPage, setCurrentPage] = useState(() => {
    if (!pages || pages.length === 0) return 'home';
    const homepage = pages.find(p => p.is_homepage);
    return homepage ? homepage.slug : pages[0].slug;
  });

  // Find the current page
  const activePage = pages?.find(p => p.slug === currentPage) || pages?.find(p => p.is_homepage) || pages?.[0];

  // Get elements from page content (prioritize page content over app config)
  const elements = activePage?.content?.elements || app.config?.elements || [];
  
  // Apply theme configuration
  const themeConfig = app.theme_config || {};
  const colors = themeConfig.colors || {};
  const fonts = themeConfig.fonts || {};

  // Generate CSS variables for theme
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
    <div className={`h-full w-full flex flex-col ${fullscreen ? 'min-h-screen' : ''}`} style={themeStyles}>
      {/* Enhanced Page Navigation */}
      {pages && pages.length > 1 && !(fullscreen && device === 'mobile') && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-slate-600" />
                <h2 className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'var(--heading-font)' }}>
                  {app.name}
                </h2>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">
                  {activePage?.title || 'Page'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {app.app_type}
              </span>
              {fullscreen && (
                <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full font-semibold">
                  Fullscreen
                </span>
              )}
            </div>
          </div>
          
          {/* Enhanced Page Navigation Tabs */}
          <nav className="flex flex-wrap gap-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.slug)}
                className={`group flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === page.slug
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
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
        className={`flex-1 relative overflow-auto ${fullscreen ? 'min-h-screen' : ''}`}
        style={{ 
          backgroundColor: 'var(--background-color)',
          color: 'var(--foreground-color)',
          fontFamily: 'var(--body-font)'
        }}
      >
        {elements && elements.length > 0 ? (
          <div className={`relative w-full h-full ${fullscreen ? 'min-h-screen' : 'min-h-[600px]'}`}>
            {/* Render elements in stacked layout for better preview */}
            <div className="space-y-0">
              {elements.map((element: any, index: number) => {
                return (
                  <m.div
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
                  </m.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`h-full flex items-center justify-center p-8 ${fullscreen ? 'min-h-screen' : ''}`}>
            <m.div 
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
              <h3 
                className={`font-bold mb-6 ${fullscreen ? 'text-5xl' : 'text-4xl'}`}
                style={{ 
                  fontFamily: 'var(--heading-font)',
                  color: 'var(--foreground-color)'
                }}
              >
                {activePage ? activePage.title : app.name}
              </h3>
              <p className={`text-slate-600 mb-8 ${fullscreen ? 'text-2xl' : 'text-xl'} leading-relaxed`} style={{ fontFamily: 'var(--body-font)' }}>
                {activePage 
                  ? `This page is ready for content. Add elements in the editor to bring it to life.`
                  : "This app is ready for content. Start building in the editor to see your creation here."
                }
              </p>
              
              {/* Enhanced App info card */}
              <div 
                className={`bg-white rounded-2xl shadow-lg border p-8 text-left mx-auto ${fullscreen ? 'max-w-2xl' : 'max-w-lg'}`}
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
                    <p className="text-slate-500 text-sm">Preview Details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block mb-1">Type</span>
                      <span className="font-semibold capitalize px-3 py-1 bg-slate-100 rounded-lg text-sm">
                        {app.app_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Pages</span>
                      <span className="font-bold text-lg">{pages?.length || 0}</span>
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
                
                {fullscreen && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-center space-x-2 text-emerald-600">
                      <Monitor className="w-4 h-4" />
                      <span className="font-semibold text-sm">Fullscreen Preview Mode</span>
                    </div>
                  </div>
                )}
              </div>
            </m.div>
          </div>
        )}
      </div>
    </div>
  );
}