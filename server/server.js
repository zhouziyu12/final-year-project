import express from 'express';
import { ethers } from 'ethers';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Response helpers

const ok = (res, data) => res.status(200).json({ success: true, ...data });

const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ success: false, error: message });
};

const handle = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, error.message);
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
app.use(express.json({ limit: '50mb' }));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ADDR_FILE = path.join(PROJECT_ROOT, 'address_v2_multi.json');
const MODEL_MAP_FILE = path.join(PROJECT_ROOT, 'model_name_map.json');

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

const modelNameMap = loadModelMap();

const SEPOLIA_RPC =
  process.env.SEPOLIA_RPC ||
  process.env.SEPOLIA_URL ||
  (process.env.INFURA_API_KEY
    ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    : 'https://rpc.sepolia.org');
const TBNB_RPC = process.env.BNB_TESTNET_URL || 'https://bsc-testnet.publicnode.com';

const pk = process.env.PRIVATE_KEY;
if (!pk) {
  console.error('PRIVATE_KEY not set in environment');
  process.exit(1);
}

const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const bnbProvider = new ethers.JsonRpcProvider(TBNB_RPC);
const sepWallet = new ethers.Wallet(pk, sepProvider);
const bnbWallet = new ethers.Wallet(pk, bnbProvider);

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

const MPT_ABI = [
  'function addRecord(uint256 _modelId, uint8 _eventType,' +
    ' string calldata _ipfsMetadata) external returns (uint256)',
  'function addZKProofRecord(uint256 _modelId, string calldata _zkProofCid)' +
    ' external returns (uint256)',
  'function getModelHistory(uint256 _modelId) view returns' +
    ' (tuple(uint256,uint256,uint8,string,uint256,address,bytes32,bytes32)[])',
  'function verifyChain(uint256 _modelId) view returns (bool)',
  'function modelChainHead(uint256 _modelId) view returns (bytes32)',
  'function modelBlacklist(uint256 _modelId) view returns (bool)',
  'event RecordAdded(uint256 indexed recordId,uint256 indexed modelId,uint8 indexed eventType,address operator)'
];

const MAL_ABI = [
  'event AuditEntryAdded(uint256 indexed entryId,uint8 indexed action,address indexed actor,uint256 targetId)'
];

