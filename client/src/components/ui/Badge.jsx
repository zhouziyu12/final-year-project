import React from 'react';

/**
 * Badge Component
 * Variants: default, success, warning, error, info
 */
export function Badge({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Status Dot
 */
export function StatusDot({ status, className = '' }) {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    pending: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.offline} ${className}`}
    />
  );
}
