import React, { useState } from 'react';
import { Card, Table, Button, Alert } from '../components/ui';
import { ModelForm, NetworkSelector } from '../components/features';

/**
 * Models Page
 */
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
    { key: 'id', label: 'Model ID', render: (row) => (
      <span className="font-mono text-xs">{row.id?.slice(0, 10)}...{row.id?.slice(-6)}</span>
    )},
    { key: 'name', label: 'Name', render: (row) => (
      <span className="font-medium">{row.name}</span>
    )},
    { key: 'owner', label: 'Owner', render: (row) => (
      <span className="font-mono text-xs text-gray-500">{row.owner?.slice(0, 8)}...</span>
    )},
    { key: 'timestamp', label: 'Registered', render: (row) => (
      <span className="text-sm text-gray-500">
        {row.timestamp ? new Date(row.timestamp * 1000).toLocaleDateString() : 'N/A'}
      </span>
    )},
    { key: 'ipfsHash', label: 'IPFS', render: (row) => (
      row.ipfsHash ? (
        <a 
          href={`https://ipfs.io/ipfs/${row.ipfsHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-mono text-xs"
        >
          {row.ipfsHash.slice(0, 12)}...
        </a>
      ) : '-'
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Register Section */}
      <Card id="register" title="Register New Model" subtitle="Add your AI model to the blockchain">
        <NetworkSelector 
          value={selectedNetwork}
          onChange={setSelectedNetwork}
        />
        <div className="mt-4">
          <ModelForm 
            onSubmit={handleRegister}
            loading={registering}
            networks={[selectedNetwork]}
          />
        </div>
        
        {result && (
          <Alert variant="success" title="Model Registered" className="mt-4">
            <p className="font-mono text-sm break-all">TX: {result.txHash}</p>
            <p className="text-sm mt-1">Model ID: {result.modelId}</p>
          </Alert>
        )}
        
        {error && (
          <Alert variant="error" title="Error" className="mt-4">
            {error}
          </Alert>
        )}
      </Card>

      {/* Models List */}
      <Card title="Registered Models" subtitle={`${models?.length || 0} models on blockchain`}>
        <Table
          columns={columns}
          data={models || []}
          emptyText="No models registered yet"
          loading={loading}
        />
      </Card>
    </div>
  );
}
