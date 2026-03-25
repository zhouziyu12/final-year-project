import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDevice } from './hooks';
import { DesktopLayout, MobileLayout } from './components/layout';
import { DashboardPage, ModelsPage, AuditPage, NFTPage } from './pages';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [tab, setTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isMobile } = useDevice();

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

  // Responsive layout - different design for mobile vs desktop
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error} - Make sure server is running on port 3000
        </div>
      )}
      <div className={isMobile ? 'p-4' : 'p-8'}>
        {pages[tab]}
      </div>
    </Layout>
  );
}

export default App;
