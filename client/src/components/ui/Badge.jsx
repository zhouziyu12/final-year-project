import React from 'react';

/**
 * Cyber Badge Component
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        border rounded-full font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'cyan' ? 'bg-cyan-400' :
        variant === 'emerald' ? 'bg-emerald-400' :
        variant === 'amber' ? 'bg-amber-400' :
        variant === 'rose' ? 'bg-rose-400' :
        variant === 'purple' ? 'bg-purple-400' :
        'bg-slate-400'
      }`} />
      {children}
    </span>
  );
}

/**
 * Status Dot Component
 */
export function StatusDot({ status, pulse = false, size = 'md', className = '' }) {
  const colors = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-500',
    pending: 'bg-amber-400',
    error: 'bg-rose-400',
    syncing: 'bg-cyan-400',
  };

  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={`
        inline-block rounded-full
        ${colors[status] || colors.offline}
        ${sizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        shadow-lg
        ${className}
      `}
      style={{
        boxShadow: status === 'online' ? '0 0 8px rgba(52, 211, 153, 0.6)' :
                   status === 'syncing' ? '0 0 8px rgba(34, 211, 238, 0.6)' : 'none',
      }}
    />
  );
}

/**
 * Progress Badge
 */
export function ProgressBadge({ progress, showLabel = true }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress >= 100 ? 'bg-emerald-400' :
            progress >= 50 ? 'bg-cyan-400' :
            'bg-amber-400'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 font-mono">{progress}%</span>
      )}
    </div>
  );
}
