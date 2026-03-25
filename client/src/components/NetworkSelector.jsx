import React from 'react';

/**
 * Network selector buttons component
 */
export default function NetworkSelector({ network, onChange }) {
  const networks = [
    { id: 'sepolia', label: '🔵 Sepolia' },
    { id: 'tbnb', label: '🟡 BSC Testnet' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {networks.map(n => (
        <button
          key={n.id}
          onClick={() => onChange(n.id)}
          style={{
            padding: '6px 16px',
            border: '1px solid',
            borderColor: network === n.id ? '#0969da' : '#d0d7de',
            borderRadius: 6,
            background: network === n.id ? '#ddf4ff' : '#fff',
            color: network === n.id ? '#0969da' : '#57606a',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
