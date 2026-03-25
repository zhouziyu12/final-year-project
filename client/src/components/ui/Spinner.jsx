import React from 'react';

/**
 * Cyber Spinner Component
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin text-cyan-400 ${sizes[size]}`} 
        fill="none" 
        viewBox="0 0 24 24"
        style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' }}
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="3"
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
      className={`animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded ${className}`}
      style={{ animation: 'shimmer 1.5s infinite' }}
      {...props}
    />
  );
}

/**
 * Loading Page
 */
export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
      {/* Custom cyber loader */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-lg" />
        <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-lg animate-spin" />
        <div className="absolute inset-2 border-2 border-transparent border-t-purple-400 rounded-lg animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        <div className="absolute inset-4 bg-cyan-400/20 rounded-lg animate-pulse" />
      </div>
      
      <div className="text-center">
        <p className="text-cyan-400 font-medium tracking-wide">{message}</p>
        <div className="flex items-center gap-1 mt-2 justify-center">
          {[0, 1, 2].map(i => (
            <span 
              key={i} 
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Progress Bar
 */
export function ProgressBar({ value = 0, max = 100, showLabel = true, color = 'cyan', size = 'md' }) {
  const colors = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
    rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">{value} / {max}</span>
          <span className="text-sm font-mono text-cyan-400">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/50 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Inline Loader (small)
 */
export function InlineLoader() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg className="animate-spin w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
  );
}
