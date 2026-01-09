'use client';

import { Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';

interface PreviewLoadingProps {
  device?: string;
  message?: string;
}

export function PreviewLoading({ device = 'desktop', message = 'Loading preview...' }: PreviewLoadingProps) {
  const getDeviceIcon = () => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="w-8 h-8 text-blue-600" />;
      case 'tablet':
        return <Tablet className="w-8 h-8 text-blue-600" />;
      default:
        return <Monitor className="w-8 h-8 text-blue-600" />;
    }
  };

  const getDeviceFrame = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto rounded-[2.5rem] border-8 border-gray-800 aspect-[9/16]';
      case 'tablet':
        return 'max-w-2xl mx-auto rounded-2xl border-4 border-gray-600 aspect-[4/3]';
      default:
        return 'max-w-4xl mx-auto rounded-lg border border-gray-300 min-h-[600px]';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Device Preview Frame */}
        <div className={`bg-white shadow-2xl overflow-hidden mb-8 ${getDeviceFrame()}`}>
          {/* Mobile Device Notch */}
          {device === 'mobile' && (
            <div className="h-6 bg-gray-800 flex items-center justify-center">
              <div className="w-20 h-4 bg-gray-700 rounded-full"></div>
            </div>
          )}
          
          {/* Loading Content */}
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-6">
                {getDeviceIcon()}
              </div>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mx-auto"></div>
              </div>
            </div>
          </div>
          
          {/* Mobile Device Home Indicator */}
          {device === 'mobile' && (
            <div className="h-8 bg-gray-800 flex items-center justify-center">
              <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* Loading Message */}
        <div className="text-center">
          <p className="text-gray-600 text-lg font-medium mb-2">{message}</p>
          <p className="text-gray-500 text-sm">
            Preparing your {device} preview experience...
          </p>
        </div>
      </div>
    </div>
  );
}

export default PreviewLoading;