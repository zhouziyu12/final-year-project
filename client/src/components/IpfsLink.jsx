import React from 'react';
import { shortAddr } from '../utils/formatters.js';

/**
 * IPFS content link component
 * @param {string} hash - IPFS CID
 * @param {string} label - Display text (optional)
 */
export default function IpfsLink({ hash, label }) {
  if (!hash) return <span style={{ color: '#6b7280' }}>N/A</span>;

  const href = `https://ipfs.io/ipfs/${hash}`;
  const display = label || shortAddr(hash);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#0969da', textDecoration: 'none' }}
      title={hash}
    >
      {display}
    </a>
  );
}
