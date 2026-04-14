import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Database,
  FileSearch,
  LockKeyhole,
  PlusCircle,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { RECORD_FIELD_LABELS, getEventTypeLabel, normalizeTupleRecord } from '../lib/projectData';

const INITIAL_FORM = {
  name: '',
  description: '',
  ipfsCid: '',
  checksum: '',
  framework: 'PyTorch',
  license: 'MIT',
  chain: 'sepolia'
};

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
  writeAccess,
  selectedModelContext,
  onSelectModel,
  onTabChange,
  onRegister
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedModel = selectedModelContext.summary;
  const selectedDetail = selectedModelContext.detail;
  const selectedAudit = selectedModelContext.audit;

  const activeModels = models.filter((model) => model.status === 'ACTIVE' || model.verified).length;
  const stakedModels = models.filter((model) => model.staked).length;

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!writeAccess.enabled) {
      setFeedback({
        type: 'error',
        title: 'Frontend writes are disabled',
        message: writeAccess.summary
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await onRegister(formData);
      setFeedback({
        type: 'success',
        title: 'Model registered',
        message: `Created model #${response.numericId || response.id} on ${response.chain}.`
      });
      setFormData((current) => ({ ...INITIAL_FORM, chain: current.chain }));
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Registration failed',
        message: error.message
      });
    } finally {
      setSubmitting(false);
    }
  }

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
          <p className="metric-footnote">Entries already promoted into active or verified state.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Staked models</p>
          <p className="metric-value">{stakedModels}</p>
          <p className="metric-footnote">Models whose list response already indicates a staking relationship.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Write mode</p>
          <p className="metric-value">{writeAccess.enabled ? 'Enabled' : 'SDK only'}</p>
          <p className="metric-footnote">{writeAccess.summary}</p>
        </article>
      </section>

      <section className="content-split content-split-wide">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Registration Path</p>
              <h3 className="panel-title">Submit a new model only when local frontend writes are intentionally enabled</h3>
            </div>
          </div>

          {!writeAccess.enabled ? (
            <div className="sdk-notice-grid">
              <div className="sdk-notice-item">
                <div className="sdk-notice-icon">
                  <Terminal size={18} />
                </div>
                <div>
                  <p className="sdk-notice-title">SDK remains authoritative</p>
                  <p className="sdk-notice-copy">Registration normally runs through the Python SDK, which owns the write key and provenance submission workflow.</p>
                </div>
              </div>
              <div className="sdk-notice-item">
                <div className="sdk-notice-icon">
                  <LockKeyhole size={18} />
                </div>
                <div>
                  <p className="sdk-notice-title">Frontend is read-only</p>
                  <p className="sdk-notice-copy">To enable demo writes, set `VITE_WRITE_API_KEY` to the same value as the backend `WRITE_API_KEY` in local development only.</p>
                </div>
              </div>
              <div className="sdk-notice-item">
                <div className="sdk-notice-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="sdk-notice-title">Security boundary stays visible</p>
                  <p className="sdk-notice-copy">The interface no longer pretends it can write when the environment says it should not.</p>
                </div>
              </div>
            </div>
          ) : (
            <form className="registry-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field-group">
                  <span>Model name</span>
                  <input name="name" value={formData.name} onChange={handleFieldChange} placeholder="vision-transformer-v2" required />
                </label>
                <label className="field-group">
                  <span>Chain</span>
                  <select name="chain" value={formData.chain} onChange={handleFieldChange}>
                    <option value="sepolia">Sepolia</option>
                    <option value="tbnb">BNB Testnet</option>
                  </select>
                </label>
                <label className="field-group field-group-wide">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFieldChange}
                    rows="3"
                    placeholder="Short operator-facing description of the model purpose."
                  />
                </label>
                <label className="field-group">
                  <span>IPFS CID</span>
                  <input name="ipfsCid" value={formData.ipfsCid} onChange={handleFieldChange} placeholder="Qm..." />
                </label>
                <label className="field-group">
                  <span>Checksum</span>
                  <input name="checksum" value={formData.checksum} onChange={handleFieldChange} placeholder="sha256..." />
                </label>
                <label className="field-group">
                  <span>Framework</span>
                  <input name="framework" value={formData.framework} onChange={handleFieldChange} placeholder="PyTorch" />
                </label>
                <label className="field-group">
                  <span>License</span>
                  <input name="license" value={formData.license} onChange={handleFieldChange} placeholder="MIT" />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-action" disabled={submitting}>
                  <PlusCircle size={16} />
                  <span>{submitting ? 'Registering...' : 'Register model'}</span>
                </button>
                <button type="button" className="secondary-action" onClick={() => setFormData(INITIAL_FORM)}>
                  Reset
                </button>
              </div>
            </form>
          )}

          {feedback ? (
            <div className={`feedback-banner${feedback.type === 'error' ? ' is-error' : ''}`}>
              <div className="result-header">
                {feedback.type === 'error' ? <AlertTriangle size={18} /> : <BadgeCheck size={18} />}
                <div>
                  <p className="feedback-title">{feedback.title}</p>
                  <p className="feedback-copy">{feedback.message}</p>
                </div>
              </div>
            </div>
          ) : null}
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
                <p className="insight-copy">This gives the UI a trustworthy inventory of ID, chain, owner, status, and staking flags.</p>
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
            <div className="table-empty">No registered models found yet. Create one through the SDK or enable local demo writes.</div>
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
                  <span className={`status-pill${model.verified ? ' is-online' : ''}`}>
                    {model.status || (model.verified ? 'ACTIVE' : 'PENDING')}
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
              <p className="empty-state-copy">Choose a registry row to inspect owner, status, staking state, and audit summary.</p>
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
                <span className={`status-pill${selectedAudit?.verified ? ' is-online' : ''}`}>
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
