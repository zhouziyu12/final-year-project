import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Fingerprint,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Waypoints
} from 'lucide-react';
import { RECORD_FIELD_LABELS, getEventTypeLabel, normalizeTupleRecord } from '../lib/projectData';

const AUDIT_STAGES = [
  'Locate the target model and chain',
  'Load on-chain provenance history through the verifier endpoint',
  'Read the returned verification flag and record count',
  'Inspect the latest record tuple and correlate it with recent audit events'
];

function LatestRecordSummary({ record }) {
  const tuple = normalizeTupleRecord(record);

  if (!tuple.length) {
    return (
      <div className="table-empty">
        No latest record tuple returned for this verification call.
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

export function AuditPage({ models, onAudit, loading, selectedModelContext, auditEvents }) {
  const [formState, setFormState] = useState({ modelId: '', chain: 'sepolia' });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedModelContext.summary) {
      setFormState({
        modelId: String(selectedModelContext.summary.numericId || selectedModelContext.summary.id),
        chain: selectedModelContext.summary.chain || 'sepolia'
      });
    }
  }, [selectedModelContext.summary]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await onAudit({
        modelId: formState.modelId,
        chain: formState.chain
      });
      setResult({ type: 'success', payload: response });
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  const recentEvents = auditEvents
    .filter((event) => !formState.chain || event.chain === formState.chain)
    .slice(0, 6);

  return (
    <div className="page-grid">
      <section className="content-split content-split-wide">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Verification Command</p>
              <h3 className="panel-title">Run provenance verification against the backend audit endpoint</h3>
            </div>
            <div className="panel-chip">
              <Fingerprint size={14} />
              <span>GET /api/v2/audit/verify/:id</span>
            </div>
          </div>

          <form className="registry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field-group">
                <span>Model ID</span>
                <input
                  name="modelId"
                  value={formState.modelId}
                  onChange={updateField}
                  placeholder="Enter a numeric model ID"
                  required
                />
              </label>

              <label className="field-group">
                <span>Chain</span>
                <select name="chain" value={formState.chain} onChange={updateField}>
                  <option value="sepolia">Sepolia</option>
                  <option value="tbnb">BNB Testnet</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-action" disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify provenance'}
              </button>
            </div>
          </form>

          <div className="audit-stage-list">
            {AUDIT_STAGES.map((step, index) => (
              <div className="audit-stage-item" key={step}>
                <div className="audit-stage-index">{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Result Interpretation</p>
              <h3 className="panel-title">Read the backend response as evidence</h3>
            </div>
          </div>

          {!result ? (
            <div className="empty-state">
              <ScanSearch size={32} />
              <p className="empty-state-title">No verification run yet</p>
              <p className="empty-state-copy">
                Submit a model ID and this panel will summarize the verification flag, record count, and latest returned record tuple.
              </p>
            </div>
          ) : result.type === 'error' ? (
            <div className="result-card result-card-danger">
              <div className="result-header">
                <ShieldAlert size={20} />
                <div>
                  <p className="result-title">Verification failed</p>
                  <p className="result-copy">{result.message}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`result-card${result.payload.verified ? ' result-card-success' : ' result-card-warning'}`}>
              <div className="result-header">
                {result.payload.verified ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                <div>
                  <p className="result-title">
                    {result.payload.verified ? 'Chain verified successfully' : 'Chain integrity did not pass'}
                  </p>
                  <p className="result-copy">
                    Model #{result.payload.modelId} on {result.payload.chain} returned {result.payload.recordCount} recorded provenance events.
                  </p>
                </div>
              </div>

              <div className="result-metrics">
                <div>
                  <span>Verified</span>
                  <strong>{result.payload.verified ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span>Record count</span>
                  <strong>{result.payload.recordCount}</strong>
                </div>
                <div>
                  <span>Target chain</span>
                  <strong>{result.payload.chain}</strong>
                </div>
              </div>

              <div className="payload-summary">
                <p className="payload-summary-label">Latest tuple returned by the verifier</p>
                <LatestRecordSummary record={result.payload.latestRecord} />
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Candidate IDs</p>
              <h3 className="panel-title">Pick an existing model to verify</h3>
            </div>
          </div>

          <div className="table-shell">
            <div className="table-row table-row-head">
              <span>Name</span>
              <span>Chain</span>
              <span>Suggested ID</span>
            </div>
            {loading ? (
              <div className="table-empty">Loading available model IDs...</div>
            ) : models.length === 0 ? (
              <div className="table-empty">There are no registered models yet. Register one first to demonstrate the audit stage.</div>
            ) : (
              models.slice(0, 6).map((model) => (
                <button
                  key={`${model.chain}-${model.id}`}
                  type="button"
                  className="table-row table-row-button"
                  onClick={() => setFormState({ modelId: String(model.numericId || model.id), chain: model.chain || 'sepolia' })}
                >
                  <span>{model.name}</span>
                  <span>{model.chain}</span>
                  <span className="mono-text">#{model.numericId || model.id}</span>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Recent Audit Events</p>
              <h3 className="panel-title">Latest backend audit feed for the selected chain</h3>
            </div>
          </div>

          {recentEvents.length === 0 ? (
            <div className="empty-state">
              <Waypoints size={32} />
              <p className="empty-state-title">No recent audit events</p>
              <p className="empty-state-copy">Recent events will appear here when the backend returns them for the selected chain.</p>
            </div>
          ) : (
            <div className="event-feed">
              {recentEvents.map((event) => (
                <div className="event-item" key={`${event.chain}-${event.transactionHash}-${event.blockNumber}`}>
                  <div className="event-item-marker">
                    <Waypoints size={14} />
                  </div>
                  <div className="event-item-body">
                    <div className="event-item-topline">
                      <p className="event-item-title">{getEventTypeLabel(event?.args?.['1'])}</p>
                      <span className="status-pill">{event.chain}</span>
                    </div>
                    <p className="event-item-copy">
                      Model #{event?.args?.['3'] || '--'} at block #{event.blockNumber || '--'}.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Audit Narrative</p>
            <h3 className="panel-title">What this page now proves during a demo</h3>
          </div>
        </div>

        <div className="insight-grid">
          <article className="insight-item">
            <Waypoints size={18} />
            <div>
              <p className="insight-title">Traceability</p>
              <p className="insight-copy">The verifier is exposed as a visible endpoint-backed stage rather than hidden backend magic.</p>
            </div>
          </article>
          <article className="insight-item">
            <CheckCircle2 size={18} />
            <div>
              <p className="insight-title">Evidence over slogans</p>
              <p className="insight-copy">Verification status, record count, latest tuple, and recent audit events now appear together for technical discussion.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
