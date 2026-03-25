import React from 'react';

/**
 * Cyber Button Component
 * Distinctive sci-fi styled buttons with glow effects
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  glow = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium overflow-hidden transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Cyber-style rounded corners
  const cyberClip = 'clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';
  
  const variants = {
    primary: `bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 font-semibold
      ${glow ? 'shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50' : ''}
      hover:from-cyan-400 hover:to-cyan-300`,
    secondary: `bg-transparent border border-cyan-500/50 text-cyan-400
      ${glow ? 'shadow-lg shadow-cyan-500/20' : ''}
      hover:bg-cyan-500/10 hover:border-cyan-400`,
    ghost: 'bg-transparent text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/5',
    danger: `bg-gradient-to-r from-rose-500 to-rose-400 text-white
      ${glow ? 'shadow-lg shadow-rose-500/30' : ''}
      hover:from-rose-400 hover:to-rose-300`,
    success: `bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900
      ${glow ? 'shadow-lg shadow-emerald-500/30' : ''}
      hover:from-emerald-400 hover:to-emerald-300`,
    purple: `bg-gradient-to-r from-purple-500 to-purple-400 text-white
      ${glow ? 'shadow-lg shadow-purple-500/30' : ''}
      hover:from-purple-400 hover:to-purple-300`,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
    xl: 'px-10 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
      
      {/* Glow effect on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

/**
 * Icon Button
 */
export function IconButton({ children, size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  return (
    <button
      className={`${sizes[size]} flex items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
