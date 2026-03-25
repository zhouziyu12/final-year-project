import express from 'express';
import { ethers } from 'ethers';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
const corsOpts = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ]
};
app.use(cors(corsOpts));

// Use relative paths (relative to project root, not server directory)
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ADDR_FILE = path.join(PROJECT_ROOT, 'address_v2_multi.json');
const MODEL_MAP_FILE = path.join(PROJECT_ROOT, 'model_name_map.json');

const addrs = JSON.parse(fs.readFileSync(ADDR_FILE, 'utf8'));

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

const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/8a031362da754c57814a57aebbd2e9db';
const TBNB_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545';

const pk = process.env.PRIVATE_KEY;
if (!pk) { console.error('PRIVATE_KEY not set'); process.exit(1); }

const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const bnbProvider = new ethers.JsonRpcProvider(TBNB_RPC);
const sepWallet = new ethers.Wallet(pk, sepProvider);
const bnbWallet = new ethers.Wallet(pk, bnbProvider);

const chains = {
  sepolia: { provider: sepProvider, wallet: sepWallet, addr: addrs.sepolia },
  tbnb: { provider: bnbProvider, wallet: bnbWallet, addr: addrs.tbnb }
};

// ModelRegistry ABI (from ModelRegistry.sol)
const MR_ABI = [
  'function registerModel(string memory _name, string memory _description,' +
  ' string memory _ipfsCid, string memory _checksum, string memory _framework,' +
  ' string memory _license) external returns (uint256)',
  'function activateModel(uint256 _id) external',
  'function getModelOwner(uint256 _id) view returns (address)',
  'function getModelStatus(uint256 _id) view returns (uint8)',
  'function isModelStaked(uint256 _id) view returns (bool)',
  'function accessControl() view returns (address)',
  'event ModelRegistered(uint256 indexed id, address indexed owner)',
  'event VersionAdded(uint256 indexed modelId, uint256 indexed versionId,' +
  ' uint8 major, uint8 minor, uint8 patch, uint8 versionType)'
];

// ModelAccessControl ABI
const MAC_ABI = [
  'function hasRole(bytes32 role, address addr) view returns (bool)',
  'function grantRole(bytes32 role, address addr)'
];

// ModelProvenanceTracker ABI (from ProvenanceTracker.sol)
const MPT_ABI = [
  'function addRecord(uint256 _modelId, uint8 _eventType,' +
  ' string calldata _ipfsMetadata) external returns (uint256)',
  'function addZKProofRecord(uint256 _modelId, string calldata _zkProofCid)' +
  ' external returns (uint256)',
  'function getModelHistory(uint256 _modelId) view returns' +
  ' (tuple(uint256,uint256,uint8,string,uint256,address,bytes32,bytes32)[])',
  'function verifyChain(uint256 _modelId) view returns (bool)',
  'function modelChainHead(uint256 _modelId) view returns (bytes32)',
  'function modelBlacklist(uint256 _modelId) view returns (bool)'
];

