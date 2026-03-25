import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled,
  loading,
  icon,
  ...props 
}) {
  const variants = {
    primary: `
      bg-gradient-to-r from-cyan-500 to-cyan-400
      text-slate-900 font-semibold
      hover:from-cyan-400 hover:to-cyan-300
      shadow-lg shadow-cyan-500/25
      hover:shadow-cyan-500/40
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/5
      text-slate-200 font-medium
      border border-white/10
      hover:bg-white/10 hover:border-white/20
      active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-r from-rose-500 to-rose-400
      text-white font-semibold
      hover:from-rose-400 hover:to-rose-300
      shadow-lg shadow-rose-500/25
      active:scale-[0.98]
    `,
    ghost: `
      text-slate-400 font-medium
      hover:text-slate-200 hover:bg-white/5
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent
      text-cyan-400 font-medium
      border border-cyan-500/50
      hover:bg-cyan-500/10 hover:border-cyan-400
      active:scale-[0.98]
    `,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
    icon: 'p-2.5 rounded-xl sm:rounded-xl',
  };
  
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

export function IconButton({ children, size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  return (
    <Button
      size="icon"
      variant="ghost"
      className={`${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
