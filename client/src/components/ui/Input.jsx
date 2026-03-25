import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label,
  error,
  hint,
  icon,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 sm:py-3.5
            ${icon ? 'pl-11 sm:pl-12' : ''}
            bg-[var(--bg-elevated)] border border-white/10
            rounded-xl text-white text-sm sm:text-base
            placeholder:text-slate-500
            transition-all duration-200
            focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
            hover:border-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-rose-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p className="mt-2 text-xs sm:text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 sm:py-3.5
          bg-[var(--bg-elevated)] border border-white/10
          rounded-xl text-white text-sm sm:text-base
          placeholder:text-slate-500
          transition-all duration-200
          focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
          hover:border-white/20
          resize-none min-h-[120px] sm:min-h-[140px]
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

export function Select({ children, label, error, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 sm:py-3.5
          bg-[var(--bg-elevated)] border border-white/10
          rounded-xl text-white text-sm sm:text-base
          transition-all duration-200
          focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
          hover:border-white/20
          cursor-pointer appearance-none
          ${error ? 'border-rose-500/50' : ''}
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem',
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-rose-400">{error}</p>
      )}
    </div>
  );
}
