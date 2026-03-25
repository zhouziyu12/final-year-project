import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header, PageContainer } from './components/layout';
import { DashboardPage, ModelsPage, AuditPage, NFTPage } from './pages';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'models', label: 'Models' },
  { id: 'audit', label: 'Audit' },
  { id: 'nft', label: 'NFTs' },
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
    <div className="min-h-screen">
      <Header title="AI Model Provenance" subtitle="ZK-Powered Verification" />
      
      <nav className="border-b border-white/5 bg-[var(--bg-secondary)]">
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

      <PageContainer>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {error} - Make sure server is running on port 3000
          </div>
        )}
        {pages[tab]}
      </PageContainer>

      <footer className="border-t border-white/5 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          AI Model Provenance System - Built with Hardhat + snarkjs
        </div>
      </footer>
    </div>
  );
}

export default App;
