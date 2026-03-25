import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import NetworkSelector from '../components/NetworkSelector.jsx';
import MessageBox from '../components/MessageBox.jsx';
import { SERVER, TOKEN } from '../utils/constants.js';
import { shortAddr, fmtEth } from '../utils/formatters.js';

export default function NftView({ network: propNetwork }) {
  const [network, setNetwork] = useState(propNetwork || 'sepolia');
  const [nfts, setNfts] = useState([]);
  const [stakeInfo, setStakeInfo] = useState(null);
  const [stakeAmt, setStakeAmt] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [mintModelId, setMintModelId] = useState('');
  const [mintTo, setMintTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nftRes, stakeRes] = await Promise.all([
        axios.get(`${SERVER}/api/v2/nfts?network=${network}`),
        axios.get(`${SERVER}/api/v2/staking?network=${network}`),
      ]);
      setNfts(nftRes.data.nfts || []);
      setStakeInfo(stakeRes.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => { load(); }, [load]);

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

  const handleStake = () => {
    const amount = parseFloat(stakeAmt);
    if (amount > 0) doAction('stake/deposit', { amount });
  };

  const handleUnstake = () => {
    doAction('stake/withdraw', {});
  };

  const handleMint = () => {
    const modelId = parseInt(mintModelId);
    if (modelId > 0) doAction('nft/mint', { modelId, to: mintTo || undefined });
  };

  const tokenSymbol = TOKEN[network] || 'ETH';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <NetworkSelector network={network} onChange={setNetwork} />
      <MessageBox msg={msg} type={msgType} />

      {/* Staking Section */}
      <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Staking</h3>
        {stakeInfo && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#f6f8fa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0969da' }}>{fmtEth(stakeInfo.balance)}</div>
              <div style={{ fontSize: 12, color: '#57606a' }}>Your Balance</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f6f8fa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{fmtEth(stakeInfo.staked)}</div>
              <div style={{ fontSize: 12, color: '#57606a' }}>Staked Amount</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f6f8fa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#9333ea' }}>{fmtEth(stakeInfo.rewards)}</div>
              <div style={{ fontSize: 12, color: '#57606a' }}>Pending Rewards</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder={`Amount to stake (${tokenSymbol})`}
            value={stakeAmt}
            onChange={e => setStakeAmt(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6 }}
          />
          <button onClick={handleStake} style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Stake</button>
          <button onClick={handleUnstake} style={{ padding: '10px 20px', background: '#ea8a14', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Unstake</button>
        </div>
      </div>

      {/* NFT Section */}
      <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>NFTs</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="number"
            placeholder="Model ID"
            value={mintModelId}
            onChange={e => setMintModelId(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6 }}
          />
          <input
            type="text"
            placeholder="Recipient (optional)"
            value={mintTo}
            onChange={e => setMintTo(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7de', borderRadius: 6 }}
          />
          <button onClick={handleMint} style={{ padding: '10px 20px', background: '#9333ea', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Mint NFT</button>
        </div>

        {/* NFT List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {nfts.map(nft => (
            <div key={nft.id} style={{ background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontWeight: 600 }}>NFT #{nft.id}</div>
              <div style={{ fontSize: 12, color: '#57606a' }}>Model: {nft.modelId}</div>
              <div style={{ fontSize: 12, color: '#57606a' }}>Owner: {shortAddr(nft.owner)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
