import React from 'react';
import {
  Activity,
  BadgeCheck,
  Binary,
  CheckCheck,
  Database,
  LayoutDashboard,
  RefreshCw,
  ServerCog,
  ShieldCheck
} from 'lucide-react';
import logoSymbol from '../../assets/provenance-logo.svg';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Binary },
  { id: 'registry', label: 'Registry', icon: Database },
  { id: 'audit', label: 'Audit', icon: ShieldCheck },
  { id: 'system', label: 'System', icon: ServerCog },
  { id: 'certificates', label: 'Certificates', icon: BadgeCheck }
];

function formatLastUpdated(value) {
  if (!value) return 'Not synced yet';
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function DesktopLayout({
  children,
  activeTab,
  onTabChange,
  pageMeta,
  status,
  models,
  lastUpdated,
  loading,
  onRefresh
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <img src={logoSymbol} alt="AI Model Provenance logo" className="brand-logo-image" />
          </div>
          <div>
            <p className="sidebar-brand-title">AI Model Provenance</p>
            <p className="sidebar-brand-subtitle">Final Year Project Dashboard</p>
          </div>
        </div>

        <div className="sidebar-group">
          <p className="sidebar-label">Workspace</p>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item${isActive ? ' is-active' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-group">
          <p className="sidebar-label">Deployment Health</p>
          <div className="sidebar-network-list">
            {Object.entries(status?.chains || {}).map(([chain, info]) => (
              <div className="sidebar-network-item" key={chain}>
                <div>
                  <p className="sidebar-network-name">{chain}</p>
                  <p className="sidebar-network-copy">
                    Block #{info.blockNumber?.toLocaleString?.() || '...'}
                  </p>
                </div>
                <span className={`status-pill${info.connected ? ' is-online' : ''}`}>
                  {info.connected ? 'Live' : 'Down'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-group sidebar-group-spacer">
          <div className="sidebar-summary-card">
            <div className="sidebar-summary-item">
              <Activity size={16} />
              <span>{status?.totalModels || models.length || 0} tracked models</span>
            </div>
            <div className="sidebar-summary-item">
              <CheckCheck size={16} />
              <span>{status?.zkReady ? 'Proof pipeline online' : 'Proof pipeline offline'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div>
            <p className="topbar-eyebrow">{pageMeta?.eyebrow}</p>
            <h1 className="topbar-title">{pageMeta?.title}</h1>
            <p className="topbar-description">{pageMeta?.description}</p>
          </div>

          <div className="topbar-actions">
            <div className="topbar-status-card">
              <span className={`status-dot${loading ? '' : ' is-ready'}`} />
              <div>
                <p className="topbar-status-title">System Sync</p>
                <p className="topbar-status-copy">{loading ? 'Refreshing data' : `Updated ${formatLastUpdated(lastUpdated)}`}</p>
              </div>
            </div>
            <button type="button" className="topbar-refresh" onClick={onRefresh}>
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>
    </div>
  );
}
