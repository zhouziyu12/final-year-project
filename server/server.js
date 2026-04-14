import express from 'express';
import { ethers } from 'ethers';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Response helpers

function toJsonSafe(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]));
  }
  return value;
}

const ok = (res, data) => res.status(200).json({ success: true, ...toJsonSafe(data) });

const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ success: false, error: message });
};

const handle = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, error.message);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === 'CALL_EXCEPTION') {
      const reason = error.reason || error.message || 'Unknown blockchain error';
      return sendError(res, `Blockchain error: ${reason}`, 502);
    }
    if (error.code === 'INSUFFICIENT_FUNDS') return sendError(res, 'Insufficient funds', 400);
    if (error.code === 'NETWORK_ERROR') return sendError(res, 'Network error, please retry', 503);
    return sendError(res, error.message || 'Internal server error', 500);
  });
};

// App setup

const app = express();
const TRUST_PROXY = ['1', 'true', 'yes'].includes(String(process.env.TRUST_PROXY || '').toLowerCase());
if (TRUST_PROXY) {
  app.set('trust proxy', true);
}

app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function isPrivateDevOrigin(origin) {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  } catch {
    return false;
  }

  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isPrivateDevOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const WRITE_API_KEY = process.env.WRITE_API_KEY || '';
const WRITE_AUTH_WINDOW_MS = Number(process.env.WRITE_AUTH_WINDOW_MS || 5 * 60 * 1000);
const WRITE_RATE_LIMIT_WINDOW_MS = Number(process.env.WRITE_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const WRITE_RATE_LIMIT_MAX = Number(process.env.WRITE_RATE_LIMIT_MAX || 30);
const AUTH_STATE_FILE = path.join(__dirname, 'write_auth_state.json');

function loadNonceStore() {
  try {
    if (!fs.existsSync(AUTH_STATE_FILE)) {
      return new Map();
    }

    const parsed = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf8'));
    const entries = Array.isArray(parsed?.nonces) ? parsed.nonces : [];
    const current = nowMs();
    return new Map(
      entries
        .filter((entry) => entry?.key && Number(entry?.expiresAt) > current)
        .map((entry) => [entry.key, { expiresAt: Number(entry.expiresAt) }])
    );
  } catch {
    return new Map();
  }
}

function persistNonceStore() {
  const payload = {
    nonces: Array.from(nonceStore.entries()).map(([key, value]) => ({
      key,
      expiresAt: value.expiresAt
    }))
  };
  fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(payload, null, 2));
}

const nonceStore = loadNonceStore();
const rateLimitStore = new Map();

