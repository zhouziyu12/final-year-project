# AI Provenance System v2 - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Smart Contract API](#smart-contract-api)
4. [REST API Endpoints](#rest-api-endpoints)
5. [Python SDK Reference](#python-sdk-reference)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)

---

## Overview

The AI Provenance System v2 provides:
- **REST API** for backend integration
- **Python SDK** for training scripts
- **Smart Contract API** for direct blockchain interaction

### Smart Contract Architecture (v2)

```
ModelAccessControl ──── (RBAC + blacklist)
      │
      ├── ModelRegistry ──── (state machine + versioning + transfer)
      │         │
      │         ├── ModelProvenanceTracker (lifecycle events)
      │         ├── ModelAuditLog (immutable trail)
      │         ├── ModelNFT (ERC-721)
      │         └── ModelStaking (ETH staking)
      │
      ├── Verifier ──── (ZK proof verification)
      └── RealZKBridge ──── (cross-chain bridge)
```

---

## Base URL

**Development**: `http://127.0.0.1:3000`
**Production**: `https://your-domain.com`

All endpoints are prefixed with `/api`.

---

## Smart Contract API

### ModelAccessControl

**Deployed Addresses:**
- Sepolia: `0x2b10c15a6e9a4FBDe74705AAd497CBf9013a1E77`
- BSC: `0xF6bD1a729eE2Ae2E8bcE5834127E9e518470e517`

**Role Hashes** (keccak256):
```
ADMIN:     0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42
REGISTRAR: 0xd6b769dbdbf190871759edfb79bd17eda0005e1b8c3b6b3f5b480b5604ad5014
AUDITOR:   0xd8994f6d76f930dc5ea8c60e38e6334a87bb8539cc3082ac6828681c33316e3d
MINTER:    0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9
```

**Functions:**
| Function | Description |
|----------|-------------|
| `hasRole(bytes32 role, address account)` | Check if account has role |
| `grantRole(bytes32 role, address account)` | Grant role (ADMIN only) |
| `revokeRole(bytes32 role, address account)` | Revoke role (ADMIN only) |
| `isBlacklisted(address account)` | Check if account is blacklisted |
| `addBlacklist(address account)` | Add to blacklist (ADMIN only) |
| `removeBlacklist(address account)` | Remove from blacklist (ADMIN only) |
| `ADMIN()` / `REGISTRAR()` / `AUDITOR()` / `MINTER()` | Get role hash constants |

---

### ModelRegistry

**Deployed Addresses:**
- Sepolia: `0x0416E82F7463f65E22B9209Aa1866c8895Ff4167`
- BSC: `0x67fe7a49778674C4152fFe875dFb06C002f85E95`

**Model Status Enum:**
```
0: DRAFT      - Initial state
1: ACTIVE     - Operational
2: DEPRECATED - No longer recommended
3: REVOKED    - Permanently revoked
```

**Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `registerModel(name, description, ipfsCid, checksum, framework, license)` | Register new model | REGISTRAR |
| `activateModel(modelId)` | DRAFT → ACTIVE | Owner |
| `deprecateModel(modelId)` | ACTIVE → DEPRECATED | Owner |
| `revokeModel(modelId)` | → REVOKED | Owner or ADMIN |
| `addVersion(modelId, major, minor, patch, versionType, ipfsMetadata, parentHash)` | Add version | Owner |
| `requestTransfer(modelId, newOwner)` | Request ownership transfer | Owner |
| `acceptTransfer(modelId)` | Accept transfer | Recipient |
| `cancelTransfer(modelId)` | Cancel pending transfer | Owner |
| `getModelStatus(modelId)` | Get model status | Public |
| `getModelOwner(modelId)` | Get model owner | Public |
| `getVersionHistory(modelId)` | Get all versions | Public |
| `latestVersionId(modelId)` | Get latest version ID | Public |

---

### ModelProvenanceTracker

**Deployed Addresses:**
- Sepolia: `0xF4DD796B894c79B197E9420350DD59F3602b7095`
- BSC: `0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701`

**Event Types:**
```
0: MODEL_REGISTERED
1: MODEL_ACTIVATED
2: MODEL_DEPRECATED
3: MODEL_REVOKED
4: PARAMETER_UPDATED
5: VERSION_ADDED
6: OWNERSHIP_TRANSFERRED
7: ZK_PROOF_VERIFIED
8: NFT_MINTED
9: NFT_TRANSFERRED
10: NFT_BURNED
```

**Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `addRecord(modelId, eventType, ipfsHash)` | Add provenance record | REGISTRAR |
| `addZKProofRecord(modelId, zkCid)` | Add ZK proof record | REGISTRAR |
| `getModelHistory(modelId)` | Get provenance history | Public |
| `getModelsStatus()` | Get all model statuses | Public |
| `verifyChain(modelId)` | Verify chain integrity | Public |

---

### ModelAuditLog

**Deployed Addresses:**
- Sepolia: `0x584Bb2E2d2E18d99976779C3bd817B69B3A579bc`
- BSC: `0x2Ee33973d1DbE6355E4a12f2e73E55645744DbD8`

**Action Types (18 types):**
```
MODEL_REGISTERED, MODEL_ACTIVATED, MODEL_DEPRECATED, MODEL_REVOKED,
MODEL_UPDATED, VERSION_ADDED, OWNERSHIP_TRANSFER_REQUESTED,
OWNERSHIP_TRANSFER_ACCEPTED, OWNERSHIP_TRANSFER_CANCELLED,
STAKE_DEPOSITED, STAKE_WITHDRAWN, STAKE_SLASHED,
ROLE_GRANTED, ROLE_REVOKED, BLACKLIST_ADDED, BLACKLIST_REMOVED,
NFT_MINTED, NFT_TRANSFERRED, NFT_BURNED
```

**Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `logModelRegistered(modelId, owner, metadata)` | Log model registration | AUDITOR/ADMIN |
| `logStatusChange(modelId, oldStatus, newStatus, operator)` | Log status change | AUDITOR/ADMIN |
| `logVersionAdded(modelId, versionId, operator, metadata)` | Log version add | AUDITOR/ADMIN |
| `logOwnershipTransfer(modelId, from, to, accepted)` | Log transfer | AUDITOR/ADMIN |
| `logStakeChange(modelId, actor, amount, slashed)` | Log staking | AUDITOR/ADMIN |
| `verifyChain(entryId)` | Verify chain from entry ID | Public |
| `getModelAuditTrail(modelId)` | Get audit trail for model | Public |
| `getEntriesByRange(start, end)` | Get entries by range | Public |
| `totalEntries()` | Get total entry count | Public |

---

### ModelNFT

**Deployed Addresses:**
- Sepolia: `0x02Ca5220360eb44c0F8c4FB7AEf732115e46f2a0`
- BSC: `0x8Ddfa02851982E964E713CF0d432Fd050962b662`

**Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `mint(modelId, tokenURI)` | Mint NFT for model | MINTER |
| `burn(tokenId)` | Burn NFT | Owner |
| `ownerOf(tokenId)` | Get token owner | Public |
| `tokenURI(tokenId)` | Get IPFS metadata URI | Public |
| `totalSupply()` | Get total supply | Public |
| `balanceOf(owner)` | Get owner balance | Public |
| `getOwnerTokens(owner)` | Get all tokens for owner | Public |

---

### ModelStaking

**Deployed Addresses:**
- Sepolia: `0x1D263F7f4B5F36b81138E6c809159090bb383a16`
- BSC: `0x2FAaaC1764CDA120405A390de2D6C86c10934397`

**Default Parameters:**
- `minStake`: 0.01 ETH
- `slashRatio`: 50%
- `lockPeriod`: 7 days

**Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `stake(modelId)` | Stake ETH for model | Public (payable) |
| `slash(modelId, reason)` | Slash stake | ADMIN |
| `withdraw(modelId)` | Withdraw stake | Staker |
| `getStakeInfo(modelId)` | Get stake info | Public |
| `getStakeAmount(modelId)` | Get stake amount | Public |

**StakeInfo Struct:**
```solidity
struct StakeInfo {
    address staker;   // Staker address
    uint256 amount;   // Stake amount in wei
    uint256 startTime;// Stake start time
    bool withdrawn;   // Has been withdrawn
    bool slashed;     // Has been slashed
}
```

---

## REST API Endpoints

### 1. Get All Model Series
```
GET /api/series
```

**Response:**
```json
{
  "success": true,
  "series": [
    {
      "name": "ResNet50",
      "secret": "738251",
      "created_at": "2026-03-04T13:10:00Z",
      "version_count": 3,
      "versions": [...]
    }
  ]
}
```

---

### 2. Get Model Lifecycle by Secret
```
GET /api/lifecycle/:secret
```

**Response:**
```json
{
  "success": true,
  "series": "ResNet50",
  "secret": "738251",
  "versions": [...],
  "records": [
    {
      "modelId": 690062533,
      "action": "TRAINING_COMPLETED",
      "ipfsHash": "ipfs://Qm...",
      "sepoliaTxHash": "0x...",
      "bscTxHash": "0x...",
      "trainingMetadata": {
        "accuracy": 0.931,
        "epochs": 10
      }
    }
  ]
}
```

---

### 3. Get All Provenance Records
```
GET /api/history
```

---

### 4. Submit Provenance (SDK Endpoint)
```
POST /api/sdk/provenance
Content-Type: application/json

{
  "modelHash": "0x...",
  "trainingMetadata": {...},
  "action": "TRAINING_COMPLETED",
  "sender": "0x...",
  "commit": "Initial training",
  "versionTag": "v1.0",
  "ipfsHash": "ipfs://Qm..."
}
```

---

## Python SDK Reference

### Class: ProvenanceSDK

```python
sdk = ProvenanceSDK(
    backend_url='http://127.0.0.1:3000',
    pinata_api_key=None,
    pinata_secret_key=None
)
```

**submit_provenance(model_path, model_series, version, commit, sender, training_metadata)**
- Submit model provenance to blockchain
- Returns: `{modelId, secret, ipfsHash, sepoliaTxHash, bscTxHash}`

---

### Class: ModelSecretManager

```python
manager = ModelSecretManager(secrets_dir='model_secrets')
```

**Methods:**
- `get_or_create_secret(model_series)` → str (6-digit secret)
- `record_version(model_series, version, model_id, model_hash)`
- `get_secret(model_series)` → Optional[str]
- `list_series()` → prints all series

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Error Handling

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Code Examples

### Query Model History
```python
import requests

response = requests.get('http://127.0.0.1:3000/api/lifecycle/738251')
data = response.json()

if data['success']:
    print(f"Model Series: {data['series']}")
    print(f"Versions: {len(data['versions'])}")
```

### Complete Training Script
```python
from sdk.python.provenance_sdk import ProvenanceSDK

sdk = ProvenanceSDK()
result = sdk.submit_provenance(
    model_path='artifacts/model_v1.pth',
    model_series='MyModel',
    version='v1.0',
    commit='Initial training',
    sender='0xYourAddress',
    training_metadata={'accuracy': 0.95, 'epochs': 10}
)

print(f"✅ Success! Secret: {result['secret']}")
```

---

## Changelog

### v2.0.0 (2026-03-18)
- Added RBAC access control with 4 roles (ADMIN, REGISTRAR, AUDITOR, MINTER)
- Added model state machine (DRAFT → ACTIVE → DEPRECATED → REVOKED)
- Added semantic version management (MAJOR.MINOR.PATCH)
- Added ownership transfer flow (request-accept-cancel)
- Added immutable audit log with genesis block
- Added model NFT-ization (ERC-721 with transfer cooldown)
- Added staking mechanism with slashing
- Added blacklist for addresses and models
- Multi-chain deployment: Sepolia + BSC Testnet + Somnia
- 50/50 tests passing across 2 networks

### v1.0.0 (2026-03-05)
- Initial release
- Basic provenance tracking on Sepolia + BSC
- ZK proof verification
- Python SDK
- Frontend interface

---

**Last Updated**: 2026-03-18
**Version**: 2.0.0
