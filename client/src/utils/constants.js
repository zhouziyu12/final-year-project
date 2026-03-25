// ─── Constants ────────────────────────────────────────────────────────────────

// API Server URL (empty string = same origin)
export const SERVER = '';

// Model status colors
export const STATUS_COLORS = {
  DRAFT: '#6b7280',
  ACTIVE: '#16a34a',
  DEPRECATED: '#d97706',
  REVOKED: '#dc2626',
};

export const STATUS_BG = {
  DRAFT: '#f3f4f6',
  ACTIVE: '#dcfce7',
  DEPRECATED: '#fef3c7',
  REVOKED: '#fee2e2',
};

// Audit log action names (indexed by action ID)
export const ACTION_NAMES = [
  'MODEL_REGISTERED',
  'MODEL_ACTIVATED',
  'MODEL_DEPRECATED',
  'MODEL_REVOKED',
  'MODEL_UPDATED',
  'VERSION_ADDED',
  'OWNERSHIP_TREQ',  // Transfer Request
  'OWNERSHIP_TACP',  // Transfer Accept
  'OWNERSHIP_TCAN',  // Transfer Cancel
  'STAKE_DEP',       // Stake Deposit
  'STAKE_WTH',       // Stake Withdraw
  'STAKE_SLS',       // Stake Slash
  'ROLE_GNT',        // Role Grant
  'ROLE_REV',        // Role Revoke
  'BLKLST_ADD',      // Blacklist Add
  'BLKLST_REM',      // Blacklist Remove
  'NFT_MINT',        // NFT Mint
  'NFT_TRAN',        // NFT Transfer
  'NFT_BURN',        // NFT Burn
];

// Block explorer URLs by network
export const EXPLORER = {
  sepolia: 'https://sepolia.etherscan.io',
  tbnb: 'https://testnet.bscscan.com',
  somnia: 'https://staging.t③.somnia.xyz', // placeholder
};

// Native token symbol by network
export const TOKEN = {
  sepolia: 'ETH',
  tbnb: 'BNB',
  somnia: 'SOMNIA',
};

// Supported networks
export const NETWORKS = ['sepolia', 'tbnb'];