function nowMs() {
  return Date.now();
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function cleanupMap(store, timeKey, onChange) {
  const current = nowMs();
  let changed = false;
  for (const [key, value] of store.entries()) {
    if (!value || value[timeKey] <= current) {
      store.delete(key);
      changed = true;
    }
  }
  if (changed && onChange) {
    onChange();
  }
}

function validateWriteRateLimit(req, res) {
  cleanupMap(rateLimitStore, 'resetAt');
  const clientIp = getClientIp(req);
  const key = `${clientIp}:${req.path}`;
  const current = nowMs();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= current) {
    rateLimitStore.set(key, { count: 1, resetAt: current + WRITE_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= WRITE_RATE_LIMIT_MAX) {
    res.set('Retry-After', Math.ceil((existing.resetAt - current) / 1000).toString());
    sendError(res, 'Write rate limit exceeded', 429);
    return false;
  }

  existing.count += 1;
  return true;
}

function validateWriteAuth(req, res, next) {
  if (!WRITE_API_KEY) {
    console.error('WRITE_API_KEY not configured. Refusing write request.');
    return sendError(res, 'Write authentication is not configured', 503);
  }

  if (!validateWriteRateLimit(req, res)) {
    return;
  }

  const apiKey = req.get('x-api-key');
  const timestampHeader = req.get('x-auth-timestamp');
  const nonce = req.get('x-auth-nonce');

  if (!apiKey || apiKey !== WRITE_API_KEY) {
    return sendError(res, 'Invalid write API key', 401);
  }

  if (!timestampHeader || !nonce) {
    return sendError(res, 'Missing write authentication headers', 401);
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return sendError(res, 'Invalid write authentication timestamp', 401);
  }

  const age = Math.abs(nowMs() - timestamp);
  if (age > WRITE_AUTH_WINDOW_MS) {
    return sendError(res, 'Expired write authentication timestamp', 401);
  }

  cleanupMap(nonceStore, 'expiresAt', persistNonceStore);
  const nonceKey = `${apiKey}:${nonce}`;
  if (nonceStore.has(nonceKey)) {
    return sendError(res, 'Replay detected for write request', 409);
  }

  nonceStore.set(nonceKey, { expiresAt: nowMs() + WRITE_AUTH_WINDOW_MS });
  persistNonceStore();
  req.writeAuth = {
    clientIp: getClientIp(req),
    authenticatedAt: new Date().toISOString()
  };
  next();
}

function requireString(value, fieldName, { optional = false, maxLength = 2000 } = {}) {
  if (optional && (value === undefined || value === null || value === '')) {
    return null;
  }
  if (typeof value !== 'string') {
    const error = new Error(`${fieldName} must be a string`);
    error.statusCode = 400;
    throw error;
  }
  const trimmed = value.trim();
  if (!optional && !trimmed) {
    const error = new Error(`${fieldName} is required`);
    error.statusCode = 400;
    throw error;
  }
  if (trimmed.length > maxLength) {
    const error = new Error(`${fieldName} is too long`);
    error.statusCode = 400;
    throw error;
  }
  return trimmed;
}

function requirePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function requirePlainObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an object`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

const SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function computeStatementHash(canonicalMetadata) {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalMetadata));
  return BigInt(hash) % SNARK_SCALAR_FIELD;
}

function parseBigNumberish(value, fieldName) {
  try {
    return BigInt(value);
  } catch {
    const error = new Error(`${fieldName} must be a valid bigint-compatible value`);
    error.statusCode = 400;
    throw error;
  }
}

function requireArray(value, fieldName, expectedLength) {
  if (!Array.isArray(value) || (expectedLength !== undefined && value.length !== expectedLength)) {
    const error = new Error(
      expectedLength === undefined
        ? `${fieldName} must be an array`
        : `${fieldName} must be an array of length ${expectedLength}`
    );
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function parseCanonicalMetadataOrThrow(value) {
  const canonicalMetadata = requireString(value, 'canonicalMetadata', { maxLength: 50000 });
  let parsed;

  try {
    parsed = JSON.parse(canonicalMetadata);
  } catch {
    const error = new Error('canonicalMetadata must be valid JSON');
    error.statusCode = 400;
    throw error;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const error = new Error('canonicalMetadata must encode a JSON object');
    error.statusCode = 400;
    throw error;
  }

  return { canonicalMetadata, parsed };
}

function validateCanonicalMetadataShape(metadata, { modelName, chain }) {
  const requiredFields = [
    'action',
    'artifactCid',
    'chain',
    'commit',
    'modelHash',
    'modelName',
    'sender',
    'submittedAt',
    'trainingMetadata',
    'versionTag'
  ];

  for (const field of requiredFields) {
    if (!(field in metadata)) {
      const error = new Error(`canonicalMetadata is missing required field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }

  requireString(metadata.action, 'canonicalMetadata.action', { maxLength: 64 });
  requireString(metadata.artifactCid, 'canonicalMetadata.artifactCid', { maxLength: 256 });
  requireString(metadata.chain, 'canonicalMetadata.chain', { maxLength: 64 });
  requireString(metadata.commit, 'canonicalMetadata.commit', { maxLength: 2048 });
  requireString(metadata.modelHash, 'canonicalMetadata.modelHash', { maxLength: 256 });
  requireString(metadata.modelName, 'canonicalMetadata.modelName', { maxLength: 256 });
  requireString(metadata.sender, 'canonicalMetadata.sender', { maxLength: 256 });
  requireString(metadata.submittedAt, 'canonicalMetadata.submittedAt', { maxLength: 128 });
  requireString(metadata.versionTag, 'canonicalMetadata.versionTag', { maxLength: 64 });
  requirePlainObject(metadata.trainingMetadata, 'canonicalMetadata.trainingMetadata');

  if (metadata.modelName !== modelName) {
    const error = new Error('modelName does not match canonicalMetadata.modelName');
    error.statusCode = 400;
    throw error;
  }

  if (metadata.chain !== chain) {
    const error = new Error('chain does not match canonicalMetadata.chain');
    error.statusCode = 400;
    throw error;
  }

  const forbiddenFields = ['zkProof', 'zk_public_signals', 'zk_calldata', 'proof', 'publicSignals'];
  for (const field of forbiddenFields) {
    if (field in metadata || field in metadata.trainingMetadata) {
      const error = new Error(`canonicalMetadata must not include proof field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }

  return metadata;
}

function normalizeZKProof(zkProof) {
  const proof = requirePlainObject(zkProof, 'zkProof');
  const pA = requireArray(proof.pA, 'zkProof.pA', 2).map((value, index) =>
    parseBigNumberish(value, `zkProof.pA[${index}]`).toString()
  );
  const pB = requireArray(proof.pB, 'zkProof.pB', 2).map((row, rowIndex) =>
    requireArray(row, `zkProof.pB[${rowIndex}]`, 2).map((value, colIndex) =>
      parseBigNumberish(value, `zkProof.pB[${rowIndex}][${colIndex}]`).toString()
    )
  );
  const pC = requireArray(proof.pC, 'zkProof.pC', 2).map((value, index) =>
    parseBigNumberish(value, `zkProof.pC[${index}]`).toString()
  );
  const publicSignals = requireArray(proof.publicSignals, 'zkProof.publicSignals', 3).map((value, index) =>
    parseBigNumberish(value, `zkProof.publicSignals[${index}]`)
  );

  return { pA, pB, pC, publicSignals };
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ADDR_FILE = path.join(PROJECT_ROOT, 'address_v2_multi.json');
const MODEL_MAP_FILE = path.join(PROJECT_ROOT, 'model_name_map.json');
const SECRETS_FILE = path.join(PROJECT_ROOT, 'model_secrets', 'secrets.json');

let addrs;
try {
  addrs = JSON.parse(fs.readFileSync(ADDR_FILE, 'utf8'));
} catch (error) {
  console.error('Failed to load address file:', ADDR_FILE);
  process.exit(1);
}

function loadModelMap() {
  try {
    if (fs.existsSync(MODEL_MAP_FILE)) {
      return JSON.parse(fs.readFileSync(MODEL_MAP_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveModelMap(map) {
  fs.writeFileSync(MODEL_MAP_FILE, JSON.stringify(map, null, 2));
}

function loadSecretStore() {
  try {
    if (!fs.existsSync(SECRETS_FILE)) {
      return {};
    }
    const raw = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
    return raw?.series || raw || {};
  } catch {
    return {};
  }
}

function decryptSecretCiphertext(ciphertext) {
  if (process.platform !== 'win32') {
    throw new Error('Encrypted secret lookup currently requires Windows DPAPI');
  }

  const env = {
    ...process.env,
    MODEL_SECRET_CIPHERTEXT_B64: Buffer.from(String(ciphertext), 'utf8').toString('base64')
  };

  const script =
    "$cipher = [System.Text.Encoding]::UTF8.GetString(" +
    "[System.Convert]::FromBase64String($env:MODEL_SECRET_CIPHERTEXT_B64));" +
    "$secure = ConvertTo-SecureString $cipher;" +
    "$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);" +
    "try { [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } " +
    "finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }";

  const result = spawnSync('powershell', ['-NoProfile', '-Command', script], {
    env,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'Failed to decrypt secret ciphertext');
  }

  return result.stdout.trim();
}

function resolveSeriesSecret(entry) {
  if (entry?.secret !== undefined && entry?.secret !== null) {
    return String(entry.secret);
  }

  if (entry?.secret_ciphertext) {
    try {
      return decryptSecretCiphertext(entry.secret_ciphertext);
    } catch {
      return null;
    }
  }

  return null;
}

function findSeriesBySecret(secret) {
  const seriesStore = loadSecretStore();
  const target = String(secret);

  for (const [seriesName, entry] of Object.entries(seriesStore)) {
    const resolved = resolveSeriesSecret(entry);
    if (resolved !== null && String(resolved) === target) {
      return {
        seriesName,
        entry,
        storageMode: entry?.secret_ciphertext ? 'encrypted' : 'plaintext-legacy'
      };
    }
  }

  return null;
}

function parseMetadataString(value) {
  if (typeof value !== 'string' || !value.trim().startsWith('{')) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getRecordMetadata(record) {
  const metadataRaw = record?.ipfsMetadata ?? record?.[3];
  return parseMetadataString(metadataRaw);
}

function getArtifactCid(metadata) {
  return metadata?.artifactCid || metadata?.ipfsHash || metadata?.metadataCid || null;
}

function buildLifecycleFilename(seriesName, versionEntry, metadata) {
  if (versionEntry?.artifact_filename) {
    return versionEntry.artifact_filename;
  }

  const weightsPath = metadata?.trainingMetadata?.weights_path;
  if (weightsPath) {
    return path.basename(weightsPath);
  }

  const safeSeries = String(seriesName || 'model').replace(/[^\w.-]+/g, '_');
  const safeVersion = String(versionEntry?.version || 'version').replace(/[^\w.-]+/g, '_');
  return `${safeSeries}-${safeVersion}.bin`;
}

async function enrichLifecycleVersion(versionEntry) {
  const enriched = {
    version: versionEntry.version,
    modelId: versionEntry.model_id,
    modelHash: versionEntry.model_hash,
    timestamp: versionEntry.timestamp,
    modelName: versionEntry.model_name || null,
    chain: versionEntry.chain || null,
    ipfsCid: versionEntry.ipfs_cid || null,
    txHash: versionEntry.tx_hash || null,
    artifactFileName: versionEntry.artifact_filename || null,
    downloadReady: false,
    downloadSource: null
  };

  const modelId = Number(versionEntry.model_id);
  if (!Number.isInteger(modelId) || modelId <= 0) {
    if (enriched.ipfsCid) {
      enriched.downloadReady = true;
      enriched.downloadSource = 'ipfs';
    }
    return enriched;
  }

  const chainCandidates = versionEntry.chain ? [versionEntry.chain] : ['sepolia', 'tbnb'];

  async function tryResolveFromHistory(chain, history) {
    const matchingRecord = [...history].reverse().find((record) => {
      const metadata = getRecordMetadata(record);
      if (!metadata) return false;
      return (
        metadata.modelHash === versionEntry.model_hash ||
        metadata.versionTag === versionEntry.version
      );
    });

    if (!matchingRecord) {
      return false;
    }

    const metadata = getRecordMetadata(matchingRecord);
    const artifactCid = getArtifactCid(metadata);
    if (artifactCid && !enriched.ipfsCid) {
      enriched.ipfsCid = artifactCid;
    }
    if (!enriched.modelName && (metadata?.modelName || metadata?.trainingMetadata?.model_name)) {
      enriched.modelName = metadata.modelName || metadata.trainingMetadata.model_name;
    }
    if (!enriched.chain) {
      enriched.chain = chain;
    }
    if (!enriched.artifactFileName) {
      enriched.artifactFileName = buildLifecycleFilename(null, versionEntry, metadata);
    }
    if (enriched.ipfsCid) {
      enriched.downloadReady = true;
      enriched.downloadSource = 'ipfs';
    }
    return enriched.downloadReady;
  }

  for (const chain of chainCandidates) {
    if (!chains[chain]) continue;

    try {
      const { mpt } = getContracts(chain);
      const history = await mpt.getModelHistory(modelId);
      if (await tryResolveFromHistory(chain, history)) {
        return enriched;
      }
    } catch {
      continue;
    }
  }

  for (const chain of chainCandidates) {
    if (!chains[chain]) continue;

    try {
      const { mpt } = getContracts(chain);
      const knownModels = getKnownModels(chain);
      for (const knownModel of knownModels) {
        const history = await mpt.getModelHistory(knownModel.id);
        if (await tryResolveFromHistory(chain, history)) {
          return enriched;
        }
      }
    } catch {
      continue;
    }
  }

  return enriched;
}

async function fetchIpfsBinary(cid) {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`
  ];

  for (const url of gateways) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      return Buffer.from(response.data);
    } catch {}
  }

  return null;
}

