import React from 'react';

export default function Header({ onNavigate, currentView }) {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #d0d7de',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div 
            onClick={() => onNavigate('list')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #0969da 0%, #0550ae 100%)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}>
              🔗
            </div>
            <span style={{ 
              fontSize: 18, 
              fontWeight: 600,
              color: '#24292f'
            }}>
              Provenance
            </span>
          </div>

          <nav style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onNavigate('list')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: currentView === 'list' ? '#f6f8fa' : 'transparent',
                color: currentView === 'list' ? '#24292f' : '#57606a',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Models
            </button>
            <button
              onClick={() => onNavigate('query')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: currentView === 'query' ? '#f6f8fa' : 'transparent',
                color: currentView === 'query' ? '#24292f' : '#57606a',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Query
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 12px',
            background: '#f6f8fa',
            borderRadius: 6,
            fontSize: 13,
            color: '#57606a',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#1a7f37' 
            }} />
            Connected
          </div>
        </div>
      </div>
    </header>
  );
}
