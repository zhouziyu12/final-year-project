# AI Provenance System v2 - Test Suite

This directory contains comprehensive tests for the AI Provenance System v2.

## Test Suites

### 1. Multi-Chain Smart Contract Tests (`scripts/test_contracts.cjs`)

Tests all 6 v2 smart contracts across Sepolia and BSC Testnet:
- **ModelAccessControl**: RBAC roles, blacklist management
- **ModelRegistry**: State machine, version control, ownership transfer
- **ModelProvenanceTracker**: Lifecycle events, chain-hash records, ZK proof logs
- **ModelAuditLog**: Immutable audit trail with genesis block verification
- **ModelNFT**: ERC-721 mint, transfer, burn, tokenURI
- **ModelStaking**: ETH staking, querying, slashing

**Run**: `node scripts/test_contracts.cjs`

### 2. ZK Proof System Tests (`test_zk_proof.js`)
Tests zero-knowledge proof generation and verification:
- Circuit file existence (WASM, zkey, verification key)
- Proof generation from test inputs
- Calldata format validation
- Public signal verification

**Run**: `node test_zk_proof.js`

### 3. SDK and Backend Tests (`test_sdk_backend.py`)
Tests Python SDK and backend API integration:
- SDK module imports
- Backend API endpoints (/api/series, /api/history)
- Secret manager functionality
- File structure validation
- IPFS configuration

**Run**: `python test_sdk_backend.py`

## Running All Tests

### Windows (PowerShell)
```powershell
.\run_all_tests.ps1
```

### Manual Execution
```bash
# v2 Smart Contracts (main test suite - 50 tests across 2 chains)
node scripts/test_contracts.cjs

# ZK Proof System
node test_zk_proof.js

# SDK and Backend
python test_sdk_backend.py
```

## Test Results

After running tests, results are saved to:

- `test_results.json` - v2 contract test results (50/50)
- `results_zk_proof.json` - ZK proof test results
- `results_sdk_backend.json` - SDK/backend test results

## v2 Test Coverage

| Contract | Test Count | Networks |
|----------|-----------|----------|
| ModelAccessControl | 5 | Sepolia + BSC |
| ModelRegistry | 7 | Sepolia + BSC |
| ProvenanceTracker | 3 | Sepolia + BSC |
| ModelAuditLog | 3 | Sepolia + BSC |
| ModelNFT | 5 | Sepolia + BSC |
| ModelStaking | 3 | Sepolia + BSC |
| **Total** | **50** | **2 chains** |

## Deployed Contract Addresses

### Sepolia Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0x2b10c15a6e9a4FBDe74705AAd497CBf9013a1E77` |
| ModelRegistry | `0x0416E82F7463f65E22B9209Aa1866c8895Ff4167` |
| ModelProvenanceTracker | `0xF4DD796B894c79B197E9420350DD59F3602b7095` |
| ModelAuditLog | `0x584Bb2E2d2E18d99976779C3bd817B69B3A579bc` |
| ModelNFT | `0x02Ca5220360eb44c0F8c4FB7AEf732115e46f2a0` |
| ModelStaking | `0x1D263F7f4B5F36b81138E6c809159090bb383a16` |

### BSC Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0xF6bD1a729eE2Ae2E8bcE5834127E9e518470e517` |
| ModelRegistry | `0x67fe7a49778674C4152fFe875dFb06C002f85E95` |
| ModelProvenanceTracker | `0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701` |
| ModelAuditLog | `0x2Ee33973d1DbE6355E4a12f2e73E55645744DbD8` |
| ModelNFT | `0x8Ddfa02851982E964E713CF0d432Fd050962b662` |
| ModelStaking | `0x2FAaaC1764CDA120405A390de2D6C86c10934397` |

All addresses are saved in `address_v2_multi.json` in the project root.

## Prerequisites

### For Smart Contract Tests
- Node.js 16+
- `ethers` package (installed via `npm install`)
- Valid `PRIVATE_KEY` in `.env`
- Internet connection for RPC access

### For ZK Proof Tests
- Compiled circuit files (`build/` directory)
- `snarkjs` installed globally or in project

### For SDK Tests
- Python 3.8+
- Backend server running on `http://127.0.0.1:3000`
- Required Python packages: `requests`, `python-dotenv`

## Troubleshooting

### "Backend not running"
Start the backend server:
```bash
node server.js
```

### "Circuit files not found"
Compile the circuit:
```bash
circom circuit.circom --r1cs --wasm --sym -o build
```

### "Module not found" (Python)
Install dependencies:
```bash
pip install requests python-dotenv
```

## Test Status Codes

- ✅ **PASS** - Test passed successfully
- ❌ **FAIL** - Test failed
- ⚠️ **WARN** - Test passed with warnings
- **SKIP** - Test skipped (dependency not met)

## Expected Results

A healthy system should show:
- All RPC connections successful
- All 50 contract tests passing
- All circuit files present
- Backend API responding
- Wallet balances sufficient for transactions
- ZK proof generation < 5 seconds

---

**Last Updated**: 2026-03-18
**Version**: 2.0.0