const modelNameMap = loadModelMap();

const SEPOLIA_RPC =
  process.env.SEPOLIA_RPC ||
  process.env.SEPOLIA_URL ||
  (process.env.INFURA_API_KEY
    ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    : 'https://rpc.sepolia.org');
const TBNB_RPC = process.env.BNB_TESTNET_URL || 'https://bsc-testnet.publicnode.com';

const pk = process.env.PRIVATE_KEY?.trim() || '';
const bootWarnings = [];
if (!pk) {
  bootWarnings.push('PRIVATE_KEY missing: backend will start in read-only mode and write routes will be unavailable.');
}

const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const bnbProvider = new ethers.JsonRpcProvider(TBNB_RPC);
const sepWallet = pk ? new ethers.Wallet(pk, sepProvider) : null;
const bnbWallet = pk ? new ethers.Wallet(pk, bnbProvider) : null;

const chains = {
  sepolia: { provider: sepProvider, wallet: sepWallet, addr: addrs.sepolia },
  tbnb: { provider: bnbProvider, wallet: bnbWallet, addr: addrs.tbnb }
};

const MR_ABI = [
  'function registerModel(string memory _name, string memory _description,' +
    ' string memory _ipfsCid, string memory _checksum, string memory _framework,' +
    ' string memory _license) external returns (uint256)',
  'function activateModel(uint256 _id) external',
  'function getModelOwner(uint256 _id) view returns (address)',
  'function getModelStatus(uint256 _id) view returns (uint8)',
  'function isModelStaked(uint256 _id) view returns (bool)',
  'function accessControl() view returns (address)',
  'event ModelRegistered(uint256 indexed id, address indexed owner)'
];

