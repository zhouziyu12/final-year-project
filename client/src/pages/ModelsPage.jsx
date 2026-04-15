import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Database,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { RECORD_FIELD_LABELS, getEventTypeLabel, normalizeTupleRecord } from '../lib/projectData';

function LatestRecord({ record }) {
  const tuple = normalizeTupleRecord(record);

  if (!tuple.length) {
    return (
      <div className="table-empty">
        No detailed provenance tuple was returned for this model yet.
      </div>
    );
  }

  return (
    <div className="record-grid">
      {tuple.slice(0, RECORD_FIELD_LABELS.length).map((value, index) => (
        <div className="record-card" key={`${RECORD_FIELD_LABELS[index]}-${index}`}>
          <span>{RECORD_FIELD_LABELS[index]}</span>
          <strong className="mono-text">
            {index === 2 ? getEventTypeLabel(value) : String(value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function ModelsPage({
  status,
  models,
  loading,
  frontendRole,
  authSession,
  selectedModelContext,
  onSelectModel,
  onTabChange
}) {
  const selectedModel = selectedModelContext.summary;
  const selectedDetail = selectedModelContext.detail;
  const selectedAudit = selectedModelContext.audit;

  const activeModels = models.filter((model) => model.status === 'ACTIVE' || model.isActive).length;
  const ownerCount = new Set(models.map((model) => model.owner).filter(Boolean)).size;

  return (
    <div className="page-grid">
      <section className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Total assets</p>
          <p className="metric-value">{status?.totalModels || models.length || 0}</p>
          <p className="metric-footnote">Models currently exposed by the backend registry list endpoint.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Active models</p>
          <p className="metric-value">{activeModels}</p>
          <p className="metric-footnote">Entries already promoted into an active on-chain state.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Indexed owners</p>
          <p className="metric-value">{ownerCount}</p>
          <p className="metric-footnote">Distinct owner addresses represented in the backend-managed registry index.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Frontend role</p>
          <p className="metric-value">{authSession?.user ? 'Signed in' : 'Presentation'}</p>
          <p className="metric-footnote">{frontendRole.summary}</p>
        </article>
      </section>

      <section className="content-split content-split-wide">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Registration Path</p>
              <h3 className="panel-title">Why the browser no longer registers models directly</h3>
            </div>
          </div>

          <div className="sdk-notice-grid">
            <div className="sdk-notice-item">
              <div className="sdk-notice-icon">
                <Terminal size={18} />
              </div>
              <div>
                <p className="sdk-notice-title">SDK remains authoritative</p>
                <p className="sdk-notice-copy">Registration now runs through the Python SDK, which signs in with an account, resolves the owner-scoped model identity, and submits through the backend relay.</p>
              </div>
            </div>
            <div className="sdk-notice-item">
              <div className="sdk-notice-icon">
                <LockKeyhole size={18} />
              </div>
              <div>
                <p className="sdk-notice-title">Frontend is presentation-first</p>
                <p className="sdk-notice-copy">The browser focuses on status, registry inspection, audit verification, and lifecycle downloads instead of sharing a reusable write secret.</p>
              </div>
            </div>
            <div className="sdk-notice-item">
              <div className="sdk-notice-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="sdk-notice-title">Bound owner identity is explicit</p>
                <p className="sdk-notice-copy">
                  {authSession?.user
                    ? `Current signed-in viewer: ${authSession.user.username} bound to ${authSession.user.walletAddress}.`
                    : 'Lifecycle downloads can use account login, but registry writes are intentionally absent from this UI.'}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Registry Rules</p>
              <h3 className="panel-title">What this page can truthfully expose</h3>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <Database size={18} />
              <div>
                <p className="insight-title">List view comes from `/api/v2/models`</p>
                <p className="insight-copy">This gives the UI a backend-managed registry view of ID, chain, owner, and status without claiming full chain-wide inventory coverage.</p>
              </div>
            </div>
            <div className="insight-item">
              <FileSearch size={18} />
              <div>
                <p className="insight-title">Detail view comes from `/api/v2/models/:id`</p>
                <p className="insight-copy">The selected row now triggers a second request so the detail view is not built from incomplete list data.</p>
              </div>
            </div>
            <div className="insight-item">
              <CheckCircle2 size={18} />
              <div>
                <p className="insight-title">Audit state comes from `/api/v2/audit/verify/:id`</p>
                <p className="insight-copy">Record count and the latest tuple are fetched separately and displayed as evidence.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Live Inventory</p>
            <h3 className="panel-title">Registered models available to the frontend</h3>
          </div>
          <div className="table-legend">
            <span><Boxes size={14} /> {models.length} asset{models.length !== 1 ? 's' : ''}</span>
            <span><CheckCircle2 size={14} /> Select a row to inspect detail</span>
          </div>
        </div>

        <div className="registry-table-shell">
          <div className="registry-table registry-table-head">
            <span>Name</span>
            <span>Description</span>
            <span>Chain</span>
            <span>Status</span>
            <span>Model ID</span>
          </div>

          {loading ? (
            <div className="table-empty">Loading model inventory from the backend...</div>
          ) : models.length === 0 ? (
            <div className="table-empty">No indexed models found yet. Create one through the authenticated Python SDK first.</div>
          ) : (
            models.map((model) => (
              <button
                type="button"
                className={`registry-table registry-table-button${selectedModel && String(selectedModel.numericId || selectedModel.id) === String(model.numericId || model.id) && selectedModel.chain === model.chain ? ' is-active' : ''}`}
                key={`${model.chain}-${model.id}`}
                onClick={() => onSelectModel(model)}
              >
                <span>{model.name || 'Unnamed model'}</span>
                <span>{model.description || 'Registered through backend relayer'}</span>
                <span>{model.chain}</span>
                <span>
                  <span className={`status-pill${model.isActive ? ' is-online' : ''}`}>
                    {model.status || (model.isActive ? 'ACTIVE' : 'PENDING')}
                  </span>
                </span>
                <span className="mono-text">#{model.numericId || model.id}</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="content-split content-split-wide">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Selected Model Detail</p>
              <h3 className="panel-title">Merged registry detail and audit context</h3>
            </div>
          </div>

          {!selectedModel ? (
            <div className="empty-state">
              <FileSearch size={32} />
              <p className="empty-state-title">No model selected</p>
              <p className="empty-state-copy">Choose a registry row to inspect owner, status, and audit summary.</p>
            </div>
          ) : (
            <div className="detail-panel">
              <div className="detail-header">
                <div>
                  <p className="detail-title">{selectedModel.name || 'Unnamed model'}</p>
                  <p className="detail-subtitle">
                    This panel combines the list response, detail response, and audit verification response for the same model.
                  </p>
                </div>
                <span className={`status-pill${selectedAudit?.chainVerified ? ' is-online' : ''}`}>
                  {selectedDetail?.status || selectedModel.status || 'Pending'}
                </span>
              </div>

              <div className="detail-kv-grid">
                <div className="detail-kv-item">
                  <span>Model ID</span>
                  <strong>#{selectedModel.numericId || selectedModel.id}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Chain</span>
                  <strong>{selectedModel.chain || '--'}</strong>
                </div>
                <div className="detail-kv-item detail-kv-item-wide">
                  <span>Owner</span>
                  <strong className="mono-text">{selectedDetail?.owner || selectedModel.owner || '--'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Status</span>
                  <strong>{selectedDetail?.status || selectedModel.status || '--'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Chain verified</span>
                  <strong>{selectedAudit?.chainVerified ? 'Yes' : 'No'}</strong>
                </div>
                <div className="detail-kv-item">
                  <span>Record count</span>
                  <strong>{selectedAudit?.recordCount ?? '--'}</strong>
                </div>
              </div>

              <div className="payload-summary">
                <p className="payload-summary-label">Latest returned provenance tuple</p>
                <LatestRecord record={selectedAudit?.latestRecord} />
              </div>
            </div>
          )}
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Next Actions</p>
              <h3 className="panel-title">Move from registry inspection into verification</h3>
            </div>
          </div>

          {selectedModel ? (
            <div className="insight-list">
              <div className="insight-item">
                <BadgeCheck size={18} />
                <div>
                  <p className="insight-title">Audit this model</p>
                  <p className="insight-copy">Use the audit console to re-run verification using the same selected model ID and chain.</p>
                </div>
              </div>
              <div className="insight-item">
                <Terminal size={18} />
                <div>
                  <p className="insight-title">Show the training context</p>
                  <p className="insight-copy">Move to the training page to explain how off-chain artifacts connect to this registry entry.</p>
                </div>
              </div>
              <div className="hero-actions">
                <button type="button" className="primary-action" onClick={() => onTabChange('audit')}>
                  Open audit console
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="secondary-action" onClick={() => onTabChange('training')}>
                  Open training flow
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Boxes size={32} />
              <p className="empty-state-title">No model selected</p>
              <p className="empty-state-copy">Select a registry row above to unlock model-specific follow-up actions.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
