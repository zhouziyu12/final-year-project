import React from 'react';
import { STATUS_COLORS, STATUS_BG } from '../utils/constants.js';

/**
 * Status badge component for model status display
 */
export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const bg = STATUS_BG[status] || '#f3f4f6';

  return (
    <span style={{
      background: bg,
      color: color,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
    }}>
      {status || 'UNKNOWN'}
    </span>
  );
}
