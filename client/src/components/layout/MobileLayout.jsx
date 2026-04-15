import React from 'react';
import {
  Binary,
  Database,
  LayoutDashboard,
  RefreshCw,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import logoSymbol from '../../assets/provenance-logo.svg';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'training', label: 'Train', icon: Binary },
  { id: 'registry', label: 'Registry', icon: Database },
  { id: 'audit', label: 'Audit', icon: ShieldCheck },
  { id: 'system', label: 'System', icon: ServerCog }
];

function formatLastUpdated(value) {
  if (!value) return 'Waiting for first sync';
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function MobileLayout({
  children,
  activeTab,
  onTabChange,
  pageMeta,
  status,
  lastUpdated,
  loading,
  onRefresh
}) {
  return (
    <div className="mobile-shell">
      <header className="mobile-topbar">
        <div>
          <p className="mobile-topbar-label">{pageMeta?.eyebrow}</p>
          <div className="mobile-brand-line">
            <img src={logoSymbol} alt="AI Model Provenance logo" className="mobile-brand-logo" />
            <h1 className="mobile-topbar-title">AI Model Provenance</h1>
          </div>
          <p className="mobile-topbar-copy">{pageMeta?.title}</p>
        </div>
        <button type="button" className="mobile-refresh" onClick={onRefresh} aria-label="Refresh">
          <RefreshCw size={16} />
        </button>
      </header>

      <section className="mobile-status-strip">
        <span className={`status-dot${loading ? '' : ' is-ready'}`} />
        <span>{loading ? 'Refreshing platform data' : `Last sync ${formatLastUpdated(lastUpdated)}`}</span>
        <span className="mobile-status-divider" />
        <span>{Object.keys(status?.chains || {}).length} chain targets</span>
      </section>

      <main className="mobile-page">{children}</main>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item${isActive ? ' is-active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
