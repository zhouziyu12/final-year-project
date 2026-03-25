import React, { useState } from 'react';
import { Card, Table, Button, Alert } from '../components/ui';
import { ModelForm, NetworkSelector } from '../components/features';

export function ModelsPage({ models, onRegister, loading }) {
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async (data) => {
    setRegistering(true);
    setError(null);
    setResult(null);
    try {
      const response = await onRegister({ ...data, network: selectedNetwork });
      setResult(response);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-xs text-cyan-400">{row.id?.slice(0, 10)}...{row.id?.slice(-6)}</span> },
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium text-white">{row.name}</span> },
    { key: 'owner', label: 'Owner', render: (row) => <span className="font-mono text-xs text-slate-400">{row.owner?.slice(0, 8)}...</span> },
    { key: 'ipfsHash', label: 'IPFS', render: (row) => row.ipfsHash ? <a href={`https://ipfs.io/ipfs/${row.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-mono text-xs">{row.ipfsHash.slice(0, 10)}...</a> : '-' },
  ];

  return (
    <div className="space-y-6">
      <Card id="register" title="Register Model" subtitle="Add your AI model to the blockchain" className="animate-fade-in-up">
        <NetworkSelector value={selectedNetwork} onChange={setSelectedNetwork} className="mb-6" />
        <ModelForm onSubmit={handleRegister} loading={registering} networks={[selectedNetwork]} />
        
        {result && (
          <Alert variant="success" title="Success" className="mt-6">
            <p className="font-mono text-sm break-all">TX: {result.txHash}</p>
            <p className="text-sm mt-1">Model ID: {result.modelId}</p>
          </Alert>
        )}
        {error && (
          <Alert variant="error" title="Error" className="mt-6">{error}</Alert>
        )}
      </Card>

      <Card title="Registered Models" subtitle={`${models?.length || 0} models`} className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Table columns={columns} data={models || []} loading={loading} />
      </Card>
    </div>
  );
}
