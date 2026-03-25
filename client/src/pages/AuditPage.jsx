import React, { useState } from 'react';
import { Card, Alert, Skeleton } from '../components/ui';
import { AuditForm, AuditResult } from '../components/features';

/**
 * Audit Page
 */
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
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Form */}
        <Card id="audit" title="ZK Proof Generation" subtitle="Generate zero-knowledge proof for model verification">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Input the model ID you want to audit</li>
              <li>2. Specify the model version</li>
              <li>3. Generate ZK proof on-chain</li>
              <li>4. Receive verifiable certification</li>
            </ul>
          </div>
          
          <AuditForm onSubmit={handleAudit} loading={auditing} />
          
          {error && (
            <Alert variant="error" title="Audit Failed" className="mt-4">
              {error}
            </Alert>
          )}
        </Card>

        {/* Result Display */}
        <Card title="Audit Result" subtitle="Generated proof and verification data">
          {loading ? (
            <Skeleton className="h-48" />
          ) : result ? (
            <AuditResult result={result} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p>No audit results yet</p>
              <p className="text-sm mt-1">Submit a model ID to generate a proof</p>
            </div>
          )}
        </Card>
      </div>

      {/* Audit Information */}
      <Card title="Audit Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-emerald-50 rounded-lg">
            <svg className="w-8 h-8 text-emerald-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-semibold text-gray-900 mb-1">Zero-Knowledge Proofs</h4>
            <p className="text-sm text-gray-600">Cryptographic proofs that verify model authenticity without revealing sensitive data</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <svg className="w-8 h-8 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h4 className="font-semibold text-gray-900 mb-1">Privacy Preserving</h4>
            <p className="text-sm text-gray-600">Your model weights and training data remain private while still being verifiable</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <svg className="w-8 h-8 text-purple-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="font-semibold text-gray-900 mb-1">Fast Verification</h4>
            <p className="text-sm text-gray-600">On-chain verification takes seconds, not hours like traditional audits</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
