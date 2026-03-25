import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Card from '../components/Card.jsx';
import NetworkSelector from '../components/NetworkSelector.jsx';
import IpfsLink from '../components/IpfsLink.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SERVER } from '../utils/constants.js';
import { shortAddr, fmtEth } from '../utils/formatters.js';

export default function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState('sepolia');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${SERVER}/api/v2/status?network=${network}`);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const statCards = [
    { label: 'Models', value: data.modelCount || 0, color: '#0969da' },
    { label: 'Active Stakes', value: data.activeStakes || 0, color: '#16a34a' },
    { label: 'NFTs Minted', value: data.nftCount || 0, color: '#9333ea' },
    { label: 'Audit Events', value: data.auditCount || 0, color: '#ea8a14' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <NetworkSelector network={network} onChange={setNetwork} />

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#fff',
            border: '1px solid #d0d7de',
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#57606a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Contract Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Contract Addresses">
          <div style={{ fontSize: 13 }}>
            {data.contracts && Object.entries(data.contracts).map(([name, addr]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#57606a' }}>{name}:</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{shortAddr(addr)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '📋 View All Models', view: 'models' },
              { label: '👥 Manage Roles', view: 'roles' },
              { label: '📜 Audit Logs', view: 'audit' },
              { label: '🖼️ NFT & Staking', view: 'nft' },
            ].map(action => (
              <button
                key={action.view}
                onClick={() => onNavigate(action.view)}
                style={{
                  padding: '10px 16px',
                  background: '#f6f8fa',
                  border: '1px solid #d0d7de',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
