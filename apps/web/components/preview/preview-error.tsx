'use client';

import { AlertTriangle, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PreviewErrorProps {
  error: string;
  token?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function PreviewError({ error, token, onRetry, isRetrying = false }: PreviewErrorProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const getErrorType = () => {
    if (error.toLowerCase().includes('expired')) {
      return {
        title: 'Preview Expired',
        description: 'This preview link has expired. Please generate a new preview from the editor.',
        icon: '⏰',
        color: 'yellow'
      };
    } else if (error.toLowerCase().includes('not found')) {
      return {
        title: 'Preview Not Found',
        description: 'The preview you\'re looking for doesn\'t exist or has been removed.',
        icon: '🔍',
        color: 'red'
      };
    } else {
      return {
        title: 'Preview Error',
        description: 'Something went wrong while loading the preview.',
        icon: '⚠️',
        color: 'red'
      };
    }
  };

  const errorInfo = getErrorType();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className={`
          w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6
          ${errorInfo.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'}
        `}>
          <span className="text-4xl">{errorInfo.icon}</span>
        </div>

        {/* Error Content */}
        <div className={`
          border rounded-lg p-6 mb-6
          ${errorInfo.color === 'yellow' 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-red-50 border-red-200'
          }
        `}>
          <div className="flex items-center justify-center mb-3">
            <AlertTriangle className={`
              w-5 h-5 mr-2
              ${errorInfo.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}
            `} />
            <h2 className={`
              font-semibold
              ${errorInfo.color === 'yellow' ? 'text-yellow-800' : 'text-red-800'}
            `}>
              {errorInfo.title}
            </h2>
          </div>
          <p className={`
            text-sm mb-4
            ${errorInfo.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}
          `}>
            {errorInfo.description}
          </p>
          
          {/* Technical Error Details */}
          <details className="text-left">
            <summary className={`
              text-xs cursor-pointer hover:underline
              ${errorInfo.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}
            `}>
              Technical Details
            </summary>
            <pre className={`
              text-xs mt-2 p-2 rounded font-mono whitespace-pre-wrap
              ${errorInfo.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'}
            `}>
              {error}
            </pre>
          </details>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
            </button>
          )}
          
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          {token && (
            <a
              href={`/preview/${token}/embed`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Try Embed View</span>
            </a>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-xs text-gray-500">
          <p>
            If this problem persists, try generating a new preview link from the editor.
          </p>
          {token && (
            <p className="mt-1">
              Token: {token.substring(0, 8)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewError;