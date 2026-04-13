import React, { useEffect, useState } from 'react';
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
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [statusResponse, modelsResponse] = await Promise.all([
          axios.get(`${API}/api/v2/status`),
          axios.get(`${API}/api/v2/models`)
        ]);

        if (!mounted) return;
        setStatus(statusResponse.data);
        setModels(modelsResponse.data.models || []);
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        setError('Server offline');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRegister = async (data) => {
    const response = await axios.post(`${API}/api/register`, data);
    const model = response.data;
    setModels((prev) => [...prev, model]);
    return model;
  };

  const handleAudit = async (data) => {
    const response = await axios.post(`${API}/api/audit`, data);
    return response.data;
  };

  const pages = {
    dashboard: <DashboardPage status={status} loading={loading} />,
    models: <ModelsPage models={models} onRegister={handleRegister} loading={loading} />,
    audit: <AuditPage onAudit={handleAudit} loading={loading} />,
    nft: <NFTPage nfts={[]} loading={loading} />
  };

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
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
