# AI Model Provenance System

A multi-chain AI model provenance platform with smart-contract-backed lifecycle tracking, audit logging, NFT minting, staking, IPFS storage, and zero-knowledge proof support.

## Overview

The repository contains:

- Solidity contracts for access control, model registration, provenance, audit logs, NFTs, staking, and ZK verification
- A Node.js backend that exposes REST APIs and bridges the contracts to the SDK and frontend
- A React + Vite frontend for browsing models and audit records
- A Python SDK for submitting provenance records from training pipelines
- A Circom/snarkjs ZK proof workflow under `zk/`

## Current Status

Latest local verification on April 14, 2026:

- `npx hardhat compile` passes
- `cd client && npm run build` passes
- `powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1` passes

Test suites currently passing:

- Smart contract suite across Sepolia and BSC Testnet
- Standalone ZK proof generation flow
- SDK and backend integration flow

## Repository Layout

```text
ai-project/
  contracts/              Solidity contracts
  scripts/                Deployment and contract test scripts
  server/                 Express backend
  client/                 React frontend
  sdk/python/             Python SDK and secret manager
  tests/                  Test runners and result summaries
  zk/                     Circom circuit, proving keys, and build artifacts
  docs/                   Project documentation
```

## Smart Contracts

Main contracts:

- `ModelAccessControl.sol`
- `ModelRegistry.sol`
- `ProvenanceTracker.sol` (contract name: `ModelProvenanceTracker`)
- `ModelAuditLog.sol`
- `ModelNFT.sol`
- `ModelStaking.sol`
- `Verifier.sol`
- `RealZKBridge.sol`

## Deployed Addresses

Contract addresses are stored in [`address_v2_multi.json`](./address_v2_multi.json).

Networks currently tracked:

- `sepolia`
- `tbnb`
- `somnia`

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

### Install Dependencies

```bash
npm install
cd client && npm install
cd ..
```

### Compile Contracts

```bash
npx hardhat compile
```

### Start the Backend

```bash
node server/server.js
```

### Start the Frontend

```bash
cd client
npm run dev
```

### Run the Full Test Flow

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Build Commands

Backend sanity check:

```bash
node --check server/server.js
```

Frontend production build:

```bash
cd client
npm run build
```

Python syntax check:

```bash
python -m py_compile sdk/python/provenance_sdk.py sdk/python/model_secret_manager.py tests/test_sdk_backend.py
```

## API Summary

Main backend endpoints:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/models/:id`
- `GET /api/v2/audit/recent`
- `GET /api/v2/audit/verify/:id`
- `POST /api/sdk/provenance`
- `POST /api/register`
- `POST /api/audit`
- `POST /api/ipfs/upload/file`
- `POST /api/ipfs/upload/metadata`
- `GET /api/ipfs/cat/:cid`

Legacy compatibility routes still exposed:

- `GET /api/status`
- `GET /api/models`

See [`docs/API.md`](./docs/API.md) for details.

## Zero-Knowledge Workflow

The ZK assets live under `zk/`:

- `zk/circuit.circom`
- `zk/build/circuit_js/circuit.wasm`
- `zk/circuit_final.zkey`
- `zk/verification_key.json`

See [`docs/ZK_GUIDE.md`](./docs/ZK_GUIDE.md) for the full flow.

## Documentation

- [`docs/API.md`](./docs/API.md)
- [`docs/DEPLOY_GUIDE.md`](./docs/DEPLOY_GUIDE.md)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- [`docs/USER_MANUAL.md`](./docs/USER_MANUAL.md)
- [`docs/ZK_GUIDE.md`](./docs/ZK_GUIDE.md)
- [`tests/README.md`](./tests/README.md)
- [`tests/TEST_SUMMARY.md`](./tests/TEST_SUMMARY.md)

## License

MIT
