import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const SERVER = '';

// ─── Utilities ────────────────────────────────────────────────────────────────
const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';
const fmtEth = (v) => (parseFloat(v) || 0).toFixed(4);
const fmtTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';
const STATUS_COLORS = { DRAFT: '#6b7280', ACTIVE: '#16a34a', DEPRECATED: '#d97706', REVOKED: '#dc2626' };
const STATUS_BG = { DRAFT: '#f3f4f6', ACTIVE: '#dcfce7', DEPRECATED: '#fef3c7', REVOKED: '#fee2e2' };
const ACTION_NAMES = ['MODEL_REGISTERED','MODEL_ACTIVATED','MODEL_DEPRECATED','MODEL_REVOKED','MODEL_UPDATED','VERSION_ADDED','OWNERSHIP_TREQ','OWNERSHIP_TACP','OWNERSHIP_TCAN','STAKE_DEP','STAKE_WTH','STAKE_SLS','ROLE_GNT','ROLE_REV','BLKLST_ADD','BLKLST_REM','NFT_MINT','NFT_TRAN','NFT_BURN'];
const EXPLORER = { sepolia: 'https://sepolia.etherscan.io', tbnb: 'https://testnet.bscscan.com' };
const TOKEN = { sepolia: 'ETH', tbnb: 'BNB' };
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// Extract real CID from metadata string
const extractCid = (meta) => {
  if (!meta) return null;
  // ipfs://Qm... format
  const match = meta.match(/ipfs:\/\/(Qm[a-zA-Z0-9]+)/);
  if (match) return match[1];
  // Already just a CID
  if (/^Qm[a-zA-Z0-9]+$/.test(meta)) return meta;
  return null;
};

// Download button component
const IpfsLink = ({ meta }) => {
  const cid = extractCid(meta);
  if (!cid) return <span style={{ fontSize: 11, color: '#9ca3af' }}>📦 {meta || '(empty)'}</span>;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#57606a', wordBreak: 'break-all' }}>{cid}</span>
      <a href={IPFS_GATEWAY + cid} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#0969da', textDecoration: 'none', padding: '1px 6px', border: '1px solid #ddf4ff', borderRadius: 4, background: '#ddf4ff', whiteSpace: 'nowrap' }}>
        ⬇️ Download
      </a>
    </span>
  );
};

function StatusBadge({ status }) {
  return <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: STATUS_BG[status] || '#f3f4f6', color: STATUS_COLORS[status] || '#6b7280' }}>{status}</span>;
}

function Card({ title, children, style }) {
  return <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 10, padding: 20, marginBottom: 16, ...style }}>{title && <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#24292f', borderBottom: '1px solid #d0d7de', paddingBottom: 10 }}>{title}</h3>}{children}</div>;
}

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 40, color: '#57606a' }}><div style={{ fontSize: 32 }}>⏳</div><div style={{ marginTop: 8 }}>Loading...</div></div>;
}

