# AI Model Provenance System

A working AI model provenance prototype for model registration, lifecycle tracking, audit verification, IPFS-backed metadata, backend-mediated contract writes, and local zero-knowledge proof generation.

Important scope note:

- model registration, provenance tracking, backend relay, frontend audit/registry views, and local ZK tooling are implemented today
- bridge-oriented cross-chain and some advanced contract features exist in the codebase but are only partially integrated into the main runtime path

## Current ZKP Path

The current codebase already supports a real ZKP-oriented training submission flow:

1. the Python SDK hashes the model artifact
2. it resolves or auto-registers the on-chain model ID
3. it generates a Groth16 proof locally from `secret`, `modelId`, and `messageHash`
4. it exports proof artifacts and Solidity calldata
5. it uploads the model artifact to IPFS when Pinata credentials are available
6. it submits provenance through the backend, carrying ZK-derived metadata inside `trainingMetadata`

What is true today:

- local proof generation is implemented and tested
- local Groth16 verification is implemented and tested
- the SDK includes ZK-derived fields such as `message_hash`, `zk_public_signals`, and `zk_calldata` in the provenance payload
- the backend stores that data through the normal provenance record flow

What is not the default runtime path today:

- the backend does not currently route the SDK flow through `addZKProofRecord(...)`
- the backend does not currently enforce verifier-gated bridge settlement before accepting a provenance record
- `RealZKBridge.sol` and `Verifier.sol` are present and useful for the ZKP architecture, but they are not yet the default application write path

## Current System Layout

The repository has five core parts:

- `contracts/`: Solidity contracts for access control, registration, provenance, audit, NFT, staking, and bridge/ZK-related components.
- `server/`: Express backend for REST APIs, write authentication, blockchain read/write orchestration, and Pinata uploads.
- `client/`: React + Vite frontend for overview, training, registry, audit, system status, and NFT presentation pages.
- `sdk/python/`: Python SDK for hashing artifacts, generating ZK proofs, uploading to IPFS, and submitting provenance.
- `zk/`: Circom circuit, wasm, zkeys, verification key, and verifier export flow.

For the code-verified current scope, see:

- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/CURRENT_ARCHITECTURE.md](./docs/CURRENT_ARCHITECTURE.md)

## Verified State

Verified locally on `2026-04-14`:

- `node tests/test_zk_proof.js`
- `python tests/test_sdk_backend.py`
- `npx hardhat compile --show-stack-traces`
- `cd client && npm run lint`
- `cd client && npm run build`
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

Current recorded deployment addresses are stored in [address_v2_multi.json](./address_v2_multi.json) for:

- `sepolia`
- `tbnb`

Note:

- the repo contains `Verifier.sol` and `RealZKBridge.sol`
- the current active address file and default deployment path focus on the six main application contracts

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

ZKP regression:

```bash
node tests/test_zk_proof.js
```

SDK/backend regression:

```bash
python tests/test_sdk_backend.py
```

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

Standalone proof smoke test:

```bash
node test_zk_standalone.js
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

- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/CURRENT_ARCHITECTURE.md](./docs/CURRENT_ARCHITECTURE.md)
- [docs/API.md](./docs/API.md)
- [docs/DEPLOY_GUIDE.md](./docs/DEPLOY_GUIDE.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/USER_MANUAL.md](./docs/USER_MANUAL.md)
- [docs/ZK_GUIDE.md](./docs/ZK_GUIDE.md)
- [tests/README.md](./tests/README.md)
- [client/README.md](./client/README.md)

## License

MIT
