import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import NetworkSelector from '../components/NetworkSelector.jsx';
import { SERVER, ACTION_NAMES } from '../utils/constants.js';
import { shortAddr, fmtTime } from '../utils/formatters.js';

export default function AuditView({ network: propNetwork }) {
  const [network, setNetwork] = useState(propNetwork || 'sepolia');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/audit?network=${network}&offset=${(page - 1) * limit}&limit=${limit}`);
      setEntries(res.data.entries || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [network, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <NetworkSelector network={network} onChange={setNetwork} />

      <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, overflow: 'hidden' }}>
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
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{shortAddr(e.actor)}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{shortAddr(e.target)}</td>
                <td style={{ padding: '10px 12px', color: '#57606a', whiteSpace: 'nowrap' }}>{fmtTime(e.timestamp)}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{shortAddr(e.contentHash)}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{shortAddr(e.prevHash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: '8px 16px', border: '1px solid #d0d7de', borderRadius: 6, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
        >
          Previous
        </button>
        <span style={{ padding: '8px 16px', color: '#57606a' }}>Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={entries.length < limit}
          style={{ padding: '8px 16px', border: '1px solid #d0d7de', borderRadius: 6, background: '#fff', cursor: entries.length < limit ? 'not-allowed' : 'pointer', opacity: entries.length < limit ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
