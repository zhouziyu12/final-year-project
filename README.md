# AI Model Provenance System

A multi-chain AI model provenance platform for model registration, lifecycle tracking, audit verification, IPFS-backed metadata, NFT and staking extensions, and zero-knowledge proof bridging.

## System Layout

The repository has five core parts:

- `contracts/`: Solidity contracts for access control, registration, provenance, audit, NFT, staking, and ZK verification.
- `server/`: Express backend for REST APIs, write authentication, blockchain read/write orchestration, and Pinata uploads.
- `client/`: React + Vite frontend for overview, training, registry, audit, system status, and NFT pages.
- `sdk/python/`: Python SDK for hashing artifacts, generating ZK proofs, uploading to IPFS, and submitting provenance.
- `zk/`: Circom circuit, wasm, zkeys, verification key, and verifier export flow.

## Verified State

Verified locally on `2026-04-14`:

- `npx hardhat compile --show-stack-traces`
- `cd client && npm run lint`
- `cd client && npm run build`
- `node tests/test_zk_proof.js`
- `python tests/test_sdk_backend.py`
- `node tests/test_smart_contracts.js`

The circuit now compiles successfully on native Windows without relying on WSL.

## Repository Structure

```text
ai-project/
  client/                  React frontend
  contracts/               Solidity contracts
  docs/                    Project documentation
  scripts/                 Deployment and test scripts
  sdk/python/              Python SDK
  server/                  REST backend
  tests/                   Integration and regression tests
  zk/                      Circuit and proving assets
  address_v2_multi.json    Multi-chain deployment addresses
  model_name_map.json      Backend-side model name cache
```

## Contracts

Core contracts:

- `ModelAccessControl.sol`
- `ModelRegistry.sol`
- `ProvenanceTracker.sol` (`ModelProvenanceTracker`)
- `ModelAuditLog.sol`
- `ModelNFT.sol`
- `ModelStaking.sol`
- `Verifier.sol`
- `RealZKBridge.sol`

Deployment addresses are stored in [address_v2_multi.json](./address_v2_multi.json) for:

- `sepolia`
- `tbnb`

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd client && npm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env` and populate at least:

- `PRIVATE_KEY`
- `WRITE_API_KEY`
- `VITE_WRITE_API_KEY`
- `PINATA_API_KEY`
- `PINATA_SECRET`

If `PRIVATE_KEY` is missing, the backend runs in read-only mode.

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Start the Backend

```bash
node server/server.js
```

Default API address: `http://127.0.0.1:3000`

### 5. Start the Frontend

```bash
cd client
npm run dev
```

### 6. Run Regression Tests

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Common Commands

Contract compile:

```bash
npx hardhat compile --show-stack-traces
```

Frontend build:

```bash
cd client
npm run build
```

Backend syntax check:

```bash
node --check server/server.js
```

Python syntax check:

```bash
python -m py_compile sdk/python/provenance_sdk.py sdk/python/model_secret_manager.py tests/test_sdk_backend.py
```

Native Windows circuit rebuild:

```bash
cd zk
cmd /c ..\node_modules\.bin\circom2.cmd circuit.circom --r1cs --wasm --sym -o build -l ..\node_modules
```

## Main API Surface

Read endpoints:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/models/:id`
- `GET /api/v2/audit/recent`
- `GET /api/v2/audit/verify/:id`
- `GET /api/ipfs/cat/:cid`

Write endpoints:

- `POST /api/register`
- `POST /api/sdk/provenance`
- `POST /api/audit`
- `POST /api/ipfs/upload/file`
- `POST /api/ipfs/upload/metadata`

Legacy compatibility routes:

- `GET /api/status`
- `GET /api/models`

See [docs/API.md](./docs/API.md) for details.

## Documentation

- [docs/API.md](./docs/API.md)
- [docs/DEPLOY_GUIDE.md](./docs/DEPLOY_GUIDE.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/FRONTEND_RESTRUCTURE_PLAN.md](./docs/FRONTEND_RESTRUCTURE_PLAN.md)
- [docs/USER_MANUAL.md](./docs/USER_MANUAL.md)
- [docs/ZK_GUIDE.md](./docs/ZK_GUIDE.md)
- [tests/README.md](./tests/README.md)
- [client/README.md](./client/README.md)

## License

MIT
