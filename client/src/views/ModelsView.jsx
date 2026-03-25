import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import NetworkSelector from '../components/NetworkSelector.jsx';
import IpfsLink from '../components/IpfsLink.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import MessageBox from '../components/MessageBox.jsx';
import { SERVER } from '../utils/constants.js';
import { shortAddr, fmtTime } from '../utils/formatters.js';

export default function ModelsView({ network: propNetwork }) {
  const [network, setNetwork] = useState(propNetwork || 'sepolia');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modelIdInput, setModelIdInput] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/models?network=${network}&limit=20`);
      setModels(res.data.models || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => { loadModels(); }, [loadModels]);

  const loadDetail = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await axios.get(`${SERVER}/api/v2/models/${id}?network=${network}`);
      setSelected(res.data);
    } catch {} finally {
      setDetailLoading(false);
    }
  };

  const handleQuery = () => {
    const id = parseInt(modelIdInput);
    if (id > 0) loadDetail(id);
  };

  const doAction = async (endpoint, body = {}) => {
    setMsg('');
    try {
      const res = await axios.post(`${SERVER}/api/v2/${endpoint}`, { ...body, network });
      setMsg(`✅ Success! TX: ${res.data.txHash?.slice(0, 20)}...`);
      setMsgType('success');
      setTimeout(loadModels, 3000);
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || e.message}`);
      setMsgType('error');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <NetworkSelector network={network} onChange={setNetwork} />
      <MessageBox msg={msg} type={msgType} />

      {/* Query Section */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="number"
          placeholder="Model ID"
          value={modelIdInput}
          onChange={e => setModelIdInput(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d0d7de', borderRadius: 6, width: 120 }}
        />
        <button onClick={handleQuery} style={{ padding: '8px 16px', background: '#0969da', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Query
        </button>
      </div>

      {/* Models Table */}
      <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f6f8fa', borderBottom: '1px solid #d0d7de' }}>
              {['#', 'Name', 'Owner', 'Status', 'Version', 'CIDs', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#57606a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{m.id}</td>
                <td style={{ padding: '10px 12px' }}>{m.name}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{shortAddr(m.owner)}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: '10px 12px' }}>v{m.version || 1}</td>
                <td style={{ padding: '10px 12px' }}>
                  <IpfsLink hash={m.modelCid} /><br />
                  <IpfsLink hash={m.metadataCid} />
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => loadDetail(m.id)} style={{ padding: '4px 10px', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Model Detail Panel */}
      {detailLoading && <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>}

      {selected && (
        <div style={{ marginTop: 24, background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Model #{selected.id}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13 }}>
            <div><strong>Name:</strong> {selected.name}</div>
            <div><strong>Owner:</strong> {selected.owner}</div>
            <div><strong>Status:</strong> <StatusBadge status={selected.status} /></div>
            <div><strong>Version:</strong> {selected.version || 1}</div>
            <div><strong>Model CID:</strong> <IpfsLink hash={selected.modelCid} /></div>
            <div><strong>Metadata CID:</strong> <IpfsLink hash={selected.metadataCid} /></div>
            <div><strong>Created:</strong> {fmtTime(selected.createdAt)}</div>
            <div><strong>Updated:</strong> {fmtTime(selected.updatedAt)}</div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => doAction('models/activate', { id: selected.id })} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Activate</button>
            <button onClick={() => doAction('models/deprecate', { id: selected.id })} style={{ padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Deprecate</button>
            <button onClick={() => doAction('models/revoke', { id: selected.id })} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Revoke</button>
          </div>
        </div>
      )}
    </div>
  );
}
