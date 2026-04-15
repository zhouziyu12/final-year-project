import React, { startTransition, useCallback, useEffect, useState } from 'react';
import './App.css';
import { useDevice } from './hooks';
import { DesktopLayout, MobileLayout } from './components/layout';
import { DashboardPage, TrainingPage, ModelsPage, AuditPage, SystemPage } from './pages';
import {
  downloadLifecycleVersion,
  fetchAuditVerification,
  fetchCurrentUser,
  fetchHealth,
  fetchLifecycleBySecret,
  fetchModelDetail,
  fetchModels,
  fetchRecentAuditEvents,
  fetchStatus,
  getFrontendRoleState,
  getStoredAuthSession,
  loginUser,
  logoutUser
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
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [authRefreshing, setAuthRefreshing] = useState(Boolean(getStoredAuthSession()?.token));
  const [authError, setAuthError] = useState(null);
  const { isMobile } = useDevice();
  const frontendRole = getFrontendRoleState();

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
    let active = true;

    async function hydrateSession() {
      if (!getStoredAuthSession()?.token) {
        if (active) setAuthRefreshing(false);
        return;
      }

      try {
        const session = await fetchCurrentUser();
        if (!active) return;
        setAuthSession(session);
        setAuthError(null);
      } catch (sessionError) {
        if (!active) return;
        setAuthSession(null);
        setAuthError(getActionError(sessionError, 'Stored session could not be restored.'));
      } finally {
        if (active) {
          setAuthRefreshing(false);
        }
      }
    }

    hydrateSession();

    return () => {
      active = false;
    };
  }, []);

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

  const handleLifecycleLookup = async (secret) => {
    const response = await fetchLifecycleBySecret(secret);
    setLastUpdated(new Date().toISOString());
    return response;
  };

  const handleLifecycleDownload = async (payload) => {
    await downloadLifecycleVersion(payload);
  };

  const handleLogin = async (credentials) => {
    const session = await loginUser(credentials);
    setAuthSession(session);
    setAuthError(null);
    return session;
  };

  const handleLogout = () => {
    logoutUser();
    setAuthSession(null);
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
        frontendRole={frontendRole}
        authSession={authSession}
        onTabChange={handleTabChange}
        onSelectModel={handleSelectModel}
      />
    ),
    training: (
      <TrainingPage
        status={status}
        selectedModelContext={selectedModelContext}
        frontendRole={frontendRole}
        authSession={authSession}
        authRefreshing={authRefreshing}
        onTabChange={handleTabChange}
        onLifecycleLookup={handleLifecycleLookup}
        onLifecycleDownload={handleLifecycleDownload}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    ),
    registry: (
      <ModelsPage
        status={status}
        models={models}
        loading={loading}
        frontendRole={frontendRole}
        authSession={authSession}
        selectedModelContext={selectedModelContext}
        onSelectModel={handleSelectModel}
        onTabChange={handleTabChange}
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
        frontendRole={frontendRole}
        authSession={authSession}
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

      {authError && !error ? (
        <section className="app-banner" aria-live="polite">
          <div>
            <p className="app-banner-title">Session notice</p>
            <p className="app-banner-copy">{authError}</p>
          </div>
        </section>
      ) : null}

      {pages[tab]}
    </Layout>
  );
}

export default App;
