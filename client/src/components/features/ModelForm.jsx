import React, { useState } from 'react';
import { Button, Input } from '../ui';

/**
 * Cyber Model Registration Form
 */
export function ModelForm({ 
  onSubmit, 
  loading = false,
  networks = ['sepolia', 'tbnb']
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ipfsHash: '',
    network: networks[0] || 'sepolia',
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name & Network */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Model Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="my-awesome-model"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
        />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">Network</label>
          <select
            name="network"
            value={formData.network}
            onChange={handleChange}
            className="w-full px-4 py-3 text-sm text-white bg-[var(--bg-elevated)] border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500/50"
          >
            {networks.map(n => (
              <option key={n} value={n} className="bg-slate-900">{n.charAt(0).toUpperCase() + n.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Description */}
      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="A brief description of the AI model and its capabilities..."
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        }
      />
      
      {/* IPFS Hash */}
      <Input
        label="IPFS Hash"
        name="ipfsHash"
        value={formData.ipfsHash}
        onChange={handleChange}
        placeholder="QmXyz...abc123"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />
      
      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" loading={loading} glow>
          Register Model
        </Button>
        <Button 
          type="button" 
          variant="ghost"
          onClick={() => setFormData({ name: '', description: '', ipfsHash: '', network: networks[0] || 'sepolia', role: 'developer' })}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
