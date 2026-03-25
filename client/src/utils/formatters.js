// ─── Formatting Utilities ────────────────────────────────────────────────────

/**
 * Shorten an Ethereum address for display
 * @param {string} a - Full address
 * @returns {string} Shortened address (e.g., "0x1234...abcd")
 */
export const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

/**
 * Format a wei/ether value for display (4 decimal places)
 * @param {string|number} v - Value in wei or ether
 * @returns {string} Formatted value
 */
export const fmtEth = (v) => (parseFloat(v) || 0).toFixed(4);

/**
 * Format a Unix timestamp to local datetime string
 * @param {number} ts - Unix timestamp (seconds)
 * @returns {string} Formatted datetime or 'N/A'
 */
export const fmtTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

/**
 * Format a Unix timestamp to short date string
 * @param {number} ts - Unix timestamp (seconds)
 * @returns {string} Formatted date or 'N/A'
 */
export const fmtDate = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : 'N/A';
