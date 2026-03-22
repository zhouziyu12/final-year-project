import React from 'react';

export default function StatsCard({ icon, label, value, trend }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #d0d7de',
      borderRadius: 8,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        {trend && (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend > 0 ? '#1a7f37' : '#cf222e',
            padding: '2px 6px',
            background: trend > 0 ? '#dafbe1' : '#ffebe9',
            borderRadius: 4
          }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#57606a', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#24292f' }}>
        {value}
      </div>
    </div>
  );
}
