'use client';

import { AlertTriangle, RefreshCw, ArrowLeft, ExternalLink, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';

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
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600'
      };
    } else if (error.toLowerCase().includes('not found')) {
      return {
        title: 'Preview Not Found',
        description: 'The preview you\'re looking for doesn\'t exist or has been removed.',
        icon: '🔍',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      };
    } else {
      return {
        title: 'Preview Error',
        description: 'Something went wrong while loading the preview.',
        icon: '⚠️',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      };
    }
  };

  const errorInfo = getErrorType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <m.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg mx-auto"
      >
        {/* Enhanced Error Icon */}
        <m.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative mb-8"
        >
          <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="w-16 h-16 text-slate-400" />
          </div>
          <div className={`
            absolute -top-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg
            ${errorInfo.bgColor} ${errorInfo.borderColor} border-2
          `}>
            <span className="text-2xl">{errorInfo.icon}</span>
          </div>
        </m.div>

        {/* Enhanced Error Content */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`
            border rounded-2xl p-8 mb-8 shadow-lg
            ${errorInfo.bgColor} ${errorInfo.borderColor}
          `}
        >
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className={`w-6 h-6 mr-3 ${errorInfo.iconColor}`} />
            <h2 className={`text-xl font-bold ${errorInfo.textColor}`}>
              {errorInfo.title}
            </h2>
          </div>
          <p className={`text-sm mb-6 leading-relaxed ${errorInfo.textColor}`}>
            {errorInfo.description}
          </p>
          
          {/* Technical Error Details */}
          <details className="text-left">
            <summary className={`
              text-xs cursor-pointer hover:underline font-medium
              ${errorInfo.iconColor}
            `}>
              Technical Details
            </summary>
            <pre className={`
              text-xs mt-3 p-3 rounded-lg font-mono whitespace-pre-wrap leading-relaxed
              ${errorInfo.color === 'amber' ? 'bg-amber-100' : 'bg-red-100'}
              border ${errorInfo.color === 'amber' ? 'border-amber-200' : 'border-red-200'}
            `}>
              {error}
            </pre>
          </details>
        </m.div>

        {/* Enhanced Action Buttons */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
            </button>
          )}
          
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-slate-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          {token && (
            <a
              href={`/preview/${token}/embed`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Try Embed View</span>
            </a>
          )}
        </m.div>

        {/* Enhanced Help Text */}
        <m.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-xs text-slate-500 bg-white rounded-xl p-4 shadow-sm border border-slate-200"
        >
          <p className="mb-2">
            If this problem persists, try generating a new preview link from the editor.
          </p>
          {token && (
            <div className="flex items-center justify-center space-x-2">
              <span>Token:</span>
              <code className="bg-slate-100 px-2 py-1 rounded font-mono text-xs">
                {token.substring(0, 8)}...
              </code>
            </div>
          )}
        </m.div>
      </m.div>
    </div>
  );
}

export default PreviewError;