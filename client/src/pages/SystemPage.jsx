import React from 'react';
import {
  ActivitySquare,
  Cloud,
  LockKeyhole,
  Server,
  ShieldCheck,
  Waypoints
} from 'lucide-react';
import auditScene from '../assets/audit-visual-scene.svg';

function getChainRows(status) {
  return Object.entries(status?.chains || {});
}

export function SystemPage({ health, status, models, auditEvents, writeAccess }) {
  const chainRows = getChainRows(status);

  return (
    <div className="page-grid">
      <section className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Backend health</p>
          <p className="metric-value">{health?.status === 'ok' ? 'Online' : 'Unknown'}</p>
          <p className="metric-footnote">Read directly from the health endpoint used during the initial frontend bootstrap.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Connected chains</p>
          <p className="metric-value">{chainRows.length}</p>
          <p className="metric-footnote">Networks currently exposed by the backend for provenance operations.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Proof path</p>
          <p className="metric-value">{status?.zkReady ? 'Ready' : 'Offline'}</p>
          <p className="metric-footnote">The UI no longer guesses this state; it reads it from `/api/v2/status`.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Frontend write mode</p>
          <p className="metric-value">{writeAccess.enabled ? 'Enabled' : 'Read-only'}</p>
          <p className="metric-footnote">{writeAccess.summary}</p>
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Network Status</p>
              <h3 className="panel-title">Runtime connectivity and chain surface</h3>
            </div>
          </div>

          <div className="network-stack">
            {chainRows.length === 0 ? (
              <div className="table-empty">No chain status is currently available from the backend.</div>
            ) : (
              chainRows.map(([chain, info]) => (
                <div className="network-card" key={chain}>
                  <div className="network-card-head">
                    <div>
                      <p className="network-name">{chain.toUpperCase()}</p>
                      <p className="network-copy">{info.connected ? 'Connection available' : 'Connection unavailable'}</p>
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
                      <span>Balance</span>
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
              <p className="panel-eyebrow">Service Checklist</p>
              <h3 className="panel-title">Dependencies this project needs at runtime</h3>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <Server size={18} />
              <div>
                <p className="insight-title">Express backend</p>
                <p className="insight-copy">Serves health, status, model inventory, model detail, audit verification, and optional write routes.</p>
              </div>
            </div>
            <div className="insight-item">
              <Waypoints size={18} />
              <div>
                <p className="insight-title">Chain RPC access</p>
                <p className="insight-copy">Required for block state, registry detail lookup, and audit verification on Sepolia and BNB Testnet.</p>
              </div>
            </div>
            <div className="insight-item">
              <Cloud size={18} />
              <div>
                <p className="insight-title">IPFS and metadata path</p>
                <p className="insight-copy">Available through backend routes, even though the frontend currently surfaces only the chain-visible state.</p>
              </div>
            </div>
            <div className="insight-item">
              <LockKeyhole size={18} />
              <div>
                <p className="insight-title">Protected write API</p>
                <p className="insight-copy">The server enforces API key, timestamp, nonce, replay protection, and rate limiting before accepting writes.</p>
              </div>
            </div>
          </div>

          <div className="feature-image-card">
            <img
              src={auditScene}
              alt="Illustrated chain verification and system status scene."
              className="feature-image"
            />
          </div>
        </article>
      </section>

      <section className="content-split">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Runtime Summary</p>
              <h3 className="panel-title">What the frontend currently sees from the backend</h3>
            </div>
          </div>

          <div className="record-grid">
            <div className="record-card">
              <span>Tracked models</span>
              <strong>{models.length}</strong>
            </div>
            <div className="record-card">
              <span>Recent audit events</span>
              <strong>{auditEvents.length}</strong>
            </div>
            <div className="record-card">
              <span>Backend-reported models</span>
              <strong>{status?.totalModels ?? '--'}</strong>
            </div>
            <div className="record-card">
              <span>ZK ready</span>
              <strong>{status?.zkReady ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Operational Summary</p>
              <h3 className="panel-title">Why this page matters during presentation</h3>
            </div>
          </div>

          <div className="insight-grid">
            <article className="insight-item">
              <ActivitySquare size={18} />
              <div>
                <p className="insight-title">Shows the system is live</p>
                <p className="insight-copy">The project is easier to trust when the demo includes visible backend and chain state instead of static screens.</p>
              </div>
            </article>
            <article className="insight-item">
              <ShieldCheck size={18} />
              <div>
                <p className="insight-title">Keeps the trust boundary explicit</p>
                <p className="insight-copy">Examiners can see whether the frontend is in read-only mode or intentionally allowed to perform local demo writes.</p>
              </div>
            </article>
          </div>
        </article>
      </section>
    </div>
  );
}
