import React from 'react';

/**
 * Card Component
 */
export function Card({ 
  children, 
  title, 
  subtitle,
  className = '',
  padding = true,
  ...props 
}) {
  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
}
