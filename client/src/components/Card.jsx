import React from 'react';

/**
 * Card container component
 */
export default function Card({ title, children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #d0d7de',
      borderRadius: 8,
      marginBottom: 16,
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '12px 16px',
          background: '#f6f8fa',
          borderBottom: '1px solid #d0d7de',
          fontWeight: 600,
          fontSize: 14,
          color: '#57606a',
        }}>
          {title}
        </div>
      )}
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}