const MAC_ABI = [
  'function ADMIN() view returns (bytes32)',
  'function REGISTRAR() view returns (bytes32)',
  'function hasRole(bytes32 role, address addr) view returns (bool)',
  'function grantRole(bytes32 role, address addr)'
];

const ZKPT_ABI = [
  'function addVerifiedRecord(uint256 _modelId, uint8 _eventType,' +
    ' string calldata _canonicalMetadata, uint256[2] calldata _pA,' +
    ' uint256[2][2] calldata _pB, uint256[2] calldata _pC,' +
    ' uint256[3] calldata _pubSignals) external returns (uint256)',
  'function getModelHistory(uint256 _modelId) view returns' +
    ' (tuple(uint256,uint256,uint8,string,uint256,address,bytes32,bytes32)[])',
  'function verifyChain(uint256 _modelId) view returns (bool)',
  'function modelChainHead(uint256 _modelId) view returns (bytes32)',
  'function modelBlacklist(uint256 _modelId) view returns (bool)',
  'function nullifierUsed(uint256 _nullifier) view returns (bool)',
  'function computeStatementHash(string calldata _canonicalMetadata) view returns (uint256)',
  'event RecordAdded(uint256 indexed recordId,uint256 indexed modelId,uint8 indexed eventType,address operator)'
];

