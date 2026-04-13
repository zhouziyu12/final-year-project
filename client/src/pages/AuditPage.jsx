import React, { useState } from 'react';
import { useDevice } from '../hooks';

export function AuditPage({ onAudit }) {
  const { isMobile } = useDevice();
  const [modelId, setModelId] = useState('');
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!modelId.trim()) return;
    setVerifying(true);
    try {
      const response = await onAudit({ modelId });
      setResult(response);
    } catch {
      setResult({ error: 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">Verify Model</h1>
          <p className="text-sm text-zinc-400">Chain consistency audit</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
            placeholder="Enter model ID..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500"
          />
          <button
            onClick={handleVerify}
            disabled={!modelId.trim() || verifying}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {result && (
          <div className={`rounded-2xl p-4 ${result.error ? 'border border-red-500/30 bg-red-500/10' : 'border border-emerald-500/30 bg-emerald-500/10'}`}>
            <p className={result.error ? 'text-red-400' : 'text-emerald-400'}>
              {result.error || (result.verified ? 'Verified successfully' : 'Chain verification failed')}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 animate-fade-in">
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white">Verify Model</h1>
          <p className="text-zinc-400">Verify the recorded provenance chain for a model</p>
        </div>

        <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-6">
          <input
            type="text"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
            placeholder="Enter model ID..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder:text-zinc-500"
          />
          <button
            onClick={handleVerify}
            disabled={!modelId.trim() || verifying}
            className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-semibold text-white disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {result && (
          <div className={`rounded-xl p-4 ${result.error ? 'border border-red-500/30 bg-red-500/10' : 'border border-emerald-500/30 bg-emerald-500/10'}`}>
            <p className={result.error ? 'text-red-400' : 'text-emerald-400'}>
              {result.error || (result.verified ? 'Verified successfully' : 'Chain verification failed')}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">How It Works</h2>
        <div className="space-y-4 text-zinc-400">
          <p>1. Enter a registered model ID.</p>
          <p>2. The backend loads the model provenance history from the tracker contract.</p>
          <p>3. The chain hash is validated and the verification result is returned.</p>
        </div>
      </div>
    </div>
  );
}
