import React from 'react';

/**
 * Cyber Network Selector Component
 */
export function NetworkSelector({ 
  value, 
  onChange, 
  networks = [
    { id: 'sepolia', name: 'Sepolia', color: '#3b82f6' },
    { id: 'tbnb', name: 'BNB Testnet', color: '#f59e0b' },
  ],
  className = ''
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {networks.map((network) => (
        <button
          key={network.id}
          onClick={() => onChange(network.id)}
          className={`
            relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200 overflow-hidden
            ${value === network.id
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
            }
          `}
        >
          {/* Background */}
          {value === network.id && (
            <>
              <div 
                className="absolute inset-0 opacity-20"
                style={{ background: `linear-gradient(135deg, ${network.color}40 0%, ${network.color}20 100%)` }}
              />
              <div 
                className="absolute inset-0 border rounded-lg"
                style={{ borderColor: `${network.color}50` }}
              />
            </>
          )}
          
          {/* Indicator dot */}
          <span 
            className="relative w-2 h-2 rounded-full transition-all duration-200"
            style={{ 
              backgroundColor: value === network.id ? network.color : '#475569',
              boxShadow: value === network.id ? `0 0 8px ${network.color}` : 'none'
            }}
          />
          
          <span className="relative">{network.name}</span>
        </button>
      ))}
    </div>
  );
}
