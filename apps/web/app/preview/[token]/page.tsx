'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, Smartphone, Tablet, Monitor, ExternalLink, QrCode, ArrowLeft, RefreshCw, Eye, EyeOff, Copy, Check, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Preview Bar */}
      <AnimatePresence>
        {showPreviewBar && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleClose}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Editor</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Preview</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">{previewData.app.name}</span>
                    <span className="text-blue-200 ml-2">• {previewData.app.app_type}</span>
                    {previewData.pages && previewData.pages.length > 0 && (
                      <span className="text-blue-300 ml-2 text-xs">
                        ({previewData.pages.length} page{previewData.pages.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Device Selector */}
                  <div className="flex bg-blue-700 rounded-lg p-1">
                    {['desktop', 'tablet', 'mobile'].map((deviceType) => (
                      <button
                        key={deviceType}
                        onClick={() => setCurrentDevice(deviceType)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentDevice === deviceType
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-blue-200 hover:text-white hover:bg-blue-600'
                        }`}
                      >
                        {getDeviceIcon(deviceType)}
                        <span className="capitalize hidden sm:inline">{deviceType}</span>
                      </button>
                    ))}
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  {/* Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {/* QR Code Button */}
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">QR</span>
                  </button>

                  {/* External Link */}
                  <a
                    href={`/preview/${token}/embed`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open</span>
                  </a>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Full'}</span>
                  </button>

                  {/* Keyboard Shortcuts Help */}
                  <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Help</span>
                  </button>

                  {/* Hide/Show Preview Bar */}
                  <button
                    onClick={() => setShowPreviewBar(false)}
                    className="flex items-center justify-center w-8 h-8 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expiration Warning */}
              {isExpired && (
                <div className="mt-2 bg-red-500 text-white rounded-lg p-2">
                  <p className="text-sm font-medium">
                    ⚠️ This preview has expired. Please generate a new preview link.
                  </p>
                </div>
              )}

              {/* QR Code Modal */}
              {showQR && (
                <div className="mt-2 bg-white text-gray-900 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={`/api/apps/preview/${token}/qr?size=150`}
                        alt="QR Code for mobile preview"
                        className="w-24 h-24 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Mobile Preview QR Code
                      </h3>
                      <p className="text-sm text-gray-700">
                        Scan this QR code with your mobile device to preview the app on your phone.
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Expires: {expiresAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Keyboard Shortcuts Help */}
              {showShortcuts && (
                <div className="mt-2 bg-white text-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Keyboard Shortcuts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toggle Fullscreen:</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">F11</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exit Fullscreen:</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Refresh Preview:</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+R</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Copy Link:</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+Shift+C</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Preview Bar Button (when hidden) */}
      {!showPreviewBar && (
        <button
          onClick={() => setShowPreviewBar(true)}
          className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Preview Content */}
      <div className={`transition-all duration-300 ${showPreviewBar ? 'pt-20' : 'pt-4'} ${fullscreen ? 'fixed inset-0 z-40 bg-gray-100' : ''}`}>
        <div className={`${fullscreen ? 'h-full' : 'p-4'}`}>
          <div className={`transition-all duration-300 ${fullscreen ? 'h-full' : getDeviceClass()}`}>
            {/* Device Frame with realistic styling */}
            <div className={`
              bg-white shadow-2xl overflow-hidden transition-all duration-300
              ${fullscreen ? 'h-full rounded-none border-none' : ''}
              ${!fullscreen && currentDevice === 'mobile' ? 'rounded-[2.5rem] border-8 border-gray-800 max-w-sm mx-auto' : ''}
              ${!fullscreen && currentDevice === 'tablet' ? 'rounded-2xl border-4 border-gray-600 max-w-2xl mx-auto' : ''}
              ${!fullscreen && currentDevice === 'desktop' ? 'rounded-lg border border-gray-300' : ''}
            `}>
              {/* Mobile Device Notch */}
              {!fullscreen && currentDevice === 'mobile' && (
                <div className="h-6 bg-gray-800 flex items-center justify-center">
                  <div className="w-20 h-4 bg-gray-700 rounded-full"></div>
                </div>
              )}
              
              {/* Device Content Area */}
              <div className={`
                ${!fullscreen && currentDevice === 'mobile' ? 'aspect-[9/16]' : ''}
                ${!fullscreen && currentDevice === 'tablet' ? 'aspect-[4/3]' : ''}
                ${!fullscreen && currentDevice === 'desktop' ? 'min-h-[600px]' : ''}
                ${fullscreen ? 'h-full' : ''}
                overflow-hidden
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
                <div className="h-8 bg-gray-800 flex items-center justify-center">
                  <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info Footer - Hide in fullscreen */}
      {!fullscreen && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Preview Active</span>
          </div>
          <div className="mt-1">
            Token: {token.substring(0, 8)}...
          </div>
          <div>
            Expires: {expiresAt.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced App Preview Renderer Component - Exact Editor Replica
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
  
  // Debug elements
  console.log('🎨 AppPreviewRenderer - Elements data:', {
    activePageId: activePage?.id,
    activePageTitle: activePage?.title,
    hasActivePage: !!activePage,
    hasContent: !!activePage?.content,
    contentKeys: activePage?.content ? Object.keys(activePage.content) : [],
    elementsCount: elements.length,
    elements: elements.slice(0, 3).map((el: any) => ({
      id: el.id,
      type: el.type,
      position: el.position,
      size: el.size,
      hasProps: !!el.props,
      propsKeys: el.props ? Object.keys(el.props) : []
    }))
  });

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
      {/* Page Navigation - Only show if multiple pages and not in fullscreen mobile */}
      {pages && pages.length > 1 && !(fullscreen && device === 'mobile') && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: 'var(--heading-font)' }}>
              {app.name}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {activePage?.title || 'Page'}
              </span>
              {fullscreen && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
                  Fullscreen
                </span>
              )}
            </div>
          </div>
          
          {/* Page Navigation Tabs */}
          <nav className="flex flex-wrap gap-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.slug)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentPage === page.slug
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ fontFamily: 'var(--body-font)' }}
              >
                {page.title}
                {page.is_homepage && <span className="ml-1 text-xs">🏠</span>}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* App Content - Exact replica of editor canvas */}
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
            {/* Debug info */}
            {!fullscreen && (
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-50">
                Elements: {elements.length}
              </div>
            )}
            
            {/* Render elements exactly as they appear in the editor */}
            {elements.map((element: any, index: number) => {
              console.log(`🎨 Rendering element ${index}:`, {
                id: element.id,
                type: element.type,
                position: element.position,
                size: element.size,
                props: element.props
              });
              
              return (
                <div
                  key={element.id || index}
                  className="absolute border border-dashed border-blue-300/50"
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
          <div className={`h-full flex items-center justify-center p-8 ${fullscreen ? 'min-h-screen' : ''}`}>
            <div className="text-center max-w-lg">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'var(--muted-color)' }}
              >
                <Monitor className="w-12 h-12 text-gray-400" />
              </div>
              <h3 
                className={`font-bold mb-4 ${fullscreen ? 'text-4xl' : 'text-3xl'}`}
                style={{ 
                  fontFamily: 'var(--heading-font)',
                  color: 'var(--foreground-color)'
                }}
              >
                {activePage ? activePage.title : app.name}
              </h3>
              <p className={`text-gray-600 mb-8 ${fullscreen ? 'text-xl' : 'text-lg'}`} style={{ fontFamily: 'var(--body-font)' }}>
                {activePage 
                  ? `This page is ready for content. Add elements in the editor to see them here.`
                  : "This app is ready for content. Add elements in the editor to see them here."
                }
              </p>
              
              {/* App info card */}
              <div 
                className={`bg-white rounded-lg shadow-sm border p-6 text-left mx-auto ${fullscreen ? 'max-w-lg' : 'max-w-md'}`}
                style={{ borderColor: 'var(--muted-color)' }}
              >
                <h4 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--heading-font)' }}>
                  App Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                      {app.app_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pages:</span>
                    <span className="font-medium">{pages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Page:</span>
                    <span className="font-medium">{activePage?.title || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Elements:</span>
                    <span className="font-medium">{elements.length}</span>
                  </div>
                  {fullscreen && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">View Mode:</span>
                      <span className="font-medium text-blue-600">Fullscreen</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}