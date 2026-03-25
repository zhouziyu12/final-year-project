import React from 'react';

/**
 * Loading spinner component
 */
export default function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 20px',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #d0d7de',
        borderTopColor: '#0969da',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
