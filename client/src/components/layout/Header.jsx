import React from 'react';

export function Header({ title = 'AI Model Provenance', subtitle, actions, className = '' }) {
  return (
    <header className={`relative z-50 ${className}`}>
      <div 
        className="border-b border-white/5"
        style={{ 
          background: 'linear-gradient(180deg, rgba(10, 11, 15, 0.98) 0%, rgba(10, 11, 15, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 blur-xl opacity-30 -z-10" />
              </div>
              
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-400 tracking-wide hidden sm:block">{subtitle}</p>
                )}
              </div>
            </div>
            
            {actions && (
              <div className="flex items-center gap-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </header>
  );
}

export function PageContainer({ children, className = '' }) {
  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ${className}`}>
      {children}
    </main>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-cyan-500" />
            <span className="text-xs text-cyan-400/70 uppercase tracking-widest">Section</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {title}
          </h2>
          
          {description && (
            <p className="mt-2 text-slate-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function Tabs({ items, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-xl border border-white/5 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            whitespace-nowrap transition-all duration-200
            ${activeTab === item.id
              ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }
          `}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
