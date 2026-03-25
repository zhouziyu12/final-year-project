import React from 'react';

/**
 * Cyber Card Component
 * Glass-effect cards with subtle borders and glow effects
 */
export function Card({ 
  children, 
  title, 
  subtitle,
  className = '',
  glow = false,
  variant = 'default', // default, elevated, glow
  padding = true,
  ...props 
}) {
  const variants = {
    default: 'bg-[var(--bg-card)] border border-white/5',
    elevated: 'bg-[var(--bg-elevated)] border border-white/10',
    glow: 'bg-[var(--bg-card)] border border-cyan-500/30 shadow-lg shadow-cyan-500/10',
  };

  return (
    <div 
      className={`
        rounded-xl backdrop-blur-sm
        ${variants[variant]}
        ${glow ? 'shadow-lg shadow-cyan-500/10 border-cyan-500/30' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(18, 20, 28, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
      }}
      {...props}
    >
      {/* Card header with accent line */}
      {(title || subtitle) && (
        <div className="relative px-6 pt-6 pb-4">
          {/* Top accent line */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          {title && (
            <h3 className="text-lg font-semibold text-white tracking-wide">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={padding ? 'px-6 pb-6' : ''}>
        {children}
      </div>
    </div>
  );
}

/**
 * Stat Card - Special card for dashboard stats
 */
export function StatCard({ label, value, change, icon, accent = 'cyan' }) {
  const accentColors = {
    cyan: 'from-cyan-500 to-cyan-400',
    purple: 'from-purple-500 to-purple-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-amber-400',
    rose: 'from-rose-500 to-rose-400',
  };

  return (
    <div 
      className="relative overflow-hidden p-6 rounded-xl border border-white/5"
      style={{ background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.95) 0%, rgba(18, 20, 28, 0.98) 100%)' }}
    >
      {/* Decorative gradient orbs */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${accentColors[accent]} opacity-10 blur-3xl`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-400 uppercase tracking-wider">{label}</span>
          {icon && (
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accentColors[accent]} flex items-center justify-center text-gray-900`}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
          {change && (
            <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
