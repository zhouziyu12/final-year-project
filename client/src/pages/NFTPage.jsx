import React from 'react';
import { Award, Blocks, FileBadge2, Gem, ShieldEllipsis } from 'lucide-react';

function buildCertificateCandidates(models) {
  return models.slice(0, 6).map((model, index) => ({
    key: `${model.chain}-${model.id}`,
    title: model.name || `Model ${model.id}`,
    subtitle: model.chain || 'Unknown chain',
    tokenLabel: `CERT-${String(model.numericId || model.id).padStart(4, '0')}`,
    state: model.verified ? 'Ready' : 'Pending',
    accent: index % 2 === 0 ? 'marine' : 'ice'
  }));
}

export function NFTPage({ models, loading }) {
  const candidates = buildCertificateCandidates(models);

  return (
    <div className="page-grid">
      <section className="content-split content-split-wide">
        <article className="panel-card panel-card-spotlight">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Ownership Story</p>
              <h3 className="panel-title">From verified model to certificate-style deliverable</h3>
            </div>
          </div>

          <div className="nft-hero">
            <div className="nft-hero-card">
              <div className="nft-hero-badge">
                <FileBadge2 size={14} />
                <span>Presentation view</span>
              </div>
              <p className="nft-hero-copy">
                Even without a full minting workflow, the project can already show how a verified registry record becomes a certificate-style output for presentation and extension planning.
              </p>
            </div>
            <div className="nft-hero-stat">
              <p>Certificate candidates</p>
              <strong>{models.length}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Roadmap</p>
              <h3 className="panel-title">How the certificate layer can evolve</h3>
            </div>
          </div>

          <div className="pipeline-list">
            {[
              { title: 'Mint per verified model', copy: 'Issue a certificate after registration and audit both pass.', icon: Award },
              { title: 'Attach provenance metadata', copy: 'Expose proof state, CID, chain, and ownership metadata to the certificate.', icon: ShieldEllipsis },
              { title: 'Public showcase gallery', copy: 'Turn verified project outputs into a presentable model gallery.', icon: Blocks }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div className="pipeline-item" key={item.title}>
                  <div className="pipeline-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="pipeline-icon">
                    <Icon size={18} />
                  </div>
                  <div className="pipeline-content">
                    <p className="pipeline-title">{item.title}</p>
                    <p className="pipeline-copy">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Certificate Gallery</p>
            <h3 className="panel-title">Visualized ownership outputs for the current registry entries</h3>
          </div>
        </div>

        {loading ? (
          <div className="table-empty">Loading certificate-ready cards...</div>
        ) : candidates.length === 0 ? (
            <div className="empty-state">
              <Gem size={32} />
              <p className="empty-state-title">No certificate candidates yet</p>
              <p className="empty-state-copy">Once models are registered, this view can show how provenance records become certificate-ready deliverables.</p>
            </div>
          ) : (
          <div className="certificate-grid">
            {candidates.map((item) => (
              <article className={`certificate-card certificate-card-${item.accent}`} key={item.key}>
                <div className="certificate-header">
                  <span className="certificate-chip">{item.tokenLabel}</span>
                  <span className={`status-pill${item.state === 'Ready' ? ' is-online' : ''}`}>{item.state}</span>
                </div>
                <div className="certificate-body">
                  <p className="certificate-title">{item.title}</p>
                  <p className="certificate-subtitle">{item.subtitle}</p>
                </div>
                <div className="certificate-footer">
                  <span>Provenance-linked</span>
                  <Award size={16} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
