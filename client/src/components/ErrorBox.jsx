import React from 'react';

/**
 * Error display box with retry button
 */
export default function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{
      background: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: 8,
      padding: '20px 24px',
      textAlign: 'center',
      color: '#991b1b',
      margin: '40px auto',
      maxWidth: 500,
    }}>
      <div style={{ fontSize: 14, marginBottom: 16 }}>
        �� Error: {msg || 'Unknown error'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
