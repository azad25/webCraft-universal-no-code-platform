'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, Smartphone, Tablet, Monitor, ExternalLink, QrCode, X, ArrowLeft, RefreshCw, Share2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetRenderer } from '@/components/editor/widget-renderer';

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

  useEffect(() => {
    loadPreviewData();
  }, [token, currentDevice]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      console.log('� Loading Apreview data for token:', token);
      
      const response = await apiClient.get(`/api/v1/preview/${token}?device=${currentDevice}`);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
            <h2 className="text-red-800 font-semibold mb-2">Preview Not Available</h2>
            <p className="text-red-700">{error}</p>
          </div>
          <p className="text-gray-600 text-sm">
            The preview link may have expired or the app may not exist.
          </p>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
            <h2 className="text-yellow-800 font-semibold mb-2">No Preview Data</h2>
            <p className="text-yellow-700">No preview data was received from the server.</p>
          </div>
          <p className="text-gray-600 text-sm">
            Please try generating a new preview link.
          </p>
        </div>
      </div>
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
                        src={`/api/v1/preview/${token}/qr?size=150`}
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
      <div className={`transition-all duration-300 ${showPreviewBar ? 'pt-20' : 'pt-4'}`}>
        <div className="p-4">
          <div className={`transition-all duration-300 ${getDeviceClass()}`}>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Device Frame */}
              <div className={`
                ${currentDevice === 'mobile' ? 'aspect-[9/16] max-w-sm mx-auto' : ''}
                ${currentDevice === 'tablet' ? 'aspect-[4/3] max-w-2xl mx-auto' : ''}
                ${currentDevice === 'desktop' ? 'min-h-[600px]' : ''}
              `}>
                {/* App Content Renderer */}
                <AppPreviewRenderer 
                  app={previewData.app}
                  device={currentDevice}
                  pages={previewData.pages}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info Footer */}
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
    </div>
  );
}

// Enhanced App Preview Renderer Component
function AppPreviewRenderer({ 
  app, 
  device, 
  pages
}: { 
  app: PreviewData['app']; 
  device: string; 
  pages: PreviewData['pages'];
}) {
  // Initialize with homepage slug or first page slug
  const [currentPage, setCurrentPage] = useState(() => {
    if (!pages || pages.length === 0) return 'home';
    const homepage = pages.find(p => p.is_homepage);
    return homepage ? homepage.slug : pages[0].slug;
  });

  // Find the current page
  const activePage = pages?.find(p => p.slug === currentPage) || pages?.find(p => p.is_homepage) || pages?.[0];

  // Get elements from app config or page content
  const elements = app.config?.elements || activePage?.content?.elements || [];

  return (
    <div className="h-full flex flex-col">
      {/* App Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{app.name}</h2>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {device.toUpperCase()}
          </span>
        </div>
        
        {/* Page Navigation */}
        {pages && pages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.slug)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  currentPage === page.slug
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page.title}
                {page.is_homepage && <span className="ml-1 text-xs">🏠</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* App Content */}
      <div className="flex-1 bg-white overflow-auto">
        {elements && elements.length > 0 ? (
          <div className="relative min-h-full">
            {/* Render elements using the actual WidgetRenderer */}
            {elements.map((element: any, index: number) => (
              <div
                key={element.id || index}
                className="absolute"
                style={{
                  left: element.position?.x || 0,
                  top: element.position?.y || (index * 100),
                  width: element.size?.width || '100%',
                  height: element.size?.height || 'auto',
                  zIndex: element.zIndex || index + 1
                }}
              >
                <WidgetRenderer
                  element={element}
                  isSelected={false}
                  isHovered={false}
                  isPreview={true}
                  onSelect={() => {}}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Empty {activePage ? 'Page' : 'App'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activePage 
                  ? `The page "${activePage.title}" doesn't have any content elements yet.`
                  : "This app doesn't have any elements yet."
                }
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">Debug Info:</h4>
                <pre className="text-xs text-blue-700 overflow-auto">
                  {JSON.stringify({
                    appElements: app.config?.elements?.length || 0,
                    pageElements: activePage?.content?.elements?.length || 0,
                    currentPage: currentPage,
                    totalPages: pages?.length || 0
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Device-specific styling */}
      <style jsx>{`
        .mobile-frame {
          max-width: 375px;
          margin: 0 auto;
        }
        .tablet-frame {
          max-width: 768px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}