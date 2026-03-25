import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NetworkSelector from '../components/NetworkSelector.jsx';
import MessageBox from '../components/MessageBox.jsx';
import { SERVER } from '../utils/constants.js';
import { shortAddr } from '../utils/formatters.js';

export default function RolesView({ network: propNetwork }) {
  const [network, setNetwork] = useState(propNetwork || 'sepolia');
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetAddr, setTargetAddr] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/v2/status?network=${network}`);
      setWalletInfo(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [network]);

  const doAction = async (action, extra = {}) => {
    if (!targetAddr) { setMsg('Enter address first'); setMsgType('error'); return; }
    setMsg('');
    try {
      const res = await axios.post(`${SERVER}/api/v2/${action}?network=${network}`, { account: targetAddr, ...extra });
      setMsg(`✅ ${action} succeeded: ${res.data.txHash?.slice(0, 20)}...`);
      setMsgType('success');
      setTimeout(load, 3000);
    } catch (e) {
      setMsg(`❌ ${e.response?.data?.error || e.message}`);
      setMsgType('error');
    }
  };

  const roles = ['MINTER', 'ADMIN', 'AUDITOR', 'STAKER'];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <NetworkSelector network={network} onChange={setNetwork} />
      <MessageBox msg={msg} type={msgType} />

      {/* Current Wallet Info */}
      {walletInfo && (
        <div style={{ background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Wallet Roles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            {roles.map(role => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{role}</span>
                <span style={{
                  background: walletInfo.roles?.[role] ? '#dcfce7' : '#fee2e2',
                  color: walletInfo.roles?.[role] ? '#166534' : '#991b1b',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {walletInfo.roles?.[role] ? '✅ YES' : '❌ NO'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#57606a' }}>
            Address: <code style={{ fontFamily: 'monospace' }}>{walletInfo.address || 'N/A'}</code>
          </div>
        </div>
      )}

      {/* Role Management */}
      <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Role Management</h3>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Target address (0x...)"
            value={targetAddr}
            onChange={e => setTargetAddr(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6, fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {roles.map(role => (
            <div key={role} style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => doAction(`grant/${role.toLowerCase()}`, { account: targetAddr })}
                style={{ flex: 1, padding: '10px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', color: '#166534', fontWeight: 600 }}
              >
                Grant {role}
              </button>
              <button
                onClick={() => doAction(`revoke/${role.toLowerCase()}`, { account: targetAddr })}
                style={{ flex: 1, padding: '10px 12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}
              >
                Revoke {role}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
