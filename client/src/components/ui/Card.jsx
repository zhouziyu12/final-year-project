import React from 'react';

export function Card({
  children,
  className = '',
  hover = true,
  glow = false,
  gradient = false,
  ...props
}) {
  const baseStyles = `
    relative overflow-hidden rounded-xl sm:rounded-2xl
    border border-white/5
    transition-all duration-300
    ${hover ? 'hover:border-white/10 hover:shadow-xl hover:shadow-cyan-500/5' : ''}
    ${glow ? 'shadow-[0_0_30px_rgba(34,211,238,0.15)]' : ''}
  `;

  const gradientStyle = gradient ? {
    background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(18, 20, 28, 0.95) 100%)',
  } : {};

  return (
    <div className={baseStyles + ' ' + className} style={gradientStyle} {...props}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      )}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-white/5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base sm:text-lg font-semibold text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-slate-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t border-white/5 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, accent = 'cyan' }) {
  const colors = {
    cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    emerald: { bg: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-500/5', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-400', border: 'border-rose-500/20' },
  };
  const c = colors[accent] || colors.cyan;
  return (
    <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]`}>
      <p className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

export function StatusDot({ status }) {
  return <div className={`w-2.5 h-2.5 rounded-full ${status === 'online' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />;
}
