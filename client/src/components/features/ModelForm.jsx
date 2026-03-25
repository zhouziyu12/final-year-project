import React, { useState } from 'react';
import { Button, Input, Select } from '../ui';

/**
 * Model Registration Form
 */
export function ModelForm({ 
  onSubmit, 
  loading = false,
  networks = ['sepolia', 'tbnb', 'somnia']
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ipfsHash: '',
    network: networks[0],
    role: 'developer',
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Model Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="MyAwesomeModel"
          required
        />
        <Select
          label="Network"
          name="network"
          value={formData.network}
          onChange={handleChange}
          options={networks.map(n => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) }))}
        />
      </div>
      
      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="A brief description of the model..."
      />
      
      <Input
        label="IPFS Hash"
        name="ipfsHash"
        value={formData.ipfsHash}
        onChange={handleChange}
        placeholder="QmXyz... (CID)"
        required
      />
      
      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" loading={loading}>
          Register Model
        </Button>
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => setFormData({ name: '', description: '', ipfsHash: '', network: networks[0], role: 'developer' })}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
