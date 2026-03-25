import React from 'react';

/**
 * Cyber Input Component
 */
export function Input({ 
  label,
  error,
  className = '',
  variant = 'default', // default, filled
  icon,
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-3
            ${icon ? 'pl-11' : ''}
            text-sm text-white
            bg-[var(--bg-elevated)]
            border border-white/10
            rounded-lg
            placeholder-slate-500
            focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]' : ''}
            ${className}
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 32, 48, 0.8) 0%, rgba(22, 24, 34, 0.9) 100%)',
          }}
          {...props}
        />
        
        {/* Bottom glow line on focus */}
        <div className={`absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent transition-opacity duration-300 ${error ? 'opacity-0' : 'opacity-0 focus-within:opacity-100'}`} />
        <div className={`absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Select Component
 */
export function Select({ 
  label,
  error,
  options = [],
  className = '',
  icon,
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        
        <select
          className={`
            w-full px-4 py-3 appearance-none
            ${icon ? 'pl-11' : ''} pr-10
            text-sm text-white
            bg-[var(--bg-elevated)]
            border border-white/10
            rounded-lg
            focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-rose-500/50' : ''}
            ${className}
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 32, 48, 0.8) 0%, rgba(22, 24, 34, 0.9) 100%)',
          }}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea Component
 */
export function Textarea({ 
  label,
  error,
  className = '',
  rows = 4,
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
          {label}
        </label>
      )}
      
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-3
          text-sm text-white
          bg-[var(--bg-elevated)]
          border border-white/10
          rounded-lg
          placeholder-slate-500
          resize-none
          focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-rose-500/50' : ''}
          ${className}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 32, 48, 0.8) 0%, rgba(22, 24, 34, 0.9) 100%)',
        }}
        {...props}
      />
      
      {error && (
        <p className="mt-2 text-sm text-rose-400">{error}</p>
      )}
    </div>
  );
}
