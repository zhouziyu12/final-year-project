import React, { startTransition, useCallback, useEffect, useState } from 'react';
import './App.css';
import { useDevice } from './hooks';
import { DesktopLayout, MobileLayout } from './components/layout';
import { DashboardPage, TrainingPage, ModelsPage, AuditPage, SystemPage, NFTPage } from './pages';
import {
  downloadLifecycleVersion,
  fetchAuditVerification,
  fetchHealth,
  fetchLifecycleBySecret,
  fetchModelDetail,
  fetchModels,
  fetchRecentAuditEvents,
  fetchStatus,
  getWriteAccessState,
  registerModel
} from './lib/api';
import { PAGE_META } from './lib/projectData';

function getActionError(error, fallback) {
  return error?.message || fallback;
}

function buildAuditEventFeed(eventsByChain) {
  return Object.entries(eventsByChain).flatMap(([chain, events]) =>
    (events || []).map((event) => ({
      ...event,
      chain
    }))
  ).sort((left, right) => (right.blockNumber || 0) - (left.blockNumber || 0));
}

function App() {
  const [tab, setTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModelRef, setSelectedModelRef] = useState(null);
  const [selectedModelDetail, setSelectedModelDetail] = useState(null);
  const [selectedModelAudit, setSelectedModelAudit] = useState(null);
  const [recentAuditByChain, setRecentAuditByChain] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectionError, setSelectionError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isMobile } = useDevice();
  const writeAccess = getWriteAccessState();

  const selectedModel = models.find((model) => (
    model && String(model.numericId || model.id) === String(selectedModelRef?.id) && model.chain === selectedModelRef?.chain
  )) || null;

  const auditEvents = buildAuditEventFeed(recentAuditByChain).slice(0, 12);

  const loadPlatformData = useCallback(async (nextSelection = null) => {
    setLoading(true);

    try {
      const [healthResponse, statusResponse, modelsResponse] = await Promise.all([
        fetchHealth(),
        fetchStatus(),
        fetchModels()
      ]);

      const auditResults = await Promise.allSettled([
        fetchRecentAuditEvents('sepolia', 8),
        fetchRecentAuditEvents('tbnb', 8)
      ]);
      const [sepoliaEvents, tbnbEvents] = auditResults.map((result) => (
        result.status === 'fulfilled' ? result.value : []
      ));

      setHealth(healthResponse);
      setStatus(statusResponse);
      setModels(modelsResponse);
      setRecentAuditByChain({ sepolia: sepoliaEvents, tbnb: tbnbEvents });
      setError(null);
      setLastUpdated(new Date().toISOString());

      setSelectedModelRef((current) => (
        nextSelection
        || current
        || (modelsResponse[0]
          ? { id: Number(modelsResponse[0].numericId || modelsResponse[0].id), chain: modelsResponse[0].chain || 'sepolia' }
          : null)
      ));
    } catch (loadError) {
      setError(getActionError(loadError, 'Unable to reach the backend.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  useEffect(() => {
    if (!selectedModelRef?.id || !selectedModelRef?.chain) {
      setSelectedModelDetail(null);
      setSelectedModelAudit(null);
      setSelectionError(null);
      return;
    }

    let active = true;

    async function loadSelectionContext() {
      setSelectionLoading(true);

      try {
        const [detailResponse, auditResponse] = await Promise.all([
          fetchModelDetail({ id: selectedModelRef.id, chain: selectedModelRef.chain }),
          fetchAuditVerification({ modelId: selectedModelRef.id, chain: selectedModelRef.chain })
        ]);

        if (!active) return;

        setSelectedModelDetail(detailResponse);
        setSelectedModelAudit(auditResponse);
        setSelectionError(null);
      } catch (selectionLoadError) {
        if (!active) return;
        setSelectedModelDetail(null);
        setSelectedModelAudit(null);
        setSelectionError(getActionError(selectionLoadError, 'Unable to load selected model context.'));
      } finally {
        if (active) {
          setSelectionLoading(false);
        }
      }
    }

    loadSelectionContext();

    return () => {
      active = false;
    };
  }, [selectedModelRef]);

  const handleAudit = async (payload) => {
    const response = await fetchAuditVerification(payload);
    setLastUpdated(new Date().toISOString());
    return response;
  };

  const handleRegister = async (payload) => {
    const response = await registerModel(payload);
    await loadPlatformData({
      id: Number(response.numericId || response.id),
      chain: response.chain || payload.chain || 'sepolia'
    });
    startTransition(() => setTab('registry'));
    return response;
  };

  const handleLifecycleLookup = async (secret) => {
    const response = await fetchLifecycleBySecret(secret);
    setLastUpdated(new Date().toISOString());
    return response;
  };

  const handleLifecycleDownload = async (payload) => {
    await downloadLifecycleVersion(payload);
  };

  const handleSelectModel = (model) => {
    if (!model) return;

    startTransition(() => {
      setSelectedModelRef({
        id: Number(model.numericId || model.id),
        chain: model.chain || 'sepolia'
      });
    });
  };

  const handleTabChange = (nextTab) => {
    startTransition(() => setTab(nextTab));
  };

  const selectedModelContext = {
    summary: selectedModel,
    detail: selectedModelDetail,
    audit: selectedModelAudit,
    loading: selectionLoading,
    error: selectionError
  };

  const layoutProps = {
    activeTab: tab,
    onTabChange: handleTabChange,
    pageMeta: PAGE_META[tab],
    status,
    models,
    lastUpdated,
    loading,
    onRefresh: () => loadPlatformData(selectedModelRef)
  };

  const pages = {
    overview: (
      <DashboardPage
        health={health}
        status={status}
        models={models}
        auditEvents={auditEvents}
        loading={loading}
        selectedModelContext={selectedModelContext}
        writeAccess={writeAccess}
        onTabChange={handleTabChange}
        onSelectModel={handleSelectModel}
      />
    ),
    training: (
      <TrainingPage
        status={status}
        selectedModelContext={selectedModelContext}
        writeAccess={writeAccess}
        onTabChange={handleTabChange}
        onLifecycleLookup={handleLifecycleLookup}
        onLifecycleDownload={handleLifecycleDownload}
      />
    ),
    registry: (
      <ModelsPage
        status={status}
        models={models}
        loading={loading}
        writeAccess={writeAccess}
        selectedModelContext={selectedModelContext}
        onSelectModel={handleSelectModel}
        onTabChange={handleTabChange}
        onRegister={handleRegister}
      />
    ),
    audit: (
      <AuditPage
        models={models}
        loading={loading}
        auditEvents={auditEvents}
        selectedModelContext={selectedModelContext}
        onAudit={handleAudit}
      />
    ),
    system: (
      <SystemPage
        health={health}
        status={status}
        models={models}
        auditEvents={auditEvents}
        writeAccess={writeAccess}
      />
    ),
    certificates: (
      <NFTPage
        status={status}
        models={models}
        loading={loading}
      />
    )
  };

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout {...layoutProps}>
      {error ? (
        <section className="app-banner app-banner-danger" aria-live="polite">
          <div>
            <p className="app-banner-title">Backend unavailable</p>
            <p className="app-banner-copy">{error}</p>
          </div>
          <button type="button" className="app-banner-action" onClick={() => loadPlatformData(selectedModelRef)}>
            Retry
          </button>
        </section>
      ) : null}

      {selectionError && !error ? (
        <section className="app-banner" aria-live="polite">
          <div>
            <p className="app-banner-title">Selected model context incomplete</p>
            <p className="app-banner-copy">{selectionError}</p>
          </div>
        </section>
      ) : null}

      {pages[tab]}
    </Layout>
  );
}

export default App;
