import React, { useState } from 'react';
import { Button, Input } from '../ui';

/**
 * Cyber Audit Form Component
 */
export function AuditForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    modelId: '',
    version: '1',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Model ID"
        name="modelId"
        value={formData.modelId}
        onChange={handleChange}
        placeholder="0x1234...abcd"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        }
      />
      
      <Input
        label="Version"
        name="version"
        value={formData.version}
        onChange={handleChange}
        placeholder="1"
        type="number"
        min="1"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
      />
      
      <Button type="submit" loading={loading} variant="purple" glow className="mt-4">
        Generate ZK Proof
      </Button>
    </form>
  );
}

/**
 * Audit Result Component
 */
export function AuditResult({ result }) {
  if (!result) return null;

  return (
    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="font-semibold text-emerald-400">Verification Complete</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Proof</span>
          <p className="font-mono text-sm text-slate-300 break-all">{result.proof}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Public Signals</span>
          <p className="font-mono text-sm text-slate-300">{result.publicSignals}</p>
        </div>
      </div>
    </div>
  );
}
