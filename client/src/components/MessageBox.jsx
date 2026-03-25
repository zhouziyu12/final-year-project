import React from 'react';

/**
 * Message/notification box component
 * @param {string} msg - Message text
 * @param {string} type - 'success' | 'error'
 */
export default function MessageBox({ msg, type }) {
  if (!msg) return null;

  const isSuccess = type === 'success';
  const bg = isSuccess ? '#dcfce7' : '#fee2e2';
  const border = isSuccess ? '#86efac' : '#fecaca';
  const color = isSuccess ? '#166534' : '#991b1b';

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: '10px 14px',
      marginBottom: 16,
      color: color,
      fontSize: 13,
    }}>
      {msg}
    </div>
  );
}
