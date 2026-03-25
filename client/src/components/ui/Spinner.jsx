import React from 'react';

/**
 * Spinner Component
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin text-blue-600 ${sizes[size]}`} 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * Skeleton Loader
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Loading Page
 */
export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