function ErrorBox({ msg, onRetry }) {
  return <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, color: '#dc2626' }}><b>Error:</b> {msg}{onRetry && <button onClick={onRetry} style={{ marginLeft: 12, padding: '4px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>}</div>;
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ currentView, onNavigate, walletInfo }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'models', label: 'Model Manager', icon: '📦' },
    { key: 'roles', label: 'Role & Access', icon: '🔐' },
    { key: 'audit', label: 'Audit Log', icon: '📋' },
    { key: 'nft', label: 'NFT & Stake', icon: '🏷️' },
  ];

  return (
    <div style={{ background: '#24292f', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🔗</span>
        <span style={{ fontWeight: 700, fontSize: 18 }}>AI Provenance v2</span>
        <span style={{ background: '#1a7f37', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>v2.0</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => onNavigate(t.key)} style={{
            padding: '12px 14px', background: currentView === t.key ? '#1f6feb' : 'transparent', color: '#fff',
            border: 'none', borderBottom: currentView === t.key ? '2px solid #fff' : '2px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      {walletInfo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {walletInfo.roles?.admin && <span style={{ background: '#1a7f37', padding: '2px 8px', borderRadius: 10 }}>ADMIN</span>}
          {walletInfo.roles?.registrar && <span style={{ background: '#0969da', padding: '2px 8px', borderRadius: 10 }}>REG</span>}
          <span style={{ color: '#8b949e' }}>{shortAddr(walletInfo.wallet)}</span>
          <span>{fmtEth(walletInfo.balance)} {TOKEN[walletInfo.network]}</span>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState('sepolia');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${SERVER}/api/v2/status?network=${network}`);
      setData(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [network]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} onRetry={load} />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Network Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['sepolia', 'tbnb'].map(n => (
          <button key={n} onClick={() => setNetwork(n)} style={{ padding: '6px 16px', border: '1px solid', borderColor: network === n ? '#0969da' : '#d0d7de', borderRadius: 6, background: network === n ? '#ddf4ff' : '#fff', color: network === n ? '#0969da' : '#57606a', cursor: 'pointer', fontWeight: 600 }}>
            {n === 'sepolia' ? '🔵 Sepolia' : '🟡 BSC Testnet'}
          </button>
        ))}
      </div>

      {/* Wallet Info */}
      <Card title="Wallet">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div><div style={{ fontSize: 12, color: '#57606a' }}>Address</div><div style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{data.wallet}</div></div>
          <div><div style={{ fontSize: 12, color: '#57606a' }}>Balance</div><div style={{ fontSize: 24, fontWeight: 700, color: '#24292f' }}>{data.balance} {TOKEN[data.network]}</div></div>
          <div><div style={{ fontSize: 12, color: '#57606a' }}>Chain ID</div><div style={{ fontSize: 18, fontWeight: 600 }}>{data.chainId}</div></div>
        </div>
      </Card>

      {/* Roles */}
      <Card title="Roles & Permissions">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { name: 'ADMIN', key: 'admin', color: '#1a7f37', bg: '#dcfce7' },
            { name: 'REGISTRAR', key: 'registrar', color: '#0969da', bg: '#dbeafe' },
            { name: 'AUDITOR', key: 'auditor', color: '#9333ea', bg: '#f3e8ff' },
            { name: 'MINTER', key: 'minter', color: '#d97706', bg: '#fef3c7' },
          ].map(r => (
            <div key={r.key} style={{ padding: '12px 20px', borderRadius: 8, background: data.roles?.[r.key] ? r.bg : '#f6f8fa', border: `1px solid ${data.roles?.[r.key] ? r.color : '#d0d7de'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{data.roles?.[r.key] ? '✅' : '❌'}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: data.roles?.[r.key] ? r.color : '#8b949e' }}>{r.name}</span>
            </div>
          ))}
          {data.roles?.blacklisted && <div style={{ padding: '12px 20px', borderRadius: 8, background: '#fee2e2', border: '1px solid #dc2626', color: '#dc2626', fontWeight: 700 }}>🚫 BLACKLISTED</div>}
        </div>
      </Card>

      {/* Stats */}
      <Card title="System Statistics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ background: '#f6f8fa', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#0969da' }}>{data.stats?.nftTotalSupply ?? 0}</div>
            <div style={{ fontSize: 13, color: '#57606a', marginTop: 4 }}>NFT Total Supply</div>
          </div>
          <div style={{ background: '#f6f8fa', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a' }}>{data.stats?.auditEntries ?? 0}</div>
            <div style={{ fontSize: 13, color: '#57606a', marginTop: 4 }}>Audit Entries</div>
          </div>
          <div style={{ background: '#f6f8fa', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{data.stats?.minStake ?? '0.01'}</div>
            <div style={{ fontSize: 13, color: '#57606a', marginTop: 4 }}>Min Stake ({TOKEN[network]})</div>
          </div>
        </div>
      </Card>

      {/* Contracts */}
      <Card title="Deployed Contracts">
        <div style={{ display: 'grid', gap: 10 }}>
          {Object.entries(data.contracts || {}).map(([name, addr]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f6f8fa', borderRadius: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13, minWidth: 200 }}>{name}</span>
              <code style={{ fontSize: 11, color: '#57606a', wordBreak: 'break-all' }}>{addr}</code>
              <a href={`${data.explorer}/address/${addr}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0969da', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>Etherscan →</a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Model Manager ────────────────────────────────────────────────────────────
function ModelsView() {
  const [network, setNetwork] = useState('sepolia');
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modelIdInput, setModelIdInput] = useState('');

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/models?network=${network}&limit=20`);
      setModels(res.data.models || []);
    } catch {}
    finally { setLoading(false); }
  }, [network]);

  useEffect(() => { loadModels(); }, [loadModels]);

  const loadDetail = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await axios.get(`${SERVER}/api/v2/models/${id}?network=${network}`);
      setSelected(res.data);
    } catch {}
    finally { setDetailLoading(false); }
  };

  const handleQuery = () => {
    const id = parseInt(modelIdInput);
    if (id > 0) loadDetail(id);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['sepolia', 'tbnb'].map(n => (
          <button key={n} onClick={() => setNetwork(n)} style={{ padding: '6px 16px', border: '1px solid', borderColor: network === n ? '#0969da' : '#d0d7de', borderRadius: 6, background: network === n ? '#ddf4ff' : '#fff', color: network === n ? '#0969da' : '#57606a', cursor: 'pointer', fontWeight: 600 }}>
            {n === 'sepolia' ? '🔵 Sepolia' : '🟡 BSC'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Left: Model List */}
        <div>
          <Card title="Registered Models">
            {/* Query by ID */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input type="number" value={modelIdInput} onChange={e => setModelIdInput(e.target.value)} placeholder="Model ID" style={{ flex: 1, padding: '8px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14 }} onKeyDown={e => e.key === 'Enter' && handleQuery()} />
              <button onClick={handleQuery} style={{ padding: '8px 16px', background: '#0969da', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Query</button>
              <button onClick={loadModels} style={{ padding: '8px 12px', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 6, cursor: 'pointer' }}>↻</button>
            </div>

            {loading ? <Spinner /> : models.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#57606a' }}>No models found. Deploy the contracts and register models first.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {models.map(m => (
                  <div key={m.id} onClick={() => loadDetail(m.id)} style={{ padding: '12px 16px', background: selected?.modelId === m.id ? '#dbeafe' : '#f6f8fa', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selected?.modelId === m.id ? '#0969da' : '#d0d7de'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Model #{m.id}</div>
                      <div style={{ fontSize: 11, color: '#57606a', marginTop: 2 }}>{shortAddr(m.owner)}</div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Model Detail */}
        <div>
          {detailLoading ? <Spinner /> : selected ? (
            <Card title={`Model #${selected.modelId} — ${selected.status}`}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#f6f8fa', padding: 12, borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#57606a' }}>Owner</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.owner}</div>
                  </div>
                  <div style={{ background: '#f6f8fa', padding: 12, borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#57606a' }}>Versions</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.versionCount}</div>
                  </div>
                </div>

                {/* State Machine */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Lifecycle</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {['DRAFT', 'ACTIVE', 'DEPRECATED', 'REVOKED'].map((s, i) => (
                      <React.Fragment key={s}>
                        <div style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: selected.status === s ? STATUS_BG[s] : '#f3f4f6', color: selected.status === s ? STATUS_COLORS[s] : '#8b949e', border: `1px solid ${selected.status === s ? STATUS_COLORS[s] : '#d0d7de'}` }}>{s}</div>
                        {i < 3 && <div style={{ width: 20, height: 2, background: '#d0d7de' }} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Versions */}
                {selected.versions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Version History</div>
                    {selected.versions.map(v => (
                      <div key={v.versionId} style={{ padding: '10px 14px', background: '#f6f8fa', borderRadius: 6, marginBottom: 6, borderLeft: '3px solid #0969da' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>v{v.major}.{v.minor}.{v.patch}</span>
                          <span style={{ fontSize: 11, color: '#57606a' }}>{fmtTime(v.timestamp)}</span>
                        </div>
                        <div style={{ fontSize: 11, marginTop: 4 }}><IpfsLink meta={v.ipfsMetadata} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Staking */}
                {selected.staking?.staker !== '0x0000000000000000000000000000000000000000' && (
                  <div style={{ padding: 12, background: selected.staking?.slashed ? '#fee2e2' : selected.staking?.withdrawn ? '#fef3c7' : '#dcfce7', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>💰 Staking</div>
                    <div style={{ fontSize: 13 }}>Amount: {selected.staking.amount} {TOKEN[network]}</div>
                    <div style={{ fontSize: 13 }}>Staker: {shortAddr(selected.staking.staker)}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {selected.staking.slashed ? '⚠️ SLASHED' : selected.staking.withdrawn ? '📤 Withdrawn' : `⏱️ ${Math.round((Date.now()/1000 - selected.staking.startTime)/86400)} days locked`}
                    </div>
                  </div>
                )}

                {/* Provenance History */}
                {selected.history?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Provenance Records</div>
                    {selected.history.slice(0, 5).map(h => (
                      <div key={h.recordId} style={{ padding: '8px 12px', background: '#f6f8fa', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>Event #{h.eventType}</span> · {fmtTime(h.timestamp)}
                        {h.ipfsMetadata && <div style={{ marginTop: 4 }}><IpfsLink meta={h.ipfsMetadata} /></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Model Detail">
              <div style={{ textAlign: 'center', padding: 60, color: '#57606a' }}>Click a model on the left to view details</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Role Manager ──────────────────────────────────────────────────────────────
function RolesView() {
  const [network, setNetwork] = useState('sepolia');
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetAddr, setTargetAddr] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // success | error

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/status?network=${network}`);
      setWalletInfo(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [network]);

  const doAction = async (action, extra = {}) => {
    if (!targetAddr) { setMsg('Enter address first'); setMsgType('error'); return; }
    setMsg('');
    try {
      const res = await axios.post(`${SERVER}/api/v2/${action}?network=${network}`, { account: targetAddr, ...extra });
      setMsg(`✅ ${action} succeeded: ${res.data.txHash?.slice(0, 20)}...`);
      setMsgType('success');
      setTimeout(load, 2000);
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || e.message}`);
      setMsgType('error');
    }
  };

  const doRole = async (action, role) => {
    if (!targetAddr) { setMsg('Enter address first'); setMsgType('error'); return; }
    setMsg('');
    try {
      const res = await axios.post(`${SERVER}/api/v2/roles/${action}`, { role, account: targetAddr, network });
      setMsg(`✅ ${action} ${role} succeeded`);
      setMsgType('success');
      setTimeout(load, 2000);
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || e.message}`);
      setMsgType('error');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['sepolia', 'tbnb'].map(n => (
          <button key={n} onClick={() => setNetwork(n)} style={{ padding: '6px 16px', border: '1px solid', borderColor: network === n ? '#0969da' : '#d0d7de', borderRadius: 6, background: network === n ? '#ddf4ff' : '#fff', color: network === n ? '#0969da' : '#57606a', cursor: 'pointer', fontWeight: 600 }}>
            {n === 'sepolia' ? '🔵 Sepolia' : '🟡 BSC'}
          </button>
        ))}
      </div>

      <Card title="Access Control Management">
        {!walletInfo?.roles?.admin ? (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: 16, color: '#92400e' }}>⚠️ Only ADMIN can manage roles. Connect with an ADMIN wallet.</div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Target Address</label>
              <input type="text" value={targetAddr} onChange={e => setTargetAddr(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14, fontFamily: 'monospace' }} />
            </div>

            {/* Role Actions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Role Management</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['grant', 'revoke'].map(action => (
                  ['registrar', 'auditor', 'minter'].map(role => (
                    <button key={`${action}-${role}`} onClick={() => doRole(action, role)} style={{ padding: '8px 16px', background: action === 'grant' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {action === 'grant' ? '+' : '−'} {role.toUpperCase()}
                    </button>
                  ))
                ))}
              </div>
            </div>

            {/* Blacklist */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Blacklist</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => doAction('blacklist/add')} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>🚫 Add to Blacklist</button>
                <button onClick={() => doAction('blacklist/remove')} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>✅ Remove from Blacklist</button>
              </div>
            </div>
          </>
        )}

        {msg && <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: msgType === 'success' ? '#dcfce7' : '#fee2e2', color: msgType === 'success' ? '#166534' : '#dc2626', fontSize: 13 }}>{msg}</div>}
      </Card>

      {/* Current Roles */}
      <Card title="Current Wallet Roles">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { name: 'ADMIN', ok: walletInfo?.roles?.admin },
            { name: 'REGISTRAR', ok: walletInfo?.roles?.registrar },
            { name: 'AUDITOR', ok: walletInfo?.roles?.auditor },
            { name: 'MINTER', ok: walletInfo?.roles?.minter },
            { name: 'BLACKLISTED', ok: walletInfo?.roles?.blacklisted },
          ].map(r => (
            <div key={r.name} style={{ padding: '10px 16px', borderRadius: 8, background: r.ok ? (r.name === 'BLACKLISTED' ? '#fee2e2' : '#dcfce7') : '#f6f8fa', border: `1px solid ${r.ok ? (r.name === 'BLACKLISTED' ? '#dc2626' : '#16a34a') : '#d0d7de'}`, fontWeight: 700, fontSize: 13 }}>
              {r.ok ? '✅' : '❌'} {r.name}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditView() {
  const [network, setNetwork] = useState('sepolia');
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/audit/recent?network=${network}&limit=30`);
      setEntries(res.data.entries || []);
      setTotal(res.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [network]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['sepolia', 'tbnb'].map(n => (
          <button key={n} onClick={() => setNetwork(n)} style={{ padding: '6px 16px', border: '1px solid', borderColor: network === n ? '#0969da' : '#d0d7de', borderRadius: 6, background: network === n ? '#ddf4ff' : '#fff', color: network === n ? '#0969da' : '#57606a', cursor: 'pointer', fontWeight: 600 }}>
            {n === 'sepolia' ? '🔵 Sepolia' : '🟡 BSC'}
          </button>
        ))}
        <button onClick={load} style={{ padding: '6px 16px', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 6, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      <Card title={`Audit Log — ${total} Total Entries`}>
        {loading ? <Spinner /> : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#57606a' }}>No audit entries found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f6f8fa', borderBottom: '1px solid #d0d7de' }}>
                  {['#', 'Action', 'Actor', 'Target', 'Timestamp', 'Content Hash', 'Prev Hash'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#57606a', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#57606a' }}>{e.id}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {ACTION_NAMES[e.action] || `Action#${e.action}`}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{shortAddr(e.actor)}</td>
                    <td style={{ padding: '10px 12px' }}>{e.targetId > 0 ? `#${e.targetId}` : '—'}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{fmtTime(e.timestamp)}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: '#0969da', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.contentHash?.slice(0, 18)}...</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: '#8b949e', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.previousHash?.slice(0, 14)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── NFT & Staking ───────────────────────────────────────────────────────────
function NftView() {
  const [network, setNetwork] = useState('sepolia');
  const [walletInfo, setWalletInfo] = useState(null);
  const [modelId, setModelId] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [amount, setAmount] = useState('0.05');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/status?network=${network}`);
      setWalletInfo(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [network]);

  const doAction = async (endpoint, body = {}) => {
    setMsg('');
    try {
      const res = await axios.post(`${SERVER}/api/v2/${endpoint}`, { ...body, network });
      setMsg(`✅ Success! TX: ${res.data.txHash?.slice(0, 20)}...`);
      setMsgType('success');
      setTimeout(load, 3000);
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || e.message}`);
      setMsgType('error');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['sepolia', 'tbnb'].map(n => (
          <button key={n} onClick={() => setNetwork(n)} style={{ padding: '6px 16px', border: '1px solid', borderColor: network === n ? '#0969da' : '#d0d7de', borderRadius: 6, background: network === n ? '#ddf4ff' : '#fff', color: network === n ? '#0969da' : '#57606a', cursor: 'pointer', fontWeight: 600 }}>
            {n === 'sepolia' ? '🔵 Sepolia' : '🟡 BSC'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card title="NFT Stats" style={{ margin: 0 }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#0969da' }}>{walletInfo?.stats?.nftTotalSupply ?? 0}</div>
            <div style={{ color: '#57606a', fontSize: 14 }}>Total NFTs Minted</div>
          </div>
        </Card>
        <Card title="Staking Config" style={{ margin: 0 }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#d97706' }}>{walletInfo?.stats?.minStake ?? '0.01'}</div>
            <div style={{ color: '#57606a', fontSize: 14 }}>Min Stake ({TOKEN[network]})</div>
          </div>
        </Card>
      </div>

      {/* Mint NFT */}
      <Card title="🏷️ Mint Model NFT">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="number" value={modelId} onChange={e => setModelId(e.target.value)} placeholder="Model ID" style={{ width: 120, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14 }} />
          <input type="text" value={tokenURI} onChange={e => setTokenURI(e.target.value)} placeholder="ipfs://Qm... (IPFS CID)" style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14, fontFamily: 'monospace' }} />
          <button onClick={() => doAction('nft/mint', { modelId: parseInt(modelId), tokenURI: tokenURI || `ipfs://model-${modelId}` })} disabled={!modelId || !walletInfo?.roles?.minter} style={{ padding: '10px 20px', background: (!modelId || !walletInfo?.roles?.minter) ? '#d0d7de' : '#0969da', color: '#fff', border: 'none', borderRadius: 6, cursor: (!modelId || !walletInfo?.roles?.minter) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            Mint NFT
          </button>
        </div>
        {tokenURI && <div style={{ fontSize: 11, marginBottom: 8 }}><IpfsLink meta={tokenURI} /></div>}
        <div style={{ fontSize: 11, color: '#57606a', marginBottom: 4 }}>💡 先将模型元数据上传到 IPFS，得到 CID 后填入上方字段。推荐使用 Pinata (pinata.cloud) 上传。</div>
        {!walletInfo?.roles?.minter && <div style={{ fontSize: 12, color: '#d97706' }}>⚠️ You need MINTER role to mint NFTs</div>}
      </Card>

      {/* Stake */}
      <Card title={`💰 Stake ${TOKEN[network]}`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="number" value={modelId} onChange={e => setModelId(e.target.value)} placeholder="Model ID" style={{ width: 120, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14 }} />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={TOKEN[network]} style={{ width: 100, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14 }} />
          <span style={{ padding: '10px 12px', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14, color: '#57606a' }}>{TOKEN[network]}</span>
          <button onClick={() => doAction('stake', { modelId: parseInt(modelId), amount: parseFloat(amount) })} disabled={!modelId} style={{ padding: '10px 20px', background: !modelId ? '#d0d7de' : '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: !modelId ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            Stake
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#57606a' }}>
          Min stake: {walletInfo?.stats?.minStake ?? '0.01'} {TOKEN[network]} · 50% slash ratio · 7-day lock
        </div>
      </Card>

      {/* Slash (Admin only) */}
      {walletInfo?.roles?.admin && (
        <Card title="⚠️ Slash Stake (Admin)">
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" value={modelId} onChange={e => setModelId(e.target.value)} placeholder="Model ID" style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 14 }} />
            <button onClick={() => doAction('stake/slash', { modelId: parseInt(modelId), reason: 'Quality violation' })} disabled={!modelId} style={{ padding: '10px 20px', background: !modelId ? '#d0d7de' : '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: !modelId ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              Slash 50%
            </button>
          </div>
        </Card>
      )}

      {msg && <div style={{ padding: 12, borderRadius: 6, background: msgType === 'success' ? '#dcfce7' : '#fee2e2', color: msgType === 'success' ? '#166534' : '#dc2626', fontSize: 13, marginTop: 8 }}>{msg}</div>}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('dashboard');
  const [walletInfo, setWalletInfo] = useState(null);

  useEffect(() => {
    axios.get(`${SERVER}/api/v2/status?network=sepolia`)
      .then(res => setWalletInfo(res.data))
      .catch(() => {});
  }, []);

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />;
      case 'models': return <ModelsView />;
      case 'roles': return <RolesView />;
      case 'audit': return <AuditView />;
      case 'nft': return <NftView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa' }}>
      <Header currentView={view} onNavigate={setView} walletInfo={walletInfo} />
      {renderView()}
    </div>
  );
}