const MAL_ABI = [
  'event AuditEntryAdded(uint256 indexed entryId,uint8 indexed action,address indexed actor,uint256 targetId)'
];

const VERIFIER_ABI = [
  'function verifyProof(uint256[2] calldata _pA, uint256[2][2] calldata _pB,' +
    ' uint256[2] calldata _pC, uint256[3] calldata _pubSignals) view returns (bool)'
];

function getContracts(chain) {
  const c = chains[chain];
  if (!c || !c.addr?.contracts) {
    const error = new Error(`Chain ${chain} is not configured`);
    error.statusCode = 503;
    throw error;
  }
  const a = c.addr.contracts;
  const reader = c.wallet || c.provider;
  if (!reader) {
    const error = new Error(`Chain ${chain} has no available provider`);
    error.statusCode = 503;
    throw error;
  }
  const provenanceAddress = a.ZKProvenanceTracker || a.ModelProvenanceTracker;
  if (!provenanceAddress) {
    const error = new Error(`Chain ${chain} is missing a provenance tracker address`);
    error.statusCode = 503;
    throw error;
  }
  return {
    mr: new ethers.Contract(a.ModelRegistry, MR_ABI, reader),
    mac: new ethers.Contract(a.ModelAccessControl, MAC_ABI, reader),
    mpt: new ethers.Contract(provenanceAddress, ZKPT_ABI, reader),
    mal: new ethers.Contract(a.ModelAuditLog, MAL_ABI, reader),
    verifier: a.Groth16Verifier ? new ethers.Contract(a.Groth16Verifier, VERIFIER_ABI, reader) : null,
    provenanceAddress,
    provenanceMode: a.ZKProvenanceTracker ? 'verifier-gated' : 'legacy'
  };
}

function requireWriteChain(chain) {
  const selected = chains[chain];
  if (!selected) {
    const error = new Error(`Invalid chain: ${chain}`);
    error.statusCode = 400;
    throw error;
  }
  if (!selected.wallet) {
    const error = new Error(`Chain ${chain} is running in read-only mode because PRIVATE_KEY is not configured`);
    error.statusCode = 503;
    throw error;
  }
  return selected;
}

async function getChainStatus(chain) {
  const c = chains[chain];
  const knownModels = getKnownModels(chain);
  const contracts = c.addr?.contracts || {};
  const payload = {
    blockNumber: null,
    connected: false,
    balance: null,
    knownModels: knownModels.length,
    zkEnforced: Boolean(contracts.ZKProvenanceTracker && contracts.Groth16Verifier),
    provenanceMode: contracts.ZKProvenanceTracker ? 'verifier-gated' : 'legacy'
  };

  try {
    payload.blockNumber = await c.provider.getBlockNumber();
    payload.connected = true;
  } catch (error) {
    payload.error = `RPC unavailable: ${error.message}`;
    return payload;
  }

  if (c.wallet) {
    try {
      const balance = await c.provider.getBalance(c.wallet.address);
      payload.balance = ethers.formatEther(balance);
      payload.walletAddress = c.wallet.address;
    } catch (error) {
      payload.balance = null;
      payload.balanceError = error.message;
    }
  } else {
    payload.balance = 'read-only';
  }

  return payload;
}

const ACTION_MAP = {
  REGISTERED: 0,
  ACTIVATED: 1,
  UPDATED: 2,
  TRAINING_COMPLETED: 2,
  DEPRECATED: 3,
  REVOKED: 4,
  VERSION_RELEASED: 5,
  TRANSFERRED: 6,
  STAKED: 7,
  UNSTAKED: 8,
  SLASHED: 9,
  ZK_PROOF_VERIFIED: 10
};

function getStatusName(status) {
  return ['DRAFT', 'ACTIVE', 'DEPRECATED', 'REVOKED'][Number(status)] || 'UNKNOWN';
}

function getKnownModels(chain) {
  const prefix = `${chain}:`;
  return Object.entries(modelNameMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, id]) => ({ chain, name: key.slice(prefix.length), id: Number(id) }));
}

async function getModelOwnerOrNull(contract, modelId) {
  const owner = await contract.getModelOwner(modelId);
  return owner === ethers.ZeroAddress ? null : owner;
}

async function buildStatusPayload() {
  const chainsPayload = {};
  let totalModels = 0;
  const contractsPayload = {};
  let zkEnforced = true;

  for (const chain of ['sepolia', 'tbnb']) {
    const knownModels = getKnownModels(chain);
    totalModels += knownModels.length;
    chainsPayload[chain] = await getChainStatus(chain);
    contractsPayload[chain] = addrs?.[chain]?.contracts || {};
    if (!contractsPayload[chain]?.ZKProvenanceTracker || !contractsPayload[chain]?.Groth16Verifier) {
      zkEnforced = false;
    }
  }

  return {
    chains: chainsPayload,
    contracts: contractsPayload,
    totalModels,
    totalAudits: totalModels,
    zkReady: zkEnforced,
    zkEnforced,
    writeMode: pk ? 'enabled' : 'read-only',
    warnings: bootWarnings
  };
}