// ModelAuditLog ABI
const MAL_ABI = [
  'event ModelRegistered(uint256 modelId, address owner, string name,' +
  ' uint256 version, uint256 timestamp)',
  'event RoleGranted(bytes32 role, address account, address sender)',
  'event RoleRevoked(bytes32 role, address account, address sender)',
  'event TrainingCompleted(uint256 modelId, string metrics, uint256 timestamp)',
  'event ModelUpdated(uint256 modelId, string hash, uint256 version)',
  'event ProvenanceRecorded(uint256 modelId, string hash,' +
  ' string action, address sender)',
  'event NFTMinted(uint256 modelId, address owner, uint256 tokenId)',
  'event Staked(uint256 modelId, address staker, uint256 amount)',
  'event Withdrawn(uint256 modelId, address staker, uint256 amount)'
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

// BigInt helper - converts bigint to string for JSON
const bigintReplacer = (k, v) => typeof v === 'bigint' ? v.toString() : v;
const safeJson = (data) => JSON.parse(JSON.stringify(data, bigintReplacer));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/v2/status', async (req, res) => {
  try {
    const result = {};
    for (const chain of ['sepolia', 'tbnb']) {
      const c = chains[chain];
      const block = await c.provider.getBlockNumber();
      result[chain] = { blockNumber: block, connected: true };
    }
    res.json({ success: true, chains: result });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/v2/audit/recent', async (req, res) => {
  try {
    const chain = req.query.chain || 'sepolia';
    const limit = parseInt(req.query.limit) || 10;
    const { mal } = getContracts(chain);
    const addr = chains[chain].addr.contracts.ModelAuditLog;
    const fromBlock = await chains[chain].provider.getBlockNumber() - 1000;
    const filter = { address: addr, fromBlock, toBlock: 'latest' };
    const logs = await chains[chain].provider.getLogs(filter);
    const events = logs.map(l => {
      try {
        const parsed = mal.interface.parseLog(l);
        const args = {};
        if (parsed.args) {
          for (let i = 0; i < parsed.args.length; i++) {
            args[i] = String(parsed.args[i]);
          }
        }
        return {
          blockNumber: l.blockNumber,
          blockHash: l.blockHash,
          transactionHash: l.transactionHash,
          contractAddress: l.address,
          event: parsed.name,
          args
        };
      } catch { return null; }
    }).filter(Boolean).slice(-limit);
    res.json({ success: true, events });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/v2/models/:id', async (req, res) => {
  try {
    const chain = req.query.chain || 'sepolia';
    const id = parseInt(req.params.id);
    const { mr } = getContracts(chain);
    try {
      const owner = await mr.getModelOwner(id);
      if (owner === '0x0000000000000000000000000000000000000000') {
        return res.json({ success: false, error: 'Model not found' });
      }
      const status = await mr.getModelStatus(id);
      const staked = await mr.isModelStaked(id);
      const statusNames = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'REVOKED'];
      res.json({ success: true, id, owner, status: statusNames[status], staked });
    } catch {
      res.json({ success: false, error: 'Model not found' });
    }
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/sdk/provenance', async (req, res) => {
  try {
    const { modelId, modelHash, action, sender, ipfsHash, metadataCid, chain, modelName, versionTag } = req.body;
    const c = chain || 'sepolia';
    const { mr, mpt } = getContracts(c);

    const actionMap = { 'REGISTERED': 0, 'ACTIVATED': 1, 'UPDATED': 2, 'DEPRECATED': 3, 'REVOKED': 4, 'VERSION_RELEASED': 5, 'TRANSFERRED': 6, 'STAKED': 7, 'UNSTAKED': 8, 'SLASHED': 9, 'ZK_PROOF_VERIFIED': 10 };
    const eventType = actionMap[action] ?? 0;
    const metaStr = JSON.stringify({ modelHash, ipfsHash, metadataCid, action, sender, timestamp: Date.now(), versionTag });

    let actualModelId = modelId;
    let isNewModel = false;

    if (modelName) {
      const mapKey = `${c}:${modelName}`;
      if (modelNameMap[mapKey]) {
        actualModelId = modelNameMap[mapKey];
        console.log(`[PROVENANCE] Using existing model ${actualModelId} for "${modelName}"`);
      } else {
        try {
          const regTx = await mr.registerModel(modelName, 'Auto-registered', ipfsHash || '', modelHash, 'PyTorch', 'MIT');
          const receipt = await regTx.wait();
          for (const log of receipt.logs) {
            try {
              const parsed = mr.interface.parseLog({ topics: log.topics, data: log.data });
              if (parsed.name === 'ModelRegistered') {
                actualModelId = Number(parsed.args[0]);
                break;
              }
            } catch {}
          }
          if (actualModelId === modelId) {
            for (let id = 999; id > 0; id--) {
              try {
                const h = await mpt.getModelHistory(id);
                if (h.length === 0) { actualModelId = id; break; }
              } catch {}
            }
          }
          modelNameMap[mapKey] = actualModelId;
          saveModelMap(modelNameMap);
          isNewModel = true;
          console.log(`[PROVENANCE] Registered new model ${actualModelId} for "${modelName}"`);
        } catch (e) {
          console.log(`[PROVENANCE] Register failed, using modelId ${modelId}: ${e.message.slice(0,100)}`);
        }
      }
    }

    const tx = await mpt.addRecord(actualModelId, eventType, metaStr);
    await tx.wait();
    res.json({ success: true, tx: tx.hash, modelId: actualModelId, eventType, isNewModel });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/ipfs/upload/file', async (req, res) => {
  try {
    const { data, fileName } = req.body;
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_SECRET;
    if (!apiKey || !apiSecret) {
      return res.json({ success: false, error: 'Pinata credentials not set' });
    }
    const buf = Buffer.from(data, 'base64');
    const formData = new FormData();
    formData.append('file', buf, { filename: fileName || 'file' });
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const hdrs = formData.getHeaders();
    const headers = { ...hdrs, pinata_api_key: apiKey, pinata_secret_api_key: apiSecret };
    const res2 = await axios.post(pinataUrl, formData, { headers });
    const cid = res2.data.IpfsHash;
    const gatewayUrl = 'https://gateway.pinata.cloud/ipfs/' + cid;
    res.json({ success: true, cid, gatewayUrl });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/ipfs/upload/metadata', async (req, res) => {
  try {
    const { metadata } = req.body;
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_SECRET;
    if (!apiKey || !apiSecret) {
      return res.json({ success: false, error: 'Pinata credentials not set' });
    }
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const body = { pinataContent: metadata, pinataMetadata: { name: 'metadata' } };
    const headers = { pinata_api_key: apiKey, pinata_secret_api_key: apiSecret };
    const res2 = await axios.post(pinataUrl, body, { headers });
    const cid = res2.data.IpfsHash;
    const gatewayUrl = 'https://gateway.pinata.cloud/ipfs/' + cid;
    res.json({ success: true, cid, gatewayUrl });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/ipfs/cat/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const gateways = [
      'https://gateway.pinata.cloud/ipfs/' + cid,
      'https://ipfs.io/ipfs/' + cid
    ];
    let content = null;
    for (const url of gateways) {
      try {
        const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
        content = Buffer.from(r.data).toString('base64');
        break;
      } catch {}
    }
    if (content) res.json({ success: true, content });
    else res.json({ success: false, error: 'Failed to fetch from all gateways' });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port', PORT));
