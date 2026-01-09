'use client';

import { Loader2, Monitor, Smartphone, Tablet, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreviewLoadingProps {
  device?: string;
  message?: string;
}

export function PreviewLoading({ device = 'desktop', message = 'Loading preview...' }: PreviewLoadingProps) {
  const getDeviceIcon = () => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="w-8 h-8 text-slate-600" />;
      case 'tablet':
        return <Tablet className="w-8 h-8 text-slate-600" />;
      default:
        return <Monitor className="w-8 h-8 text-slate-600" />;
    }
  };

  const getDeviceFrame = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto rounded-[2.5rem] border-8 border-slate-800 aspect-[9/16] shadow-slate-900/20';
      case 'tablet':
        return 'max-w-2xl mx-auto rounded-2xl border-4 border-slate-600 aspect-[4/3] shadow-slate-600/20';
      default:
        return 'max-w-4xl mx-auto rounded-xl border border-slate-300 min-h-[700px] shadow-slate-300/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="text-center">
        {/* Enhanced Device Preview Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`bg-white shadow-2xl overflow-hidden mb-8 ${getDeviceFrame()}`}
        >
          {/* Mobile Device Notch */}
          {device === 'mobile' && (
            <div className="h-6 bg-slate-900 flex items-center justify-center">
              <div className="w-20 h-4 bg-slate-700 rounded-full"></div>
            </div>
          )}
          
          {/* Enhanced Loading Content */}
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-8"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-10 h-10 text-slate-600" />
                </div>
                {getDeviceIcon()}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
              </motion.div>
              
              {/* Enhanced Loading Skeleton */}
              <div className="space-y-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '12rem' }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-4 bg-slate-200 rounded-lg animate-pulse mx-auto"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '8rem' }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-4 bg-slate-200 rounded-lg animate-pulse mx-auto"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '10rem' }}
                  transition={{ delay: 1.0, duration: 0.8 }}
                  className="h-4 bg-slate-200 rounded-lg animate-pulse mx-auto"
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Device Home Indicator */}
          {device === 'mobile' && (
            <div className="h-8 bg-slate-900 flex items-center justify-center">
              <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
            </div>
          )}
        </motion.div>
        
        {/* Enhanced Loading Message */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-slate-700 text-xl font-semibold mb-2">{message}</p>
          <p className="text-slate-500 text-sm">
            Preparing your {device} preview experience...
          </p>
          
          {/* Loading Progress Dots */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-slate-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PreviewLoading;