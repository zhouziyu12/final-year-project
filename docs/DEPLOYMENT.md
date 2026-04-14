# Deployment Notes

## Purpose

This document records the current runtime behavior, write-mode requirements, test outputs, and Windows-specific operational notes. It is an operational reference, not a one-shot deployment script.

## Runtime Modes

### Read-only

Triggered when:

- `.env` does not contain `PRIVATE_KEY`

Behavior:

- read endpoints remain available
- write endpoints return `503`
- `/api/v2/status` reports `writeMode: read-only`

### Write-enabled

Triggered when:

- `.env` contains `PRIVATE_KEY`
- `.env` contains `WRITE_API_KEY`

Behavior:

- model registration, SDK submission, and IPFS uploads are enabled
- the backend persists used nonces and enforces replay protection and rate limiting

## Verified Commands

Commands verified in the current repository state:

```bash
npx hardhat compile --show-stack-traces
cd client && npm run lint
cd client && npm run build
node tests/test_zk_proof.js
python tests/test_sdk_backend.py
node tests/test_smart_contracts.js
```

Full Windows regression:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Local Startup

### Backend

```bash
node server/server.js
```

Health check:

```bash
curl http://127.0.0.1:3000/api/health
```

### Frontend

```bash
cd client
npm run dev
```

Production build:

```bash
cd client
npm run build
```

## Important Runtime Files

- `address_v2_multi.json`: current multi-chain deployment addresses
- `model_name_map.json`: backend cache from model name to model ID
- `server/write_auth_state.json`: persisted nonce state for write authentication
- `client/dist/`: frontend build output
- `artifacts/`: Hardhat compile output

## Windows Notes

- Hardhat, snarkjs, and circom2 all run directly on Windows.
- The project no longer requires WSL to complete circuit compilation.
- The working circuit compile path is the local `node_modules/.bin/circom2.cmd` invocation inside `zk/`.

## Deployment Address Metadata

The repository currently tracks:

- `sepolia`
- `tbnb`

Treat `address_v2_multi.json` as the source of truth for addresses.

Important scope note:

- the current address file records the six main application contracts
- bridge/verifier contract sources exist in `contracts/`, but they are not part of the default active deployment metadata tracked here
