import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header, PageContainer, PageHeader } from './components/layout';
import { DashboardPage, ModelsPage, AuditPage, NFTPage } from './pages';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Navigation
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'models', label: 'Models', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { id: 'audit', label: 'Audit', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'nft', label: 'NFT Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

function App() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchStatus();
    fetchModels();
  }, []);

  // API Functions
  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/status`);
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to connect to server');
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/models`);
      setModels(res.data.models || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    const res = await axios.post(`${API_BASE}/api/register`, data);
    await fetchModels();
    return res.data;
  };

  const handleAudit = async (data) => {
    const res = await axios.post(`${API_BASE}/api/audit`, data);
    return res.data;
  };

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage status={status} loading={loading} />;
      case 'models':
        return <ModelsPage models={models} onRegister={handleRegister} loading={loading} />;
      case 'audit':
        return <AuditPage onAudit={handleAudit} loading={loading} />;
      case 'nft':
        return <NFTPage nfts={nfts} loading={loading} />;
      default:
        return <DashboardPage status={status} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title="AI Model Provenance"
        subtitle="ZK-Powered Model Verification"
        actions={
          <div className="flex items-center gap-2">
            <StatusDot connected={!error} />
            <span className="text-sm text-gray-500">
              {error ? 'Disconnected' : 'Connected'}
            </span>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium
                  transition-colors whitespace-nowrap
                  ${activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <PageContainer>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <strong>Error:</strong> {error}. Please make sure the server is running.
          </div>
        )}
        {renderPage()}
      </PageContainer>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              AI Model Provenance System - ZK-Powered Verification
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="https://github.com/zhouziyu12/final-year-project" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
                GitHub
              </a>
              <span>|</span>
              <span>Built with Hardhat + snarkjs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Status indicator
function StatusDot({ connected }) {
  return (
    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

export default App;
