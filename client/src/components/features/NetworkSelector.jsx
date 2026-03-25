import React from 'react';

/**
 * Network Selector Component
 */
export function NetworkSelector({ 
  value, 
  onChange, 
  networks = [
    { id: 'sepolia', name: 'Sepolia', color: 'bg-blue-500' },
    { id: 'tbnb', name: 'BNB Testnet', color: 'bg-yellow-500' },
    { id: 'somnia', name: 'Somnia', color: 'bg-purple-500' },
  ],
  className = ''
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {networks.map(network => (
        <button
          key={network.id}
          onClick={() => onChange(network.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-150
            ${value === network.id
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }
          `}
        >
          <span className={`w-2 h-2 rounded-full ${network.color} ${value === network.id ? 'bg-white' : ''}`} />
          {network.name}
        </button>
      ))}
    </div>
  );
}
