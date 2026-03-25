import React from 'react';

/**
 * Page header component
 */
export default function Header({ title, subtitle }) {
  return (
    <header style={{
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: '1px solid #d0d7de',
    }}>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#24292f',
        margin: 0,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: 14,
          color: '#57606a',
          margin: '8px 0 0 0',
        }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
