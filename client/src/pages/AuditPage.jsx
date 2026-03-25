import React, { useState } from 'react';
import { Card, Alert, Skeleton } from '../components/ui';
import { AuditForm, AuditResult } from '../components/features';

export function AuditPage({ onAudit, loading }) {
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAudit = async (data) => {
    setAuditing(true);
    setError(null);
    setResult(null);
    try {
      const response = await onAudit(data);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card id="audit" title="ZK Proof Generation" subtitle="Generate zero-knowledge proof" className="animate-fade-in-up">
          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <h4 className="font-medium text-purple-300 mb-2">How it works</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>1. Input model ID</li>
              <li>2. Specify version</li>
              <li>3. Generate ZK proof</li>
              <li>4. Receive certification</li>
            </ul>
          </div>
          <AuditForm onSubmit={handleAudit} loading={auditing} />
          {error && <Alert variant="error" title="Error" className="mt-4">{error}</Alert>}
        </Card>

        <Card title="Result" subtitle="Generated proof" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {loading ? <Skeleton className="h-48" /> : result ? <AuditResult result={result} /> : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <p className="text-slate-400">No results yet</p>
            </div>
          )}
        </Card>
      </div>

      <Card title="ZK Technology" subtitle="How zero-knowledge proofs work" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="font-semibold text-white mb-1">Privacy</h4>
            <p className="text-sm text-slate-400">Verify without revealing sensitive data</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="font-semibold text-white mb-1">Fast</h4>
            <p className="text-sm text-slate-400">Seconds instead of hours</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h4 className="font-semibold text-white mb-1">Secure</h4>
            <p className="text-sm text-slate-400">Cryptographically verified</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
