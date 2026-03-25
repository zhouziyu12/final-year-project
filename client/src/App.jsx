import React, { useState } from 'react';
import { Header, Spinner } from './components/index.js';
import { DashboardView, ModelsView, RolesView, AuditView, NftView } from './views/index.js';
import './App.css';

// Navigation tabs configuration
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'models', label: 'Models', icon: '🤖' },
  { id: 'roles', label: 'Roles', icon: '👥' },
  { id: 'audit', label: 'Audit', icon: '📜' },
  { id: 'nft', label: 'NFT & Staking', icon: '🖼️' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [network, setNetwork] = useState('sepolia');
  const [loading, setLoading] = useState(false);

  const handleNetworkChange = (net) => {
    setNetwork(net);
    // Reset to dashboard when network changes
    setView('dashboard');
  };

  const renderView = () => {
    const props = { network, onNetworkChange: handleNetworkChange };

    switch (view) {
      case 'dashboard':
        return <DashboardView {...props} onNavigate={setView} />;
      case 'models':
        return <ModelsView {...props} />;
      case 'roles':
        return <RolesView {...props} />;
      case 'audit':
        return <AuditView {...props} />;
      case 'nft':
        return <NftView {...props} />;
      default:
        return <DashboardView {...props} onNavigate={setView} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa' }}>
      {/* Top Navigation */}
      <nav style={{
        background: '#24292f',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          padding: '14px 0',
          marginRight: 24,
        }}>
          AI Provenance
        </div>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: '14px 16px',
              background: view === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: view === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
              border: 'none',
              borderBottom: view === tab.id ? '2px solid #f78166' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : (
        renderView()
      )}
    </div>
  );
}
