# AI Model Provenance System

A working AI model provenance prototype for model registration, lifecycle tracking, audit verification, IPFS-backed artifacts, verifier-gated contract writes, and local zero-knowledge proof generation.

Important scope note:

- model registration, verifier-gated provenance tracking, backend relay, frontend audit/registry views, and local ZK tooling are implemented today
- bridge-oriented cross-chain features still exist in the codebase, but `RealZKBridge.sol` is not the default provenance entry path

## Current ZKP Path

The current codebase now supports a verifier-gated training submission flow:

1. the Python SDK hashes the model artifact
2. it resolves or auto-registers the on-chain model ID
3. it uploads the model artifact to IPFS
4. it builds stable canonical metadata and derives `statementHash = keccak256(bytes(canonicalMetadata)) % field`
5. it generates a Groth16 proof locally from `secret`, `modelId`, and `statementHash`
6. it submits provenance through the backend using `canonicalMetadata + zkProof`

What is true today:

- local proof generation is implemented and tested
- local Groth16 verification is implemented and tested
- the SDK binds proof generation to the exact canonical metadata string that will be written on-chain
- the backend recomputes `statementHash` before writing
- successful writes go through `ZKProvenanceTracker.addVerifiedRecord(...)`
- submissions without valid proof material are rejected before provenance anchoring

What is not the default runtime path today:

- `RealZKBridge.sol` remains in the repository, but it is not the default application write path
- raw proof blobs and calldata are not stored on-chain; the chain only anchors the canonical metadata string

## Current System Layout

The repository has five core parts:

- `contracts/`: Solidity contracts for access control, registration, provenance, audit, NFT, staking, and verifier/ZK-related components.
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
- `ZKProvenanceTracker.sol`
- `ModelAuditLog.sol`
- `ModelNFT.sol`
- `ModelStaking.sol`
- `Verifier.sol`
- `RealZKBridge.sol`

Current recorded deployment addresses are stored in [address_v2_multi.json](./address_v2_multi.json) for:

- `sepolia`
- `tbnb`

Note:

- the active deployment path now includes `Groth16Verifier` and `ZKProvenanceTracker`
- the legacy `ModelProvenanceTracker` may still exist for compatibility, but the backend default write path is verifier-gated

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
