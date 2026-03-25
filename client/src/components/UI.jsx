import React from 'react';
import { STATUS_COLORS, STATUS_BG, TOKEN, IPFS_GATEWAY } from '../App.jsx';

const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';
const fmtEth = (v) => (parseFloat(v) || 0).toFixed(4);
const fmtTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

// Extract real CID from metadata string
const extractCid = (meta) => {
  if (!meta) return null;
  const match = meta.match(/ipfs:\/\/(Qm[a-zA-Z0-9]+)/);
  if (match) return match[1];
  if (/^Qm[a-zA-Z0-9]+$/.test(meta)) return meta;
  return null;
};

export { shortAddr, fmtEth, fmtTime, extractCid };

// ─── IPFS Link ───────────────────────────────────────────────────────────────
export function IpfsLink({ meta }) {
  const cid = extractCid(meta);
  if (!cid) return (
    <span style={{ fontSize: 11, color: '#9ca3af' }}>
      📦 {meta || '(empty)'}
    </span>
  );
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#57606a', wordBreak: 'break-all' }}>{cid}</span>
      <a
        href={IPFS_GATEWAY + cid}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 11,
          color: '#0969da',
          textDecoration: 'none',
          padding: '1px 6px',
          border: '1px solid #ddf4ff',
          borderRadius: 4,
          background: '#ddf4ff',
          whiteSpace: 'nowrap'
        }}
      >
        ⬇️ Download
      </a>
    </span>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: STATUS_BG[status] || '#f3f4f6',
      color: STATUS_COLORS[status] || '#6b7280'
    }}>
      {status}
    </span>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ title, children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #d0d7de',
      borderRadius: 10,
      padding: 20,
      marginBottom: 16,
      ...style
    }}>
      {title && (
        <h3 style={{
          margin: '0 0 16px',
          fontSize: 16,
          color: '#24292f',
          borderBottom: '1px solid #d0d7de',
          paddingBottom: 10
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: '#57606a' }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div style={{ marginTop: 8 }}>Loading...</div>
    </div>
  );
}

// ─── Error Box ─────────────────────────────────────────────────────────────
export function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: 8,
      padding: 16,
      color: '#dc2626'
    }}>
      <b>Error:</b> {msg}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginLeft: 12,
            padding: '4px 12px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Network Selector ────────────────────────────────────────────────────────
export function NetworkSelector({ network, onChange, networks }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {networks.map(n => (
        <button
          key={n.key}
          onClick={() => onChange(n.key)}
          style={{
            padding: '6px 16px',
            border: '1px solid',
            borderColor: network === n.key ? '#0969da' : '#d0d7de',
            borderRadius: 6,
            background: network === n.key ? '#ddf4ff' : '#fff',
            color: network === n.key ? '#0969da' : '#57606a',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {n.icon} {n.label}
        </button>
      ))}
    </div>
  );
}

// ─── Message Box ────────────────────────────────────────────────────────────
export function MsgBox({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      marginTop: 16,
      padding: 12,
      borderRadius: 6,
      background: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#166534' : '#dc2626',
      fontSize: 13
    }}>
      {msg}
    </div>
  );
}