async function getModelSummary(chain, entry) {
  const { mr } = getContracts(chain);
  try {
    const owner = await mr.getModelOwner(entry.id);
    if (owner === ethers.ZeroAddress) {
      return {
        id: String(entry.id),
        numericId: entry.id,
        name: entry.name,
        description: 'Registration submitted through backend relayer',
        chain,
        owner: null,
        status: 'PENDING_REGISTRATION',
        verified: false,
        staked: false,
        pending: true
      };
    }
    const status = await mr.getModelStatus(entry.id);
    const staked = await mr.isModelStaked(entry.id);
    return {
      id: String(entry.id),
      numericId: entry.id,
      name: entry.name,
      description: 'Registered through backend relayer',
      chain,
      owner,
      status: getStatusName(status),
      verified: Number(status) === 1,
      staked
    };
  } catch {
    return null;
  }
}

// Health and status

app.get('/api/health', (req, res) => {
  ok(res, {
    status: bootWarnings.length === 0 ? 'ok' : 'degraded',
    timestamp: Date.now(),
    warnings: bootWarnings
  });
});

app.get('/api/v2/status', handle(async (req, res) => {
  ok(res, await buildStatusPayload());
}));

app.get('/api/status', handle(async (req, res) => {
  ok(res, await buildStatusPayload());
}));

// Audit events

