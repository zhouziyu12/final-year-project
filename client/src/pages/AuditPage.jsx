import React, { useState } from 'react';
import { useDevice } from '../hooks';

export function AuditPage({ onAudit, loading }) {
  const { isMobile } = useDevice();
  const [modelId, setModelId] = useState('');
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!modelId.trim()) return;
    setVerifying(true);
    try {
      const res = await onAudit({ modelId });
      setResult(res);
    } catch (err) {
      setResult({ error: 'Verification failed' });
    }
    setVerifying(false);
  };

  if (isMobile) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">Verify Model</h1>
          <p className="text-zinc-400 text-sm">ZK-based audit</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Enter model ID..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500"
          />
          <button
            onClick={handleVerify}
            disabled={!modelId.trim() || verifying}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold disabled:opacity-50 active:scale-[0.98]"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-2xl ${result.error ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
            <p className={result.error ? 'text-red-400' : 'text-emerald-400'}>{result.error || 'Verified successfully'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 animate-fade-in">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Model</h1>
          <p className="text-zinc-400">Use ZK proofs to verify model integrity</p>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-4">
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Enter model ID..."
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 font-mono"
          />
          <button
            onClick={handleVerify}
            disabled={!modelId.trim() || verifying}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-xl ${result.error ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
            <p className={result.error ? 'text-red-400' : 'text-emerald-400'}>{result.error || 'Verified successfully'}</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
        <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
        <div className="space-y-4 text-zinc-400">
          <p>1. Input model hash or ID</p>
          <p>2. ZK proof generated on-chain</p>
          <p>3. Verification result returned</p>
        </div>
      </div>
    </div>
  );
}