function getContracts(chain) {
  const c = chains[chain];
  const a = c.addr.contracts;
  return {
    mr: new ethers.Contract(a.ModelRegistry, MR_ABI, c.wallet),
    mac: new ethers.Contract(a.ModelAccessControl, MAC_ABI, c.wallet),
    mpt: new ethers.Contract(a.ModelProvenanceTracker, MPT_ABI, c.wallet),
    mal: new ethers.Contract(a.ModelAuditLog, MAL_ABI, c.wallet)
  };
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

async function getModelSummary(chain, entry) {
  const { mr } = getContracts(chain);
  try {
    const owner = await mr.getModelOwner(entry.id);
    if (owner === ethers.ZeroAddress) {
      return null;
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
  ok(res, { status: 'ok', timestamp: Date.now() });
});

app.get('/api/v2/status', handle(async (req, res) => {
  const result = {};
  let totalModels = 0;
  for (const chain of ['sepolia', 'tbnb']) {
    const c = chains[chain];
    const block = await c.provider.getBlockNumber();
    const balance = await c.provider.getBalance(c.wallet.address);
    const knownModels = getKnownModels(chain);
    totalModels += knownModels.length;
    result[chain] = {
      blockNumber: block,
      connected: true,
      balance: ethers.formatEther(balance),
      knownModels: knownModels.length
    };
  }
  ok(res, {
    chains: result,
    totalModels,
    totalAudits: totalModels,
    zkReady: true
  });
}));

app.get('/api/status', handle(async (req, res) => {
  const payload = await new Promise((resolve, reject) => {
    const mockRes = {
      status() {
        return this;
      },
      json(data) {
        resolve(data);
      }
    };
    handle(async (_req, realRes) => {
      const result = {};
      let totalModels = 0;
      for (const chain of ['sepolia', 'tbnb']) {
        const c = chains[chain];
        const block = await c.provider.getBlockNumber();
        const balance = await c.provider.getBalance(c.wallet.address);
        const knownModels = getKnownModels(chain);
        totalModels += knownModels.length;
        result[chain] = {
          blockNumber: block,
          connected: true,
          balance: ethers.formatEther(balance),
          knownModels: knownModels.length
        };
      }
      ok(realRes, {
        chains: result,
        totalModels,
        totalAudits: totalModels,
        zkReady: true
      });
    })({}, mockRes, reject);
  });
  res.json(payload);
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

  const id = parseInt(modelId, 10);
  if (Number.isNaN(id) || id <= 0) return sendError(res, 'Invalid model ID', 400);

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

// Provenance tracking

app.post('/api/sdk/provenance', handle(async (req, res) => {
  const {
    modelId,
    modelHash,
    action,
    sender,
    ipfsHash,
    metadataCid,
    chain,
    modelName,
    versionTag,
    trainingMetadata
  } = req.body;

  if (!modelId && !modelName) {
    return sendError(res, 'Either modelId or modelName is required', 400);
  }

  const targetChain = chain || 'sepolia';
  if (!chains[targetChain]) return sendError(res, `Invalid chain: ${targetChain}`, 400);
  if (!action || !ACTION_MAP[action]) {
    if (action !== 'REGISTERED') {
      return sendError(res, `Unsupported action: ${action}`, 400);
    }
  }

  const { mr, mpt, mac } = getContracts(targetChain);

  let actualModelId = modelId ? Number(modelId) : null;
  let isNewModel = false;

  if (modelName) {
    const mapKey = `${targetChain}:${modelName}`;
    if (modelNameMap[mapKey]) {
      actualModelId = Number(modelNameMap[mapKey]);
      console.log(`[PROVENANCE] Using existing model ${actualModelId} for "${modelName}"`);
    } else {
      const registrarRole = await mac.REGISTRAR();
      const canRegister = await mac.hasRole(registrarRole, chains[targetChain].wallet.address);
      if (!canRegister) {
        return sendError(res, 'Backend wallet does not have REGISTRAR role', 403);
      }

      const registerTx = await mr.registerModel(
        modelName,
        'Auto-registered',
        ipfsHash || '',
        modelHash || '',
        'PyTorch',
        'MIT'
      );
      const receipt = await registerTx.wait();
      for (const log of receipt.logs) {
        try {
          const parsed = mr.interface.parseLog({ topics: log.topics, data: log.data });
          if (parsed.name === 'ModelRegistered') {
            actualModelId = Number(parsed.args[0]);
            break;
          }
        } catch {}
      }

      if (!actualModelId) {
        return sendError(res, 'Failed to determine registered model ID', 500);
      }

      modelNameMap[mapKey] = actualModelId;
      saveModelMap(modelNameMap);
      isNewModel = true;
      console.log(`[PROVENANCE] Registered new model ${actualModelId} for "${modelName}"`);
    }
  }

  if (!actualModelId || actualModelId <= 0) {
    return sendError(res, 'A valid modelId could not be resolved', 400);
  }

  const eventType = ACTION_MAP[action];
  if (eventType === undefined) {
    return sendError(res, `Unsupported action: ${action}`, 400);
  }

  const metadata = {
    modelHash,
    ipfsHash,
    metadataCid,
    action,
    sender,
    timestamp: Date.now(),
    versionTag,
    trainingMetadata: trainingMetadata || null
  };

  const tx = await mpt.addRecord(actualModelId, eventType, JSON.stringify(metadata));
  await tx.wait();
  ok(res, { tx: tx.hash, modelId: actualModelId, eventType, isNewModel });
}));

app.post('/api/register', handle(async (req, res) => {
  const { name, description, ipfsCid, checksum, framework, license, chain } = req.body;
  if (!name) return sendError(res, 'name is required', 400);

  const targetChain = chain || 'sepolia';
  if (!chains[targetChain]) return sendError(res, `Invalid chain: ${targetChain}`, 400);

  const { mr } = getContracts(targetChain);
  const tx = await mr.registerModel(
    name,
    description || '',
    ipfsCid || '',
    checksum || '',
    framework || 'PyTorch',
    license || 'MIT'
  );
  const receipt = await tx.wait();

  let modelId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = mr.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed.name === 'ModelRegistered') {
        modelId = Number(parsed.args[0]);
        break;
      }
    } catch {}
  }

  if (!modelId) return sendError(res, 'Registration succeeded but model ID was not found', 500);

  modelNameMap[`${targetChain}:${name}`] = modelId;
  saveModelMap(modelNameMap);

  ok(res, {
    id: String(modelId),
    numericId: modelId,
    name,
    description: description || '',
    chain: targetChain,
    verified: false
  });
}));

// IPFS

app.post('/api/ipfs/upload/file', handle(async (req, res) => {
  const { data, fileName } = req.body;
  if (!data) return sendError(res, 'Missing data field', 400);

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

  const resp = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, { headers });
  const cid = resp.data.IpfsHash;
  ok(res, { cid, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}` });
}));

app.post('/api/ipfs/upload/metadata', handle(async (req, res) => {
  const { metadata } = req.body;
  if (!metadata) return sendError(res, 'Missing metadata field', 400);

  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET;
  if (!apiKey || !apiSecret) {
    return sendError(res, 'Pinata credentials not configured', 503);
  }

  const resp = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    { pinataContent: metadata, pinataMetadata: { name: 'metadata' } },
    { headers: { pinata_api_key: apiKey, pinata_secret_api_key: apiSecret } }
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
