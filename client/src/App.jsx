import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header, PageContainer } from './components/layout';
import { DashboardPage, ModelsPage, AuditPage, NFTPage } from './pages';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'models', label: 'Models', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { id: 'audit', label: 'Audit', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'nft', label: 'NFTs', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

function App() {
  const [tab, setTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/status`).catch(() => null),
      axios.get(`${API}/api/models`).catch(() => ({ data: { models: [] } }))
    ]).then(([s, m]) => {
      if (s?.data) setStatus(s.data);
      else setError('Server offline');
      setModels(m?.data?.models || []);
      setLoading(false);
    });
  }, []);

  const handleRegister = async (data) => {
    const r = await axios.post(`${API}/api/register`, data);
    setModels(prev => [...prev, r.data]);
    return r.data;
  };

  const handleAudit = async (data) => {
    const r = await axios.post(`${API}/api/audit`, data);
    return r.data;
  };

  const pages = {
    dashboard: <DashboardPage status={status} loading={loading} />,
    models: <ModelsPage models={models} onRegister={handleRegister} loading={loading} />,
    audit: <AuditPage onAudit={handleAudit} loading={loading} />,
    nft: <NFTPage nfts={[]} loading={loading} />,
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header title="AI Model Provenance" subtitle="ZK-Powered Verification" />
      
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-white/5 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-5 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                  tab === item.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <PageContainer className="px-4 sm:px-6">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error} - Make sure server is running
          </div>
        )}
        {pages[tab]}
      </PageContainer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-white/5 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                tab === item.id ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={tab === item.id ? 2.5 : 1.5} d={item.icon} />
              </svg>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="hidden md:block border-t border-white/5 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          AI Model Provenance System - Built with Hardhat + snarkjs
        </div>
      </footer>
    </div>
  );
}

export default App;
