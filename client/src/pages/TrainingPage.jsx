import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Binary,
  Box,
  Download,
  FileCode2,
  Fingerprint,
  HardDriveUpload,
  KeyRound,
  LockKeyhole,
  PlaySquare,
  ShieldCheck,
  Workflow
} from 'lucide-react';
import { TRAINING_ARTIFACTS, TRAINING_STEPS } from '../lib/projectData';
import heroScene from '../assets/hero-provenance-scene.svg';

export function TrainingPage({
  status,
  selectedModelContext,
  writeAccess,
  onTabChange,
  onLifecycleLookup,
  onLifecycleDownload
}) {
  const selectedModel = selectedModelContext.summary;
  const selectedDetail = selectedModelContext.detail;
  const selectedAudit = selectedModelContext.audit;
  const [secretValue, setSecretValue] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [downloadHash, setDownloadHash] = useState(null);
  const [lifecycleResult, setLifecycleResult] = useState(null);
  const [lifecycleError, setLifecycleError] = useState(null);

  async function handleLifecycleSubmit(event) {
    event.preventDefault();
    setLookupLoading(true);
    setLifecycleError(null);

    try {
      const response = await onLifecycleLookup(secretValue.trim());
      setLifecycleResult(response);
    } catch (error) {
      setLifecycleResult(null);
      setLifecycleError(error.message);
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleVersionDownload(version) {
    setDownloadHash(version.modelHash);
    setLifecycleError(null);

    try {
      await onLifecycleDownload({
        secret: secretValue.trim(),
        modelHash: version.modelHash,
        fallbackName: version.artifactFileName || `${lifecycleResult?.series || 'model'}-${version.version || 'version'}.bin`
      });
    } catch (error) {
      setLifecycleError(error.message);
    } finally {
      setDownloadHash(null);
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">
            <Binary size={16} />
            <span>Training and submission pipeline</span>
          </div>
          <h2 className="hero-title">
            Explain the real handoff from Python training to backend relay to chain verification.
          </h2>
          <p className="hero-description">
            The frontend now treats training as an external workflow with inspectable outputs. It shows which files are
            produced locally, which stages are relayed through the backend, and which state becomes visible again through
            the registry and audit endpoints.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => onTabChange('registry')}>
              Continue to registry
              <ArrowRight size={16} />
            </button>
            <button type="button" className="secondary-action" onClick={() => onTabChange('audit')}>
              Open audit flow
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orbit-panel orbit-panel-compact">
            <div className="orbit-badge">
              <Fingerprint size={16} />
              <span>{status?.zkEnforced ? 'Verifier-gated provenance is enabled' : 'Verifier-gated provenance is currently unavailable'}</span>
            </div>
            <div className="orbit-center">
              <span className="orbit-center-value">{TRAINING_ARTIFACTS.length}</span>
              <span className="orbit-center-label">tracked artifacts</span>
            </div>
            <div className="orbit-node orbit-node-top">Train</div>
            <div className="orbit-node orbit-node-right">Hash</div>
            <div className="orbit-node orbit-node-bottom">Relay</div>
            <div className="orbit-node orbit-node-left">Verify</div>
          </div>
        </div>
      </section>

      <section className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Training scripts</p>
          <p className="metric-value">2</p>
          <p className="metric-footnote">`train1.py` and `train2.py` remain the authoritative training entry points.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Indexed artifacts</p>
          <p className="metric-value">{TRAINING_ARTIFACTS.length}</p>
          <p className="metric-footnote">Files and configuration surfaces explicitly referenced by the rebuilt UI.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Verifier gate</p>
          <p className="metric-value">{status?.zkEnforced ? 'Enforced' : 'Offline'}</p>
          <p className="metric-footnote">Read directly from the backend status response rather than assumed locally.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Write mode</p>
          <p className="metric-value">{writeAccess.enabled ? 'Demo enabled' : 'SDK only'}</p>
          <p className="metric-footnote">{writeAccess.summary}</p>
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Pipeline Stages</p>
              <h3 className="panel-title">Stage-by-stage system mapping</h3>
            </div>
          </div>

          <div className="pipeline-list">
            {TRAINING_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="pipeline-item" key={step.title}>
                  <div className="pipeline-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="pipeline-icon">
                    <Icon size={18} />
                  </div>
                  <div className="pipeline-content">
                    <p className="pipeline-title">{step.title}</p>
                    <p className="pipeline-copy">{step.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Boundary Notes</p>
              <h3 className="panel-title">What the frontend can and cannot do</h3>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <PlaySquare size={18} />
              <div>
                <p className="insight-title">Training is not browser-driven</p>
                <p className="insight-copy">The frontend documents the training flow; it does not execute Python scripts or claim direct control over checkpoints.</p>
              </div>
            </div>
            <div className="insight-item">
              <HardDriveUpload size={18} />
              <div>
                <p className="insight-title">Artifacts are restored through IPFS by lifecycle secret</p>
                <p className="insight-copy">The backend resolves the version-linked CID and streams the stored model artifact back from IPFS gateways.</p>
              </div>
            </div>
            <div className="insight-item">
              <LockKeyhole size={18} />
              <div>
                <p className="insight-title">Writes remain protected</p>
                <p className="insight-copy">Without a valid proof and canonical metadata pair, the backend no longer accepts provenance writes at all.</p>
              </div>
            </div>
          </div>

          <div className="feature-image-card">
            <img
              src={heroScene}
              alt="Illustrated model training workstation and provenance submission scene."
              className="feature-image"
            />
          </div>
        </article>
      </section>

      <section className="content-split content-split-wide">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Artifact Map</p>
              <h3 className="panel-title">Which files belong to which stage</h3>
            </div>
          </div>

          <div className="table-shell">
            <div className="table-row table-row-head training-artifact-head">
              <span>Artifact</span>
              <span>Producer</span>
              <span>Surfaced by</span>
            </div>
            {TRAINING_ARTIFACTS.map((artifact) => (
              <div className="table-row training-artifact-row" key={artifact.name}>
                <span className="mono-text">{artifact.name}</span>
                <span>{artifact.producer}</span>
                <span>{artifact.surfacedBy}</span>
              </div>
            ))}
          </div>

          <div className="feedback-banner training-note">
            <div className="result-header">
              <FileCode2 size={18} />
              <div>
                <p className="feedback-title">Artifact visibility is intentionally honest</p>
                <p className="feedback-copy">
                  The rebuilt frontend shows which assets are local-only versus backend-visible, so the demo stays technically coherent.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Current Inspection Target</p>
              <h3 className="panel-title">Use one real model as the bridge between pages</h3>
            </div>
          </div>

          {!selectedModel ? (
            <div className="empty-state">
              <Box size={32} />
              <p className="empty-state-title">No selected model</p>
              <p className="empty-state-copy">Pick a model in the registry and this page will use it to connect the training story to the audit story.</p>
            </div>
          ) : (
            <div className="detail-callout">
              <div className="detail-callout-head">
                <div>
                  <p className="detail-callout-title">{selectedModel.name || 'Unnamed model'}</p>
                  <p className="detail-callout-copy">
                    This model is currently being used as the UI's live example for detail and verification fetches.
                  </p>
                </div>
                <span className={`status-pill${selectedAudit?.verified ? ' is-online' : ''}`}>
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
                  <span>Record count</span>
                  <strong>{selectedAudit?.recordCount ?? '--'}</strong>
                </div>
              </div>

              <div className="submission-chain-state">
                <p className="submission-chain-state-label">Visibility by stage</p>
                <div className="submission-chain-stages">
                  <div className="submission-chain-stage">
                    <div className="submission-chain-dot is-done" />
                    <span>Local training artifacts are defined in the project workspace</span>
                  </div>
                  <div className="submission-chain-stage">
                    <div className={`submission-chain-dot${status?.zkEnforced ? ' is-done' : ''}`} />
                    <span>Verifier-gated provenance is reported as {status?.zkEnforced ? 'enforced' : 'offline'} by the backend</span>
                  </div>
                  <div className="submission-chain-stage">
                    <div className={`submission-chain-dot${selectedAudit?.recordCount ? ' is-done' : ''}`} />
                    <span>Registry and audit endpoints currently expose {selectedAudit?.recordCount ?? 0} recorded provenance entries</span>
                  </div>
                </div>
              </div>

              <div className="hero-actions">
                <button type="button" className="primary-action" onClick={() => onTabChange('audit')}>
                  Audit this model
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="secondary-action" onClick={() => onTabChange('registry')}>
                  Open registry detail
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Lifecycle Download</p>
            <h3 className="panel-title">Enter a lifecycle secret to download any recorded version of the same model series</h3>
          </div>
        </div>

        <form className="registry-form" onSubmit={handleLifecycleSubmit}>
          <div className="form-grid">
            <label className="field-group field-group-wide">
              <span>Lifecycle secret</span>
              <input
                name="secret"
                value={secretValue}
                onChange={(event) => setSecretValue(event.target.value)}
                placeholder="Enter the model series secret"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-action" disabled={lookupLoading || !secretValue.trim()}>
              <KeyRound size={16} />
              <span>{lookupLoading ? 'Loading versions...' : 'Load lifecycle versions'}</span>
            </button>
          </div>
        </form>

        {lifecycleError ? (
          <div className="feedback-banner is-error">
            <div className="result-header">
              <AlertTriangle size={18} />
              <div>
                <p className="feedback-title">Lifecycle lookup failed</p>
                <p className="feedback-copy">{lifecycleError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!lifecycleResult ? (
          <div className="empty-state">
            <KeyRound size={32} />
            <p className="empty-state-title">No lifecycle loaded</p>
            <p className="empty-state-copy">Enter a secret to load all recorded versions belonging to the same model series.</p>
          </div>
        ) : (
          <>
            <div className="detail-callout">
              <div className="detail-callout-head">
                <div>
                  <p className="detail-callout-title">{lifecycleResult.series}</p>
                  <p className="detail-callout-copy">
                    {lifecycleResult.versions?.length || 0} recorded version{(lifecycleResult.versions?.length || 0) !== 1 ? 's' : ''} resolved from the same lifecycle secret.
                  </p>
                </div>
                <span className="status-pill">{lifecycleResult.storageMode}</span>
              </div>
            </div>

            <div className="table-shell">
              <div className="table-row table-row-head training-artifact-head">
                <span>Version</span>
                <span>Model ID</span>
                <span>Source</span>
                <span>Timestamp</span>
                <span>Action</span>
              </div>
              {(lifecycleResult.versions || []).map((version) => (
                <div className="table-row training-artifact-row" key={version.modelHash}>
                  <span>{version.version || '--'}</span>
                  <span className="mono-text">#{version.modelId || '--'}</span>
                  <span>{version.downloadSource || 'unavailable'}</span>
                  <span>{version.timestamp || '--'}</span>
                  <span>
                    <button
                      type="button"
                      className="secondary-action"
                      disabled={!version.downloadReady || downloadHash === version.modelHash}
                      onClick={() => handleVersionDownload(version)}
                    >
                      <Download size={14} />
                      <span>{downloadHash === version.modelHash ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Submission Readiness</p>
            <h3 className="panel-title">Frontend write posture during demo</h3>
          </div>
        </div>

        <div className="insight-grid">
          <article className="insight-item">
            <ShieldCheck size={18} />
            <div>
              <p className="insight-title">Protected backend path</p>
              <p className="insight-copy">The server still requires authenticated headers and nonce-based replay protection for write routes.</p>
            </div>
          </article>
          <article className="insight-item">
            {writeAccess.enabled ? <Workflow size={18} /> : <AlertTriangle size={18} />}
            <div>
              <p className="insight-title">{writeAccess.enabled ? 'Local write demo enabled' : 'Read-only frontend'}</p>
              <p className="insight-copy">{writeAccess.summary}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