app.get('/api/v2/audit/recent', handle(async (req, res) => {
  const chain = req.query.chain || 'sepolia';
  if (!chains[chain]) return sendError(res, `Invalid chain: ${chain}`, 400);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

  const { mal } = getContracts(chain);
  const addr = chains[chain].addr.contracts.ModelAuditLog;
  const currentBlock = await chains[chain].provider.getBlockNumber();
  const fromBlock = Math.max(currentBlock - 50, 1);

  let logs = [];
  try {
    logs = await chains[chain].provider.getLogs({ address: addr, fromBlock, toBlock: currentBlock });
  } catch (error) {
    console.log(`[AUDIT] Fetch error: ${error.message.slice(0, 80)}`);
  }

  const events = logs
    .map((log) => {
      try {
        const parsed = mal.interface.parseLog(log);
        return {
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          contractAddress: log.address,
          event: parsed.name,
          args: Object.fromEntries(parsed.args.map((value, index) => [index, String(value)]))
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(-limit);

  ok(res, { events, blockRange: { from: fromBlock, to: currentBlock } });
}));

app.get('/api/v2/audit/verify/:id', handle(async (req, res) => {
  const chain = req.query.chain || 'sepolia';
  if (!chains[chain]) return sendError(res, `Invalid chain: ${chain}`, 400);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return sendError(res, 'Invalid model ID', 400);

  const { mpt } = getContracts(chain);
  const history = await mpt.getModelHistory(id);
  const verified = await mpt.verifyChain(id);
  ok(res, {
    modelId: id,
    chain,
    verified,
    recordCount: history.length,
    latestRecord: history.length > 0 ? history[history.length - 1] : null
  });
}));

app.post('/api/audit', handle(async (req, res) => {
  const { modelId, chain } = req.body;
  if (!modelId) return sendError(res, 'modelId is required', 400);
  const targetChain = chain || 'sepolia';
  if (!chains[targetChain]) return sendError(res, `Invalid chain: ${targetChain}`, 400);

  const id = requirePositiveInt(modelId, 'modelId');

  const { mpt } = getContracts(targetChain);
  const history = await mpt.getModelHistory(id);
  const verified = await mpt.verifyChain(id);
  ok(res, {
    modelId: id,
    chain: targetChain,
    verified,
    recordCount: history.length
  });
}));

// Models

app.get('/api/v2/models/:id', handle(async (req, res) => {
  const chain = req.query.chain || 'sepolia';
  if (!chains[chain]) return sendError(res, `Invalid chain: ${chain}`, 400);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return sendError(res, 'Invalid model ID', 400);

  const { mr } = getContracts(chain);
  const owner = await mr.getModelOwner(id);
  if (owner === ethers.ZeroAddress) {
    return sendError(res, 'Model not found', 404);
  }

  const status = await mr.getModelStatus(id);
  const staked = await mr.isModelStaked(id);
  ok(res, {
    id,
    owner,
    status: getStatusName(status),
    staked
  });
}));

app.get('/api/v2/models', handle(async (req, res) => {
  const requestedChain = req.query.chain;
  const chainList = requestedChain ? [requestedChain] : ['sepolia', 'tbnb'];

  for (const chain of chainList) {
    if (!chains[chain]) return sendError(res, `Invalid chain: ${chain}`, 400);
  }

  const models = [];
  for (const chain of chainList) {
    const entries = getKnownModels(chain);
    for (const entry of entries) {
      const summary = await getModelSummary(chain, entry);
      if (summary) models.push(summary);
    }
  }

  ok(res, { models });
}));

app.get('/api/models', handle(async (req, res) => {
  const requestedChain = req.query.chain;
  const chainList = requestedChain ? [requestedChain] : ['sepolia', 'tbnb'];
  const models = [];
  for (const chain of chainList) {
    if (!chains[chain]) return sendError(res, `Invalid chain: ${chain}`, 400);
    const entries = getKnownModels(chain);
    for (const entry of entries) {
      const summary = await getModelSummary(chain, entry);
      if (summary) models.push(summary);
    }
  }
  ok(res, { models });
}));

app.get('/api/v2/lifecycle', handle(async (req, res) => {
  const secret = requireString(req.query.secret, 'secret', { maxLength: 512 });
  const match = findSeriesBySecret(secret);

  if (!match) {
    return sendError(res, 'No lifecycle found for this secret', 404);
  }

  const versions = await Promise.all(
    (match.entry?.versions || []).map((versionEntry) => enrichLifecycleVersion(versionEntry))
  );

  ok(res, {
    series: match.seriesName,
    storageMode: match.storageMode,
    createdAt: match.entry?.created_at || null,
    versions
  });
}));

app.get('/api/v2/lifecycle/download', handle(async (req, res) => {
  const secret = requireString(req.query.secret, 'secret', { maxLength: 512 });
  const modelHash = requireString(req.query.modelHash, 'modelHash', { maxLength: 128 });
  const match = findSeriesBySecret(secret);

  if (!match) {
    return sendError(res, 'No lifecycle found for this secret', 404);
  }

  const versionEntry = (match.entry?.versions || []).find(
    (item) => String(item?.model_hash) === String(modelHash)
  );
  if (!versionEntry) {
    return sendError(res, 'Requested version was not found for this secret', 404);
  }

  const enriched = await enrichLifecycleVersion(versionEntry);
  if (enriched.ipfsCid) {
    const binary = await fetchIpfsBinary(enriched.ipfsCid);
    if (!binary) {
      return sendError(res, 'Failed to fetch model artifact from IPFS gateways', 502);
    }

    const filename = enriched.artifactFileName || buildLifecycleFilename(match.seriesName, versionEntry, null);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(binary);
  }

  return sendError(res, 'This version does not currently resolve to an IPFS artifact', 404);
}));

// Provenance tracking

app.post('/api/sdk/provenance', handle(async (req, res) => {
  validateWriteAuth(req, res, () => {});
  if (res.headersSent) return;
  const modelId = requirePositiveInt(req.body.modelId, 'modelId');
  const modelName = requireString(req.body.modelName, 'modelName', { maxLength: 256 });
  const targetChain = requireString(req.body.chain || 'sepolia', 'chain', { maxLength: 64 });
  if (!chains[targetChain]) return sendError(res, `Invalid chain: ${targetChain}`, 400);
  const { canonicalMetadata, parsed: parsedMetadata } = parseCanonicalMetadataOrThrow(req.body.canonicalMetadata);
  validateCanonicalMetadataShape(parsedMetadata, { modelName, chain: targetChain });
  const normalizedProof = normalizeZKProof(req.body.zkProof);

  const writableChain = requireWriteChain(targetChain);
  const { mr, mpt, provenanceMode } = getContracts(targetChain);
  if (provenanceMode !== 'verifier-gated') {
    return sendError(res, `Chain ${targetChain} is not configured for verifier-gated provenance`, 503);
  }
  const mrWriter = mr.connect(writableChain.wallet);
  const mptWriter = mpt.connect(writableChain.wallet);

  const owner = await getModelOwnerOrNull(mr, modelId);
  if (!owner) {
    return sendError(res, `Model ${modelId} is not registered on ${targetChain}`, 404);
  }

  const eventType = ACTION_MAP[parsedMetadata.action];
  if (eventType === undefined) {
    return sendError(res, `Unsupported action: ${parsedMetadata.action}`, 400);
  }

  const statementHash = computeStatementHash(canonicalMetadata);
  const nullifier = normalizedProof.publicSignals[0];
  const signalModelId = normalizedProof.publicSignals[1];
  const signalStatementHash = normalizedProof.publicSignals[2];

  if (signalModelId !== BigInt(modelId)) {
    return sendError(res, 'zkProof.publicSignals[1] does not match modelId', 400);
  }

  if (signalStatementHash !== statementHash) {
    return sendError(res, 'zkProof.publicSignals[2] does not match canonicalMetadata statementHash', 400);
  }

  const tx = await mptWriter.addVerifiedRecord(
    modelId,
    eventType,
    canonicalMetadata,
    normalizedProof.pA,
    normalizedProof.pB,
    normalizedProof.pC,
    normalizedProof.publicSignals.map((value) => value.toString())
  );
  await tx.wait();
  ok(res, {
    tx: tx.hash,
    modelId,
    eventType,
    statementHash: statementHash.toString(),
    nullifier: nullifier.toString(),
    proofVerified: true
  });
}));

app.post('/api/register', handle(async (req, res) => {
  validateWriteAuth(req, res, () => {});
  if (res.headersSent) return;
  const { name, description, ipfsCid, checksum, framework, license, chain } = req.body;
  const modelName = requireString(name, 'name', { maxLength: 256 });

  const targetChain = chain || 'sepolia';
  if (!chains[targetChain]) return sendError(res, `Invalid chain: ${targetChain}`, 400);
  const writableChain = requireWriteChain(targetChain);
  const mapKey = `${targetChain}:${modelName}`;

  const { mr } = getContracts(targetChain);
  if (modelNameMap[mapKey]) {
    const existingId = Number(modelNameMap[mapKey]);
    const existingOwner = await getModelOwnerOrNull(mr, existingId);
    if (existingOwner) {
      return ok(res, {
        id: String(existingId),
        numericId: existingId,
        name: modelName,
        description: description || '',
        chain: targetChain,
        owner: existingOwner,
        verified: false,
        existing: true
      });
    }

    delete modelNameMap[mapKey];
    saveModelMap(modelNameMap);
  }

  const writer = mr.connect(writableChain.wallet);
  const registrationArgs = [
    modelName,
    requireString(description, 'description', { optional: true, maxLength: 2048 }) || '',
    requireString(ipfsCid, 'ipfsCid', { optional: true, maxLength: 256 }) || '',
    requireString(checksum, 'checksum', { optional: true, maxLength: 256 }) || '',
    requireString(framework, 'framework', { optional: true, maxLength: 128 }) || 'PyTorch',
    requireString(license, 'license', { optional: true, maxLength: 128 }) || 'MIT'
  ];

  const predictedModelId = Number(await writer.registerModel.staticCall(...registrationArgs));
  const tx = await writer.registerModel(...registrationArgs);
  await tx.wait();

  modelNameMap[mapKey] = predictedModelId;
  saveModelMap(modelNameMap);

  ok(res, {
    id: String(predictedModelId),
    numericId: predictedModelId,
    name: modelName,
    description: description || '',
    chain: targetChain,
    verified: false,
    pending: true,
    txHash: tx.hash
  });
}));

// IPFS

app.post('/api/ipfs/upload/file', handle(async (req, res) => {
  validateWriteAuth(req, res, () => {});
  if (res.headersSent) return;
  const { data, fileName } = req.body;
  if (!data) return sendError(res, 'Missing data field', 400);
  requireString(fileName, 'fileName', { optional: true, maxLength: 256 });

  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET;
  if (!apiKey || !apiSecret) {
    return sendError(res, 'Pinata credentials not configured', 503);
  }

  const buf = Buffer.from(data, 'base64');
  const formData = new FormData();
  formData.append('file', buf, { filename: fileName || 'file' });

  const headers = {
    ...formData.getHeaders(),
    pinata_api_key: apiKey,
    pinata_secret_api_key: apiSecret
  };

  const resp = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers,
    timeout: 15000
  });
  const cid = resp.data.IpfsHash;
  ok(res, { cid, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}` });
}));

app.post('/api/ipfs/upload/metadata', handle(async (req, res) => {
  validateWriteAuth(req, res, () => {});
  if (res.headersSent) return;
  const { metadata } = req.body;
  if (!metadata) return sendError(res, 'Missing metadata field', 400);
  requirePlainObject(metadata, 'metadata');

  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET;
  if (!apiKey || !apiSecret) {
    return sendError(res, 'Pinata credentials not configured', 503);
  }

  const resp = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    { pinataContent: metadata, pinataMetadata: { name: 'metadata' } },
    {
      headers: { pinata_api_key: apiKey, pinata_secret_api_key: apiSecret },
      timeout: 15000
    }
  );

  const cid = resp.data.IpfsHash;
  ok(res, { cid, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}` });
}));

app.get('/api/ipfs/cat/:cid', handle(async (req, res) => {
  const { cid } = req.params;
  if (!cid) return sendError(res, 'Missing CID', 400);

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`
  ];

  for (const url of gateways) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
      return ok(res, { content: Buffer.from(response.data).toString('base64') });
    } catch {}
  }

  return sendError(res, 'Failed to fetch from all gateways', 502);
}));

// Global handlers

app.use((req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
});

app.use((error, req, res, next) => {
  console.error('[UNHANDLED ERROR]', error.message);
  if (!error.isOperational) {
    console.error(error.stack);
  }
  sendError(res, 'Internal server error', 500);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port', PORT));
