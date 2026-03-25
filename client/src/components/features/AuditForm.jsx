import React, { useState } from 'react';
import { Button, Input, Alert } from '../ui';

/**
 * Audit Form Component
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Model ID"
        name="modelId"
        value={formData.modelId}
        onChange={handleChange}
        placeholder="0x1234...abcd"
        required
      />
      
      <Input
        label="Version"
        name="version"
        value={formData.version}
        onChange={handleChange}
        placeholder="1"
        type="number"
        min="1"
      />
      
      <Button type="submit" loading={loading}>
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
    <Alert variant="success" title="Audit Complete">
      <div className="space-y-2">
        <p className="font-mono text-sm break-all">{result.proof}</p>
        <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 mt-2">
          <span className="text-xs text-emerald-600 font-medium">Verified:</span>
          <span className="text-xs font-mono">{result.publicSignals}</span>
        </div>
      </div>
    </Alert>
  );
}
