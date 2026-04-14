import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Database,
  FileSearch,
  ServerCog,
  ShieldCheck,
  Terminal,
  Waypoints
} from 'lucide-react';
import { DEMO_LANES, getEventTypeLabel } from '../lib/projectData';
import auditScene from '../assets/audit-visual-scene.svg';
import { MotionShowcase } from '../components/media/MotionShowcase';

function statValue(value, fallback = '0') {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function formatEvent(event) {
  const targetId = event?.args?.['3'] || '--';
  const eventType = event?.args?.['1'];
  return {
    title: event?.event || 'AuditEntryAdded',
    targetId,
    eventType: eventType !== undefined ? getEventTypeLabel(eventType) : 'Unknown',
    chain: event?.chain || 'unknown',
    blockNumber: event?.blockNumber || '--'
  };
}

export function DashboardPage({
  health,
  status,
  models,
  auditEvents,
  loading,
  selectedModelContext,
  writeAccess,
  onTabChange,
  onSelectModel
}) {
  const verifiedModels = models.filter((model) => model.verified).length;
  const selectedModel = selectedModelContext.summary;
  const selectedDetail = selectedModelContext.detail;
  const selectedAudit = selectedModelContext.audit;
  const defenseHighlights = [
    {
      icon: ShieldCheck,
      eyebrow: '可信性',
      title: 'Backend-first truth surface',
      copy: 'Health, registry, audit, and verification all come from live backend routes instead of fabricated showcase data.'
    },
    {
      icon: Box,
      eyebrow: '可验证性',
      title: 'Training to proof to chain',
      copy: 'The project story is explicit: local training artifacts, IPFS metadata, provenance records, and ZK-backed verification form one narrative.'
    },
    {
      icon: ServerCog,
      eyebrow: '稳健性',
      title: 'Read-only degradation path',
      copy: 'If signer credentials are unavailable, the platform can still present audit and registry evidence instead of crashing the whole backend.'
    }
  ];
  const defensePoints = [
    'Dual-chain registry and provenance inspection',
    'ZK proof pipeline and verification bridge',
    'Audit-friendly UI for final presentation'
  ];

  return (
    <div className="page-grid">
      <section className="hero-panel landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-brandline">AI Model Provenance · Final Year Project</p>
          <div className="hero-kicker">
            <BadgeCheck size={16} />
            <span>Provable lifecycle for training, IPFS, chain, and audit</span>
          </div>
          <h2 className="landing-hero-title">
            Provable lineage for AI models, designed for technical review and final defense.
          </h2>
          <p className="landing-hero-description">
            This landing page reframes the system as a thesis project, not a generic dashboard: backend truth, dual-chain
            provenance, ZK verification, and auditable model history are presented as one end-to-end engineering story.
          </p>

          <div className="landing-proof-strip">
            {defensePoints.map((point) => (
              <div className="landing-proof-chip" key={point}>
                <CheckCircle2 size={15} />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => onTabChange('training')}>
              Start defense walkthrough
              <ArrowRight size={16} />
            </button>
            <button type="button" className="secondary-action" onClick={() => onTabChange('audit')}>
              Open audit verification
            </button>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="hero-visual-stack">
            <MotionShowcase />
            <div className="arch-flow">
              <div className={`arch-flow-badge${health?.status === 'ok' ? '' : ' is-warning'}`}>
                <ShieldCheck size={14} />
                <span>{health?.status === 'ok' ? 'Backend health confirmed' : 'Health endpoint unavailable'}</span>
              </div>
              <div className="arch-flow-track">
                {[
                  'GET /api/health',
                  'GET /api/v2/status',
                  'GET /api/v2/models',
                  'GET /api/v2/models/:id',
                  'GET /api/v2/audit/recent',
                  'GET /api/v2/audit/verify/:id'
                ].map((label, index) => (
                  <div className="arch-node" key={label}>
                    <div
                      className="arch-node-dot"
                      style={{ background: index % 2 === 0 ? 'var(--accent-ink)' : 'var(--accent-aurora)' }}
                    />
                    <div className="arch-node-text">
                      <span className="arch-node-label">{label}</span>
                      <span className="arch-node-sub">Live interface contract used by the rebuilt frontend</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-highlight-section">
        <div className="demo-lanes-head">
          <p className="panel-eyebrow">Defense Highlights</p>
          <h3 className="panel-title">Three claims the homepage should make in the first minute</h3>
        </div>
        <div className="landing-highlight-grid">
          {defenseHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article className="landing-highlight-card" key={item.title}>
                <div className="landing-highlight-head">
                  <span className="landing-highlight-eyebrow">{item.eyebrow}</span>
                  <div className="landing-highlight-icon">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="landing-highlight-title">{item.title}</p>
                <p className="landing-highlight-copy">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Backend health</p>
          <p className="metric-value">{health?.status === 'ok' ? 'Live' : 'Offline'}</p>
          <p className="metric-footnote">Directly loaded from the health endpoint before other pages are rendered.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Models registered</p>
          <p className="metric-value">{statValue(status?.totalModels || models.length)}</p>
          <p className="metric-footnote">Inventory returned by the registry list endpoint.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Verified models</p>
          <p className="metric-value">{statValue(verifiedModels)}</p>
          <p className="metric-footnote">Models whose list response already indicates an active or verified state.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Frontend mode</p>
          <p className="metric-value">{writeAccess.enabled ? 'Writable' : 'Read-only'}</p>
          <p className="metric-footnote">{writeAccess.summary}</p>
        </article>
      </section>

      <section className="demo-lanes">
        <div className="demo-lanes-head">
          <p className="panel-eyebrow">Demo Walkthrough</p>
          <h3 className="panel-title">Four steps aligned with the backend contract</h3>
        </div>
        <div className="demo-lanes-grid">
          {DEMO_LANES.map((lane) => {
            const Icon = lane.icon;
            return (
              <button
                type="button"
                className="demo-lane-card"
                key={lane.tab}
                onClick={() => onTabChange(lane.tab)}
              >
                <div className="demo-lane-top">
                  <span className="demo-lane-step">{lane.step}</span>
                  <div className="demo-lane-icon">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="demo-lane-label">{lane.label}</p>
                <p className="demo-lane-copy">{lane.copy}</p>
                <div className="demo-lane-cta">
                  {lane.cta}
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Chain Surface</p>
              <h3 className="panel-title">Current runtime network status</h3>
            </div>
          </div>

          <div className="network-stack">
            {Object.entries(status?.chains || {}).length === 0 ? (
              <div className="table-empty">No chain connections detected. Open the System page for the dependency checklist.</div>
            ) : (
              Object.entries(status?.chains || {}).map(([chain, info]) => (
                <div className="network-card" key={chain}>
                  <div className="network-card-head">
                    <div>
                      <p className="network-name">{chain.toUpperCase()}</p>
                      <p className="network-copy">{info.connected ? 'RPC reachable and responding' : 'No response detected'}</p>
                    </div>
                    <span className={`status-pill${info.connected ? ' is-online' : ''}`}>
                      {info.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="network-stats">
                    <div>
                      <span>Block</span>
                      <strong>#{info.blockNumber?.toLocaleString?.() || '--'}</strong>
                    </div>
                    <div>
                      <span>Relayer balance</span>
                      <strong>{info.balance || '--'}</strong>
                    </div>
                    <div>
                      <span>Known models</span>
                      <strong>{info.knownModels || 0}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Recent Audit Activity</p>
              <h3 className="panel-title">Latest backend audit events across chains</h3>
            </div>
          </div>

          {auditEvents.length === 0 ? (
            <div className="empty-state">
              <FileSearch size={32} />
              <p className="empty-state-title">No recent audit events</p>
              <p className="empty-state-copy">The overview will list recent audit log events as soon as the backend returns them.</p>
            </div>
          ) : (
            <div className="event-feed">
              {auditEvents.slice(0, 5).map((event) => {
                const view = formatEvent(event);
                return (
                  <div className="event-item" key={`${view.chain}-${event.transactionHash}-${event.blockNumber}`}>
                    <div className="event-item-marker">
                      <Waypoints size={14} />
                    </div>
                    <div className="event-item-body">
                      <div className="event-item-topline">
                        <p className="event-item-title">{view.eventType}</p>
                        <span className="status-pill">{view.chain}</span>
                      </div>
                      <p className="event-item-copy">
                        {view.title} for model #{view.targetId} at block #{view.blockNumber}.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="feature-image-card">
            <img
              src={auditScene}
              alt="Illustrated audit and verification network for AI model provenance."
              className="feature-image"
            />
          </div>
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Registry Snapshot</p>
              <h3 className="panel-title">Selectable live model inventory</h3>
            </div>
          </div>

          <div className="table-shell">
            <div className="table-row table-row-head">
              <span>Name</span>
              <span>Chain</span>
              <span>Status</span>
            </div>
            {loading ? (
              <div className="table-empty">Refreshing models from the registry...</div>
            ) : models.length === 0 ? (
              <div className="table-empty">No registered models yet. Add one through the SDK or enable local demo writes.</div>
            ) : (
              models.slice(0, 5).map((model) => (
                <button
                  type="button"
                  className="table-row table-row-button"
                  key={`${model.chain}-${model.id}`}
                  onClick={() => onSelectModel(model)}
                >
                  <span>{model.name || 'Unnamed model'}</span>
                  <span>{model.chain}</span>
                  <span>{model.status || (model.verified ? 'ACTIVE' : 'PENDING')}</span>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Selected Model</p>
              <h3 className="panel-title">Backend-backed detail for the current inspection target</h3>
            </div>
          </div>

          {!selectedModel ? (
            <div className="empty-state">
              <Database size={32} />
              <p className="empty-state-title">No model selected</p>
              <p className="empty-state-copy">Choose a registry entry to load its detail and verification context.</p>
            </div>
          ) : (
            <div className="detail-callout">
              <div className="detail-callout-head">
                <div>
                  <p className="detail-callout-title">{selectedModel.name || 'Unnamed model'}</p>
                  <p className="detail-callout-copy">
                    This card merges the list response, the model detail endpoint, and the audit verification endpoint.
                  </p>
                </div>
                <span className={`status-pill${selectedDetail?.status === 'ACTIVE' || selectedModel.verified ? ' is-online' : ''}`}>
                  {selectedDetail?.status || selectedModel.status || 'Pending'}
                </span>
              </div>

              <div className="detail-kv-list">
                <div className="detail-kv-item">
                  <span>Model ID</span>
                  <strong>#{selectedModel.numericId || selectedModel.id}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Chain</span>
                  <strong>{selectedModel.chain}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Owner</span>
                  <strong className="mono-text">{selectedDetail?.owner || selectedModel.owner || '--'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Staked</span>
                  <strong>{selectedDetail?.staked ? 'Yes' : 'No'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Verified</span>
                  <strong>{selectedAudit?.verified ? 'Yes' : 'No'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Record count</span>
                  <strong>{selectedAudit?.recordCount ?? '--'}</strong>
                </div>
              </div>

              <div className="hero-actions">
                <button type="button" className="primary-action" onClick={() => onTabChange('audit')}>
                  Verify this model
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="secondary-action" onClick={() => onTabChange('registry')}>
                  Inspect registry detail
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">What Changed</p>
              <h3 className="panel-title">This frontend now respects backend truth boundaries</h3>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <Terminal size={18} />
              <div>
                <p className="insight-title">Training remains an external pipeline</p>
                <p className="insight-copy">The browser explains the training system but does not pretend to run Python workflows itself.</p>
              </div>
            </div>
            <div className="insight-item">
              <CheckCircle2 size={18} />
              <div>
                <p className="insight-title">List and detail are separated</p>
                <p className="insight-copy">The selected model now triggers a real detail fetch instead of reusing incomplete list data.</p>
              </div>
            </div>
            <div className="insight-item">
              <ServerCog size={18} />
              <div>
                <p className="insight-title">Write mode is explicit</p>
                <p className="insight-copy">Registration is only offered when a frontend demo key is deliberately configured.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Presentation Path</p>
              <h3 className="panel-title">Recommended flow for supervisors and examiners</h3>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <Database size={18} />
              <div>
                <p className="insight-title">Start here</p>
                <p className="insight-copy">Use the overview to establish that the UI is pulling real data from the backend and both chains.</p>
              </div>
            </div>
            <div className="insight-item">
              <Terminal size={18} />
              <div>
                <p className="insight-title">Then show the training page</p>
                <p className="insight-copy">Explain how local artifacts become backend submissions without claiming more browser-side control than actually exists.</p>
              </div>
            </div>
            <div className="insight-item">
              <ShieldCheck size={18} />
              <div>
                <p className="insight-title">Close with audit</p>
                <p className="insight-copy">Use one real model ID and let the verification result complete the provenance story.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
